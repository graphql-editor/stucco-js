import { run, runPluginWith } from '../../src/server/run';

describe('local plugin server', () => {
  it('returns node config', () => {
    const oldWrite = process.stdout.write;
    const oldProcessArgv = process.argv;
    const fn = jest.fn();
    try {
      process.stdout.write = fn;
      process.argv = ['', '', 'config'];
      run({ version: 'v1.1.1' });
    } finally {
      process.argv = oldProcessArgv;
      process.stdout.write = oldWrite;
    }
    expect(fn).toBeCalledTimes(1);
    expect(JSON.parse(fn.mock.calls[0][0])).toEqual([
      {
        provider: 'local',
        runtime: 'nodejs',
      },
      {
        provider: 'local',
        runtime: 'nodejs-1',
      },
    ]);
  });
  it('starts and stops with process signals', () => {
    const serverMock = {
      serve: jest.fn(() => {
        return;
      }),
      stop: jest.fn(() => {
        return Promise.resolve();
      }),
    };
    const mockProcessSignals = {
      on: jest.fn(),
      removeListener: jest.fn(),
    };
    const oldOn = process.on;
    const oldOff = process.off;
    try {
      process.on = mockProcessSignals.on;
      process.removeListener = mockProcessSignals.removeListener;
      runPluginWith(serverMock)();
    } finally {
      process.on = oldOn;
      process.off = oldOff;
    }
    expect(serverMock.serve).toBeCalledTimes(1);
    expect(mockProcessSignals.on).toBeCalledTimes(2);
    expect(mockProcessSignals.on.mock.calls[0][0]).toEqual('SIGINT');
    expect(mockProcessSignals.on.mock.calls[0][1]).toBeInstanceOf(Function);
    expect(mockProcessSignals.on.mock.calls[1][0]).toEqual('SIGTERM');
    expect(mockProcessSignals.on.mock.calls[1][1]).toBeInstanceOf(Function);
    const stopCallback: () => {} = mockProcessSignals.on.mock.calls[0][1];
    stopCallback();
    expect(mockProcessSignals.removeListener).toBeCalledTimes(2);
    expect(mockProcessSignals.removeListener.mock.calls[0][0]).toEqual('SIGINT');
    expect(mockProcessSignals.removeListener.mock.calls[0][1]).toEqual(stopCallback);
    expect(mockProcessSignals.removeListener.mock.calls[1][0]).toEqual('SIGTERM');
    expect(mockProcessSignals.removeListener.mock.calls[1][1]).toEqual(stopCallback);
    expect(serverMock.stop).toBeCalledTimes(1);
  });
});
