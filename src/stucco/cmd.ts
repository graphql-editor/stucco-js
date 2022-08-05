#!/usr/bin/env node
import { stucco } from './run.js';
import { spawn } from 'child_process';
(async (): Promise<void> => {
  const bin = await stucco();
  const args = process.argv.length > 2 ? process.argv.slice(2) : ['local', 'start'];
  const child = spawn(bin.path(), args, { stdio: [process.stdin, process.stdout, process.stderr] });
  const kill = () => child.kill();
  process.on('SIGTERM', kill);
  process.on('SIGINT', kill);
})().catch((e) => console.error(e));
