import { readFileSync } from 'fs';
import * as grpc from 'grpc';
import { GrpcHealthCheck, HealthCheckResponse, HealthService } from 'grpc-ts-health-check';
import { getHandler } from '../handler/handler';
import {
  FieldResolveInput,
  FieldResolveOutput,
  InterfaceResolveTypeInput,
  InterfaceResolveTypeOutput,
  ScalarParseInput,
  ScalarParseOutput,
  ScalarSerializeInput,
  ScalarSerializeOutput,
  UnionResolveTypeInput,
  UnionResolveTypeOutput,
  SetSecretsOutput,
} from '../api';
import { DriverService } from '../proto/driver_grpc_pb';
import {
  fieldResolve,
  interfaceResolveType,
  makeGrpcError,
  setSecrets,
  scalarParse,
  scalarSerialize,
  unionResolveType,
} from '../proto/driver/driver';
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

export interface WithFunction {
  hasFunction(): boolean;
  getFunction(): { getName: () => string } | undefined;
}

interface WriteOverload {
  (buffer: string | Buffer | Uint8Array, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
  (str: string, encoding?: string | undefined, cb?: ((err?: Error | null | undefined) => void) | undefined): boolean;
}

function hijackWrite(w: WriteOverload, to: WriteOverload): WriteOverload {
  const hijack: WriteOverload = (
    first: string | Buffer | Uint8Array,
    second: ((err?: Error | null | undefined) => void) | string | undefined,
    cb?: ((err?: Error | null | undefined) => void) | undefined,
  ): boolean => {
    if (typeof first === 'string' && (typeof second === 'string' || typeof second === 'undefined')) {
      to(first, second, cb);
      return w(first, second, cb);
    } else if (
      (typeof first === 'string' || Buffer.isBuffer(first) || ArrayBuffer.isView(first)) &&
      typeof second === 'function'
    ) {
      to(first, second);
      return w(first, second);
    }
    return false;
  };
  return hijack;
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

function doError(
  e: unknown,
  v: {
    setError: (err: DriverError) => void;
  },
): void {
  v.setError(makeGrpcError(e));
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

  public async fieldResolve(
    call: grpc.ServerUnaryCall<FieldResolveRequest>,
    callback: grpc.sendUnaryData<FieldResolveResponse>,
  ): Promise<void> {
    try {
      const handler = await getHandler<FieldResolveInput, FieldResolveOutput>(call.request);
      const response = await fieldResolve(call.request, handler);
      callback(null, response);
    } catch (e) {
      const response = new FieldResolveResponse();
      doError(e, response);
      callback(null, response);
    }
  }

  public async interfaceResolveType(
    call: grpc.ServerUnaryCall<InterfaceResolveTypeRequest>,
    callback: grpc.sendUnaryData<InterfaceResolveTypeResponse>,
  ): Promise<void> {
    try {
      const handler = await getHandler<InterfaceResolveTypeInput, InterfaceResolveTypeOutput>(call.request);
      const response = await interfaceResolveType(call.request, handler);
      callback(null, response);
    } catch (e) {
      const response = new InterfaceResolveTypeResponse();
      doError(e, response);
      callback(null, response);
    }
  }

  public async setSecrets(
    call: grpc.ServerUnaryCall<SetSecretsRequest>,
    callback: grpc.sendUnaryData<SetSecretsResponse>,
  ): Promise<void> {
    try {
      const response = await setSecrets(
        call.request,
        async (secrets): Promise<SetSecretsOutput> => {
          Object.keys(secrets.secrets).forEach((k) => {
            process.env[k] = secrets.secrets[k];
          });
          return;
        },
      );
      callback(null, response);
    } catch (e) {
      const response = new SetSecretsResponse();
      doError(e, response);
      callback(null, response);
    }
  }

  public async scalarParse(
    call: grpc.ServerUnaryCall<ScalarParseRequest>,
    callback: grpc.sendUnaryData<ScalarParseResponse>,
  ): Promise<void> {
    try {
      const handler = await getHandler<ScalarParseInput, ScalarParseOutput>(call.request);
      const response = await scalarParse(call.request, handler);
      callback(null, response);
    } catch (e) {
      const response = new ScalarParseResponse();
      doError(e, response);
      callback(null, response);
    }
  }

  public async scalarSerialize(
    call: grpc.ServerUnaryCall<ScalarSerializeRequest>,
    callback: grpc.sendUnaryData<ScalarSerializeResponse>,
  ): Promise<void> {
    try {
      const handler = await getHandler<ScalarSerializeInput, ScalarSerializeOutput>(call.request);
      const response = await scalarSerialize(call.request, handler);
      callback(null, response);
    } catch (e) {
      const response = new ScalarSerializeResponse();
      doError(e, response);
      callback(null, response);
    }
  }

  public async unionResolveType(
    call: grpc.ServerUnaryCall<UnionResolveTypeRequest>,
    callback: grpc.sendUnaryData<UnionResolveTypeResponse>,
  ): Promise<void> {
    try {
      const handler = await getHandler<UnionResolveTypeInput, UnionResolveTypeOutput>(call.request);
      const response = await unionResolveType(call.request, handler);
      callback(null, response);
    } catch (e) {
      const response = new UnionResolveTypeResponse();
      doError(e, response);
      callback(null, response);
    }
  }

  public setupIO(): [typeof process.stdout.write, typeof process.stderr.write] {
    const oldIO = this._hijackIO();
    this._hijackConsole();
    return oldIO;
  }

  public start(): void {
    // go-plugin does not read stdout
    // hijack io and send it through buffer
    const [stdoutWrite, stderrWrite] = this.setupIO();
    try {
      this.server.start();
    } catch (e) {
      if ('message' in e && typeof e.message === 'string') {
        stderrWrite.call(process.stderr, e.message);
      }
    } finally {
      this.closeStreams([stdoutWrite, stderrWrite]);
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

  private wrap<T, U extends Array<unknown>, V>(
    srv: Server,
    fn: (call: T, callback: (...args: U) => V) => void,
  ): (call: T, callback: (...args: U) => V) => void {
    const boundFn = fn.bind(srv);
    return (call: T, callback: (...args: U) => V): void => {
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

  public closeStreams([stdoutWrite, stderrWrite]: [typeof process.stdout.write, typeof process.stderr.write]): void {
    process.stderr.write = stderrWrite;
    process.stdout.write = stdoutWrite;
    this.stdoutStreams.forEach((v) => v.end());
    this.stderrStreams.forEach((v) => v.end());
  }

  private _hijackConsole(): void {
    console.log = ((oldLog) => (msg?: unknown, ...params: unknown[]): void => {
      oldLog('[INFO]' + msg, ...params);
    })(console.log);
    console.info = ((oldInfo) => (msg?: unknown, ...params: unknown[]): void => {
      oldInfo('[INFO]' + msg, ...params);
    })(console.info);
    console.debug = ((oldDebug) => (msg?: unknown, ...params: unknown[]): void => {
      oldDebug('[DEBUG]' + msg, ...params);
    })(console.debug);
    console.warn = ((oldWarn) => (msg?: unknown, ...params: unknown[]): void => {
      oldWarn('[WARN]' + msg, ...params);
    })(console.warn);
    console.error = ((oldError) => (msg?: unknown, ...params: unknown[]): void => {
      oldError('[ERROR]' + msg, ...params);
    })(console.error);
  }
}
