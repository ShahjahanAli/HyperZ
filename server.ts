// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Server Bootstrap
// ──────────────────────────────────────────────────────────────

import { createApp } from './app.js';
import { registerPlayground } from './src/playground/Playground.js';
import { createAdminRouter } from './src/admin/AdminAPI.js';
import { I18n } from './src/i18n/I18n.js';
import { getMCPServerInfo } from './src/mcp/MCPServer.js';
import { registerSwaggerUI } from './src/docs/SwaggerUI.js';
import { createGlobalRateLimiter } from './src/rateLimit/RateLimitManager.js';
import { metricsMiddleware } from './src/monitoring/MetricsCollector.js';
import { registerGraphQL } from './src/graphql/GraphQLServer.js';
import docsConfig from './config/docs.js';
import rateLimitConfig from './config/ratelimit.js';
import graphqlConfig from './config/graphql.js';
import * as path from 'node:path';

async function main(): Promise<void> {
    const app = createApp();

    // Register metrics collection (must be first to capture all requests)
    app.express.use(metricsMiddleware());

    // Register global rate limiter
    app.express.use(createGlobalRateLimiter(rateLimitConfig));

    // Register Playground routes BEFORE boot (RouteServiceProvider adds
    // a 404 catch-all at the end of boot — playground must exist before that).
    registerPlayground(app.express);

    // Register Admin API routes
    const adminRouter = await createAdminRouter(app);
    app.express.use('/api/_admin', adminRouter);

    // Register Swagger/OpenAPI docs
    registerSwaggerUI(app.express, docsConfig);

    // Register GraphQL endpoint
    registerGraphQL(app.express, graphqlConfig);

    await app.boot();

    // Load translations
    await I18n.load(path.join(app.basePath, 'lang'));

    // Start server
    await app.listen();
}

main().catch((err) => {
    console.error('❌ Failed to start HyperZ:', err);
    process.exit(1);
});
