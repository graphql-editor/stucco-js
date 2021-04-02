import { Argv } from 'yargs';
import { extensions } from '../util';

export const command = 'plugin <command>';
export const describe = 'Plugin server commands';
export const builder = (yargs: Argv): Argv => yargs.commandDir('plugin_cmds', { extensions });
export function handler(): void {
  return;
}
