#!/usr/bin/env node
import yargs from 'yargs';
import { extensions } from './util';

// Plugin compatibility
let args = process.argv.slice(2);
if (args.length === 0) {
  args = ['plugin', 'serve'];
}
yargs(args).commandDir('cmds', { extensions }).help().argv;
