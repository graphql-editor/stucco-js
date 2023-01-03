import { join } from 'path';
import { getHandler } from '../../src/handler/index.js';
import { readdir, mkdir, copyFile, rm } from 'fs/promises';

interface WithFunction {
  hasFunction(): boolean;
  getFunction(): { getName: () => string } | undefined;
}

async function copyDir(src: string, dest: string) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    entry.isDirectory() ?
        await copyDir(srcPath, destPath):
        await copyFile(srcPath, destPath);
  }));
}

describe('handler', () => {
  const mockWithFunction = (name: string): WithFunction => {
    return {
      hasFunction: (): boolean => true,
      getFunction: (): { getName: () => string } | undefined => ({
        getName: (): string => name,
      }),
    };
  };
  const cwd = process.cwd();
  beforeAll(async () => {
    const nm = join(cwd, 'tests', 'handler', 'testdata', 'node_modules');
    const testPkgs = await readdir(nm);
    await Promise.all(testPkgs.map((pkg) => copyDir(join(nm, pkg), join(cwd, 'node_modules', pkg))));
  })
  afterAll(async () => {
    const nm = join(cwd, 'tests', 'handler', 'testdata', 'node_modules');
    const testPkgs = await readdir(nm);
    await Promise.all(testPkgs.map((pkg) => rm(join(cwd, 'node_modules', pkg), { recursive: true })));
  })
  beforeEach(() => {
    process.chdir(join(cwd, 'tests', 'handler', 'testdata'));
  });
  afterEach(() => {
    process.chdir(cwd);
  });
  it('throws when function is missing', async () => {
    await expect(
      getHandler({ hasFunction: (): boolean => false, getFunction: () => undefined }),
    ).rejects.toHaveProperty('message');
  });
  it('throws when function name is empty', async () => {
    await expect(getHandler(mockWithFunction(''))).rejects.toHaveProperty('message');
  });
  it('imports commonjs default export', async () => {
    const v = ((await getHandler(mockWithFunction('commonjs_default'))) as (arg: unknown) => unknown)(1);
    expect(v).resolves.toEqual(1);
  });
  it('imports commonjs handler export if name empty', async () => {
    const v = ((await getHandler(mockWithFunction('commonjs_handler'))) as (arg: unknown) => unknown)(1);
    expect(v).resolves.toEqual(1);
  });
  it('imports commonjs named function', async () => {
    const v = ((await getHandler(mockWithFunction('commonjs_named.fnname'))) as (arg: unknown) => unknown)(1);
    expect(v).resolves.toEqual(1);
  });
  it('imports es module default function', async () => {
    const v = ((await getHandler(mockWithFunction('esm_default'))) as (arg: unknown) => unknown)(1);
    expect(v).resolves.toEqual(1);
  });
  it('imports es handler export if name empty', async () => {
    const v = ((await getHandler(mockWithFunction('esm_handler'))) as (arg: unknown) => unknown)(1);
    expect(v).resolves.toEqual(1);
  });
  it('imports es named function', async () => {
    const v = ((await getHandler(mockWithFunction('esm_named.fnname'))) as (arg: unknown) => unknown)(1);
    expect(v).resolves.toEqual(1);
  });
  it('imports es dict named function', async () => {
    const v = ((await getHandler(mockWithFunction('esm_dict_named@firstName.secondName.fnname'))) as (arg: unknown) => unknown)(1);
    expect(v).resolves.toEqual(1);
  });
  it('imports externaltesthandleresm module', async () => {
    const v = ((await getHandler(mockWithFunction('externaltesthandleresm'))) as (arg: unknown) => unknown)(1);
    expect(v).resolves.toEqual(1);
  });
  it('throws if function not defined', async () => {
    expect(getHandler(mockWithFunction('function'))).rejects.toHaveProperty('message');
  });
});
