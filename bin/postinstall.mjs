#!/usr/bin/env node

/**
 * HyperZ CLI — Postinstall Setup
 *
 * Creates platform-specific shims in node_modules/.bin/ so that
 * `npx hyperz`, `npx hz`, and `npx hyperz-mcp` work without building.
 *
 * Runs automatically via the "postinstall" npm lifecycle hook.
 */

import { mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');
const binDir = join(projectRoot, 'node_modules', '.bin');

// Ensure .bin directory exists
mkdirSync(binDir, { recursive: true });

// Map of command name → target .mjs file
const bins = {
    'hyperz': resolve(__dirname, 'hyperz.mjs'),
    'hz': resolve(__dirname, 'hyperz.mjs'),
    'hyperz-mcp': resolve(__dirname, 'hyperz-mcp.mjs'),
};

const isWindows = process.platform === 'win32';

for (const [name, target] of Object.entries(bins)) {
    try {
        if (isWindows) {
            // CMD shim
            writeFileSync(
                join(binDir, `${name}.cmd`),
                `@ECHO off\r\nGOTO :s\r\n:s\r\nnode "${target}" %*\r\n`
            );

            // PowerShell shim
            writeFileSync(
                join(binDir, `${name}.ps1`),
                `#!/usr/bin/env pwsh\n& node "${target}" $args\nexit $LASTEXITCODE\n`
            );

            // Git Bash / WSL shim
            writeFileSync(
                join(binDir, name),
                `#!/bin/sh\nnode "${target}" "$@"\n`
            );
        } else {
            // Unix shell script
            const shPath = join(binDir, name);
            writeFileSync(shPath, `#!/bin/sh\nnode "${target}" "$@"\n`);
            chmodSync(shPath, '755');
        }
    } catch {
        // Silently skip if we can't create a specific shim (e.g. permissions)
    }
}

console.log('⚡ HyperZ CLI linked: npx hyperz | npx hz | npx hyperz-mcp');
