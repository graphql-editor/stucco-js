import { Profiler } from '../../src/server/profiler';

describe('test profiler', () => {
  it('falsy report if not enabled', () => {
    const profiler = new Profiler();
    profiler.start();
    expect(profiler.report()).toBeFalsy();
  });
  it('reports function profile', () => {
    const profiler = new Profiler({ enabled: true });
    profiler.start();
    expect(
      profiler.report({
        hasFunction: (): boolean => true,
        getFunction: (): { getName: () => string } => ({
          getName: (): string => 'some.function',
        }),
      }),
    ).toMatch(/^some.function took: [0-9]*\.[0-9]*ms$/);
  });
});
