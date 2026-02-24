#!/usr/bin/env node

/**
 * HyperZ CLI — Executable Shim
 *
 * This file allows running `npx hyperz <command>` without compiling TypeScript first.
 * It spawns Node.js with `--import tsx` to enable TypeScript support, then runs the actual CLI.
 *
 * Usage:
 *   npx hyperz <command>       # Full name
 *   npx hz <command>           # Short alias
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = resolve(__dirname, 'hyperz.ts');

const result = spawnSync(process.execPath, ['--import', 'tsx', cli, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..'),
});

process.exit(result.status ?? 1);
