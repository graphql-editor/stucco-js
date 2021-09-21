import { operation, OperationOptions } from 'retry';

export function notUndefined<T>(v: T | undefined): v is T {
  return v !== undefined;
}

export async function retry<T>(f: () => Promise<T> | T, opts?: OperationOptions): Promise<T> {
  const op = operation(
    opts || {
      retries: 5,
      factor: 3,
      minTimeout: 1 * 1000,
      maxTimeout: 60 * 1000,
      randomize: true,
    },
  );
  return new Promise<T>((resolve, reject) =>
    op.attempt(async () => {
      try {
        resolve(await f());
      } catch (e) {
        const err = e === undefined || e instanceof Error ? e : new Error('unknown error');
        if (!op.retry(err)) {
          reject(err);
        }
      }
    }),
  );
}
