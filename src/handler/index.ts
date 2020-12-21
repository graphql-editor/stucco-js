import { extname } from 'path';
export interface WithFunction {
  hasFunction(): boolean;
  getFunction(): { getName: () => string } | undefined;
}

function handlerFunc<T, U, V>(name: string, mod: { [k: string]: unknown }): (x: T, y?: V) => Promise<U> | U {
  if (!name) {
    if (!mod.__esModule || ('default' in mod && !('handler' in mod))) {
      mod = mod.default as { [k: string]: unknown };
    }
    if (typeof mod === 'function') {
      return mod as (x: T, y?: V) => Promise<U> | U;
    }
    if ('handler' in mod) {
      name = 'handler';
    }
  }
  if (!name || !(name in mod) || typeof mod[name] !== 'function') {
    throw new TypeError('invalid handler module');
  }
  return mod[name] as (x: T, y?: V) => Promise<U> | U;
}

const cache: {
  [k: string]: (arg1: unknown, arg2?: unknown) => unknown;
} = {};

function cachedFunc<T, U, V>(fnName: string): ((x: T, y?: V) => Promise<U | undefined>) | undefined {
  const cached = cache[fnName];
  if (cached) {
    return cached as (x: T, y?: V) => Promise<U | undefined>;
  }
  return;
}

export async function getHandler<T, U, V = undefined>(
  req: WithFunction,
): Promise<(x: T, y?: V) => Promise<U | undefined>> {
  if (!req.hasFunction()) {
    throw new Error('missing function');
  }
  const fn = req.getFunction();
  if (typeof fn === 'undefined' || !fn.getName()) {
    throw new Error(`function name is empty`);
  }
  const fnName = fn.getName();
  const cached = cachedFunc<T, U, V>(fnName);
  if (cached) {
    return cached;
  }
  const ext = extname(fnName) !== '.js' ? extname(fnName) : '';
  const mod = await import(
    `${process.env.STUCCO_PROJECT_ROOT || process.cwd()}/${fnName.slice(0, fnName.length - ext.length)}`
  );
  const handler = handlerFunc<T, U, V>(ext.slice(1), mod);
  const wrapHandler = (x: T, y?: V): Promise<U> => Promise.resolve(handler(x, y));
  cache[fnName] = wrapHandler as (arg1: unknown, arg2?: unknown) => unknown;
  return wrapHandler;
}
