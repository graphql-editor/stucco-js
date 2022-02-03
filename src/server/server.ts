import { readFileSync } from 'fs';
import * as grpc from '@grpc/grpc-js';
import { GrpcHealthCheck, HealthCheckResponse, HealthService } from 'grpc-health-check-ts';
import { SubscriptionListenInput, SubscriptionListenEmitter } from '../api/index.js';
import { getHandler } from '../handler/index.js';
import * as messages from '../proto/driver/messages.js';
import * as driverService from '../proto/driver/driver_service.js';
import {
  authorize,
  fieldResolve,
  interfaceResolveType,
  makeProtoError,
  setSecrets,
  scalarParse,
  scalarSerialize,
  unionResolveType,
  subscriptionConnection,
  subscriptionListen,
} from '../proto/driver/index.js';
import { Writable } from 'stream';
import { Profiler } from './profiler.js';
import { setSecretsEnvironment } from '../raw/set_secrets.js';

type ServerStatusResponse = Partial<grpc.StatusObject>;
type ServerErrorResponse = ServerStatusResponse & Error;

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

function isCallRequestWithFunction<T, U>(
  v: grpc.ServerUnaryCall<T, U>,
): v is grpc.ServerUnaryCall<T & WithFunction, U> {
  return (
    typeof v.request === 'object' && v.request !== null && 'hasFunction' in v.request && 'getFunction' in v.request
  );
}

