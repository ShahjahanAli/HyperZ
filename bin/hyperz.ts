#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────
// HyperZ Framework — CLI Entry Point
// ──────────────────────────────────────────────────────────────

import { Command } from 'commander';
import chalk from 'chalk';
import { registerCommands } from '../src/cli/index.js';

const program = new Command();

program
    .name('hyperz')
    .description(chalk.bold.cyan('⚡ HyperZ Framework CLI'))
    .version('1.0.0');

registerCommands(program);

program.parse(process.argv);
