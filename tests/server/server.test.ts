import { jest } from '@jest/globals';
import { join } from 'path';
import { HealthService } from 'grpc-health-check-ts';
import * as driverGrpcPb from '../../src/proto/driver/driver_service.js';
import * as messages from '../../src/proto/driver/messages.js';
import { Server, ServerOptions, GRPCServer } from '../../src/server/server.js';
import { ServerUnaryCall } from '@grpc/grpc-js';
import { Writable } from 'stream';

describe('grpc server', () => {
  it('adds services', async () => {
    const addService = jest.fn();
    new Server({ server: { addService } as unknown as GRPCServer });
    expect(addService).toBeCalledWith(
      HealthService,
      expect.objectContaining({
        check: expect.anything(),
        watch: expect.anything(),
      }),
    );
    expect(addService).toBeCalledWith(
      driverGrpcPb.DriverService,
      expect.objectContaining({
        fieldResolve: expect.anything(),
        interfaceResolveType: expect.anything(),
        scalarParse: expect.anything(),
        scalarSerialize: expect.anything(),
        unionResolveType: expect.anything(),
      }),
    );
    expect(addService).toBeCalledTimes(2);
  });
  it('starts', async () => {
    const addService = jest.fn();
    const start = jest.fn();
    const srv = new Server({ server: { start, addService } as unknown as GRPCServer });
    srv.start();
    expect(start).toHaveBeenCalled();
  });
  it('handle start error', async () => {
    const addService = jest.fn();
    const err = new Error();
    const start = jest.fn().mockImplementation(() => {
      throw err;
    });
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const srv = new Server({ server: { start, addService } as unknown as GRPCServer });
    srv.start();
    expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    consoleErrorSpy.mockClear();
  });
  it('handle start error without message', async () => {
    const addService = jest.fn();
    const err = new Error();
    const start = jest.fn().mockImplementation(() => {
      throw err;
    });
    const stderrWriteSpy = jest.spyOn(process.stderr, 'write');
    const srv = new Server({ server: { start, addService } as unknown as GRPCServer });
    srv.start();
    expect(stderrWriteSpy).not.toHaveBeenCalled();
    stderrWriteSpy.mockClear();
  });
  it('hook wires data through grpc stdout', async () => {
    const hook = {
      on: jest.fn(),
      removeListener: jest.fn(),
      hook: jest.fn(),
      unhook: jest.fn(),
    };
    const fakeStdout = jest.fn();
    let stdout: (call: Writable) => void = fakeStdout;
    const addService = jest.fn().mockImplementation(((
      _: unknown,
      services: {
        stdout: (call: Writable) => void;
      },
    ) => {
      stdout = services.stdout;
    }) as (...args: unknown[]) => unknown);
    new Server({
      stdoutHook: hook,
      server: { addService } as unknown as GRPCServer,
    } as ServerOptions);
    expect(hook.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(hook.on).toHaveBeenCalledWith('end', expect.any(Function));
    const writeMock = jest.fn();
    const writer = new Writable();
    writer.write = writeMock as typeof writer.write;
    stdout(writer);
    const expectByteStreamMessage = (msg: string): void => {
      const byteStream = new messages.ByteStream();
      byteStream.setData(Uint8Array.from(Buffer.from(msg)));
      expect(writeMock).toHaveBeenLastCalledWith(byteStream, expect.anything());
      writeMock.mockClear();
    };
    const dataListener: (buf: Buffer) => void = hook.on.mock.calls[0][1] as (buf: Buffer) => void;
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
    new Server({
      stdoutHook: hook,
    } as ServerOptions);
    expect(hook.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(hook.on).toHaveBeenCalledWith('end', expect.any(Function));
    const endListener: () => void = hook.on.mock.calls[1][1] as () => void;
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
    const fakeStderr = jest.fn();
    let stderr: (call: Writable) => void = fakeStderr;
    const addService = jest.fn().mockImplementation(((
      _: unknown,
      services: {
        stderr: (call: Writable) => void;
      },
    ): void => {
      stderr = services.stderr;
    }) as (...args: unknown[]) => unknown);
    new Server({
      stderrHook: hook,
      server: { addService } as unknown as GRPCServer,
    } as ServerOptions);
    expect(hook.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(hook.on).toHaveBeenCalledWith('end', expect.any(Function));
    const writeMock = jest.fn();
    const writer = new Writable();
    writer.write = writeMock as typeof writer.write;
    stderr(writer);
    const expectByteStreamMessage = (msg: string): void => {
      const byteStream = new messages.ByteStream();
      byteStream.setData(Uint8Array.from(Buffer.from(msg)));
      expect(writeMock).toHaveBeenLastCalledWith(byteStream, expect.anything());
      writeMock.mockClear();
    };
    const dataListener: (buf: Buffer) => void = hook.on.mock.calls[0][1] as (buf: Buffer) => void;
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
    new Server({
      stderrHook: hook,
    } as ServerOptions);
    expect(hook.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(hook.on).toHaveBeenCalledWith('end', expect.any(Function));
    const endListener: () => void = hook.on.mock.calls[1][1] as () => void;
    endListener();
    expect(hook.removeListener).toHaveBeenCalledWith('data', hook.on.mock.calls[0][1]);
  });
  //it('creates insecure credentials for plugin', async () => {
  //  const srv = new Server();
  //  const insecureCreds = grpc.ServerCredentials.createInsecure();
  //  createInsecureMock.mockReturnValue(insecureCreds);
  //  expect(srv.credentials(true)).toEqual(insecureCreds);
  //});
  //it('creates insecure if certs not defined', async () => {
  //  const { Server } = await import('../../src/server/server.js');
  //  const srv = new Server();
  //  const insecureCreds = grpc.ServerCredentials.createInsecure();
  //  createInsecureMock.mockReturnValue(insecureCreds);
  //  expect(srv.credentials(false)).toEqual(insecureCreds);
  //});
  //it('throws bad certs', async () => {
  //  const { Server } = await import('../../src/server/server.js');
  //  const srv = new Server({ rootCerts: 'root.crt' });
  //  expect(() => {
  //    srv.credentials(false);
  //  }).toThrow();
  //});
  //it('creates secure credentials with certs', async () => {
  //  const { Server } = await import('../../src/server/server.js');
  //  mockReadFileSync = true;
  //  mockedReadFileSync.mockImplementation((v) => Buffer.from(v + 'data'));
  //  createSslMock.mockReturnValue('mock');
  //  new Server({
  //    rootCerts: 'root.crt',
  //    privateKey: 'key.crt',
  //    certChain: 'cert.crt',
  //  }).credentials(false);
  //  expect(createSslMock).toHaveBeenCalledWith(
  //    Buffer.from('root.crtdata'),
  //    [
  //      {
  //        cert_chain: Buffer.from('cert.crtdata'),
  //        private_key: Buffer.from('key.crtdata'),
  //      },
  //    ],
  //    undefined,
  //  );
  //  mockReadFileSync = false;
  //});
  //it('serves on default addresss as plugin', async () => {
  //  const { Server } = await import('../../src/server/server.js');
  //  const insecureCreds = realCreateInsecure();
  //  createInsecureMock.mockReset();
  //  createInsecureMock.mockReturnValue(insecureCreds);
  //  const srv = new Server();
  //  const logSpy = jest.spyOn(global.console, 'log');
  //  grpcServerMock.bindAsync.mockImplementation(((_1, _2, cb: (a: null, b: number) => void) => {
  //    cb(null, 1234);
  //  }) as (...args: unknown[]) => unknown);
  //  await srv.serve();
  //  expect(logSpy).toHaveBeenCalledWith('1|1|tcp|127.0.0.1:1234|grpc');
  //  logSpy.mockClear();
  //});
  //it('serves on default addresss', async () => {
  //  const { Server } = await import('../../src/server/server.js');
  //  const insecureCreds = realCreateInsecure();
  //  createInsecureMock.mockReset();
  //  createInsecureMock.mockReturnValue(insecureCreds);
  //  createInsecureMock.mockReturnValue(insecureCreds);
  //  const srv = new Server({ pluginMode: false });
  //  const logSpy = jest.spyOn(global.console, 'log');
  //  grpcServerMock.bindAsync.mockImplementation(((_1, _2, cb: (a: null, b: number) => void) => {
  //    cb(null, 1234);
  //  }) as (...args: unknown[]) => unknown);
  //  await srv.serve();
  //  expect(logSpy).not.toHaveBeenCalledWith('1|1|tcp|127.0.0.1:1234|grpc');
  //});
  //it('gracefully shutdowns', async () => {
  //  const { Server } = await import('../../src/server/server.js');
  //  grpcServerMock.tryShutdown.mockImplementation(((f: () => void) => f()) as (...args: unknown[]) => unknown);
  //  const srv = new Server();
  //  await srv.stop();
  //  expect(grpcServerMock.tryShutdown).toHaveBeenCalled();
  //});
  //it('supports profiling enabling', async () => {
  //  const { Server } = await import('../../src/server/server.js');
  //  mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
  //  mockedDriverHandlers.fieldResolve.mockResolvedValue(new driverPb.FieldResolveResponse());
  //  const profilerMock = {
  //    start: jest.fn(),
  //    report: jest.fn(),
  //  };
  //  let wrappedFieldResolve: (...args: unknown[]) => void;
  //  grpcServerMock.addService.mockImplementation(
  //    ((_: unknown, services: { fieldResolve: (...args: unknown[]) => void }) => {
  //      wrappedFieldResolve = services.fieldResolve;
  //    }) as (...args: unknown[]) => unknown,
  //  );
  //  mockedProfiler.Profiler.mockImplementation(() => profilerMock as unknown as Profiler);
  //  profilerMock.report.mockReturnValue('mocked report');
  //  new Server({ enableProfiling: true });
  //  const call = { request: new driverPb.FieldResolveRequest() } as ServerUnaryCall<
  //    messages.FieldResolveRequest,
  //    messages.FieldResolveResponse
  //  >;
  //  const errorSpy = jest.spyOn(global.console, 'error');
  //  await new Promise<void>((resolved) => {
  //    const cb = jest.fn();
  //    cb.mockImplementation(() => {
  //      resolved();
  //    });
  //    wrappedFieldResolve(call, cb);
  //  });
  //  expect(mockedProfiler.Profiler).toHaveBeenCalledWith({ enabled: true });
  //  expect(profilerMock.start).toHaveBeenCalled();
  //  expect(profilerMock.report).toHaveBeenCalled();
  //  expect(errorSpy).toHaveBeenCalledWith('mocked report');
  //  errorSpy.mockClear();
  //});
  //it('supports profiling disabling', async () => {
  //  const { Server } = await import('../../src/server/server.js');
  //  mockHandlerModule.getHandler.mockResolvedValue(jest.fn());
  //  mockedDriverHandlers.fieldResolve.mockResolvedValue(new driverPb.FieldResolveResponse());
  //  const profilerMock = {
  //    start: jest.fn(),
  //    report: jest.fn(),
  //  };
  //  let wrappedFieldResolve: (...args: unknown[]) => void;
  //  grpcServerMock.addService.mockImplementation(
  //    ((_: unknown, services: { fieldResolve: (...args: unknown[]) => void }) => {
  //      wrappedFieldResolve = services.fieldResolve;
  //    }) as (...args: unknown[]) => unknown,
  //  );
  //  mockedProfiler.Profiler.mockImplementation(() => profilerMock as unknown as Profiler);
  //  profilerMock.report.mockReturnValue('');
  //  new Server();
  //  const call = { request: new driverPb.FieldResolveRequest() } as ServerUnaryCall<
  //    messages.FieldResolveRequest,
  //    messages.FieldResolveResponse
  //  >;
  //  const errorSpy = jest.spyOn(global.console, 'error');
  //  await new Promise<void>((resolved) => {
  //    const cb = jest.fn();
  //    cb.mockImplementation(() => {
  //      resolved();
  //    });
  //    wrappedFieldResolve(call, cb);
  //  });
  //  expect(mockedProfiler.Profiler).toHaveBeenCalledWith({ enabled: false });
  //  expect(profilerMock.start).toHaveBeenCalled();
  //  expect(profilerMock.report).toHaveBeenCalled();
  //  expect(errorSpy).not.toHaveBeenCalledWith('mocked report');
  //  errorSpy.mockClear();
  //});
});
describe('tests function executors', () => {
  const cwd = process.cwd();
  beforeEach(() => {
    process.chdir(join(cwd, 'tests', 'server', 'testdata'));
  });
  afterEach(() => {
    process.chdir(cwd);
  });
  let handlers: Record<string, (...args: unknown[]) => unknown> = {};
  const addService = (_: unknown, callbacks: Record<string, (...args: unknown[]) => unknown>) => {
    handlers = callbacks;
  };
  const execute = <T>(name: string, call: unknown): Promise<T> =>
    new Promise<T>((resolve, reject) =>
      handlers[name](call, (err: unknown, resp: unknown) => (err ? reject(err) : resolve(resp as T))),
    );
  new Server({ server: { addService } as GRPCServer });
  it('calls field resolve handler', async () => {
    const func = new messages.Function();
    func.setName('field_resolve_handler');
    const request = new messages.FieldResolveRequest();
    request.setFunction(func);
    request.setInfo(new messages.FieldResolveInfo());
    const call = { request } as ServerUnaryCall<messages.FieldResolveRequest, messages.FieldResolveResponse>;
    const resp = await execute<messages.FieldResolveResponse>('fieldResolve', call);
    expect(resp.getResponse()?.getI()).toEqual(1);
  });
  it('catches field resolve import error ', async () => {
    const func = new messages.Function();
    func.setName('missing');
    const request = new messages.FieldResolveRequest();
    request.setFunction(func);
    request.setInfo(new messages.FieldResolveInfo());
    const call = { request } as ServerUnaryCall<messages.FieldResolveRequest, messages.FieldResolveResponse>;
    const resp = await execute<messages.FieldResolveResponse>('fieldResolve', call);
    expect(resp.getError()?.getMsg()).toBeTruthy();
  });
  it('catches field resolve user error ', async () => {
    const func = new messages.Function();
    func.setName('user_error');
    const request = new messages.FieldResolveRequest();
    request.setFunction(func);
    request.setInfo(new messages.FieldResolveInfo());
    const call = { request } as ServerUnaryCall<messages.FieldResolveRequest, messages.FieldResolveResponse>;
    const resp = await execute<messages.FieldResolveResponse>('fieldResolve', call);
    expect(resp.getError()?.getMsg()).toEqual('some error');
  });
  it('calls interface resolve type handler', async () => {
    const func = new messages.Function();
    func.setName('interface_resolve_type_handler');
    const request = new messages.InterfaceResolveTypeRequest();
    request.setFunction(func);
    request.setInfo(new messages.InterfaceResolveTypeInfo());
    const call = { request } as ServerUnaryCall<
      messages.InterfaceResolveTypeRequest,
      messages.InterfaceResolveTypeResponse
    >;
    const resp = await execute<messages.InterfaceResolveTypeResponse>('interfaceResolveType', call);
    expect(resp.getType()?.getName()).toEqual('SomeType');
  });
  it('catches interface resolve type import error ', async () => {
    const func = new messages.Function();
    func.setName('missing');
    const request = new messages.InterfaceResolveTypeRequest();
    request.setFunction(func);
    request.setInfo(new messages.InterfaceResolveTypeInfo());
    const call = { request } as ServerUnaryCall<
      messages.InterfaceResolveTypeRequest,
      messages.InterfaceResolveTypeResponse
    >;
    const resp = await execute<messages.InterfaceResolveTypeResponse>('interfaceResolveType', call);
    expect(resp.getError()?.getMsg()).toBeTruthy();
  });
  it('catches interface resolve type user error ', async () => {
    const func = new messages.Function();
    func.setName('user_error');
    const request = new messages.InterfaceResolveTypeRequest();
    request.setFunction(func);
    request.setInfo(new messages.InterfaceResolveTypeInfo());
    const call = { request } as ServerUnaryCall<
      messages.InterfaceResolveTypeRequest,
      messages.InterfaceResolveTypeResponse
    >;
    const resp = await execute<messages.InterfaceResolveTypeResponse>('interfaceResolveType', call);
    expect(resp.getError()?.getMsg()).toEqual('some error');
  });
  it('sets environment variables for secrets', async () => {
    const secrets: Array<[string, string]> = [['SECRET', 'VALUE']];
    const request = new messages.SetSecretsRequest();
    request.setSecretsList(
      secrets.map((secret) => {
        const protoSecret = new messages.Secret();
        protoSecret.setKey(secret[0]);
        protoSecret.setValue(secret[0]);
        return protoSecret;
      }),
    );
    const call = { request } as ServerUnaryCall<messages.SetSecretsRequest, messages.SetSecretsResponse>;
    const resp = await execute<messages.SetSecretsResponse>('setSecrets', call);
    expect(resp.getError()).toBeUndefined();
  });
  it('calls scalar parse type handler', async () => {
    const func = new messages.Function();
    func.setName('scalar_parse_handler');
    const request = new messages.ScalarParseRequest();
    request.setFunction(func);
    const call = { request } as ServerUnaryCall<messages.ScalarParseRequest, messages.ScalarParseResponse>;
    const resp = await execute<messages.ScalarParseResponse>('scalarParse', call);
    expect(resp.getValue()?.getI()).toEqual(1);
  });
  it('catches scalar parse type import error ', async () => {
    const func = new messages.Function();
    func.setName('missing');
    const request = new messages.ScalarParseRequest();
    request.setFunction(func);
    const call = { request } as ServerUnaryCall<messages.ScalarParseRequest, messages.ScalarParseResponse>;
    const resp = await execute<messages.ScalarParseResponse>('scalarParse', call);
    expect(resp.getError()?.getMsg()).toBeTruthy();
  });
  it('catches scalar parse type user error ', async () => {
    const func = new messages.Function();
    func.setName('user_error');
    const request = new messages.ScalarParseRequest();
    request.setFunction(func);
    const call = { request } as ServerUnaryCall<messages.ScalarParseRequest, messages.ScalarParseResponse>;
    const resp = await execute<messages.ScalarParseResponse>('scalarParse', call);
    expect(resp.getError()?.getMsg()).toEqual('some error');
  });
  it('calls scalar serialize type handler', async () => {
    const func = new messages.Function();
    func.setName('scalar_serialize_handler');
    const request = new messages.ScalarSerializeRequest();
    request.setFunction(func);
    const call = { request } as ServerUnaryCall<messages.ScalarSerializeRequest, messages.ScalarSerializeResponse>;
    const resp = await execute<messages.ScalarSerializeResponse>('scalarSerialize', call);
    expect(resp.getValue()?.getI()).toEqual(1);
  });
  it('catches scalar serialize type import error ', async () => {
    const func = new messages.Function();
    func.setName('missing');
    const request = new messages.ScalarSerializeRequest();
    request.setFunction(func);
    const call = { request } as ServerUnaryCall<messages.ScalarSerializeRequest, messages.ScalarSerializeResponse>;
    const resp = await execute<messages.ScalarSerializeResponse>('scalarSerialize', call);
    expect(resp.getError()?.getMsg()).toBeTruthy();
  });
  it('catches scalar serialize type user error ', async () => {
    const func = new messages.Function();
    func.setName('user_error');
    const request = new messages.ScalarSerializeRequest();
    request.setFunction(func);
    const call = { request } as ServerUnaryCall<messages.ScalarSerializeRequest, messages.ScalarSerializeResponse>;
    const resp = await execute<messages.ScalarSerializeResponse>('scalarSerialize', call);
    expect(resp.getError()?.getMsg()).toEqual('some error');
  });
  it('calls union resolve type handler', async () => {
    const func = new messages.Function();
    func.setName('union_resolve_type_handler');
    const request = new messages.UnionResolveTypeRequest();
    request.setFunction(func);
    request.setInfo(new messages.UnionResolveTypeInfo());
    const call = { request } as ServerUnaryCall<messages.UnionResolveTypeRequest, messages.UnionResolveTypeResponse>;
    const resp = await execute<messages.UnionResolveTypeResponse>('unionResolveType', call);
    expect(resp.getType()?.getName()).toEqual('SomeType');
  });
  it('catches union resolve type import error ', async () => {
    const func = new messages.Function();
    func.setName('missing');
    const request = new messages.UnionResolveTypeRequest();
    request.setFunction(func);
    request.setInfo(new messages.UnionResolveTypeInfo());
    const call = { request } as ServerUnaryCall<messages.UnionResolveTypeRequest, messages.UnionResolveTypeResponse>;
    const resp = await execute<messages.UnionResolveTypeResponse>('unionResolveType', call);
    expect(resp.getError()?.getMsg()).toBeTruthy();
  });
  it('catches union resolve type user error ', async () => {
    const func = new messages.Function();
    func.setName('user_error');
    const request = new messages.UnionResolveTypeRequest();
    request.setFunction(func);
    request.setInfo(new messages.UnionResolveTypeInfo());
    const call = { request } as ServerUnaryCall<messages.UnionResolveTypeRequest, messages.UnionResolveTypeResponse>;
    const resp = await execute<messages.UnionResolveTypeResponse>('unionResolveType', call);
    expect(resp.getError()?.getMsg()).toEqual('some error');
  });
});
