// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Server Bootstrap
// ──────────────────────────────────────────────────────────────

import { createApp } from './app.js';
import { registerPlayground } from './src/playground/Playground.js';
import { createAdminRouter } from './src/admin/AdminAPI.js';
import { I18n } from './src/i18n/I18n.js';
import { createGlobalRateLimiter } from './src/rateLimit/RateLimitManager.js';
import { HealthController } from './src/http/controllers/HealthController.js';
import { requestIdMiddleware } from './src/http/middleware/RequestIdMiddleware.js';
import { metricsMiddleware } from './src/monitoring/MetricsCollector.js';
import rateLimitConfig from './config/ratelimit.js';
import * as path from 'node:path';

async function main(): Promise<void> {
    const app = createApp();

    // Ensure environment is loaded before registration
    app.config.loadEnv();
    await app.config.loadConfigFiles();

    // Register tracing and metrics collection
    app.express.use(requestIdMiddleware());
    app.express.use(metricsMiddleware());

    // Register health endpoint
    app.express.get('/health', HealthController.check);

    // Register global rate limiter
    app.express.use(createGlobalRateLimiter(rateLimitConfig));

    // Register Playground routes BEFORE boot
    registerPlayground(app.express);

    // Register Admin API routes (includes Docs, GraphQL, Metrics)
    const adminRouter = await createAdminRouter(app);
    app.express.use('/api/_admin', adminRouter);

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
