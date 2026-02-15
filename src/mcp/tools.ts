/**
 * HyperZ MCP Server — Tools
 *
 * 13 tools that AI agents can invoke to manage the HyperZ framework:
 * scaffolding, migrations, seeding, route listing, env reading.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';

const execAsync = promisify(exec);
const PROJECT_ROOT = process.cwd();

async function runCLI(command: string): Promise<string> {
    try {
        const { stdout, stderr } = await execAsync(
            `npx tsx bin/hyperz.ts ${command}`,
            { cwd: PROJECT_ROOT, timeout: 30000 }
        );
        return stdout || stderr || 'Command completed successfully.';
    } catch (err: any) {
        return `Error: ${err.message}`;
    }
}

export function registerTools(server: McpServer): void {
    // ── Scaffolding Tools ──────────────────────────────────────────────

    server.tool(
        'scaffold_controller',
        'Create a new controller file in app/controllers/',
        { name: z.string().describe('Controller name, e.g. ProductController') },
        async ({ name }) => {
            const output = await runCLI(`make:controller ${name}`);
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'scaffold_model',
        'Create a new model in app/models/ with optional migration',
        {
            name: z.string().describe('Model name, e.g. Product'),
            withMigration: z.boolean().optional().describe('Also create a migration file (-m flag)'),
        },
        async ({ name, withMigration }) => {
            const flag = withMigration ? ' -m' : '';
            const output = await runCLI(`make:model ${name}${flag}`);
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'scaffold_migration',
        'Create a new database migration file',
        { name: z.string().describe('Migration name, e.g. create_products_table') },
        async ({ name }) => {
            const output = await runCLI(`make:migration ${name}`);
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'scaffold_seeder',
        'Create a new database seeder in database/seeders/',
        { name: z.string().describe('Seeder name, e.g. ProductSeeder') },
        async ({ name }) => {
            const output = await runCLI(`make:seeder ${name}`);
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'scaffold_middleware',
        'Create a new middleware in app/middleware/',
        { name: z.string().describe('Middleware name, e.g. ThrottleMiddleware') },
        async ({ name }) => {
            const output = await runCLI(`make:middleware ${name}`);
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'scaffold_route',
        'Create a new route file in app/routes/',
        { name: z.string().describe('Route filename, e.g. products') },
        async ({ name }) => {
            const output = await runCLI(`make:route ${name}`);
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'scaffold_job',
        'Create a new queue job in app/jobs/',
        { name: z.string().describe('Job name, e.g. SendWelcomeEmail') },
        async ({ name }) => {
            const output = await runCLI(`make:job ${name}`);
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'scaffold_ai_action',
        'Create a new AI action in app/ai/',
        { name: z.string().describe('AI action name, e.g. SummarizeAction') },
        async ({ name }) => {
            const output = await runCLI(`make:ai-action ${name}`);
            return { content: [{ type: 'text', text: output }] };
        }
    );

    // ── Database Tools ─────────────────────────────────────────────────

    server.tool(
        'run_migration',
        'Run all pending database migrations',
        {},
        async () => {
            const output = await runCLI('migrate');
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'run_migration_rollback',
        'Rollback the last batch of database migrations',
        {},
        async () => {
            const output = await runCLI('migrate:rollback');
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'run_seed',
        'Run all database seeders',
        {},
        async () => {
            const output = await runCLI('db:seed');
            return { content: [{ type: 'text', text: output }] };
        }
    );

    // ── Inspection Tools ───────────────────────────────────────────────

    server.tool(
        'list_routes',
        'List all registered API routes with methods and paths',
        {},
        async () => {
            const output = await runCLI('route:list');
            return { content: [{ type: 'text', text: output }] };
        }
    );

    server.tool(
        'read_env',
        'Read environment variables from the .env file',
        {
            key: z.string().optional().describe('Specific env variable to read, or omit for all'),
        },
        async ({ key }) => {
            try {
                const envPath = path.join(PROJECT_ROOT, '.env');
                const content = fs.readFileSync(envPath, 'utf-8');

                if (key) {
                    const match = content.split('\n').find((line) =>
                        line.startsWith(`${key}=`)
                    );
                    return {
                        content: [{ type: 'text', text: match || `Variable "${key}" not found.` }],
                    };
                }

                // Filter out comments and empty lines, mask sensitive values
                const filtered = content
                    .split('\n')
                    .filter((l) => l.trim() && !l.startsWith('#'))
                    .map((line) => {
                        const [k] = line.split('=');
                        const lower = k?.toLowerCase() || '';
                        if (lower.includes('secret') || lower.includes('key') || lower.includes('password')) {
                            return `${k}=********`;
                        }
                        return line;
                    })
                    .join('\n');

                return { content: [{ type: 'text', text: filtered }] };
            } catch {
                return { content: [{ type: 'text', text: 'No .env file found.' }] };
            }
        }
    );
}
