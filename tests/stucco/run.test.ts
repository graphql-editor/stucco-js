import { jest } from '@jest/globals';
import { execFileSync } from 'child_process';
import { stucco } from '../../src/stucco/run.js';
import { version } from '../../src/stucco/version.js';

describe('stucco', () => {
  // file downlaod, be a bit more permissive timeout
  jest.setTimeout(60000);
  test('fetch correct version', async () => {
    const bin = await stucco();
    expect(execFileSync(bin.path(), ['version']).toString().trim()).toEqual(version);
  });
});
