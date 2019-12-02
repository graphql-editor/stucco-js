#!/usr/bin/env node

import { Server } from './server';

interface StoppableServer {
  serve(): void;
  stop(): Promise<unknown>;
}

interface RunOptions {
  version?: string;
}

export const runPluginWith = (server: StoppableServer) => {
  return (opts: RunOptions = {}): void => {
    const { version = process.version } = opts;
    if (process.argv.length > 2 && process.argv[2] === 'config') {
      process.stdout.write(
        JSON.stringify([
          {
            provider: 'local',
            runtime: 'nodejs',
          },
          {
            provider: 'local',
            runtime: 'nodejs-' + version.slice(1, version.indexOf('.')),
          },
        ]),
      );
    } else {
      const stopServer = (): void => {
        server.stop().catch((e) => console.error(e));
        process.removeListener('SIGINT', stopServer);
      };
      process.on('SIGINT', stopServer);
      server.serve();
    }
  };
};

export const run = (opts?: RunOptions): void => {
  return runPluginWith(new Server())(opts);
};

if (require.main === module) {
  try {
    run();
  } catch (e) {
    console.error(e);
  }
}
