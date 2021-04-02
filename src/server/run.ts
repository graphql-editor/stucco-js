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
  maxMessageSize?: number;
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
        process.removeListener('SIGTERM', stopServer);
      };
      process.on('SIGINT', stopServer);
      process.on('SIGTERM', stopServer);
      server.serve();
    }
  };
};

export const run = (opts: RunOptions = {}): void => {
  try {
    const grpcServerOpts = {
      ...(opts.maxMessageSize && {
        'grpc.max_send_message_length': opts.maxMessageSize,
        'grpc.max_receive_message_length': opts.maxMessageSize,
      }),
    };
    const serverOptions: Record<string, unknown> = {
      ...opts,
      stdoutHook: stdout,
      stderrHook: stderr,
      consoleHook: consoleHook,
      grpcServerOpts,
    };
    return runPluginWith(new Server(serverOptions))(opts);
  } catch (e) {
    stderr.unhook();
    consoleHook.unhook();
    console.error(e);
  }
};
