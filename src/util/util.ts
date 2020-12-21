export function notUndefined<T>(v: T | undefined): v is T {
  return v !== undefined;
}
