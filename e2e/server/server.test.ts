import { exec, ChildProcess } from 'child_process';
import fetch from 'node-fetch';
import { join } from 'path';

describe('test plugin integration', () => {
  let stuccoProccess: ChildProcess;
  beforeAll(async () => {
    stuccoProccess = exec('node node_modules/.bin/stucco', {
      cwd: join(process.cwd(), 'e2e/server/testdata'),
    });
    for (let i = 0; i < 5; i++) {
      try {
        await fetch('http://localhost:8080/graphql', {
          method: 'OPTIONS',
        });
      } catch (e) {
        if (i === 4) {
          throw e;
        }
        await new Promise((resolve) => {
          setTimeout(() => resolve(), 5000);
        });
      }
    }
  }, 30000);
  afterAll(() => {
    if (stuccoProccess) {
      stuccoProccess.kill();
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
            when: 'serialized date: ' + new Date(2020, 1, 1, 0, 1, 0, 0).toString(),
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
          new Date(2020, 1, 1, 0, 1, 0, 0).toString() +
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
            when: 'serialized date: ' + new Date(2020, 1, 1, 0, 1, 0, 0).toString(),
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
