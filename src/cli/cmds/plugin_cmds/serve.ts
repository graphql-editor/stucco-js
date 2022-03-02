import { Argv, Arguments } from 'yargs';
import { run } from '../../../server';
export const command = 'serve';
export const describe = 'Run plugin stucco server';

const sizes = ['KB', 'MB', 'GB', 'TB'];
function toBytesSize(v: unknown): number {
  if (typeof v === 'number') {
    return v;
  }
  if (!v || typeof v !== 'string') {
    return 0;
  }
  let uv = v.toUpperCase();
  const size = sizes.findIndex((s) => uv.endsWith(s)) + 1;
  if (size && size <= sizes.length) {
    uv = uv.substr(0, uv.length - 2).trim();
  }
  const nv = parseInt(uv);
  if (isNaN(nv)) {
    throw new Error(`${v} is not a valid size string`);
  }
  return nv * Math.pow(2, 10 * size);
}
export const builder = (yargs: Argv): Argv =>
  yargs
    .option('enable-profiling', {
      default: process.env.STUCCO_JS_PROFILE === '1' || process.env.STUCCO_JS_PROFILE === 'true',
      desc: 'Enables some simple profiling for plugin',
    })
    .option('max-message-size', {
      default: process.env.STUCCO_MAX_MESSAGE_SIZE || '1mb',
      desc: 'Max size of message in bytes. Accepts human readable strings. (for ex: 1024, 1kb, 1KB, 1mb, 1MB etc)',
    });
export function handler(args: Arguments): void {
  const maxMessageSize = toBytesSize(args.maxMessageSize);
  const enableProfiling = args.enableProfiling === true;
  const done = (e?: unknown) => {
    if (e) console.error(e);
    process.exit(e ? 1 : 0);
  };
  process.once('SIGTERM', () => done());
  process.once('SIGINT', () => done());
  run({ maxMessageSize, enableProfiling }).catch(done);
}
