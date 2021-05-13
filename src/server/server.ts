import { readFileSync } from 'fs';
import * as grpc from 'grpc';
import { GrpcHealthCheck, HealthCheckResponse, HealthService } from 'grpc-ts-health-check';
import { SubscriptionListenInput, SubscriptionListenEmitter } from '../api';
import { getHandler } from '../handler';
import { driverService, messages } from 'stucco-ts-proto-gen';
import {
  fieldResolve,
  interfaceResolveType,
  makeProtoError,
  setSecrets,
  scalarParse,
  scalarSerialize,
  unionResolveType,
  subscriptionConnection,
  subscritpionListen,
} from '../proto/driver';
import { Writable } from 'stream';
import { Profiler } from './profiler';
import { setSecretsEnvironment } from '../raw/set_secrets';

function toBuffer(v: unknown): Buffer {
  if (Buffer.isBuffer(v)) {
    return v;
  }
  if (ArrayBuffer.isView(v)) {
    return Buffer.from(v.buffer);
  }
  return Buffer.from(`${v}`);
}

export interface WithFunction {
  hasFunction(): boolean;
  getFunction(): { getName: () => string } | undefined;
}

function isCallRequestWithFunction(
  v: unknown,
): v is {
  request: WithFunction;
} {
  let request: WithFunction | unknown;
  if (typeof v === 'object' && v !== null && 'request' in v) {
    request = (v as {
      request: unknown;
    }).request;
  }
  return typeof request === 'object' && request !== null && 'hasFunction' in request && 'getFunction' in request;
}

interface ServerOptions {
  bindAddress?: string;
  enableProfiling?: boolean;
  pluginMode?: boolean;
  rootCerts?: string;
  privateKey?: string;
  certChain?: string;
  checkClientCertificate?: boolean;
  grpcServerOpts?: Record<string, unknown>;
  server?: GRPCServer;
  stdoutHook?: StreamHook;
  stderrHook?: StreamHook;
  consoleHook?: ConsoleHook;
}

interface GRPCServer {
  start: typeof grpc.Server.prototype.start;
  addService: typeof grpc.Server.prototype.addService;
  tryShutdown: typeof grpc.Server.prototype.tryShutdown;
  bind: typeof grpc.Server.prototype.bind;
}

interface WithError {
  setError: (err: messages.Error) => void;
}

function doError(e: unknown, v: WithError): void {
  v.setError(makeProtoError(e));
}

interface StreamHook {
  on(event: 'data', listener: (chunk: unknown) => void): StreamHook;
  on(event: 'end', listener: () => void): StreamHook;
  removeListener(event: 'data', listener: (chunk: unknown) => void): StreamHook;
  hook(): void;
  unhook(): void;
}

interface ConsoleHook {
  hook(): void;
  unhook(): void;
}

export class Server {
  private server: GRPCServer;
  private stdoutStreams: Writable[];
  private stderrStreams: Writable[];
  private stdoutHook?: StreamHook;
  private stderrHook?: StreamHook;
  private consoleHook?: ConsoleHook;
  constructor(private serverOpts: ServerOptions = {}) {
    const healthCheckStatusMap = {
      plugin: HealthCheckResponse.ServingStatus.SERVING,
    };
    this.server = serverOpts.server || new grpc.Server(this.serverOpts.grpcServerOpts);
    const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
    this.server.addService(HealthService, grpcHealthCheck);
    this.server.addService(driverService.DriverService, {
      fieldResolve: this.wrap(this, this.fieldResolve),
      interfaceResolveType: this.wrap(this, this.interfaceResolveType),
      scalarParse: this.wrap(this, this.scalarParse),
      scalarSerialize: this.wrap(this, this.scalarSerialize),
      setSecrets: this.wrap(this, this.setSecrets),
      stderr: this.wrap(this, this.stderr),
      stdout: this.wrap(this, this.stdout),
      stream: (srv: grpc.ServerWritableStream<messages.StreamRequest>) => this.stream(srv),
      unionResolveType: this.wrap(this, this.unionResolveType),
      subscriptionConnection: this.wrap(this, this.subscriptionConnection),
      subscriptionListen: (srv: grpc.ServerWritableStream<messages.SubscriptionListenRequest>) =>
        this.subscriptionListen(srv),
    });
    this.stdoutStreams = [];
    this.stderrStreams = [];

    // stdio hooks
    this.stdoutHook = serverOpts.stdoutHook;
    this.stderrHook = serverOpts.stderrHook;
    this.consoleHook = serverOpts.consoleHook;
    this.addListener((data: unknown): void => {
      this.writeToGRPCStdout(toBuffer(data));
    }, this.stdoutHook);
    this.addListener((data: unknown): void => {
      this.writeToGRPCStderr(toBuffer(data));
    }, this.stderrHook);
  }

