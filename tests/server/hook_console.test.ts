describe('ConsoleHook', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  function traceExpect(trace: string, firstLine = 'Trace: trace'): void {
    const traceLines = trace.split('\n');
    expect(traceLines[0]).toEqual(firstLine);
    expect(traceLines[1]).toMatch(
      new RegExp('^.* \\(' + __filename.split('\\').join('\\\\') + ':[1-9][0-9]*:[1-9][0-9]*\\)$'),
    );
  }
  it('creates and deletes a monkey patch', async () => {
    const { ConsoleHook } = await import('../../src/server/hook_console');
    const mockConsole = {
      log: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      trace: jest.fn(),
    };
    const mockConsoleFunctions = { ...mockConsole };
    const mockHooks = {
      log: jest.fn().mockReturnValue('hooked log'),
      info: jest.fn().mockReturnValue('hooked info'),
      debug: jest.fn().mockReturnValue('hooked debug'),
      warn: jest.fn().mockReturnValue('hooked warn'),
      error: jest.fn().mockReturnValue('hooked error'),
      trace: jest.fn().mockReturnValue('hooked trace'),
    };
    const hook = new ConsoleHook(mockConsole, mockHooks);
    expect(mockConsole.log).not.toBe(mockConsoleFunctions.log);
    expect(mockConsole.info).not.toBe(mockConsoleFunctions.info);
    expect(mockConsole.debug).not.toBe(mockConsoleFunctions.debug);
    expect(mockConsole.warn).not.toBe(mockConsoleFunctions.warn);
    expect(mockConsole.error).not.toBe(mockConsoleFunctions.error);
    expect(mockConsole.trace).not.toBe(mockConsoleFunctions.trace);
    hook.delete();
    expect(mockConsole.log).toBe(mockConsoleFunctions.log);
    expect(mockConsole.info).toBe(mockConsoleFunctions.info);
    expect(mockConsole.debug).toBe(mockConsoleFunctions.debug);
    expect(mockConsole.warn).toBe(mockConsoleFunctions.warn);
    expect(mockConsole.error).toBe(mockConsoleFunctions.error);
    expect(mockConsole.trace).toBe(mockConsoleFunctions.trace);
  });
  it('hooks and unhooks', async () => {
    const { ConsoleHook } = await import('../../src/server/hook_console');
    const mockConsole = {
      log: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      trace: jest.fn(),
    };
    const mockConsoleFunctions = { ...mockConsole };
    const mockHooks = {
      log: jest.fn().mockReturnValue('hooked log'),
      info: jest.fn().mockReturnValue('hooked info'),
      debug: jest.fn().mockReturnValue('hooked debug'),
      warn: jest.fn().mockReturnValue('hooked warn'),
      error: jest.fn().mockReturnValue('hooked error'),
      trace: jest.fn().mockReturnValue('hooked trace'),
    };
    const errorCalls = mockConsoleFunctions.error.mock.calls;
    const hook = new ConsoleHook(mockConsole, mockHooks);
    mockConsole.log('log');
    expect(mockConsoleFunctions.log).toHaveBeenLastCalledWith('log');
    mockConsole.info('info');
    expect(mockConsoleFunctions.info).toHaveBeenLastCalledWith('info');
    mockConsole.debug('debug');
    expect(mockConsoleFunctions.debug).toHaveBeenLastCalledWith('debug');
    mockConsole.warn('warn');
    expect(mockConsoleFunctions.warn).toHaveBeenLastCalledWith('warn');
    mockConsole.error('error');
    expect(mockConsoleFunctions.error).toHaveBeenLastCalledWith('error');
    mockConsole.trace('trace');
    traceExpect.call(global, errorCalls[errorCalls.length - 1][0]);
    hook.hook();
    mockConsole.log('log');
    expect(mockConsoleFunctions.log).toHaveBeenLastCalledWith('hooked log');
    mockConsole.info('info');
    expect(mockConsoleFunctions.info).toHaveBeenLastCalledWith('hooked info');
    mockConsole.debug('debug');
    expect(mockConsoleFunctions.debug).toHaveBeenLastCalledWith('hooked debug');
    mockConsole.warn('warn');
    expect(mockConsoleFunctions.warn).toHaveBeenLastCalledWith('hooked warn');
    mockConsole.error('error');
    expect(mockConsoleFunctions.error).toHaveBeenLastCalledWith('hooked error');
    mockConsole.trace('trace');
    expect(mockConsoleFunctions.error).toHaveBeenLastCalledWith('hooked trace');
    hook.unhook();
    mockConsole.log('log');
    expect(mockConsoleFunctions.log).toHaveBeenLastCalledWith('log');
    mockConsole.info('info');
    expect(mockConsoleFunctions.info).toHaveBeenLastCalledWith('info');
    mockConsole.debug('debug');
    expect(mockConsoleFunctions.debug).toHaveBeenLastCalledWith('debug');
    mockConsole.warn('warn');
    expect(mockConsoleFunctions.warn).toHaveBeenLastCalledWith('warn');
    mockConsole.error('error');
    expect(mockConsoleFunctions.error).toHaveBeenLastCalledWith('error');
    mockConsole.trace('trace');
    traceExpect.call(global, errorCalls[errorCalls.length - 1][0]);
    hook.delete();
  });
  it('adds level prefix', async () => {
    const { ConsoleHook } = await import('../../src/server/hook_console');
    const mockConsole = {
      log: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      trace: jest.fn(),
    };
    const mockConsoleFunctions = { ...mockConsole };
    const hook = new ConsoleHook(mockConsole);
    hook.hook();
    mockConsole.log('log');
    const errorCalls = mockConsoleFunctions.error.mock.calls;
    expect(mockConsoleFunctions.log).toHaveBeenLastCalledWith('[INFO]log');
    mockConsole.info('info');
    expect(mockConsoleFunctions.info).toHaveBeenLastCalledWith('[INFO]info');
    mockConsole.debug('debug');
    expect(mockConsoleFunctions.debug).toHaveBeenLastCalledWith('[DEBUG]debug');
    mockConsole.warn('warn');
    expect(mockConsoleFunctions.warn).toHaveBeenLastCalledWith('[WARN]warn');
    mockConsole.error('error');
    expect(mockConsoleFunctions.error).toHaveBeenLastCalledWith('[ERROR]error');
    mockConsole.trace('trace');
    traceExpect.call(global, errorCalls[errorCalls.length - 1][0], '[TRACE]Trace: trace');
    hook.delete();
  });
  it('Trace without message', async () => {
    const { ConsoleHook } = await import('../../src/server/hook_console');
    const mockConsole = {
      log: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      trace: jest.fn(),
    };
    const mockConsoleFunctions = { ...mockConsole };
    const hook = new ConsoleHook(mockConsole);
    const errorCalls = mockConsoleFunctions.error.mock.calls;
    mockConsole.trace();
    traceExpect.call(global, errorCalls[errorCalls.length - 1][0], 'Trace');
    hook.delete();
  });
});
