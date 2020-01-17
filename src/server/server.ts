import { readFileSync } from 'fs';
import { Console } from 'console';
import * as grpc from 'grpc';
import { GrpcHealthCheck, HealthCheckResponse, HealthService } from 'grpc-ts-health-check';
import { getHandler } from '../handler';
import { DriverService } from '../proto/driver_grpc_pb';
import {
  fieldResolve,
  interfaceResolveType,
  makeProtoError,
  setSecrets,
  scalarParse,
  scalarSerialize,
  unionResolveType,
} from '../proto/driver';
import {
  ByteStream,
  Error as DriverError,
  FieldResolveRequest,
  FieldResolveResponse,
  InterfaceResolveTypeRequest,
  InterfaceResolveTypeResponse,
  ScalarParseRequest,
  ScalarParseResponse,
  ScalarSerializeRequest,
  ScalarSerializeResponse,
  UnionResolveTypeRequest,
  UnionResolveTypeResponse,
  SetSecretsRequest,
  SetSecretsResponse,
} from '../proto/driver_pb';
import { DevNull } from './devnull';
import { Writable } from 'stream';
import { Profiler } from './profiler';
import { setSecretsEnvironment } from '../raw/set_secrets';

export interface WithFunction {
  hasFunction(): boolean;
  getFunction(): { getName: () => string } | undefined;
}

type writeFuncType = typeof process.stdout.write;

function hijackWrite(w: writeFuncType, to: writeFuncType): writeFuncType {
  const hijack = (
    first: Parameters<writeFuncType>[0],
    second: Parameters<writeFuncType>[1],
    third: Parameters<writeFuncType>[2],
  ): boolean => {
    to(first, second, third);
    try {
      return w(first, second, third);
    } catch (e) {
      // node@8 on macOS does not seem to handle Uint8Array for writing
      if (e instanceof TypeError && (first as unknown) instanceof Uint8Array) {
        const view = (first as unknown) as Uint8Array;
        return w(Buffer.from(view), (second as unknown) as (err?: Error) => void | undefined);
      }
      throw e;
    }
  };
  return hijack as writeFuncType;
}

function isCallRequestWithFunction(
  v: unknown,
): v is {
  request: WithFunction;
} {
  let request: WithFunction | unknown;
  if (typeof v === 'object' && 'request' in v) {
    request = (v as {
      request: unknown;
    }).request;
  }
  return request && typeof request === 'object' && 'hasFunction' in request && 'getFunction' in request;
}

interface ServerOptions {
  bindAddress?: string;
  enableProfiling?: boolean;
  pluginMode?: boolean;
  rootCerts?: string;
  privateKey?: string;
  certChain?: string;
  checkClientCertificate?: boolean;
  grpcServerOpts?: object;
  server?: GRPCServer;
}

interface GRPCServer {
  start: typeof grpc.Server.prototype.start;
  addService: typeof grpc.Server.prototype.addService;
  tryShutdown: typeof grpc.Server.prototype.tryShutdown;
  bind: typeof grpc.Server.prototype.bind;
}

interface WithError {
  setError: (err: DriverError) => void;
}

function doError(e: unknown, v: WithError): void {
  v.setError(makeProtoError(e));
}

export class Server {
  private server: GRPCServer;
  private stdoutStreams: Writable[];
  private stderrStreams: Writable[];
  constructor(private serverOpts: ServerOptions = {}) {
    const healthCheckStatusMap = {
      plugin: HealthCheckResponse.ServingStatus.SERVING,
    };
    this.server = serverOpts.server || new grpc.Server(this.serverOpts.grpcServerOpts);
    const grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
    this.server.addService(HealthService, grpcHealthCheck);
    this.server.addService(DriverService, {
      fieldResolve: this.wrap(this, this.fieldResolve),
      interfaceResolveType: this.wrap(this, this.interfaceResolveType),
      scalarParse: this.wrap(this, this.scalarParse),
      scalarSerialize: this.wrap(this, this.scalarSerialize),
      setSecrets: this.wrap(this, this.setSecrets),
      stderr: this.wrap(this, this.stderr),
      stdout: this.wrap(this, this.stdout),
      stream: undefined,
      unionResolveType: this.wrap(this, this.unionResolveType),
    });
    this.stdoutStreams = [];
    this.stderrStreams = [];
  }

