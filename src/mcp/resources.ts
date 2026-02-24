/**
 * HyperZ MCP Server — Resources
 *
 * 6 read-only resources that expose project structure, routes,
 * config, env, database tables, and migration status to AI agents.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const PROJECT_ROOT = process.cwd();

function walkDir(dir: string, prefix = '', depth = 0, maxDepth = 3): string[] {
    if (depth >= maxDepth) return [`${prefix}[...]`];
    const lines: string[] = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
            .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== '.next');

        for (const entry of entries) {
            if (entry.isDirectory()) {
                lines.push(`${prefix}📁 ${entry.name}/`);
                lines.push(...walkDir(path.join(dir, entry.name), prefix + '  ', depth + 1, maxDepth));
            } else {
                lines.push(`${prefix}📄 ${entry.name}`);
            }
        }
    } catch { /* ignore permission issues */ }

    return lines;
}

export function registerResources(server: McpServer): void {
    // ── Project Structure ──────────────────────────────────────────────

    server.resource(
        'project_structure',
        'hyperz://project/structure',
        { description: 'Full project directory tree (top 3 levels)' },
        async () => ({
            contents: [{
                uri: 'hyperz://project/structure',
                mimeType: 'text/plain',
                text: walkDir(PROJECT_ROOT).join('\n'),
            }],
        })
    );

    // ── Registered Routes ──────────────────────────────────────────────

    server.resource(
        'project_routes',
        'hyperz://project/routes',
        { description: 'All registered API routes' },
        async () => {
            try {
                const { stdout } = await execAsync('npx hyperz route:list', {
                    cwd: PROJECT_ROOT,
                    timeout: 15000,
                });
                return {
                    contents: [{
                        uri: 'hyperz://project/routes',
                        mimeType: 'text/plain',
                        text: stdout || 'No routes registered.',
                    }],
                };
            } catch {
                return {
                    contents: [{
                        uri: 'hyperz://project/routes',
                        mimeType: 'text/plain',
                        text: 'Unable to load routes. Is the project set up?',
                    }],
                };
            }
        }
    );

    // ── Environment Variables ──────────────────────────────────────────

    server.resource(
        'project_env',
        'hyperz://project/env',
        { description: 'Environment variables (secrets masked)' },
        async () => {
            try {
                const envPath = path.join(PROJECT_ROOT, '.env');
                const raw = fs.readFileSync(envPath, 'utf-8');
                const masked = raw.split('\n').map((line) => {
                    const [k] = line.split('=');
                    const lower = k?.toLowerCase() || '';
                    if (lower.includes('secret') || lower.includes('key') || lower.includes('password')) {
                        return `${k}=********`;
                    }
                    return line;
                }).join('\n');

                return {
                    contents: [{
                        uri: 'hyperz://project/env',
                        mimeType: 'text/plain',
                        text: masked,
                    }],
                };
            } catch {
                return {
                    contents: [{
                        uri: 'hyperz://project/env',
                        mimeType: 'text/plain',
                        text: 'No .env file found.',
                    }],
                };
            }
        }
    );

    // ── Config Files ───────────────────────────────────────────────────

    server.resource(
        'project_config',
        'hyperz://project/config',
        { description: 'List of available config files in config/' },
        async () => {
            try {
                const configDir = path.join(PROJECT_ROOT, 'config');
                const files = fs.readdirSync(configDir).filter((f) => f.endsWith('.ts'));
                const configs: string[] = [];

                for (const file of files) {
                    const filePath = path.join(configDir, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    configs.push(`── ${file} ──\n${content}\n`);
                }

                return {
                    contents: [{
                        uri: 'hyperz://project/config',
                        mimeType: 'text/plain',
                        text: configs.join('\n') || 'No config files found.',
                    }],
                };
            } catch {
                return {
                    contents: [{
                        uri: 'hyperz://project/config',
                        mimeType: 'text/plain',
                        text: 'Config directory not found.',
                    }],
                };
            }
        }
    );

    // ── Database Tables ────────────────────────────────────────────────

    server.resource(
        'database_tables',
        'hyperz://database/tables',
        { description: 'Database table list and schemas' },
        async () => {
            try {
                // Attempt to read SQLite tables via a quick query
                const dbPath = path.join(PROJECT_ROOT, 'database', 'database.sqlite');
                if (fs.existsSync(dbPath)) {
                    const { stdout } = await execAsync(
                        `npx tsx -e "import knex from 'knex'; const db = knex({client:'sqlite3',connection:{filename:'${dbPath.replace(/\\/g, '/')}'},useNullAsDefault:true}); const tables = await db.raw(\\"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knex_%'\\"); console.log(JSON.stringify(tables.map(t=>t.name))); await db.destroy();"`,
                        { cwd: PROJECT_ROOT, timeout: 10000 }
                    );
                    return {
                        contents: [{
                            uri: 'hyperz://database/tables',
                            mimeType: 'application/json',
                            text: stdout || '[]',
                        }],
                    };
                }
                return {
                    contents: [{
                        uri: 'hyperz://database/tables',
                        mimeType: 'text/plain',
                        text: 'No SQLite database found. Configure DB_DRIVER in .env for other databases.',
                    }],
                };
            } catch (err: any) {
                return {
                    contents: [{
                        uri: 'hyperz://database/tables',
                        mimeType: 'text/plain',
                        text: `Error reading database: ${err.message}`,
                    }],
                };
            }
        }
    );

    // ── Migration Status ───────────────────────────────────────────────

    server.resource(
        'database_migrations',
        'hyperz://database/migrations',
        { description: 'Migration files and their status' },
        async () => {
            try {
                const migrationsDir = path.join(PROJECT_ROOT, 'database', 'migrations');
                const files = fs.readdirSync(migrationsDir)
                    .filter((f) => f.endsWith('.ts'))
                    .sort();

                const list = files.map((f) => `📄 ${f}`).join('\n');

                return {
                    contents: [{
                        uri: 'hyperz://database/migrations',
                        mimeType: 'text/plain',
                        text: `Migration files (${files.length}):\n\n${list}` || 'No migrations found.',
                    }],
                };
            } catch {
                return {
                    contents: [{
                        uri: 'hyperz://database/migrations',
                        mimeType: 'text/plain',
                        text: 'No migrations directory found.',
                    }],
                };
            }
        }
    );
}
