import { Argv } from 'yargs';
import * as serve from './azure_cmds/serve';

export const command = 'azure <command>';
export const describe = 'Azure Function commands';
export const builder = (yargs: Argv): Argv => yargs.command([serve]);
export function handler(): void {
  return;
}
