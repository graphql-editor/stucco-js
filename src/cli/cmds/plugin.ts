import { Argv } from 'yargs';
import * as config from './plugin_cmds/config';
import * as serve from './plugin_cmds/serve';

export const command = 'plugin <command>';
export const describe = 'Plugin server commands';
export const builder = (yargs: Argv): Argv => yargs.command([config, serve]);
export function handler(): void {
  return;
}
