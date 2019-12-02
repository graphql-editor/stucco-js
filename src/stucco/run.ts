#!/usr/bin/env node

import BinWrapper from 'bin-wrapper';
import { spawnSync } from 'child_process';
import * as path from 'path';
import { version } from './version';

const base = 'https://stucco-release.fra1.cdn.digitaloceanspaces.com';
export const stucco = async (): Promise<BinWrapper> => {
  const bin = new BinWrapper()
    .src(`${base}/${version}/darwin/amd64/stucco`, 'darwin')
    .src(`${base}/${version}/linux/amd64/stucco`, 'linux', 'x64')
    .src(`${base}/${version}/windows/amd64/stucco.exe`, 'win32', 'x64')
    .dest(path.join(__dirname, 'vendor'))
    .use(process.platform === 'win32' ? 'stucco.exe' : 'stucco')
    .version(`~${version}`);
  await bin.run();
  return bin;
};

if (require.main === module) {
  (async (): Promise<void> => {
    const bin = await stucco();
    spawnSync(bin.path(), [], { stdio: [process.stdin, process.stdout, process.stderr] });
  })().catch((e) => console.error(e));
}
