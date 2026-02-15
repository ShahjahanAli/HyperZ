/**
 * HyperZ MCP Server — Prompts
 *
 * 4 reusable prompt templates that AI agents can invoke
 * for guided interactions with HyperZ projects.
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer): void {
    // ── CRUD Resource Creation ─────────────────────────────────────────

    server.prompt(
        'create_crud_resource',
        'Step-by-step guide to create a full CRUD API resource in HyperZ',
        {
            resourceName: z.string().describe('Name of the resource, e.g. Product, BlogPost'),
            fields: z.string().optional().describe('Comma-separated fields, e.g. "title:string, price:float, active:boolean"'),
        },
        ({ resourceName, fields }) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Create a complete CRUD API for the "${resourceName}" resource in a HyperZ framework project.

${fields ? `Fields: ${fields}` : 'Determine appropriate fields based on the resource name.'}

Follow these exact steps:
1. Run: scaffold_controller with name "${resourceName}Controller"
2. Run: scaffold_model with name "${resourceName}" and withMigration=true
3. Run: scaffold_route with name "${resourceName.toLowerCase()}s"
4. Edit the migration file in database/migrations/ to add columns: ${fields || 'appropriate columns'}
5. Edit the route file in app/routes/ to use router.resource('/${resourceName.toLowerCase()}s', controller)
6. Edit the controller to implement index, show, store, update, destroy methods
7. Run: run_migration to create the table
8. Optionally run: scaffold_seeder with name "${resourceName}Seeder" for test data

Use the available MCP tools for scaffolding and migrations. Read the project structure resource for context.`,
                    },
                },
            ],
        })
    );

    // ── Debug API Endpoint ─────────────────────────────────────────────

    server.prompt(
        'debug_api_endpoint',
        'Help debug a failing API endpoint in HyperZ',
        {
            method: z.string().describe('HTTP method (GET, POST, PUT, DELETE)'),
            path: z.string().describe('API path, e.g. /api/products'),
            errorMessage: z.string().optional().describe('The error message received'),
        },
        ({ method, path, errorMessage }) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Debug this failing API endpoint in my HyperZ project:

**Endpoint:** ${method} ${path}
${errorMessage ? `**Error:** ${errorMessage}` : ''}

Debugging steps:
1. Read the project_routes resource to check if the route is registered
2. Read the project_env resource to check for configuration issues
3. Read the project_config resource for relevant config settings
4. Use list_routes tool to see all registered routes
5. Check if the corresponding controller exists in app/controllers/
6. Check if the model exists in app/models/
7. Verify the database is set up (run_migration if needed)

Common HyperZ issues:
- Missing .js extension in imports
- Controller method not bound correctly (needs .bind(controller))
- Route file not in app/routes/ (auto-load won't find it)
- Missing validation schema
- Database not migrated`,
                    },
                },
            ],
        })
    );

    // ── Add Auth to Route ──────────────────────────────────────────────

    server.prompt(
        'add_auth_to_route',
        'Add JWT authentication and RBAC to existing routes in HyperZ',
        {
            routeFile: z.string().describe('Route file name, e.g. products'),
            requiredRole: z.string().optional().describe('Required role, e.g. admin, editor'),
        },
        ({ routeFile, requiredRole }) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Add authentication and authorization to the "${routeFile}" routes in my HyperZ project.

**Route file:** app/routes/${routeFile}.ts
${requiredRole ? `**Required role:** ${requiredRole}` : 'Apply auth middleware to all routes.'}

Steps:
1. Read the project_routes resource to see current routes
2. Import auth middleware: import { authMiddleware } from '../../src/auth/AuthMiddleware.js'
${requiredRole ? `3. Import role middleware: import { roleMiddleware } from '../../src/auth/RoleMiddleware.js'` : ''}
4. Wrap routes in a group with auth middleware:
   router.group({ prefix: '/${routeFile}', middleware: [authMiddleware${requiredRole ? `, roleMiddleware('${requiredRole}')` : ''}] }, (r) => {
     // existing routes here
   });

HyperZ auth pattern:
- authMiddleware verifies JWT token from Authorization: Bearer <token>
- roleMiddleware('role') checks user has the required role
- permissionMiddleware('permission') checks specific permissions
- Use Gate.allows('ability', user, resource) for custom authorization logic`,
                    },
                },
            ],
        })
    );

    // ── Database Optimization ──────────────────────────────────────────

    server.prompt(
        'optimize_database',
        'Get database optimization suggestions for a HyperZ project',
        {
            concern: z.string().optional().describe('Specific concern, e.g. "slow queries", "large tables"'),
        },
        ({ concern }) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Analyze and optimize the database setup in my HyperZ project.

${concern ? `**Specific concern:** ${concern}` : 'General optimization review.'}

Steps:
1. Read database_tables resource to see all tables
2. Read database_migrations resource to review migration history
3. Read project_config resource for database configuration
4. Read project_env resource to check DB_DRIVER and connection settings

Optimization checklist:
- Add indexes to frequently queried columns (create a new migration)
- Review foreign key relationships
- Check for missing timestamps (created_at, updated_at)
- Verify soft deletes are used where appropriate
- Look for N+1 query patterns in controllers
- Suggest pagination for large datasets (use this.paginate() controller method)
- Consider caching frequently accessed data (CACHE_DRIVER=redis)
- Review if tables should be normalized or denormalized
- Suggest database seeders/factories for test data if missing`,
                    },
                },
            ],
        })
    );
}
