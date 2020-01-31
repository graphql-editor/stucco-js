let mockReadFileSync = false;
const mockedReadFileSync = jest.fn();
import { Writable } from 'stream';
import { ServerUnaryCall } from 'grpc';
import { Profiler } from '../../src/server/profiler';
import {
  FieldResolveRequest,
  InterfaceResolveTypeRequest,
  ScalarParseRequest,
  ScalarSerializeRequest,
  SetSecretsRequest,
  UnionResolveTypeRequest,
} from '../../src/proto/driver_pb';

describe('grpc server', () => {
  let healthCheck: typeof import('grpc-ts-health-check');
  let driverGrpcPb: typeof import('../../src/proto/driver_grpc_pb');
  let driverPb: typeof import('../../src/proto/driver_pb');
  let grpc: typeof import('grpc');
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
  beforeEach(async () => {
    jest.resetModules();
    jest.mock('../../src/handler');
    jest.mock('../../src/proto/driver');
    jest.mock('grpc');
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
    healthCheck = await import('grpc-ts-health-check');
    grpc = await import('grpc');
    profiler = await import('../../src/server/profiler');
    importer = await import('../../src/handler');
    driverHandlers = await import('../../src/proto/driver');
    driverGrpcPb = await import('../../src/proto/driver_grpc_pb');
    driverPb = await import('../../src/proto/driver_pb');
    mockedGrpc = grpc as jest.Mocked<typeof grpc>;
    grpcServerMock = {
      addService: jest.fn(),
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
      return grpcServerMock;
    });
    mockHandlerModule = importer as jest.Mocked<typeof importer>;
    mockedDriverHandlers = driverHandlers as jest.Mocked<typeof driverHandlers>;
    mockedProfiler = profiler as jest.Mocked<typeof profiler>;
    mockHandlerModule.getHandler.mockReset();
    mockedDriverHandlers.fieldResolve.mockReset();
    mockedDriverHandlers.interfaceResolveType.mockReset();
    mockedDriverHandlers.scalarParse.mockReset();
    mockedDriverHandlers.scalarSerialize.mockReset();
    mockedDriverHandlers.unionResolveType.mockReset();
    mockedDriverHandlers.makeProtoError.mockReset();
    mockedGrpc.ServerCredentials.mockReset();
    grpcServerMock.addService.mockReset();
    grpcServerMock.bind.mockReset();
    grpcServerMock.start.mockReset();
    mockedReadFileSync.mockReset();
    mockedProfiler.Profiler.mockReset();
  });
  it('adds services', async () => {
    const { Server } = await import('../../src/server/server');
    new Server();
    expect(grpcServerMock.addService).toBeCalledWith(
      healthCheck.HealthService,
      new healthCheck.GrpcHealthCheck({
        plugin: healthCheck.HealthCheckResponse.ServingStatus.SERVING,
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

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(call, cb);
    expect(mockedDriverHandlers.fieldResolve).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches field resolve import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.FieldResolveResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches field resolve user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.fieldResolve.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.FieldResolveResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('calls interface resolve type handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.InterfaceResolveTypeRequest();
    const expected = new driverPb.InterfaceResolveTypeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.interfaceResolveType.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as ServerUnaryCall<InterfaceResolveTypeRequest>;
    await srv.interfaceResolveType(call, cb);
    expect(mockedDriverHandlers.interfaceResolveType).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches interface resolve type import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.InterfaceResolveTypeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<InterfaceResolveTypeRequest>;
    await srv.interfaceResolveType(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches interface resolve type user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.interfaceResolveType.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.InterfaceResolveTypeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<InterfaceResolveTypeRequest>;
    await srv.interfaceResolveType(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('sets environment variables for secrets', async () => {
    const { Server } = await import('../../src/server/server');
    const secrets: Array<[string, string]> = [['SECRET', 'VALUE']];
    const request = new driverPb.SetSecretsRequest();
    const response = new driverPb.SetSecretsResponse();
    mockedDriverHandlers.setSecrets.mockResolvedValue(response);
    request.setSecretsList(
      secrets.map((secret) => {
        const protoSecret = new driverPb.Secret();
        protoSecret.setKey(secret[0]);
        protoSecret.setValue(secret[0]);
        return protoSecret;
      }),
    );
    const srv = new Server();
    const cb = jest.fn();
    await srv.setSecrets({ request } as ServerUnaryCall<SetSecretsRequest>, cb);
    expect(cb).toHaveBeenCalledWith(null, response);
    expect(mockedDriverHandlers.setSecrets).toHaveBeenCalledWith(request, expect.anything());
  });
  it('calls scalar parse type handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.ScalarParseRequest();
    const expected = new driverPb.ScalarParseResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.scalarParse.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as ServerUnaryCall<ScalarParseRequest>;
    await srv.scalarParse(call, cb);
    expect(mockedDriverHandlers.scalarParse).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches scalar parse import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.ScalarParseResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<ScalarParseRequest>;
    await srv.scalarParse(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches scalar parse user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.scalarParse.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.ScalarParseResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<ScalarParseRequest>;
    await srv.scalarParse(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('calls scalar serialize type handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.ScalarSerializeRequest();
    const expected = new driverPb.ScalarSerializeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.scalarSerialize.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as ServerUnaryCall<ScalarSerializeRequest>;
    await srv.scalarSerialize(call, cb);
    expect(mockedDriverHandlers.scalarSerialize).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches scalar serialize import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.ScalarSerializeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<ScalarSerializeRequest>;
    await srv.scalarSerialize(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches scalar serialize user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.scalarSerialize.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.ScalarSerializeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<ScalarSerializeRequest>;
    await srv.scalarSerialize(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('calls union resolve type handler', async () => {
    const { Server } = await import('../../src/server/server');
    const request = new driverPb.UnionResolveTypeRequest();
    const expected = new driverPb.UnionResolveTypeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.unionResolveType.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as ServerUnaryCall<UnionResolveTypeRequest>;
    await srv.unionResolveType(call, cb);
    expect(mockedDriverHandlers.unionResolveType).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches union resolve type import error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.UnionResolveTypeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<UnionResolveTypeRequest>;
    await srv.unionResolveType(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches union resolve type user error ', async () => {
    const { Server } = await import('../../src/server/server');
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.unionResolveType.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new driverPb.Error();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new driverPb.UnionResolveTypeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as ServerUnaryCall<UnionResolveTypeRequest>;
    await srv.unionResolveType(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('hook wires data through grpc stdout', async () => {
    const hook = {
      on: jest.fn(),
      removeListener: jest.fn(),
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const { Server } = await import('../../src/server/server');
    let stdout: (call: Writable) => void;
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
    const dataListener: Function = hook.on.mock.calls[0][1];
    dataListener(Buffer.from('data'));
    expectByteStreamMessage('data');
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
    const endListener: Function = hook.on.mock.calls[1][1];
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
    let stderr: (call: Writable) => void;
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
    const dataListener: Function = hook.on.mock.calls[0][1];
    dataListener(Buffer.from('data'));
    expectByteStreamMessage('data');
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
    const endListener: Function = hook.on.mock.calls[1][1];
    endListener();
    expect(hook.removeListener).toHaveBeenCalledWith('data', hook.on.mock.calls[0][1]);
  });
  it('creates insecure credentials for plugin', async () => {
    const { Server } = await import('../../src/server/server');
    const srv = new Server();
    const insecureCreds = new grpc.ServerCredentials();
    createInsecureMock.mockReturnValue(insecureCreds);
    expect(srv.credentials(true)).toEqual(insecureCreds);
  });
  it('creates insecure if certs not defined', async () => {
    const { Server } = await import('../../src/server/server');
    const srv = new Server();
    const insecureCreds = new grpc.ServerCredentials();
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
    mockedReadFileSync.mockImplementation((v) => v + 'data');
    const creds = new grpc.ServerCredentials();
    createSslMock.mockReturnValue(creds);
    const srv = new Server({
      rootCerts: 'root.crt',
      privateKey: 'key.crt',
      certChain: 'cert.crt',
    });
    expect(srv.credentials(false)).toEqual(creds);
    /* eslint-disable @typescript-eslint/camelcase */
    expect(createSslMock).toHaveBeenCalledWith(
      'root.crtdata',
      [
        {
          cert_chain: 'cert.crtdata',
          private_key: 'key.crtdata',
        },
      ],
      undefined,
    );
    /* eslint-enable @typescript-eslint/camelcase */
    mockReadFileSync = false;
  });
  it('serves on default addresss as plugin', async () => {
    const { Server } = await import('../../src/server/server');
    const insecureCreds = new grpc.ServerCredentials();
    createInsecureMock.mockReturnValue(insecureCreds);
    const srv = new Server();
    const logSpy = jest.spyOn(global.console, 'log');
    srv.serve();
    expect(logSpy).toHaveBeenCalledWith('1|1|tcp|127.0.0.1:1234|grpc');
    expect(grpcServerMock.bind).toHaveBeenCalledWith('0.0.0.0:1234', insecureCreds);
    logSpy.mockClear();
  });
  it('serves on default addresss', async () => {
    const { Server } = await import('../../src/server/server');
    const insecureCreds = new grpc.ServerCredentials();
    createInsecureMock.mockReturnValue(insecureCreds);
    const srv = new Server({ pluginMode: false });
    const logSpy = jest.spyOn(global.console, 'log');
    srv.serve();
    expect(logSpy).not.toHaveBeenCalledWith('1|1|tcp|127.0.0.1:1234|grpc');
    expect(grpcServerMock.bind).toHaveBeenCalledWith('0.0.0.0:1234', insecureCreds);
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
    const call = { request: new driverPb.FieldResolveRequest() } as ServerUnaryCall<FieldResolveRequest>;
    const errorSpy = jest.spyOn(global.console, 'error');
    await new Promise((resolved) => {
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
    const call = { request: new driverPb.FieldResolveRequest() } as ServerUnaryCall<FieldResolveRequest>;
    const errorSpy = jest.spyOn(global.console, 'error');
    await new Promise((resolved) => {
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
  it('user handler calls hook and unhook io', async () => {
    const stdoutHook = {
      on: jest.fn(),
      removeListener: jest.fn(),
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const stderrHook = {
      on: jest.fn(),
      removeListener: jest.fn(),
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const consoleHook = {
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const { Server } = await import('../../src/server/server');
    const srv = new Server({ stdoutHook, stderrHook, consoleHook });
    await srv.fieldResolve(
      {
        request: new driverPb.FieldResolveRequest(),
      } as ServerUnaryCall<FieldResolveRequest>,
      jest.fn(),
    );
    expect(stdoutHook.hook).toHaveBeenCalledTimes(1);
    expect(stdoutHook.unhook).toHaveBeenCalledTimes(1);
    expect(stderrHook.hook).toHaveBeenCalledTimes(1);
    expect(stderrHook.unhook).toHaveBeenCalledTimes(1);
    expect(consoleHook.hook).toHaveBeenCalledTimes(1);
    expect(consoleHook.unhook).toHaveBeenCalledTimes(1);
  });
});
