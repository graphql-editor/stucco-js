import { extname } from 'path';
import { promises } from 'fs';
export interface WithFunction {
  hasFunction(): boolean;
  getFunction(): { getName: () => string } | undefined;
}

function handlerFunc<T, U, V>(name: string, mod: { [k: string]: unknown }): (x: T, y?: V) => Promise<U> | U {
  if (!name || !(name in mod)) {
    if ('default' in mod && !('handler' in mod)) {
      mod = mod.default as { [k: string]: unknown };
    }
    if (typeof mod === 'function') {
      return mod as (x: T, y?: V) => Promise<U> | U;
    }
    if ('handler' in mod && !name) {
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

async function findExtFrom(fnName: string, ext: string[]): Promise<string> {
  if (!ext.length) throw new Error('extension not found');
  return promises
    .stat(fnName + ext[0])
    .then(() => ext[0])
    .catch(() => findExtFrom(fnName, ext.slice(1)));
}
async function findExt(fnName: string): Promise<string> {
  return findExtFrom(fnName, ['.js', '.cjs', '.mjs']);
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
  const fnName = `${process.cwd()}/${fn.getName()}`;
  const cached = cachedFunc<T, U, V>(fnName);
  if (cached) {
    return cached;
  }
  const baseExt = extname(fnName);
  const fName = baseExt === '' ? await findExt(fnName) : baseExt;
  const ext = fName.match(/^\.[mc]?js/) ? fName : await findExt(fnName.slice(0, -fName.length));
  const importPath = (baseExt.length ? fnName.slice(0, -baseExt.length) : fnName) + ext
  const mod = await import(importPath);
  const handler = handlerFunc<T, U, V>(fName === ext ? '' : fName.slice(1), mod);
  const wrapHandler = (x: T, y?: V): Promise<U> => Promise.resolve(handler(x, y));
  cache[fnName] = wrapHandler as (arg1: unknown, arg2?: unknown) => unknown;
  return wrapHandler;
}
