#!/usr/bin/env node
import yargs from 'yargs';
import * as azure from './cmds/azure.js';
import * as config from './cmds/config.js';
import * as plugin from './cmds/plugin.js';

// Plugin compatibility
let args = process.argv.slice(2);
if (args.length === 0) {
  args = ['plugin', 'serve'];
}
yargs(args).command([azure, config, plugin]).help().argv;
