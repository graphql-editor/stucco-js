#!/usr/bin/env node
import { StreamHook } from './hook_stream';

const stdout = new StreamHook(process.stdout);
const stderr = new StreamHook(process.stderr);

import { ConsoleHook } from './hook_console';

const consoleHook = new ConsoleHook(console);

import { Server } from './server';

interface StoppableServer {
  serve(): void;
  stop(): Promise<unknown>;
}

interface RunOptions {
  enableProfiling?: boolean;
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
  const serverOptions = {
    ...opts,
    stdoutHook: stdout,
    stderrHook: stderr,
    consoleHook: consoleHook,
  };
  return runPluginWith(new Server(serverOptions))(opts);
};

if (require.main === module) {
  try {
    run({ enableProfiling: process.env.STUCCO_JS_PROFILE === '1' || process.env.STUCCO_JS_PROFILE === 'true' });
  } catch (e) {
    stderr.unhook();
    consoleHook.unhook();
    console.error(e);
  }
}
