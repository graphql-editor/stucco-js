import { extname } from 'path';
export interface WithFunction {
  hasFunction(): boolean;
  getFunction(): { getName: () => string } | undefined;
}

function handlerFunc<T, U>(name: string, mod: { [k: string]: unknown }): (x: T) => Promise<U> | U {
  if (!name) {
    if (!mod.__esModule || ('default' in mod && !('handler' in mod))) {
      mod = mod.default as { [k: string]: unknown };
    }
    if (typeof mod === 'function') {
      return mod as (x: T) => Promise<U> | U;
    }
    if ('handler' in mod) {
      name = 'handler';
    }
  }
  if (!name || !(name in mod) || typeof mod[name] !== 'function') {
    throw new TypeError('invalid handler module');
  }
  return mod[name] as (x: T) => Promise<U> | U;
}

export async function getHandler<T, U>(req: WithFunction): Promise<(x: T) => Promise<U | undefined>> {
  if (!req.hasFunction()) {
    throw new Error('missing function');
  }
  const fn = req.getFunction();
  if (typeof fn === 'undefined' || !fn.getName()) {
    throw new Error(`function name is empty`);
  }
  const fnName = fn.getName();
  const ext = extname(fnName) !== '.js' ? extname(fnName) : '';
  const mod = await import(`${process.cwd()}/${fnName.slice(0, fnName.length - ext.length)}`);
  const handler = handlerFunc<T, U>(ext.slice(1), mod);
  return (x: T): Promise<U> => Promise.resolve(handler(x));
}