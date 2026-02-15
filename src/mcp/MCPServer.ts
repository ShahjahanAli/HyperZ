/**
 * HyperZ MCP Server
 *
 * Main MCP server class that registers all tools, resources, and prompts.
 * Supports stdio transport (for local AI tools) and Streamable HTTP
 * transport (for web-based AI agents and the admin panel).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools.js';
import { registerResources } from './resources.js';
import { registerPrompts } from './prompts.js';

const SERVER_NAME = 'hyperz-mcp';
const SERVER_VERSION = '1.0.0';

/**
 * Create and configure the HyperZ MCP server instance.
 */
export function createMCPServer(): McpServer {
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    }, {
        capabilities: {
            tools: {},
            resources: {},
            prompts: {},
        },
    });

    // Register all capabilities
    registerTools(server);
    registerResources(server);
    registerPrompts(server);

    return server;
}

/**
 * Start MCP server with stdio transport (for local AI tools like Claude Desktop).
 */
export async function startStdioServer(): Promise<void> {
    const server = createMCPServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log to stderr so it doesn't interfere with stdio protocol
    console.error(`[HyperZ MCP] Server started (stdio transport)`);
    console.error(`[HyperZ MCP] 13 tools, 6 resources, 4 prompts registered`);
}

/**
 * Get MCP server info — used by admin API for dashboard display.
 */
export function getMCPServerInfo() {
    return {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        transport: ['stdio', 'streamable-http'],
        tools: [
            { name: 'scaffold_controller', category: 'Scaffolding', description: 'Create a controller' },
            { name: 'scaffold_model', category: 'Scaffolding', description: 'Create a model (with migration)' },
            { name: 'scaffold_migration', category: 'Scaffolding', description: 'Create a migration' },
            { name: 'scaffold_seeder', category: 'Scaffolding', description: 'Create a seeder' },
            { name: 'scaffold_middleware', category: 'Scaffolding', description: 'Create middleware' },
            { name: 'scaffold_route', category: 'Scaffolding', description: 'Create a route file' },
            { name: 'scaffold_job', category: 'Scaffolding', description: 'Create a queue job' },
            { name: 'scaffold_ai_action', category: 'Scaffolding', description: 'Create an AI action' },
            { name: 'run_migration', category: 'Database', description: 'Run pending migrations' },
            { name: 'run_migration_rollback', category: 'Database', description: 'Rollback last migration batch' },
            { name: 'run_seed', category: 'Database', description: 'Run all seeders' },
            { name: 'list_routes', category: 'Inspection', description: 'List registered routes' },
            { name: 'read_env', category: 'Inspection', description: 'Read .env variables' },
        ],
        resources: [
            { uri: 'hyperz://project/structure', name: 'Project Structure', description: 'Directory tree' },
            { uri: 'hyperz://project/routes', name: 'API Routes', description: 'Registered routes' },
            { uri: 'hyperz://project/env', name: 'Environment', description: 'Env variables (masked)' },
            { uri: 'hyperz://project/config', name: 'Configuration', description: 'Config file contents' },
            { uri: 'hyperz://database/tables', name: 'Database Tables', description: 'Table list and schemas' },
            { uri: 'hyperz://database/migrations', name: 'Migrations', description: 'Migration file status' },
        ],
        prompts: [
            { name: 'create_crud_resource', description: 'Full CRUD resource creation guide' },
            { name: 'debug_api_endpoint', description: 'Debug a failing API endpoint' },
            { name: 'add_auth_to_route', description: 'Add JWT + RBAC to routes' },
            { name: 'optimize_database', description: 'Database optimization suggestions' },
        ],
    };
}
