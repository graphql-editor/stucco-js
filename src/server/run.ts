#!/usr/bin/env node

import { Server } from "./server";

interface IStoppableServer {
  // blocking serve
  serve(): void;
  stop(): Promise<unknown>;
}

interface IRunOptions {
  version?: string;
}

export function runPluginWith(server: IStoppableServer) {
  return (opts: IRunOptions = {}) => {
    const {
      version = process.version,
    } = opts;
    if (process.argv.length > 2 && process.argv[2] === "config") {
      process.stdout.write(JSON.stringify([
        {
          provider: "local",
          runtime: "nodejs",
        },
        {
          provider: "local",
          runtime: "nodejs-" + version.slice(1, version.indexOf(".")),
        },
      ]));
    } else {
      const stopServer = () => {
        server.stop().catch((e) => console.error(e));
        process.removeListener("SIGINT", stopServer);
      };
      process.on("SIGINT", stopServer);
      server.serve();
    }
  };
}

export function run(opts?: IRunOptions) {
  return runPluginWith(new Server())(opts);
}
