import { extname, resolve, normalize, join } from 'path';
import { promises } from 'fs';
interface WithName {
  getName: () => string;
}
export interface WithFunction {
  hasFunction(): boolean;
  getFunction(): WithName | undefined;
}

function handlerFunc<T, U, V>(name: string, mod: { [k: string]: unknown }): (x: T, y?: V) => Promise<U> | U {
  let path = name.split('.').filter((v) => v);
  let v = path.reduce(
    (pv: Record<string, unknown> | undefined, cv: string) => pv && pv[cv] as Record<string, unknown> | undefined,
    mod,
  );
  if (!path.length || !v) {
    if ('default' in mod && !('handler' in mod)) {
      mod = mod.default as { [k: string]: unknown };
    }
    if (typeof mod === 'function') {
      return mod as (x: T, y?: V) => Promise<U> | U;
    }
    if ('handler' in mod && !path.length) {
      path = ['handler'];
    }
    v = path.reduce(
      (pv: Record<string, unknown> | undefined, cv: string) => pv && pv[cv] as Record<string, unknown> | undefined,
      mod,
    );
  }
  if (!path.length || typeof v !== 'function') {
    throw new TypeError('invalid handler module');
  }
  return v as (x: T, y?: V) => Promise<U> | U;
}

const cache: {
  [k: string]: (arg1: unknown, arg2?: unknown) => unknown;
} = {};

function cachedFunc<T, U, V>(fnName: string): ((x: T, y?: V) => Promise<U>) | undefined {
  const cached = cache[fnName];
  if (cached) {
    return cached as (x: T, y?: V) => Promise<U>;
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
  fnName = new URL(fnName).pathname;
  if (process.platform === 'win32' && fnName.match(/^\/[a-zA-Z]:\/.*$/)) {
    fnName = fnName.slice(1);
  }
  return findExtFrom(fnName, ['.js', '.cjs', '.mjs']);
}

const splitRefWithImport = (v: string) => v.split('@').reduce(
    (pv, cv) => pv[0]
      ? [
        pv[0],
        pv[1]
          ? [pv[1], cv].join('@')
          : cv,
      ]
      : [cv, ''],
    ['', ''],
  );

async function loadLocal<T, U, V = undefined>(fnName: string): Promise<(arg1: T, arg2?: V) => Promise<U>> {
  const [importName, name] = splitRefWithImport(fnName);
  fnName = `file:///${resolve(importName)}`;
  const baseExt = extname(fnName);
  const fName = baseExt === '' ? await findExt(fnName) : baseExt;
  const ext = fName.match(/^\.[mc]?js$/) ? fName : await findExt(fnName.slice(0, -fName.length));
  const importPath = (baseExt.length ? fnName.slice(0, -baseExt.length) : fnName) + ext;
  const mod = await import(importPath);
  const handler = handlerFunc<T, U, V>(name || (fName === ext ? '' : fName.slice(1)), mod);
  const wrapHandler = (x: T, y?: V): Promise<U> => Promise.resolve(handler(x, y));
  cache[fnName] = wrapHandler as (arg1: unknown, arg2?: unknown) => unknown;
  return wrapHandler;
}

async function findNodeModules(target: string, at: string = process.cwd()): Promise<string> {
  at = normalize(at);
  try {
    const nm = join(at, 'node_modules', target);
    await promises.stat(nm);
    return nm;
  } catch (e) {
    const up = normalize(join(at, '..'));
    if (up === at) {
      throw e;
    }
    return findNodeModules(target, up);
  }
}

async function loadModule<T, U, V = undefined>(modName: string): Promise<(arg1: T, arg2?: V) => Promise<U>> {
  const [importName, name] = splitRefWithImport(modName);
  modName = importName
  const [importPath, fName] = modName.split('.');
  await findNodeModules(importPath);
  const mod = await import(importPath);
  const handler = handlerFunc<T, U, V>(name || fName && fName.slice(1) || '', mod);
  const wrapHandler = (x: T, y?: V): Promise<U> => Promise.resolve(handler(x, y));
  cache[modName] = wrapHandler as (arg1: unknown, arg2?: unknown) => unknown;
  return wrapHandler;
}

export async function getHandler<T, U, V = undefined>(req: WithFunction): Promise<(x: T, y?: V) => Promise<U>> {
  if (!req.hasFunction()) {
    throw new Error('missing function');
  }
  const fn = req.getFunction();
  if (typeof fn === 'undefined' || !fn.getName()) {
    throw new Error(`function name is empty`);
  }
  const fnName = fn.getName()
  const cached = cachedFunc<T, U, V>(`file:///${resolve(fnName)}`) || cachedFunc<T, U, V>(fnName);
  if (cached) {
    return cached;
  }
  try {
    const handler = await loadLocal<T, U, V>(fnName);
    return handler;
  } catch(e) {
    const handler = await loadModule<T, U, V>(fnName).catch(() => {});
    if (!handler) {
      throw e;
    }
    return handler;
  }
}
