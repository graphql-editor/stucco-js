let mockReadFileSync = false;
const mockedReadFileSync = jest.fn();
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
import * as grpc from 'grpc';
import * as profiler from '../../src/server/profiler';
import { GrpcHealthCheck, HealthCheckResponse, HealthService } from 'grpc-ts-health-check';
import * as importer from '../../src/handler';
import * as driverHandlers from '../../src/proto/driver';
import { DriverService } from '../../src/proto/driver_grpc_pb';
import {
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
  ByteStream,
  SetSecretsRequest,
  Secret,
  SetSecretsResponse,
} from '../../src/proto/driver_pb';
import { Server } from '../../src/server/server';
import { Writable } from 'stream';

describe('grpc server', () => {
  jest.resetModules();
  const mockedGrpc = grpc as jest.Mocked<typeof grpc>;
  const grpcServerMock = {
    addService: jest.fn(),
    bind: jest.fn(),
    start: jest.fn(),
    tryShutdown: jest.fn(),
    register: jest.fn(),
    forceShutdown: jest.fn(),
    addProtoService: jest.fn(),
    bindAsync: jest.fn(),
  };
  const createInsecureMock = jest.fn();
  grpc.ServerCredentials.createInsecure = createInsecureMock.bind(grpc.ServerCredentials);
  const createSslMock = jest.fn();
  grpc.ServerCredentials.createSsl = createSslMock.bind(grpc.ServerCredentials);
  mockedGrpc.Server.mockImplementation(() => {
    return grpcServerMock;
  });
  const mockHandlerModule = importer as jest.Mocked<typeof importer>;
  const mockedDriverHandlers = driverHandlers as jest.Mocked<typeof driverHandlers>;
  const mockedProfiler = profiler as jest.Mocked<typeof profiler>;
  beforeEach(() => {
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
  it('adds services', () => {
    new Server();
    expect(grpcServerMock.addService).toBeCalledWith(
      HealthService,
      new GrpcHealthCheck({
        plugin: HealthCheckResponse.ServingStatus.SERVING,
      }),
    );
    expect(grpcServerMock.addService).toBeCalledWith(
      DriverService,
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
  it('starts', () => {
    const srv = new Server();
    srv.start();
    expect(grpcServerMock.start).toHaveBeenCalled();
  });
  it('handle start error', () => {
    grpcServerMock.start.mockImplementation(() => {
      throw new Error('error message');
    });
    const stderrWriteSpy = jest.spyOn(process.stderr, 'write');
    const srv = new Server();
    srv.start();
    expect(stderrWriteSpy).toHaveBeenCalledWith('error message');
    stderrWriteSpy.mockClear();
  });
  it('handle start error without message', () => {
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
    const request = new FieldResolveRequest();
    const expected = new FieldResolveResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.fieldResolve.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as grpc.ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(call, cb);
    expect(mockedDriverHandlers.fieldResolve).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches field resolve import error ', async () => {
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new FieldResolveResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches field resolve user error ', async () => {
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.fieldResolve.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new FieldResolveResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<FieldResolveRequest>;
    await srv.fieldResolve(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('calls interface resolve type handler', async () => {
    const request = new InterfaceResolveTypeRequest();
    const expected = new InterfaceResolveTypeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.interfaceResolveType.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as grpc.ServerUnaryCall<InterfaceResolveTypeRequest>;
    await srv.interfaceResolveType(call, cb);
    expect(mockedDriverHandlers.interfaceResolveType).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches interface resolve type import error ', async () => {
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new InterfaceResolveTypeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<InterfaceResolveTypeRequest>;
    await srv.interfaceResolveType(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches interface resolve type user error ', async () => {
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.interfaceResolveType.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new InterfaceResolveTypeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<InterfaceResolveTypeRequest>;
    await srv.interfaceResolveType(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('sets environment variables for secrets', async () => {
    const secrets: Array<[string, string]> = [['SECRET', 'VALUE']];
    const request = new SetSecretsRequest();
    const response = new SetSecretsResponse();
    mockedDriverHandlers.setSecrets.mockResolvedValue(response);
    request.setSecretsList(
      secrets.map((secret) => {
        const protoSecret = new Secret();
        protoSecret.setKey(secret[0]);
        protoSecret.setValue(secret[0]);
        return protoSecret;
      }),
    );
    const srv = new Server();
    const cb = jest.fn();
    await srv.setSecrets({ request } as grpc.ServerUnaryCall<SetSecretsRequest>, cb);
    expect(cb).toHaveBeenCalledWith(null, response);
    expect(mockedDriverHandlers.setSecrets).toHaveBeenCalledWith(request, expect.anything());
  });
  it('calls scalar parse type handler', async () => {
    const request = new ScalarParseRequest();
    const expected = new ScalarParseResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.scalarParse.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as grpc.ServerUnaryCall<ScalarParseRequest>;
    await srv.scalarParse(call, cb);
    expect(mockedDriverHandlers.scalarParse).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches scalar parse import error ', async () => {
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new ScalarParseResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<ScalarParseRequest>;
    await srv.scalarParse(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches scalar parse user error ', async () => {
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.scalarParse.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new ScalarParseResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<ScalarParseRequest>;
    await srv.scalarParse(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('calls scalar serialize type handler', async () => {
    const request = new ScalarSerializeRequest();
    const expected = new ScalarSerializeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.scalarSerialize.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as grpc.ServerUnaryCall<ScalarSerializeRequest>;
    await srv.scalarSerialize(call, cb);
    expect(mockedDriverHandlers.scalarSerialize).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches scalar serialize import error ', async () => {
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new ScalarSerializeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<ScalarSerializeRequest>;
    await srv.scalarSerialize(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches scalar serialize user error ', async () => {
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.scalarSerialize.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new ScalarSerializeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<ScalarSerializeRequest>;
    await srv.scalarSerialize(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('calls union resolve type handler', async () => {
    const request = new UnionResolveTypeRequest();
    const expected = new UnionResolveTypeResponse();
    const handler = jest.fn();
    mockHandlerModule.getHandler.mockResolvedValue(handler);
    mockedDriverHandlers.unionResolveType.mockResolvedValue(expected);

    const srv = new Server();
    const cb = jest.fn();
    const call = { request } as grpc.ServerUnaryCall<UnionResolveTypeRequest>;
    await srv.unionResolveType(call, cb);
    expect(mockedDriverHandlers.unionResolveType).toHaveBeenCalledWith(request, handler);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches union resolve type import error ', async () => {
    mockHandlerModule.getHandler.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new UnionResolveTypeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<UnionResolveTypeRequest>;
    await srv.unionResolveType(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('catches union resolve type user error ', async () => {
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.unionResolveType.mockRejectedValue(new Error('some error'));
    const expectedDriverError = new DriverError();
    expectedDriverError.setMsg('some error');
    mockedDriverHandlers.makeProtoError.mockReturnValue(expectedDriverError);

    const expected = new UnionResolveTypeResponse();
    expected.setError(expectedDriverError);
    const srv = new Server();
    const cb = jest.fn();
    const call = { request: null } as grpc.ServerUnaryCall<UnionResolveTypeRequest>;
    await srv.unionResolveType(call, cb);
    expect(cb).toBeCalledWith(null, expected);
  });
  it('setupIO hijacks stdout', async () => {
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
    const writeMock = jest.fn();
    const writer = new Writable();
    writer.write = writeMock;
    const cleanup = new Server().setupIO();
    stdout(writer);
    process.stdout.write('data');
    process.stdout.write(Buffer.from('data'));
    process.stdout.write(Uint8Array.from(Buffer.from('data')));
    const byteStream = new ByteStream();
    byteStream.setData(Uint8Array.from(Buffer.from('data')));
    expect(writeMock).toHaveBeenCalledWith(byteStream, expect.anything());
    expect(writeMock).toHaveBeenCalledTimes(3);
    cleanup();
  });
  it('setupIO hijacks stderr', async () => {
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
    const writeMock = jest.fn();
    const writer = new Writable();
    writer.write = writeMock;
    const cleanup = new Server().setupIO();
    stderr(writer);
    process.stderr.write('data');
    process.stderr.write(Buffer.from('data'));
    process.stderr.write(Uint8Array.from(Buffer.from('data')));
    const byteStream = new ByteStream();
    byteStream.setData(Uint8Array.from(Buffer.from('data')));
    expect(writeMock).toHaveBeenCalledWith(byteStream, expect.anything());
    expect(writeMock).toHaveBeenCalledTimes(3);
    cleanup();
  });
  it('console stdout hijacked', async () => {
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
    const writeMock = jest.fn();
    const expectByteStreamMessage = (msg: string): void => {
      const byteStream = new ByteStream();
      byteStream.setData(Uint8Array.from(Buffer.from(msg)));
      expect(writeMock).toHaveBeenCalledWith(byteStream, expect.anything());
      writeMock.mockClear();
    };
    const writer = new Writable();
    writer.write = writeMock;
    const cleanup = new Server().setupIO();
    stdout(writer);
    console.log('log msg');
    expectByteStreamMessage('[INFO]log msg\n');
    console.info('info msg');
    expectByteStreamMessage('[INFO]info msg\n');
    console.debug('debug msg');
    expectByteStreamMessage('[DEBUG]debug msg\n');
    cleanup();
  });
  it('console stderr hijacked', async () => {
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
    const writeMock = jest.fn();
    const expectByteStreamMessage = (msg: string): void => {
      const byteStream = new ByteStream();
      byteStream.setData(Uint8Array.from(Buffer.from(msg)));
      expect(writeMock).toHaveBeenCalledWith(byteStream, expect.anything());
      writeMock.mockClear();
    };
    const writer = new Writable();
    writer.write = writeMock;
    const cleanup = new Server().setupIO();
    stderr(writer);
    console.warn('warn msg');
    expectByteStreamMessage('[WARN]warn msg\n');
    console.error('error msg');
    expectByteStreamMessage('[ERROR]error msg\n');
    cleanup();
  });
  it('creates insecure credentials for plugin', () => {
    const srv = new Server();
    const insecureCreds = new grpc.ServerCredentials();
    createInsecureMock.mockReturnValue(insecureCreds);
    expect(srv.credentials(true)).toEqual(insecureCreds);
  });
  it('creates insecure if certs not defined', () => {
    const srv = new Server();
    const insecureCreds = new grpc.ServerCredentials();
    createInsecureMock.mockReturnValue(insecureCreds);
    expect(srv.credentials(false)).toEqual(insecureCreds);
  });
  it('throws bad certs', () => {
    const srv = new Server({ rootCerts: 'root.crt' });
    expect(() => {
      srv.credentials(false);
    }).toThrow();
  });
  it('creates secure credentials with certs', () => {
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
  it('serves on default addresss as plugin', () => {
    const insecureCreds = new grpc.ServerCredentials();
    createInsecureMock.mockReturnValue(insecureCreds);
    const srv = new Server();
    const logSpy = jest.spyOn(global.console, 'log');
    srv.serve();
    expect(logSpy).toHaveBeenCalledWith('1|1|tcp|127.0.0.1:1234|grpc');
    expect(grpcServerMock.bind).toHaveBeenCalledWith('0.0.0.0:1234', insecureCreds);
    logSpy.mockClear();
  });
  it('serves on default addresss', () => {
    const insecureCreds = new grpc.ServerCredentials();
    createInsecureMock.mockReturnValue(insecureCreds);
    const srv = new Server({ pluginMode: false });
    const logSpy = jest.spyOn(global.console, 'log');
    srv.serve();
    expect(logSpy).not.toHaveBeenCalledWith('1|1|tcp|127.0.0.1:1234|grpc');
    expect(grpcServerMock.bind).toHaveBeenCalledWith('0.0.0.0:1234', insecureCreds);
  });
  it('gracefully shutdowns', async () => {
    grpcServerMock.tryShutdown.mockImplementation((f) => f());
    const srv = new Server();
    await srv.stop();
    expect(grpcServerMock.tryShutdown).toHaveBeenCalled();
  });
  it('supports profiling enabling', async () => {
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.fieldResolve.mockResolvedValue(new FieldResolveResponse());
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
    mockedProfiler.Profiler.mockImplementation(() => (profilerMock as unknown) as profiler.Profiler);
    profilerMock.report.mockReturnValue('mocked report');
    new Server({ enableProfiling: true });
    const call = { request: new FieldResolveRequest() } as grpc.ServerUnaryCall<FieldResolveRequest>;
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
    mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
    mockedDriverHandlers.fieldResolve.mockResolvedValue(new FieldResolveResponse());
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
    mockedProfiler.Profiler.mockImplementation(() => (profilerMock as unknown) as profiler.Profiler);
    profilerMock.report.mockReturnValue('');
    new Server();
    const call = { request: new FieldResolveRequest() } as grpc.ServerUnaryCall<FieldResolveRequest>;
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
});
