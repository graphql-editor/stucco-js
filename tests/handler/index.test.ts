interface WithFunction {
  hasFunction(): boolean;
  getFunction(): { getName: () => string } | undefined;
}

describe('handler', () => {
  const mockWithFunction = (name: string): WithFunction => {
    return {
      hasFunction: (): boolean => true,
      getFunction: (): { getName: () => string } | undefined => ({
        getName: (): string => name,
      }),
    };
  };
  beforeEach(() => {
    jest.resetModules();
  });
  it('throws when function is missing', async () => {
    const { getHandler } = await import('../../src/handler');
    await expect(
      getHandler({ hasFunction: (): boolean => false, getFunction: () => undefined }),
    ).rejects.toHaveProperty('message');
  });
  it('throws when function name is empty', async () => {
    const { getHandler } = await import('../../src/handler');
    await expect(getHandler(mockWithFunction(''))).rejects.toHaveProperty('message');
  });
  it('imports commonjs default export', async () => {
    const { getHandler } = await import('../../src/handler');
    const handler = jest.fn();
    jest.mock(`${process.cwd()}/function`, () => handler, { virtual: true });
    (await getHandler(mockWithFunction('function')))(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('imports commonjs handler export if name empty', async () => {
    const { getHandler } = await import('../../src/handler');
    const handler = jest.fn();
    jest.mock(`${process.cwd()}/function`, () => ({ handler: handler }), { virtual: true });
    (await getHandler(mockWithFunction('function')))(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('imports commonjs named function', async () => {
    const { getHandler } = await import('../../src/handler');
    const handler = jest.fn();
    jest.mock(`${process.cwd()}/function`, () => ({ fnname: handler }), { virtual: true });
    (await getHandler(mockWithFunction('function.fnname')))(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('imports es module default function', async () => {
    const { getHandler } = await import('../../src/handler');
    const handler = jest.fn();
    jest.mock(`${process.cwd()}/function`, () => ({ __esModule: true, default: handler }), { virtual: true });
    (await getHandler(mockWithFunction('function')))(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('imports es handler export if name empty', async () => {
    const { getHandler } = await import('../../src/handler');
    const handler = jest.fn();
    jest.mock(`${process.cwd()}/function`, () => ({ __esModule: true, handler: handler }), { virtual: true });
    (await getHandler(mockWithFunction('function')))(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('imports es named function', async () => {
    const { getHandler } = await import('../../src/handler');
    const handler = jest.fn();
    jest.mock(`${process.cwd()}/function`, () => ({ __esModule: true, fnname: handler }), { virtual: true });
    (await getHandler(mockWithFunction('function.fnname')))(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('throws if function not defined', async () => {
    const { getHandler } = await import('../../src/handler');
    jest.mock(`${process.cwd()}/function`);
    await expect(getHandler(mockWithFunction('function'))).rejects.toHaveProperty('message');
  });
});