  private async executeUserHandler<T extends WithFunction, U extends WithError, V, W>(
    call: grpc.ServerUnaryCall<T>,
    callback: grpc.sendUnaryData<U>,
    responseCtor: {
      new (): U;
    },
    fn: (req: T, handler: (x: V) => Promise<W>) => Promise<U>,
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
    call: grpc.ServerUnaryCall<FieldResolveRequest>,
    callback: grpc.sendUnaryData<FieldResolveResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, FieldResolveResponse, fieldResolve);
  }

  public async interfaceResolveType(
    call: grpc.ServerUnaryCall<InterfaceResolveTypeRequest>,
    callback: grpc.sendUnaryData<InterfaceResolveTypeResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, InterfaceResolveTypeResponse, interfaceResolveType);
  }

  public async setSecrets(
    call: grpc.ServerUnaryCall<SetSecretsRequest>,
    callback: grpc.sendUnaryData<SetSecretsResponse>,
  ): Promise<void> {
    callback(null, await setSecrets(call.request, setSecretsEnvironment));
  }

  public async scalarParse(
    call: grpc.ServerUnaryCall<ScalarParseRequest>,
    callback: grpc.sendUnaryData<ScalarParseResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, ScalarParseResponse, scalarParse);
  }

  public async scalarSerialize(
    call: grpc.ServerUnaryCall<ScalarSerializeRequest>,
    callback: grpc.sendUnaryData<ScalarSerializeResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, ScalarSerializeResponse, scalarSerialize);
  }

  public async unionResolveType(
    call: grpc.ServerUnaryCall<UnionResolveTypeRequest>,
    callback: grpc.sendUnaryData<UnionResolveTypeResponse>,
  ): Promise<void> {
    return this.executeUserHandler(call, callback, UnionResolveTypeResponse, unionResolveType);
  }

  public setupIO(): () => void {
    const [stdoutWrite, stderrWrite] = this._hijackIO();
    const oldConsole = this._hijackConsole();
    return (): void => {
      oldConsole();
      process.stderr.write = stderrWrite;
      process.stdout.write = stdoutWrite;
      this.stdoutStreams.forEach((v) => v.end());
      this.stderrStreams.forEach((v) => v.end());
    };
  }

  public start(): void {
    // go-plugin does not read stdout
    // hijack io and send it through buffer
    const oldWrite = process.stderr.write;
    const cleanup = this.setupIO();
    try {
      this.server.start();
    } catch (e) {
      if ('message' in e && typeof e.message === 'string') {
        oldWrite.call(process.stderr, e.message);
      }
    } finally {
      cleanup();
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
    /* eslint-disable @typescript-eslint/camelcase */
    const certs: grpc.KeyCertPair = {
      cert_chain: readFileSync(certChain),
      private_key: readFileSync(privateKey),
    };
    /* eslint-enable @typescript-eslint/camelcase */
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
      | grpc.ServerUnaryCall<SetSecretsRequest>,
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

  private _hijackIO(): [typeof process.stdout.write, typeof process.stderr.write] {
    const oldStdout = process.stdout.write;
    const oldStderr = process.stderr.write;
    const writeStdToGRPC = (data: string | Buffer | Uint8Array): boolean => {
      const msg = new ByteStream();
      if (typeof data === 'string') {
        data = Buffer.from(data);
      }
      if (Buffer.isBuffer(data)) {
        data = Uint8Array.from(data);
      }
      msg.setData(data);
      this.stdoutStreams.forEach((v) => {
        v.write(msg, (e) => {
          if (e) {
            v.end();
            this.stdoutStreams = this.stdoutStreams.filter((stream) => stream !== v);
          }
        });
      });
      return true;
    };
    process.stdout.write = hijackWrite(oldStdout.bind(process.stdout), writeStdToGRPC.bind(this));
    const writeStderrToGRPC = (data: string | Buffer | Uint8Array): boolean => {
      const msg = new ByteStream();
      if (typeof data === 'string') {
        data = Buffer.from(data);
      }
      if (Buffer.isBuffer(data)) {
        data = Uint8Array.from(data);
      }
      msg.setData(data);
      this.stderrStreams.forEach((v) => {
        v.write(msg, (e) => {
          if (e) {
            v.end();
            this.stderrStreams = this.stderrStreams.filter((stream) => stream !== v);
          }
        });
      });
      return true;
    };
    const { pluginMode = true } = this.serverOpts;
    if (pluginMode) {
      // stderr to pseudo null device, since we're already sending
      // stderr through grpc. No need to write it again through pipe
      const nullErr = new DevNull();
      process.stderr.write = hijackWrite(nullErr.write.bind(process.stderr), writeStderrToGRPC.bind(this));
    } else {
      process.stderr.write = hijackWrite(oldStderr.bind(process.stderr.write), writeStderrToGRPC.bind(this));
    }
    return [oldStdout, oldStderr];
  }

  private _hijackConsole(): () => void {
    const newConsole = new Console(process.stdout, process.stderr);
    const oldLog = console.log;
    console.log = (() => (msg?: unknown, ...params: unknown[]): void => {
      newConsole.log('[INFO]' + msg, ...params);
    })();
    const oldInfo = console.info;
    console.info = (() => (msg?: unknown, ...params: unknown[]): void => {
      newConsole.info('[INFO]' + msg, ...params);
    })();
    const oldDebug = console.debug;
    console.debug = (() => (msg?: unknown, ...params: unknown[]): void => {
      newConsole.debug('[DEBUG]' + msg, ...params);
    })();
    const oldWarn = console.warn;
    console.warn = (() => (msg?: unknown, ...params: unknown[]): void => {
      newConsole.warn('[WARN]' + msg, ...params);
    })();
    const oldError = console.error;
    console.error = (() => (msg?: unknown, ...params: unknown[]): void => {
      newConsole.error('[ERROR]' + msg, ...params);
    })();
    return (): void => {
      console.log = oldLog;
      console.info = oldInfo;
      console.debug = oldDebug;
      console.warn = oldWarn;
      console.error = oldError;
    };
  }
}
