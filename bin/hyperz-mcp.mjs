#!/usr/bin/env node

/**
 * HyperZ MCP Server — Executable Shim
 *
 * This file allows running `npx hyperz-mcp` without compiling TypeScript first.
 * It spawns Node.js with `--import tsx` to enable TypeScript support, then runs the MCP server.
 *
 * Usage:
 *   npx hyperz-mcp              # stdio transport (for Claude Desktop, Cursor, etc.)
 *   npx hyperz-mcp --http       # Streamable HTTP transport
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = resolve(__dirname, 'hyperz-mcp.ts');

const result = spawnSync(process.execPath, ['--import', 'tsx', cli, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: resolve(__dirname, '..'),
});

process.exit(result.status ?? 1);
