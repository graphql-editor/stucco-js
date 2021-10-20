import { stucco } from './run.js';
import { spawn } from 'child_process';
import { SIGINT } from 'constants';
(async (): Promise<void> => {
  const bin = await stucco();
  const args = process.argv.length > 2 ? process.argv.slice(2) : ['local', 'start'];
  const child = spawn(bin.path(), args, { stdio: [process.stdin, process.stdout, process.stderr] });
  process.on('SIGTERM', () => {
    child.kill(SIGINT);
  });
  process.on('SIGINT', () => {
    child.kill(SIGINT);
  });
})().catch((e) => console.error(e));