  private addListener(listener: (data: unknown) => void, hook?: StreamHook): void {
    if (!hook) {
      return;
    }
    hook.on('data', listener);
    hook.on('end', () => {
      hook.removeListener('data', listener);
    });
  }

  private writeToGRPC(data: Buffer, streams: Writable[]): Writable[] {
    const msg = new messages.ByteStream();
    msg.setData(Uint8Array.from(data));
    streams.forEach((v) => {
      v.write(msg, (e) => {
        if (e) {
          v.end();
          streams = streams.filter((stream) => stream !== v);
        }
      });
    });
    return streams;
  }
  private writeToGRPCStdout(data: Buffer): void {
    this.stdoutStreams = this.writeToGRPC(data, this.stdoutStreams);
  }
  private writeToGRPCStderr(data: Buffer): void {
    this.stderrStreams = this.writeToGRPC(data, this.stderrStreams);
  }

  private hookIO(): void {
    if (this.stdoutHook) {
      this.stdoutHook.hook();
    }
    if (this.stderrHook) {
      this.stderrHook.hook();
    }
    if (this.consoleHook) {
      this.consoleHook.hook();
    }
  }

  private unhookIO(): void {
    if (this.stdoutHook) {
      this.stdoutHook.unhook();
    }
    if (this.stderrHook) {
      this.stderrHook.unhook();
    }
    if (this.consoleHook) {
      this.consoleHook.unhook();
    }
  }

  private async executeUserHandler<T extends WithFunction, U extends WithError, V, W>(
    call: grpc.ServerUnaryCall<T>,
    callback: grpc.sendUnaryData<U>,
    responseCtor: {
      new (): U;
    },
    fn: (req: T, handler: (x: V) => Promise<W | undefined>) => Promise<U>,
  ): Promise<void> {
    try {
      const handler = await getHandler<V, W>(call.request);
      const response = await fn(call.request, handler);
      callback(null, response);
    } catch (e) {
      const response = new responseCtor();
      doError(e, response);
      callback(null, response);
    }
  }