export interface ServerOptions {
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

export interface GRPCServer {
  start: typeof grpc.Server.prototype.start;
  addService: typeof grpc.Server.prototype.addService;
  tryShutdown: typeof grpc.Server.prototype.tryShutdown;
  bind: typeof grpc.Server.prototype.bind;
  bindAsync: typeof grpc.Server.prototype.bindAsync;
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
    this.server.addService(HealthService, grpcHealthCheck.server);
    this.server.addService(driverService.DriverService, {
      authorize: this.wrapUnaryCall(this, this.unaryCallHandler(messages.AuthorizeResponse, authorize)),
      fieldResolve: this.wrapUnaryCall(this, this.unaryCallHandler(messages.FieldResolveResponse, fieldResolve)),
      interfaceResolveType: this.wrapUnaryCall(
        this,
        this.unaryCallHandler(messages.InterfaceResolveTypeResponse, interfaceResolveType),
      ),
      scalarParse: this.wrapUnaryCall(this, this.unaryCallHandler(messages.ScalarParseResponse, scalarParse)),
      scalarSerialize: this.wrapUnaryCall(
        this,
        this.unaryCallHandler(messages.ScalarSerializeResponse, scalarSerialize),
      ),
      setSecrets: this.wrapUnaryCall(this, this.setSecrets),
      stderr: this.wrapServerStreamingCall(this, this.stderr),
      stdout: this.wrapServerStreamingCall(this, this.stdout),
      stream: (srv: grpc.ServerWritableStream<messages.StreamRequest, messages.StreamMessage>) => this.stream(srv),
      unionResolveType: this.wrapUnaryCall(
        this,
        this.unaryCallHandler(messages.UnionResolveTypeResponse, unionResolveType),
      ),
      subscriptionConnection: this.wrapUnaryCall(this, this.subscriptionConnection),
      subscriptionListen: (
        srv: grpc.ServerWritableStream<messages.SubscriptionListenRequest, messages.SubscriptionListenMessage>,
      ) => this.subscriptionListen(srv),
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

  private executeUserHandler<T extends WithFunction, U extends WithError, V, W>(
    call: grpc.ServerUnaryCall<T, U>,
    callback: grpc.sendUnaryData<U>,
    responseCtor: {
      new (): U;
    },
    fn: (req: T, handler: (x: V) => Promise<W>) => Promise<U>,
  ): void {
    const f = async () => {
      try {
        const handler = await getHandler<V, W>(call.request);
        const response = await fn(call.request, handler);
        callback(null, response);
      } catch (e) {
        const response = new responseCtor();
        doError(e, response);
        callback(null, response);
      }
    };
    f().catch((e) => console.error(e));
  }

  private unaryCallHandler<T extends WithFunction, U extends WithError, V, W>(
    responseCtor: {
      new (): U;
    },
    fn: (req: T, handler: (x: V) => Promise<W>) => Promise<U>,
  ): grpc.handleUnaryCall<T, U> {
    return (call: grpc.ServerUnaryCall<T, U>, callback: grpc.sendUnaryData<U>): void =>
      this.executeUserHandler(call, callback, responseCtor, fn);
  }

  private setSecrets(
    call: grpc.ServerUnaryCall<messages.SetSecretsRequest, messages.SetSecretsResponse>,
    callback: grpc.sendUnaryData<messages.SetSecretsResponse>,
  ): void {
    setSecrets(call.request, setSecretsEnvironment)
      .then((v) => callback(null, v))
      .catch((e) => console.error(e));
  }

  private stream(srv: grpc.ServerWritableStream<messages.StreamRequest, messages.StreamMessage>): void {
    console.error(`Requested stream with function ${srv.request.getFunction()?.getName()}`);
    throw new Error('Data streaming is not yet implemented');
  }

  private subscriptionConnection(
    call: grpc.ServerUnaryCall<messages.SubscriptionConnectionRequest, messages.SubscriptionConnectionResponse>,
    callback: grpc.sendUnaryData<messages.SubscriptionConnectionResponse>,
  ): void {
    this.executeUserHandler(call, callback, messages.SubscriptionConnectionResponse, subscriptionConnection);
  }

  private subscriptionListen(
    srv: grpc.ServerWritableStream<messages.SubscriptionListenRequest, messages.SubscriptionListenMessage>,
  ): void {
    const f = async () => {
      try {
        const handler = await getHandler<SubscriptionListenInput, void, SubscriptionListenEmitter>(srv.request);
        await subscriptionListen(srv, handler);
      } catch (e) {
        console.error(e);
      }
    };
    f();
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

  public serve(): Promise<void> {
    const { bindAddress = '0.0.0.0:1234', pluginMode = true } = this.serverOpts;
    const creds: grpc.ServerCredentials = this.credentials(pluginMode);
    return new Promise((resolve, reject) => {
      this.server.bindAsync(bindAddress, creds, (err, port) => {
        if (err) {
          reject(err);
          return;
        }
        if (pluginMode) {
          console.log(`1|1|tcp|127.0.0.1:${port}|grpc`);
        }
        this.start();
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    this.unhookIO();
    return new Promise((resolve, reject) => this.server.tryShutdown((err) => (err ? reject(err) : resolve())));
  }
  private profileFunction<T extends WithFunction, U>(
    call: grpc.ServerUnaryCall<T, U>,
    callback: grpc.sendUnaryData<U>,
    boundFn: grpc.handleUnaryCall<T, U>,
  ): void {
    const profiler = new Profiler({ enabled: !!this.serverOpts.enableProfiling });
    profiler.start();
    boundFn(
      call,
      (
        error: ServerErrorResponse | ServerStatusResponse | null,
        value?: U | null,
        trailer?: grpc.Metadata,
        flags?: number,
      ): void => {
        callback(error, value, trailer, flags);
        const report = profiler.report(call && call.request);
        if (report) {
          console.error(report);
        }
      },
    );
  }
  private wrapUnaryCall<T, U>(srv: Server, fn: grpc.handleUnaryCall<T, U>): grpc.handleUnaryCall<T, U> {
    const boundFn = fn.bind(srv);
    return (call: grpc.ServerUnaryCall<T, U>, callback: grpc.sendUnaryData<U>): void => {
      if (isCallRequestWithFunction(call)) {
        this.profileFunction(call, callback, boundFn);
      } else {
        boundFn(call, callback);
      }
    };
  }
  private wrapServerStreamingCall<T extends Writable, U>(
    srv: Server,
    fn: grpc.handleServerStreamingCall<T, U>,
  ): grpc.handleServerStreamingCall<T, U> {
    const boundFn = fn.bind(srv);
    return (call: grpc.ServerWritableStream<T, U>) => boundFn(call);
  }

  private stdout(call: Writable): void {
    this.stdoutStreams.push(call);
  }

  private stderr(call: Writable): void {
    this.stderrStreams.push(call);
  }
}
