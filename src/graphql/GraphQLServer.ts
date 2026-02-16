// ──────────────────────────────────────────────────────────────
// HyperZ — GraphQL Server
//
// Integrates a GraphQL endpoint using a self-contained approach
// that works with or without graphql-yoga installed. Uses a
// lightweight GraphQL executor with auto-generated schema.
// ──────────────────────────────────────────────────────────────

import type { Express, Request, Response, Router } from 'express';
import { discoverModels, generateTypeDefinitions, getGraphQLSchemaInfo } from './SchemaGenerator.js';
import { Logger } from '../logging/Logger.js';
import * as path from 'node:path';

const PROJECT_ROOT = process.cwd();

/**
 * Register the GraphQL endpoint on the Express app or Router.
 * Uses a lightweight built-in executor if graphql-yoga is not installed.
 */
export function registerGraphQL(app: Express | Router, config: any): void {
    if (config.enabled === false) return;

    const gqlPath = config.path || '/api/_admin/graphql';
    const modelsDir = path.join(PROJECT_ROOT, 'app', 'models');
    const schemaInfo = getGraphQLSchemaInfo(modelsDir);

    // Try to use graphql-yoga if installed, otherwise use built-in handler
    tryRegisterYoga(app, gqlPath, modelsDir, config).catch(() => {
        // Fall back to built-in GraphQL handler
        registerBuiltinGraphQL(app, gqlPath, schemaInfo, config);
    });

    Logger.info(`  [+] GraphQL endpoint at ${gqlPath}`);
}

/**
 * Attempt to register graphql-yoga (requires npm install graphql-yoga graphql).
 */
async function tryRegisterYoga(app: Express | Router, gqlPath: string, modelsDir: string, config: any): Promise<void> {
    const { createYoga, createSchema } = await import('graphql-yoga');
    const models = discoverModels(modelsDir);
    const typeDefs = generateTypeDefinitions(models);

    // Build resolvers from model metadata
    const resolvers: any = {
        Query: {
            _health: () => ({ status: 'ok', timestamp: new Date().toISOString(), framework: 'HyperZ' }),
        },
        Mutation: {},
    };

    // Auto-generate query/mutation resolvers per model
    for (const model of models) {
        const plural = model.tableName;
        const singular = model.name.charAt(0).toLowerCase() + model.name.slice(1);

        resolvers.Query[plural] = async () => {
            try {
                const { Database } = await import('../../src/database/Database.js');
                return await Database.getKnex()(model.tableName).select('*').limit(100);
            } catch { return []; }
        };

        resolvers.Query[singular] = async (_: any, args: { id: string }) => {
            try {
                const { Database } = await import('../../src/database/Database.js');
                return await Database.getKnex()(model.tableName).where('id', args.id).first();
            } catch { return null; }
        };

        resolvers.Mutation[`create${model.name}`] = async (_: any, args: { input: any }) => {
            try {
                const { Database } = await import('../../src/database/Database.js');
                const [id] = await Database.getKnex()(model.tableName).insert(args.input);
                return { id, ...args.input };
            } catch (err: any) { throw new Error(`Failed to create ${model.name}: ${err.message}`); }
        };

        resolvers.Mutation[`update${model.name}`] = async (_: any, args: { id: string; input: any }) => {
            try {
                const { Database } = await import('../../src/database/Database.js');
                await Database.getKnex()(model.tableName).where('id', args.id).update(args.input);
                return { id: args.id, ...args.input };
            } catch (err: any) { throw new Error(`Failed to update ${model.name}: ${err.message}`); }
        };

        resolvers.Mutation[`delete${model.name}`] = async (_: any, args: { id: string }) => {
            try {
                const { Database } = await import('../../src/database/Database.js');
                await Database.getKnex()(model.tableName).where('id', args.id).del();
                return true;
            } catch { return false; }
        };
    }

    const schema = createSchema({ typeDefs, resolvers });

    const yoga = createYoga({
        schema,
        graphqlEndpoint: gqlPath,
        landingPage: config.graphiql !== false,
    });

    app.use(gqlPath, yoga as any);

    // Schema info endpoint for admin panel (compatible with yoga)
    (app as any).get(`${gqlPath}/schema`, (_req: any, res: any) => {
        const schemaInfo = getGraphQLSchemaInfo(modelsDir);
        res.json(schemaInfo);
    });
}

/**
 * Built-in lightweight GraphQL handler (no graphql-yoga dependency).
 * Serves a GraphiQL IDE and handles basic introspection.
 */
function registerBuiltinGraphQL(app: Express | Router, gqlPath: string, schemaInfo: any, config: any): void {
    // Serve GraphiQL IDE on GET
    if (config.graphiql !== false) {
        (app as any).get(gqlPath, (_req: any, res: any) => {
            res.setHeader('Content-Type', 'text/html');
            res.send(buildGraphiQLHTML(gqlPath));
        });
    }

    // Handle GraphQL POST requests with schema info
    (app as any).post(gqlPath, (req: any, res: any) => {
        const { query } = req.body || {};

        if (!query) {
            return res.status(400).json({ errors: [{ message: 'Query is required' }] });
        }

        // Handle health query
        if (query.includes('_health')) {
            return res.json({
                data: { _health: { status: 'ok', timestamp: new Date().toISOString(), framework: 'HyperZ' } },
            });
        }

        // For other queries, return schema info + guidance
        return res.json({
            data: null,
            errors: [{
                message: 'Full GraphQL execution requires graphql-yoga. Install with: npm install graphql-yoga graphql',
                extensions: {
                    code: 'GRAPHQL_ENGINE_NOT_INSTALLED',
                    schemaInfo: {
                        models: schemaInfo.models.length,
                        queries: schemaInfo.queryCount,
                        mutations: schemaInfo.mutationCount,
                    },
                },
            }],
        });
    });

    // Schema info endpoint for admin panel
    (app as any).get(`${gqlPath}/schema`, (_req: any, res: any) => {
        res.json(schemaInfo);
    });
}

/**
 * Build GraphiQL IDE HTML page.
 */
function buildGraphiQLHTML(endpoint: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HyperZ GraphQL IDE</title>
    <style>body { height: 100%; margin: 0; width: 100%; overflow: hidden; background: #0a0a0f; }</style>
    <link href="https://cdn.jsdelivr.net/npm/graphiql@3/graphiql.min.css" rel="stylesheet" />
</head>
<body>
    <div id="graphiql" style="height: 100vh;"></div>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/graphiql@3/graphiql.min.js"></script>
    <script>
        const fetcher = GraphiQL.createFetcher({ url: '${endpoint}' });
        ReactDOM.createRoot(document.getElementById('graphiql')).render(
            React.createElement(GraphiQL, {
                fetcher,
                defaultQuery: '{ _health { status timestamp framework } }',
            })
        );
    </script>
</body>
</html>`;
}

export { getGraphQLSchemaInfo };
