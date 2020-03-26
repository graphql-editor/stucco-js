#!/usr/bin/env node

import BinWrapper from 'bin-wrapper';
import { spawn } from 'child_process';
import * as path from 'path';
import { version } from './version';
import binCheck from 'bin-check';
import binVersionCheck from 'bin-version-check';

const base = 'https://stucco-release.fra1.cdn.digitaloceanspaces.com';
export const stucco = async (): Promise<BinWrapper> => {
  const bin = new BinWrapper({ skipCheck: true })
    .src(`${base}/${version}/darwin/amd64/stucco`, 'darwin')
    .src(`${base}/${version}/linux/amd64/stucco`, 'linux', 'x64')
    .src(`${base}/${version}/windows/amd64/stucco.exe`, 'win32', 'x64')
    .dest(path.join(__dirname, 'vendor'))
    .use(process.platform === 'win32' ? 'stucco.exe' : 'stucco');
  await bin.run();
  const works = await binCheck(bin.path());
  if (!works) {
    throw new Error(`binary ${bin.path()} does not seem to work`);
  }
  await binVersionCheck(bin.path(), `~${version}`, { args: ['version'] });
  return bin;
};

if (require.main === module) {
  (async (): Promise<void> => {
    const bin = await stucco();
    const child = spawn(bin.path(), ['local', 'start'], { stdio: [process.stdin, process.stdout, process.stderr] });
    process.on('SIGTERM', () => {
      child.kill();
    });
    process.on('SIGINT', () => {
      child.kill();
    });
  })().catch((e) => console.error(e));
}
