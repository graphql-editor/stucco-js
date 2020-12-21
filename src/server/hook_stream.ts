import { PassThrough, Writable } from 'stream';

type ErrorCallback = (error: Error | undefined | null) => void;
type WriteFunc = Writable['write'];

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

  private hookWithCastOv1(
    fn: WriteFunc,
    arg1: string | Buffer | Uint8Array,
    arg2: string,
    arg3?: ErrorCallback,
  ): ReturnType<WriteFunc> {
    if (this.hooked) {
      this.write(arg1, arg2, arg3);
    }
    return fn(arg1, arg2, arg3);
  }

  private hookWithCastOv2(
    fn: WriteFunc,
    arg1: string | Buffer | Uint8Array,
    arg2?: ErrorCallback,
  ): ReturnType<WriteFunc> {
    const call = (fn: WriteFunc): ReturnType<WriteFunc> => (arg2 ? fn(arg1, arg2) : fn(arg1));
    if (this.hooked) {
      call(this.write);
    }
    return call(fn);
  }

  private hookWithCast(fn: WriteFunc): WriteFunc {
    return (
      arg1: string | Buffer | Uint8Array,
      arg2?: string | ErrorCallback,
      arg3?: ErrorCallback,
    ): ReturnType<WriteFunc> => {
      if (typeof arg2 === 'string') {
        return this.hookWithCastOv1(fn, arg1, arg2, arg3);
      }
      return this.hookWithCastOv2(fn, arg1, arg2);
    };
  }
}
