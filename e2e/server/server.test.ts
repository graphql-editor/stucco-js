import { spawn, ChildProcess, execSync } from 'child_process';
import fetch from 'node-fetch';
import { join } from 'path';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

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

describe('test plugin integration', () => {
  let stuccoProccess: ChildProcess;
  beforeAll(async () => {
    // Use run.js directly to make sure process is terminated on windows
    const cwd = join(process.cwd(), 'e2e', 'server', 'testdata');
    stuccoProccess = spawn(npm, ['run', 'start'], { cwd, env: process.env, stdio: 'inherit' });
    await retry(
      async () =>
        fetch('http://localhost:8080/graphql', {
          method: 'OPTIONS',
          timeout: 1000,
        }),
      5,
      2000,
    );
  }, 30000);
  afterAll(() => {
    if (stuccoProccess) {
      if (process.platform === 'win32') {
        execSync('taskkill /pid ' + stuccoProccess.pid + ' /T /F');
      } else {
        stuccoProccess.kill();
      }
    }
  });
  it('returns hero', async () => {
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query: '{ hero(name: "Batman") { name sidekick { name } } }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
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
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query: '{ sidekick(name: "Robin") { name hero { name } } }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
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
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query: '{ search(name: "Batman") { ... on Hero { name } } }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
      data: {
        search: {
          name: 'Batman',
        },
      },
    });
  });
  it('finds sidekick', async () => {
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query: '{ search(name: "Robin") { ... on Sidekick { name } } }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
      data: {
        search: {
          name: 'Robin',
        },
      },
    });
  });
  it('finds vilian', async () => {
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query: '{ search(name: "Joker") { ... on Vilian { name } } }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
      data: {
        search: {
          name: 'Joker',
        },
      },
    });
  });
  it('battles', async () => {
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query:
          '{ battles { participants { members { name ... on Hero { sidekick { name } } ... on Sidekick { hero { name } } } } when } }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
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
    const response = await fetch('http://localhost:8080/graphql', {
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
    }).then((res) => res.json());
    expect(response).toEqual({
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
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query:
          '{ search(name: "Batman") { ... on Hero { name sidekick { name } } ... on Sidekick { name hero { name } } } }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
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
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query:
          '{ search(name: "Robin") { ... on Hero { name sidekick { name } } ... on Sidekick { name hero { name } } } }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
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
    const response = await fetch('http://localhost:8080/graphql', {
      body: JSON.stringify({
        query: '{ getSecretKey }',
      }),
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    }).then((res) => res.json());
    expect(response).toEqual({
      data: {
        getSecretKey: 'VALUE',
      },
    });
  });
});
