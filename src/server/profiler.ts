import { WithFunction } from './server.js';

export class Profiler {
  private startTime?: [number, number];
  constructor(
    private opts: {
      enabled: boolean;
    } = { enabled: false },
  ) {}
  start(): void {
    if (this.opts.enabled) {
      this.startTime = process.hrtime();
    }
  }
  report(fn?: WithFunction): string | undefined {
    if (this.opts.enabled && this.startTime) {
      const t1 = process.hrtime(this.startTime);
      let fnName = 'function';
      if (fn && fn.hasFunction()) {
        const grpcFnName = fn.getFunction();
        if (grpcFnName) {
          fnName = grpcFnName.getName();
        }
      }
      return `${fnName} took: ${t1[0] * 1000 + t1[1] / 1000000}ms`;
    }
  }
}
