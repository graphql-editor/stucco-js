#!/usr/bin/env node

import { spawn } from 'child_process';
import { join } from 'path';
const stuccoProccess = spawn('node', [join('..', '..', '..', 'lib', 'cli', 'cli.js'), ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
});
const kill = () => stuccoProccess.kill()
process.on('SIGTERM', kill);
process.on('SIGINT', kill);