  public async fieldResolve(
    call: grpc.ServerUnaryCall<messages.FieldResolveRequest>,
    callback: grpc.sendUnaryData<messages.FieldResolveResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, messages.FieldResolveResponse, fieldResolve);
  }

  public async interfaceResolveType(
    call: grpc.ServerUnaryCall<messages.InterfaceResolveTypeRequest>,
    callback: grpc.sendUnaryData<messages.InterfaceResolveTypeResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, messages.InterfaceResolveTypeResponse, interfaceResolveType);
  }

  public async setSecrets(
    call: grpc.ServerUnaryCall<messages.SetSecretsRequest>,
    callback: grpc.sendUnaryData<messages.SetSecretsResponse>,
  ): Promise<void> {
    callback(null, await setSecrets(call.request, setSecretsEnvironment));
  }

  public async scalarParse(
    call: grpc.ServerUnaryCall<messages.ScalarParseRequest>,
    callback: grpc.sendUnaryData<messages.ScalarParseResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, messages.ScalarParseResponse, scalarParse);
  }

  public async scalarSerialize(
    call: grpc.ServerUnaryCall<messages.ScalarSerializeRequest>,
    callback: grpc.sendUnaryData<messages.ScalarSerializeResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, messages.ScalarSerializeResponse, scalarSerialize);
  }

  public async unionResolveType(
    call: grpc.ServerUnaryCall<messages.UnionResolveTypeRequest>,
    callback: grpc.sendUnaryData<messages.UnionResolveTypeResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, messages.UnionResolveTypeResponse, unionResolveType);
  }

  public async stream(srv: grpc.ServerWritableStream<messages.StreamRequest>): Promise<void> {
    console.error(`Requested stream with function ${srv.request.getFunction()?.getName()}`);
    throw new Error('Data streaming is not yet implemented');
  }

  public async subscriptionConnection(
    call: grpc.ServerUnaryCall<messages.SubscriptionConnectionRequest>,
    callback: grpc.sendUnaryData<messages.SubscriptionConnectionResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, messages.SubscriptionConnectionResponse, subscriptionConnection);
  }

  public async subscriptionListen(srv: grpc.ServerWritableStream<messages.SubscriptionListenRequest>): Promise<void> {
    try {
      const handler = await getHandler<SubscriptionListenInput, void, SubscriptionListenEmitter>(srv.request);
      await subscritpionListen(srv, handler);
    } catch (e) {
      console.error(e);
    }
  }
  public start(): void {
    try {
      this.hookIO();
      this.server.start();
    } catch (e) {
      console.error(e);
    }
  }

  public credentials(pluginMode: boolean): grpc.ServerCredentials {
    const { rootCerts, privateKey, certChain, checkClientCertificate } = this.serverOpts;
    if (pluginMode || (!rootCerts && !privateKey && !certChain)) {
      return grpc.ServerCredentials.createInsecure();
    }
    if (!rootCerts || !privateKey || !certChain) {
      // refuse to setup server with partial TLS setup
      throw new Error('TLS certificate chain defined partially');
    }
    const rootCert = readFileSync(rootCerts);
    const certs: grpc.KeyCertPair = {
      cert_chain: readFileSync(certChain),
      private_key: readFileSync(privateKey),
    };
    return grpc.ServerCredentials.createSsl(rootCert, [certs], checkClientCertificate);
  }

  public serve(): void {
    const { bindAddress = '0.0.0.0:1234', pluginMode = true } = this.serverOpts;
    const creds: grpc.ServerCredentials = this.credentials(pluginMode);
    this.server.bind(bindAddress, creds);
    if (pluginMode) {
      console.log('1|1|tcp|127.0.0.1:1234|grpc');
    }
    this.start();
  }

  public stop(): Promise<void> {
    this.unhookIO();
    return new Promise((resolve) =>
      this.server.tryShutdown(() => {
        resolve();
      }),
    );
  }
  private profileFunction<
    T extends {
      request: WithFunction;
    },
    U extends Array<unknown>,
    V
  >(call: T, callback: (...args: U) => V, boundFn: (call: T, callback: (...args: U) => V) => void): void {
    const profiler = new Profiler({ enabled: !!this.serverOpts.enableProfiling });
    profiler.start();
    boundFn(
      call,
      (...args: U): V => {
        const r = callback(...args);
        const report = profiler.report(call && (call as { request?: WithFunction }).request);
        if (report) {
          console.error(report);
        }
        return r;
      },
    );
  }
  private wrap<
    T extends
      | {
          request: WithFunction;
        }
      | Writable
      | grpc.ServerUnaryCall<messages.SetSecretsRequest>,
    U extends Array<unknown>,
    V
  >(srv: Server, fn: (call: T, callback: (...args: U) => V) => void): (call: T, callback: (...args: U) => V) => void {
    const boundFn = fn.bind(srv);
    return (call: T, callback: (...args: U) => V): void => {
      if (isCallRequestWithFunction(call)) {
        return this.profileFunction(call, callback, boundFn);
      } else {
        boundFn(call, callback);
      }
    };
  }

  private stdout(call: Writable): void {
    this.stdoutStreams.push(call);
  }

  private stderr(call: Writable): void {
    this.stderrStreams.push(call);
  }
}
