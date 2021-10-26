#!/usr/bin/env node

import { spawn } from 'child_process';
import { join } from 'path';
import { SIGINT } from 'constants';
const stuccoProccess = spawn('node', [join('..', '..', '..', 'lib', 'cli', 'cli.js'), ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});
process.on('SIGTERM', () => {
  stuccoProccess.kill(SIGINT);
});
process.on('SIGINT', () => {
  stuccoProccess.kill(SIGINT);
});
