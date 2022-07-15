import { spawn, ChildProcess, execSync } from 'child_process';
import fetch from 'node-fetch';
import type { AbortSignal as NodeFetchAbortSignal } from 'node-fetch/externals';
import { AbortController as NodeAbortController } from 'node-abort-controller';
import { join, delimiter } from 'path';

const node = process.platform === 'win32' ? 'node.exe' : 'node';
const pathKey = process.platform === 'win32' ? 'Path' : 'PATH';

const retry = <T>(fn: () => Promise<T>, retries: number, timeout: number): Promise<T> =>
  retries > 1
    ? fn().catch(
        () =>
          new Promise<T>((resolve, reject) =>
            setTimeout(
              () =>
                retry(fn, retries - 1, timeout)
                  .then((r: T) => resolve(r))
                  .catch((e: unknown) => reject(e)),
              timeout,
            ),
          ),
      )
    : fn();

const kill = (proc: ChildProcess) =>
  process.platform === 'win32' ? execSync('taskkill /pid ' + proc.pid + ' /T /F') : proc.kill();

const waitKill = async (proc?: ChildProcess) =>
  proc &&
  new Promise<void>((resolve) => {
    proc.once('exit', resolve);
    kill(proc);
  });

const waitSpawn = async (proc: ChildProcess) =>
  ver >= 14 &&
  new Promise<void>((resolve, reject) => {
    proc.once('error', reject);
    proc.once('spawn', () => {
      proc.off('error', reject);
      resolve();
    });
  });

const ver = parseInt(process.versions.node.split('.')[0]);
const AbortControllerImpl = ver < 16 ? NodeAbortController : AbortController;

const query = (body: Record<string, unknown>, signal?: AbortSignal) =>
  fetch('http://localhost:8080/graphql', {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    signal,
  }).then((res) => (res.status === 200 ? res.json() : Promise.reject('not 200')));

const ping = async () => {
  const controller = new AbortControllerImpl();
  const id = setTimeout(() => controller.abort(), 1000);
  const signal = controller.signal;
  const resp = await query({ query: '{ hero(name: "Batman") { name sidekick { name } } }' }, signal);
  clearTimeout(id);
  return resp;
};

const waitPing = () => retry(ping, 5, 2000);

describe('test plugin integration', () => {
  let stuccoProccess: ChildProcess | undefined;
  beforeAll(async () => {
    // Use run.js directly to make sure process is terminated on windows
    const cwd = join(process.cwd(), 'e2e', 'server', 'testdata');
    const env = { ...process.env };
    const p = (env[pathKey] && delimiter + env[pathKey]) || '';
    env[pathKey] = `${cwd}${p.length > 1 ? p : ''}`;
    stuccoProccess = spawn(node, [join('..', '..', '..', 'lib', 'stucco', 'run.js'), 'local', 'start', '-v', '5'], {
      cwd,
      env,
      stdio: 'ignore',
    });
    await retry(
      async () => {
        const ver = parseInt(process.versions.node.split('.')[0]);
        const controller = ver < 16 ? new NodeAbortController() : new AbortController();
        const id = setTimeout(() => controller.abort(), 1000);
        const signal = controller.signal as NodeFetchAbortSignal;
        const resp = await fetch('http://localhost:8080/graphql', {
          method: 'OPTIONS',
          signal,
        });
        clearTimeout(id);
        return resp;
      },
      5,
      2000,
    );
  }, 30000);
  afterAll(async () => {
    const proc = stuccoProccess;
    stuccoProccess = undefined;
    await waitKill(proc);
  }, 30000);
  it('returns hero', async () => {
    await expect(query({ query: '{ hero(name: "Batman") { name sidekick { name } } }' })).resolves.toEqual({
      data: {
        hero: {
          name: 'Batman',
          sidekick: {
            name: 'Robin',
          },
        },
      },
    });
  });
  it('returns sidekick', async () => {
    await expect(query({ query: '{ sidekick(name: "Robin") { name hero { name } } }' })).resolves.toEqual({
      data: {
        sidekick: {
          name: 'Robin',
          hero: {
            name: 'Batman',
          },
        },
      },
    });
  });
  it('finds hero', async () => {
    await expect(query({ query: '{ search(name: "Batman") { ... on Hero { name } } }' })).resolves.toEqual({
      data: {
        search: {
          name: 'Batman',
        },
      },
    });
  });
  it('finds sidekick', async () => {
    await expect(query({ query: '{ search(name: "Robin") { ... on Sidekick { name } } }' })).resolves.toEqual({
      data: {
        search: {
          name: 'Robin',
        },
      },
    });
  });
  it('finds vilian', async () => {
    await expect(query({ query: '{ search(name: "Joker") { ... on Vilian { name } } }' })).resolves.toEqual({
      data: {
        search: {
          name: 'Joker',
        },
      },
    });
  });
  it('battles', async () => {
    await expect(
      query({
        query:
          '{ battles { participants { members { name ... on Hero { sidekick { name } } ... on Sidekick { hero { name } } } } when } }',
      }),
    ).resolves.toEqual({
      data: {
        battles: [
          {
            participants: [
              {
                members: [
                  {
                    name: 'Batman',
                    sidekick: {
                      name: 'Robin',
                    },
                  },
                  {
                    name: 'Robin',
                    hero: {
                      name: 'Batman',
                    },
                  },
                ],
              },
              {
                members: [
                  {
                    name: 'Joker',
                  },
                ],
              },
            ],
            when: 'serialized date: ' + new Date(2020, 1, 1, 0, 1, 0, 0).toUTCString(),
          },
        ],
      },
    });
  });
  it('findBattles', async () => {
    await expect(
      query({
        query:
          '{ findBattles(when: "' +
          new Date(2020, 1, 1, 0, 1, 0, 0).toUTCString() +
          '") { participants { members { name ... on Hero { sidekick { name } } ... on Sidekick { hero { name } } } } when } }',
      }),
    ).resolves.toEqual({
      data: {
        findBattles: [
          {
            participants: [
              {
                members: [
                  {
                    name: 'Batman',
                    sidekick: {
                      name: 'Robin',
                    },
                  },
                  {
                    name: 'Robin',
                    hero: {
                      name: 'Batman',
                    },
                  },
                ],
              },
              {
                members: [
                  {
                    name: 'Joker',
                  },
                ],
              },
            ],
            when: 'serialized date: ' + new Date(2020, 1, 1, 0, 1, 0, 0).toUTCString(),
          },
        ],
      },
    });
  });
  it('search batman', async () => {
    await expect(
      query({
        query:
          '{ search(name: "Batman") { ... on Hero { name sidekick { name } } ... on Sidekick { name hero { name } } } }',
      }),
    ).resolves.toEqual({
      data: {
        search: {
          name: 'Batman',
          sidekick: {
            name: 'Robin',
          },
        },
      },
    });
  });
  it('search robin', async () => {
    await expect(
      query({
        query:
          '{ search(name: "Robin") { ... on Hero { name sidekick { name } } ... on Sidekick { name hero { name } } } }',
      }),
    ).resolves.toEqual({
      data: {
        search: {
          name: 'Robin',
          hero: {
            name: 'Batman',
          },
        },
      },
    });
  });
  it('check if secret set', async () => {
    await expect(query({ query: '{ getSecretKey }' })).resolves.toEqual({
      data: {
        getSecretKey: 'VALUE',
      },
    });
  });
});
