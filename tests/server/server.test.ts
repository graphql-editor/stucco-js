let mockReadFileSync = false;
const mockedReadFileSync = jest.fn();
import { Writable } from 'stream';
import {
  ServerUnaryCall,
  Server,
  ServiceDefinition,
  UntypedServiceImplementation,
  handleUnaryCall,
  ServerCredentials,
} from '@grpc/grpc-js';
import { Profiler } from '../../src/server/profiler';
import { messages, driverService } from 'stucco-ts-proto-gen';

const realCreateInsecure = ServerCredentials.createInsecure;

function doTestCall<T, U>(fn: handleUnaryCall<T, U>, call: ServerUnaryCall<T, U>): Promise<U> {
  return new Promise<U>((resolve, reject) => {
    fn(call, (e, v) => {
      if (e) {
        reject(e);
        return;
      }
      if (v) {
        resolve(v);
        return;
      }
      reject(new Error('ttttt'));
    });
  });
}

describe('grpc server', () => {
  let healthCheck: typeof import('grpc-health-check-ts');
  let driverGrpcPb: typeof import('stucco-ts-proto-gen').driverService;
  let driverPb: typeof import('stucco-ts-proto-gen').messages;
  let grpc: typeof import('@grpc/grpc-js');
  let profiler: typeof import('../../src/server/profiler');
  let importer: typeof import('../../src/handler');
  let driverHandlers: typeof import('../../src/proto/driver');
  let mockedGrpc: jest.Mocked<typeof grpc>;
  let grpcServerMock: {
    addService: jest.Mock;
    bind: jest.Mock;
    start: jest.Mock;
    tryShutdown: jest.Mock;
    register: jest.Mock;
    forceShutdown: jest.Mock;
    addProtoService: jest.Mock;
    bindAsync: jest.Mock;
  };
  let createInsecureMock: jest.Mock;
  let createSslMock: jest.Mock;
  let mockHandlerModule: jest.Mocked<typeof importer>;
  let mockedDriverHandlers: jest.Mocked<typeof driverHandlers>;
  let mockedProfiler: jest.Mocked<typeof profiler>;
  let service: driverService.IDriverServer;
  beforeEach(async () => {
    jest.resetModules();
    jest.mock('../../src/handler');
    jest.mock('../../src/proto/driver');
    jest.mock('@grpc/grpc-js');
    jest.mock('fs', () => {
      const fs = jest.requireActual('fs');
      return {
        ...fs,
        readFileSync: (...args: unknown[]): unknown => {
          if (mockReadFileSync) {
            return mockedReadFileSync(...args);
          }
          return fs.readFileSync(...args);
        },
      };
    });
    jest.mock('../../src/server/profiler');
    healthCheck = await import('grpc-health-check-ts');
    grpc = await import('@grpc/grpc-js');
    profiler = await import('../../src/server/profiler');
    importer = await import('../../src/handler');
    driverHandlers = await import('../../src/proto/driver');
    driverGrpcPb = await import('stucco-ts-proto-gen').then((m) => m.driverService);
    driverPb = await import('stucco-ts-proto-gen').then((m) => m.messages);
    mockedGrpc = grpc as jest.Mocked<typeof grpc>;
    grpcServerMock = {
      addService: jest
        .fn()
        .mockImplementation(
          (def: ServiceDefinition<UntypedServiceImplementation>, impl: UntypedServiceImplementation) => {
            if ('fieldResolve' in def) {
              service = impl as driverService.IDriverServer;
            }
          },
        ),
      bind: jest.fn(),
      start: jest.fn(),
      tryShutdown: jest.fn(),
      register: jest.fn(),
      forceShutdown: jest.fn(),
      addProtoService: jest.fn(),
      bindAsync: jest.fn(),
    };
    createInsecureMock = jest.fn();
    grpc.ServerCredentials.createInsecure = createInsecureMock.bind(grpc.ServerCredentials);
    createSslMock = jest.fn();
    grpc.ServerCredentials.createSsl = createSslMock.bind(grpc.ServerCredentials);
    mockedGrpc.Server.mockImplementation(() => {
      return (grpcServerMock as unknown) as Server;
    });
    mockHandlerModule = importer as jest.Mocked<typeof importer>;
    mockedDriverHandlers = driverHandlers as jest.Mocked<typeof driverHandlers>;
    mockedProfiler = profiler as jest.Mocked<typeof profiler>;
  });
  it('adds services', async () => {
    const { Server } = await import('../../src/server/server');
    new Server();
    expect(grpcServerMock.addService).toBeCalledWith(
      healthCheck.HealthService,
      expect.objectContaining({
        check: expect.anything(),
        watch: expect.anything(),
      }),
    );
    expect(grpcServerMock.addService).toBeCalledWith(
      driverGrpcPb.DriverService,
      expect.objectContaining({
        fieldResolve: expect.anything(),
        interfaceResolveType: expect.anything(),
        scalarParse: expect.anything(),
        scalarSerialize: expect.anything(),
        unionResolveType: expect.anything(),
      }),
    );
    expect(grpcServerMock.addService).toBeCalledTimes(2);
  });
  it('starts', async () => {
    const { Server } = await import('../../src/server/server');
    const srv = new Server();
    srv.start();
    expect(grpcServerMock.start).toHaveBeenCalled();
  });
  it('handle start error', async () => {
    const err = new Error();
    grpcServerMock.start.mockImplementation(() => {
      throw err;
    });
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const { Server } = await import('../../src/server/server');
    const srv = new Server();
    srv.start();
    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    consoleErrorSpy.mockClear();
  });
  it('handle start error without message', async () => {
    const { Server } = await import('../../src/server/server');
    grpcServerMock.start.mockImplementation(() => {
      throw {};
    });
    const stderrWriteSpy = jest.spyOn(process.stderr, 'write');
    const srv = new Server();
    srv.start();
    expect(stderrWriteSpy).not.toHaveBeenCalled();
    stderrWriteSpy.mockClear();
  });
  it('calls field resolve handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.FieldResolveRequest();
    const expected = new driverPb.FieldResolveResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.fieldResolve.mockResolvedValue(expected);
    new Server();
    const call = { request } as ServerUnaryCall<messages.FieldResolveRequest, messages.FieldResolveResponse>;
    const resp = await doTestCall(service.fieldResolve, call);
    expect(resp).toBe(expected);
  });
  it('catches field resolve import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.FieldResolveRequest();
    const expected = new driverPb.FieldResolveResponse();
    expected.setError(expectedDriverError);
    new Server();
    const call = { request } as ServerUnaryCall<messages.FieldResolveRequest, messages.FieldResolveResponse>;
    const resp = await doTestCall(service.fieldResolve, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('catches field resolve user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.fieldResolve.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.FieldResolveRequest();
    const expected = new driverPb.FieldResolveResponse();
    expected.setError(expectedDriverError);
    new Server();
    const call = { request } as ServerUnaryCall<messages.FieldResolveRequest, messages.FieldResolveResponse>;
    const resp = await doTestCall(service.fieldResolve, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('calls interface resolve type handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.InterfaceResolveTypeRequest();
    const expected = new driverPb.InterfaceResolveTypeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.interfaceResolveType.mockResolvedValue(expected);

    new Server();
    const call = { request } as ServerUnaryCall<
      messages.InterfaceResolveTypeRequest,
      messages.InterfaceResolveTypeResponse
    >;
    const resp = await doTestCall(service.interfaceResolveType, call);
    expect(resp).toBe(expected);
  });
  it('catches interface resolve type import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.InterfaceResolveTypeRequest();
    const expected = new driverPb.InterfaceResolveTypeResponse();
    expected.setError(expectedDriverError);
    new Server();
    const call = { request } as ServerUnaryCall<
      messages.InterfaceResolveTypeRequest,
      messages.InterfaceResolveTypeResponse
    >;
    const resp = await doTestCall(service.interfaceResolveType, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('catches interface resolve type user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.interfaceResolveType.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.InterfaceResolveTypeRequest();
    const expected = new driverPb.InterfaceResolveTypeResponse();
    expected.setError(expectedDriverError);
    new Server();
    const call = { request } as ServerUnaryCall<
      messages.InterfaceResolveTypeRequest,
      messages.InterfaceResolveTypeResponse
    >;
    const resp = await doTestCall(service.interfaceResolveType, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('sets environment variables for secrets', async () => {
    const { Server } = await import('../../src/server/server');
    const secrets: Array<[string, string]> = [['SECRET', 'VALUE']];
    const request = new driverPb.SetSecretsRequest();
    const expected = new driverPb.SetSecretsResponse();
    mockedDriverHandlers.setSecrets.mockResolvedValue(expected);
    request.setSecretsList(
      secrets.map((secret) => {
        const protoSecret = new driverPb.Secret();
        protoSecret.setKey(secret[0]);
        protoSecret.setValue(secret[0]);
        return protoSecret;
      }),
    );

    new Server();
    const call = { request } as ServerUnaryCall<messages.SetSecretsRequest, messages.SetSecretsResponse>;
    const resp = await doTestCall(service.setSecrets, call);
    expect(resp).toBe(expected);
  });
  it('calls scalar parse type handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.ScalarParseRequest();
    const expected = new driverPb.ScalarParseResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.scalarParse.mockResolvedValue(expected);

    new Server();
    const call = { request } as ServerUnaryCall<messages.ScalarParseRequest, messages.ScalarParseResponse>;
    const resp = await doTestCall(service.scalarParse, call);
    expect(resp).toBe(expected);
  });
  it('catches scalar parse import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.ScalarParseRequest();
    const expected = new driverPb.ScalarParseResponse();
    expected.setError(expectedDriverError);

    new Server();
    const call = { request } as ServerUnaryCall<messages.ScalarParseRequest, messages.ScalarParseResponse>;
    const resp = await doTestCall(service.scalarParse, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('catches scalar parse user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.scalarParse.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.ScalarParseRequest();
    const expected = new driverPb.ScalarParseResponse();
    expected.setError(expectedDriverError);

    new Server();
    const call = { request } as ServerUnaryCall<messages.ScalarParseRequest, messages.ScalarParseResponse>;
    const resp = await doTestCall(service.scalarParse, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('calls scalar serialize type handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.ScalarSerializeRequest();
    const expected = new driverPb.ScalarSerializeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.scalarSerialize.mockResolvedValue(expected);

    new Server();
    const call = { request } as ServerUnaryCall<messages.ScalarSerializeRequest, messages.ScalarSerializeResponse>;
    const resp = await doTestCall(service.scalarSerialize, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('catches scalar serialize import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.ScalarSerializeRequest();
    const expected = new driverPb.ScalarSerializeResponse();
    expected.setError(expectedDriverError);

    new Server();
    const call = { request } as ServerUnaryCall<messages.ScalarSerializeRequest, messages.ScalarSerializeResponse>;
    const resp = await doTestCall(service.scalarSerialize, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('catches scalar serialize user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.scalarSerialize.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.ScalarSerializeRequest();
    const expected = new driverPb.ScalarSerializeResponse();
    expected.setError(expectedDriverError);

    new Server();
    const call = { request } as ServerUnaryCall<messages.ScalarSerializeRequest, messages.ScalarSerializeResponse>;
    const resp = await doTestCall(service.scalarSerialize, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('calls union resolve type handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.UnionResolveTypeRequest();
    const expected = new driverPb.UnionResolveTypeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.unionResolveType.mockResolvedValue(expected);

    new Server();
    const call = { request } as ServerUnaryCall<messages.UnionResolveTypeRequest, messages.UnionResolveTypeResponse>;
    const resp = await doTestCall(service.unionResolveType, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('catches union resolve type import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.UnionResolveTypeRequest();
    const expected = new driverPb.UnionResolveTypeResponse();
    expected.setError(expectedDriverError);

    new Server();
    const call = { request } as ServerUnaryCall<messages.UnionResolveTypeRequest, messages.UnionResolveTypeResponse>;
    const resp = await doTestCall(service.unionResolveType, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('catches union resolve type user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.unionResolveType.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const request = new driverPb.UnionResolveTypeRequest();
    const expected = new driverPb.UnionResolveTypeResponse();
    expected.setError(expectedDriverError);

    new Server();
    const call = { request } as ServerUnaryCall<messages.UnionResolveTypeRequest, messages.UnionResolveTypeResponse>;
    const resp = await doTestCall(service.unionResolveType, call);
    expect(resp.getError()).toBe(expected.getError());
  });
  it('hook wires data through grpc stdout', async () => {
    const hook = {
      on: jest.fn(),
      removeListener: jest.fn(),
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const { Server } = await import('../../src/server/server');
    const fakeStdout = jest.fn();
    let stdout: (call: Writable) => void = fakeStdout;
    grpcServerMock.addService.mockImplementation(
      (
        _: unknown,
        services: {
          stdout: (call: Writable) => void;
        },
      ): void => {
        stdout = services.stdout;
      },
    );
    new Server({
      stdoutHook: hook,
    });
    expect(hook.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(hook.on).toHaveBeenCalledWith('end', expect.any(Function));
    const writeMock = jest.fn();
    const writer = new Writable();
    writer.write = writeMock;
    stdout(writer);
    const expectByteStreamMessage = (msg: string): void => {
      const byteStream = new driverPb.ByteStream();
      byteStream.setData(Uint8Array.from(Buffer.from(msg)));
      expect(writeMock).toHaveBeenLastCalledWith(byteStream, expect.anything());
      writeMock.mockClear();
    };
    const dataListener: (buf: Buffer) => void = hook.on.mock.calls[0][1];
    dataListener(Buffer.from('data'));
    expectByteStreamMessage('data');
    expect(fakeStdout).not.toHaveBeenCalled();
  });
  it('stdout hook is removed on end', async () => {
    const hook = {
      on: jest.fn(),
      removeListener: jest.fn(),
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const { Server } = await import('../../src/server/server');
    new Server({
      stdoutHook: hook,
    });
    expect(hook.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(hook.on).toHaveBeenCalledWith('end', expect.any(Function));
    const endListener: () => void = hook.on.mock.calls[1][1];
    endListener();
    expect(hook.removeListener).toHaveBeenCalledWith('data', hook.on.mock.calls[0][1]);
  });
  it('hook wires data through grpc stderr', async () => {
    const hook = {
      on: jest.fn(),
      removeListener: jest.fn(),
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const { Server } = await import('../../src/server/server');
    const fakeStderr = jest.fn();
    let stderr: (call: Writable) => void = fakeStderr;
    grpcServerMock.addService.mockImplementation(
      (
        _: unknown,
        services: {
          stderr: (call: Writable) => void;
        },
      ): void => {
        stderr = services.stderr;
      },
    );
    new Server({
      stderrHook: hook,
    });
    expect(hook.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(hook.on).toHaveBeenCalledWith('end', expect.any(Function));
    const writeMock = jest.fn();
    const writer = new Writable();
    writer.write = writeMock;
    stderr(writer);
    const expectByteStreamMessage = (msg: string): void => {
      const byteStream = new driverPb.ByteStream();
      byteStream.setData(Uint8Array.from(Buffer.from(msg)));
      expect(writeMock).toHaveBeenLastCalledWith(byteStream, expect.anything());
      writeMock.mockClear();
    };
    const dataListener: (buf: Buffer) => void = hook.on.mock.calls[0][1];
    dataListener(Buffer.from('data'));
    expectByteStreamMessage('data');
    expect(fakeStderr).not.toHaveBeenCalled();
  });
  it('stderr hook is removed on end', async () => {
    const hook = {
      on: jest.fn(),
      removeListener: jest.fn(),
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const { Server } = await import('../../src/server/server');
    new Server({
      stderrHook: hook,
    });
    expect(hook.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(hook.on).toHaveBeenCalledWith('end', expect.any(Function));
    const endListener: () => void = hook.on.mock.calls[1][1];
    endListener();
    expect(hook.removeListener).toHaveBeenCalledWith('data', hook.on.mock.calls[0][1]);
  });
  it('creates insecure credentials for plugin', async () => {
    const { Server } = await import('../../src/server/server');
    const srv = new Server();
    const insecureCreds = grpc.ServerCredentials.createInsecure();
    createInsecureMock.mockReturnValue(insecureCreds);
    expect(srv.credentials(true)).toEqual(insecureCreds);
  });
  it('creates insecure if certs not defined', async () => {
    const { Server } = await import('../../src/server/server');
    const srv = new Server();
    const insecureCreds = grpc.ServerCredentials.createInsecure();
    createInsecureMock.mockReturnValue(insecureCreds);
    expect(srv.credentials(false)).toEqual(insecureCreds);
  });
  it('throws bad certs', async () => {
    const { Server } = await import('../../src/server/server');
    const srv = new Server({ rootCerts: 'root.crt' });
    expect(() => {
      srv.credentials(false);
    }).toThrow();
  });
  it('creates secure credentials with certs', async () => {
    const { Server } = await import('../../src/server/server');
    mockReadFileSync = true;
    mockedReadFileSync.mockImplementation((v) => Buffer.from(v + 'data'));
    createSslMock.mockReturnValue('mock');
    new Server({
      rootCerts: 'root.crt',
      privateKey: 'key.crt',
      certChain: 'cert.crt',
    }).credentials(false);
    expect(createSslMock).toHaveBeenCalledWith(
      Buffer.from('root.crtdata'),
      [
        {
          cert_chain: Buffer.from('cert.crtdata'),
          private_key: Buffer.from('key.crtdata'),
        },
      ],
      undefined,
    );
    mockReadFileSync = false;
  });
  it('serves on default addresss as plugin', async () => {
    const { Server } = await import('../../src/server/server');
    const insecureCreds = realCreateInsecure();
    createInsecureMock.mockReset();
    createInsecureMock.mockReturnValue(insecureCreds);
    const srv = new Server();
    const logSpy = jest.spyOn(global.console, 'log');
    grpcServerMock.bindAsync.mockImplementation((_1, _2, cb) => {
      cb(null, 1234);
    });
    await srv.serve();
    expect(logSpy).toHaveBeenCalledWith('1|1|tcp|127.0.0.1:1234|grpc');
    logSpy.mockClear();
  });
  it('serves on default addresss', async () => {
    const { Server } = await import('../../src/server/server');
    const insecureCreds = realCreateInsecure();
    createInsecureMock.mockReset();
    createInsecureMock.mockReturnValue(insecureCreds);
    createInsecureMock.mockReturnValue(insecureCreds);
    const srv = new Server({ pluginMode: false });
    const logSpy = jest.spyOn(global.console, 'log');
    grpcServerMock.bindAsync.mockImplementation((_1, _2, cb) => {
      cb(null, 1234);
    });
    await srv.serve();
    expect(logSpy).not.toHaveBeenCalledWith('1|1|tcp|127.0.0.1:1234|grpc');
  });
  it('gracefully shutdowns', async () => {
    const { Server } = await import('../../src/server/server');
    grpcServerMock.tryShutdown.mockImplementation((f) => f());
    const srv = new Server();
    await srv.stop();
    expect(grpcServerMock.tryShutdown).toHaveBeenCalled();
  });
  it('supports profiling enabling', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.fieldResolve.mockResolvedValue(new driverPb.FieldResolveResponse());
    const profilerMock = {
      start: jest.fn(),
      report: jest.fn(),
    };
    let wrappedFieldResolve: (...args: unknown[]) => void;
    grpcServerMock.addService.mockImplementation(
      (_: unknown, services: { fieldResolve: (...args: unknown[]) => void }) => {
        wrappedFieldResolve = services.fieldResolve;
      },
    );
    mockedProfiler.Profiler.mockImplementation(() => (profilerMock as unknown) as Profiler);
    profilerMock.report.mockReturnValue('mocked report');
    new Server({ enableProfiling: true });
    const call = { request: new driverPb.FieldResolveRequest() } as ServerUnaryCall<
      messages.FieldResolveRequest,
      messages.FieldResolveResponse
    >;
    const errorSpy = jest.spyOn(global.console, 'error');
    await new Promise<void>((resolved) => {
      const cb = jest.fn();
      cb.mockImplementation(() => {
        resolved();
      });
      wrappedFieldResolve(call, cb);
    });
    expect(mockedProfiler.Profiler).toHaveBeenCalledWith({ enabled: true });
    expect(profilerMock.start).toHaveBeenCalled();
    expect(profilerMock.report).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('mocked report');
    errorSpy.mockClear();
  });
  it('supports profiling disabling', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.fieldResolve.mockResolvedValue(new driverPb.FieldResolveResponse());
    const profilerMock = {
      start: jest.fn(),
      report: jest.fn(),
    };
    let wrappedFieldResolve: (...args: unknown[]) => void;
    grpcServerMock.addService.mockImplementation(
      (_: unknown, services: { fieldResolve: (...args: unknown[]) => void }) => {
        wrappedFieldResolve = services.fieldResolve;
      },
    );
    mockedProfiler.Profiler.mockImplementation(() => (profilerMock as unknown) as Profiler);
    profilerMock.report.mockReturnValue('');
    new Server();
    const call = { request: new driverPb.FieldResolveRequest() } as ServerUnaryCall<
      messages.FieldResolveRequest,
      messages.FieldResolveResponse
    >;
    const errorSpy = jest.spyOn(global.console, 'error');
    await new Promise<void>((resolved) => {
      const cb = jest.fn();
      cb.mockImplementation(() => {
        resolved();
      });
      wrappedFieldResolve(call, cb);
    });
    expect(mockedProfiler.Profiler).toHaveBeenCalledWith({ enabled: false });
    expect(profilerMock.start).toHaveBeenCalled();
    expect(profilerMock.report).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalledWith('mocked report');
    errorSpy.mockClear();
  });
});
