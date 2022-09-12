import { spawn, ChildProcess } from 'child_process';
import fetch from 'node-fetch';
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

const waitKill = async (proc?: ChildProcess) =>
  proc &&
  new Promise<void>((resolve) => {
    proc.once('exit', resolve);
    proc.kill();
  });

const ver = parseInt(process.versions.node.split('.')[0]);

const waitSpawn = async (proc: ChildProcess) =>
  ver >= 14 &&
  new Promise<void>((resolve, reject) => {
    proc.once('error', reject);
    proc.once('spawn', () => {
      proc.off('error', reject);
      resolve();
    });
  });

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
  const controller = new AbortController();
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
    stuccoProccess = spawn(node, [join('..', '..', '..', 'lib', 'stucco', 'cmd.js'), 'local', 'start', '-v', '5'], {
      cwd,
      env,
      stdio: 'inherit',
    });
    const proc = stuccoProccess;
    await waitSpawn(proc);
    await waitPing();
  }, 30000);
  afterAll(async () => {
    const proc = stuccoProccess;
    stuccoProccess = undefined;
    await waitKill(proc);
  }, 30000);
  it('returns hero', async () => {
    await expect(
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query: '{ hero(name: "Batman") { name sidekick { name } } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
    ).resolves.toEqual({
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
    await expect(
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query: '{ sidekick(name: "Robin") { name hero { name } } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
    ).resolves.toEqual({
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
    await expect(
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query: '{ search(name: "Batman") { ... on Hero { name } } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
    ).resolves.toEqual({
      data: {
        search: {
          name: 'Batman',
        },
      },
    });
  });
  it('finds sidekick', async () => {
    await expect(
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query: '{ search(name: "Robin") { ... on Sidekick { name } } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
    ).resolves.toEqual({
      data: {
        search: {
          name: 'Robin',
        },
      },
    });
  });
  it('finds vilian', async () => {
    await expect(
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query: '{ search(name: "Joker") { ... on Vilian { name } } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
    ).resolves.toEqual({
      data: {
        search: {
          name: 'Joker',
        },
      },
    });
  });
  it('battles', async () => {
    await expect(
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query:
            '{ battles { participants { members { name ... on Hero { sidekick { name } } ... on Sidekick { hero { name } } } } when } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
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
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query:
            '{ findBattles(when: "' +
            new Date(2020, 1, 1, 0, 1, 0, 0).toUTCString() +
            '") { participants { members { name ... on Hero { sidekick { name } } ... on Sidekick { hero { name } } } } when } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
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
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query:
            '{ search(name: "Batman") { ... on Hero { name sidekick { name } } ... on Sidekick { name hero { name } } } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
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
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query:
            '{ search(name: "Robin") { ... on Hero { name sidekick { name } } ... on Sidekick { name hero { name } } } }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
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
    await expect(
      fetch('http://localhost:8080/graphql', {
        body: JSON.stringify({
          query: '{ getSecretKey }',
        }),
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      }).then((res) => res.json()),
    ).resolves.toEqual({
      data: {
        getSecretKey: 'VALUE',
      },
    });
  });
});
