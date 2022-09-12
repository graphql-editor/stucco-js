#!/usr/bin/env node

import { version } from './version.js';
import { platform, arch } from 'os';
import { promises, createWriteStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { get } from 'https';
import { retry } from '../util/util.js';
import { IncomingMessage } from 'http';
import binVersionCheck from 'bin-version-check';
const { chmod, rm, stat, mkdir } = promises;

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = `https://stucco-release.fra1.cdn.digitaloceanspaces.com/${version}`;
const dest = join(__dirname, 'vendor');
const filename = join(dest, platform() === 'win32' ? 'stucco.exe' : 'stucco');
const src = () => {
  const src: Partial<Record<NodeJS.Platform, Record<string, string>>> = {
    darwin: {
      x64: `${base}/darwin/amd64/stucco`,
      arm64: `${base}/darwin/arm64/stucco`,
    },
    linux: {
      x32: `${base}/linux/386/stucco`,
      x64: `${base}/linux/amd64/stucco`,
      arm64: `${base}/linux/arm64/stucco`,
    },
    win32: {
      x32: `${base}/windows/386/stucco`,
      x64: `${base}/windows/amd64/stucco`,
      arm64: `${base}/windows/arm64/stucco`,
    },
  };
  const plat = src[platform()] || {};
  return plat[arch()];
};

const fetchBin = async () => {
  const res = await new Promise<IncomingMessage>((resolve, reject) => {
    const req = get(src(), resolve);
    req.on('error', reject);
  });
  const { statusCode = 0 } = res;
  if (statusCode < 200 || statusCode > 299) {
    throw new Error('Did not recieve 200 class respopnse');
  }
  await mkdir(dirname(filename), { recursive: true });
  await new Promise((resolve, reject) => {
    const bin = createWriteStream(filename, { autoClose: true });
    bin.on('error', reject);
    bin.on('close', resolve);
    bin.on('open', () => {
      res.pipe(bin);
      res.on('error', (e) => {
        reject(e);
        bin.close();
      });
      res.on('end', () => bin.close());
    });
  });
  if (platform() != 'win32') {
    await chmod(filename, '700');
  }
};

async function fetchCheckBin() {
  try {
    await stat(filename);
  } catch {
    await fetchBin().catch((e) => {
      console.log(e);
      throw e;
    });
  }
  await binVersionCheck(filename, `~${version}`, { args: ['version'] });
}

async function tryRemove(e: unknown): Promise<void> {
  await rm(dest, { recursive: true });
  throw e;
}

export async function stucco(): Promise<string> {
  await retry(() => fetchCheckBin().catch(tryRemove), { retries: 2, minTimeout: 10 });
  return filename;
}
