describe('StreamHook', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  afterEach(() => {
    jest.resetModules();
  });
  it('creates and deletes monkey patch', async () => {
    const passthroughWrite = jest.fn();
    const passthroughEnd = jest.fn();
    const nodejsStreamMockWrite = jest.fn();
    jest.mock('stream', () => {
      class PassThrough {
        public write = passthroughWrite;
        public end = passthroughEnd;
      }
      return { PassThrough };
    });
    const { StreamHook } = await import('../../src/server/hook_stream');
    const stream = { write: nodejsStreamMockWrite };
    const hook = new StreamHook(stream);
    expect(stream.write).not.toBe(nodejsStreamMockWrite);
    hook.delete();
    expect(stream.write).toBe(nodejsStreamMockWrite);
    expect(passthroughEnd).toHaveBeenCalledTimes(1);
  });
  it('hooks and unhooks', async () => {
    const passthroughWrite = jest.fn();
    const passthroughEnd = jest.fn();
    const nodejsStreamMockWrite = jest.fn();
    jest.mock('stream', () => {
      class PassThrough {
        public write = passthroughWrite;
        public end = passthroughEnd;
      }
      return { PassThrough };
    });
    const { StreamHook } = await import('../../src/server/hook_stream');
    const stream = { write: nodejsStreamMockWrite };
    const hook = new StreamHook(stream);
    stream.write('unhooked');
    expect(nodejsStreamMockWrite).toHaveBeenLastCalledWith('unhooked');
    hook.hook();
    stream.write('hooked');
    expect(nodejsStreamMockWrite).toHaveBeenLastCalledWith('hooked');
    expect(passthroughWrite).toHaveBeenLastCalledWith('hooked');
    hook.unhook();
    stream.write('unhooked');
    expect(nodejsStreamMockWrite).toHaveBeenLastCalledWith('unhooked');
    expect(nodejsStreamMockWrite).toHaveBeenCalledTimes(3);
    expect(passthroughWrite).toHaveBeenCalledTimes(1);
    hook.hook();
    const encoding = 'encoding';
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const cb = (): void => {};
    stream.write('hooked', encoding, cb);
    expect(nodejsStreamMockWrite).toHaveBeenLastCalledWith('hooked', encoding, cb);
    expect(passthroughWrite).toHaveBeenLastCalledWith('hooked', encoding, cb);
    expect(passthroughWrite).toHaveBeenCalledTimes(2);
    stream.write('hooked', cb);
    expect(nodejsStreamMockWrite).toHaveBeenLastCalledWith('hooked', cb);
    expect(passthroughWrite).toHaveBeenLastCalledWith('hooked', cb);
    expect(passthroughWrite).toHaveBeenCalledTimes(3);
  });
});
