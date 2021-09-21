#!/usr/bin/env node

import BinWrapper from 'bin-wrapper';
import { spawn } from 'child_process';
import { version } from './version';
import binCheck from 'bin-check';
import binVersionCheck from 'bin-version-check';
import { retry } from '../util/util';
import { rmdir } from 'fs';
import { promisify } from 'util';
import { join } from 'path';
const rmdirP = promisify(rmdir);

const base = 'https://stucco-release.fra1.cdn.digitaloceanspaces.com';
const dest = join(__dirname, 'vendor');
async function fetchCheckBin(): Promise<BinWrapper> {
  const bin = new BinWrapper({ skipCheck: true })
    .src(`${base}/${version}/darwin/amd64/stucco`, 'darwin')
    .src(`${base}/${version}/linux/amd64/stucco`, 'linux', 'x64')
    .src(`${base}/${version}/windows/amd64/stucco.exe`, 'win32', 'x64')
    .dest(dest)
    .use(process.platform === 'win32' ? 'stucco.exe' : 'stucco');
  await bin.run();
  const works = await binCheck(bin.path());
  if (!works) {
    throw new Error(`binary ${bin.path()} does not seem to work`);
  }
  await binVersionCheck(bin.path(), `~${version}`, { args: ['version'] });
  return bin;
}

async function tryRemove(e: unknown): Promise<void> {
  await rmdirP(dest, { recursive: true });
  throw e;
}

export async function stucco(): Promise<BinWrapper> {
  const bin = await retry(() => fetchCheckBin().catch(tryRemove), { retries: 2, minTimeout: 10 });
  if (!bin) {
    throw new Error('could not find stucco binary');
  }
  return bin;
}

if (require.main === module) {
  (async (): Promise<void> => {
    const bin = await stucco();
    const args = process.argv.length > 2 ? process.argv.slice(2) : ['local', 'start'];
    const child = spawn(bin.path(), args, { stdio: [process.stdin, process.stdout, process.stderr] });
    process.on('SIGTERM', () => {
      child.kill();
    });
    process.on('SIGINT', () => {
      child.kill();
    });
  })().catch((e) => console.error(e));
}
