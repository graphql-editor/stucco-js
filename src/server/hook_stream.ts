import { PassThrough } from 'stream';

interface WriteFunc {
  (buffer: string | Buffer | Uint8Array, cb?: (err?: Error) => void): boolean;
  (str: string, encoding?: string, cb?: (err?: Error) => void): boolean;
}

interface WriteStreamLike {
  write: WriteFunc;
}

export class StreamHook extends PassThrough {
  private oldWrite: WriteFunc;
  private stream: WriteStreamLike;
  private hooked: boolean;
  constructor(stream: WriteStreamLike) {
    super();
    this.oldWrite = stream.write;
    this.stream = stream;
    this.hooked = false;
    this.stream.write = this.hookWithCast(this.stream.write.bind(this.stream));
  }
  hook(): void {
    this.hooked = true;
  }
  unhook(): void {
    this.hooked = false;
  }
  delete(): void {
    this.stream.write = this.oldWrite;
    this.end();
  }

  private hookWithCast<T, U, W, FunctionType extends (data: T, arg1?: U, arg2?: W) => boolean>(
    fn: FunctionType,
  ): FunctionType {
    return ((data: T, arg1: U, arg2: W): boolean => {
      if (this.hooked) {
        this.write(data);
      }
      if (typeof arg1 === 'undefined') {
        return fn(data);
      }
      if (typeof arg2 === 'undefined') {
        return fn(data, arg1);
      }
      return fn(data, arg1, arg2);
    }) as FunctionType;
  }
}
