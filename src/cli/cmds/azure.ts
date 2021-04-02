import { Argv } from 'yargs';
import { extensions } from '../util';

export const command = 'azure <command>';
export const describe = 'Azure Function commands';
export const builder = (yargs: Argv): Argv => yargs.commandDir('azure_cmds', { extensions });
export function handler(): void {
  return;
}
