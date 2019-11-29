import { Writable } from "stream";

export class DevNull extends Writable {
  public write(
    buffer: string | Buffer | Uint8Array,
    cb?: ((err?: Error | null | undefined) => void) | undefined,
  ): boolean;
  public write(
    str: string, encoding?: string | undefined,
    cb?: ((err?: Error | null | undefined) => void) | undefined,
  ): boolean;
  public write(
    _: string | Buffer | Uint8Array,
    second?: string | ((err?: Error | null | undefined) => void),
    cb?: ((err?: Error | null | undefined) => void))
    : boolean {
    if (typeof second === "function") {
      setImmediate(second);
    } else if (typeof cb === "function") {
      setImmediate(cb);
    }
    return true;
  }
}
