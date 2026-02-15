// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Application Entry Point
// ──────────────────────────────────────────────────────────────

import { Application } from './src/core/Application.js';
import { AppServiceProvider } from './src/providers/AppServiceProvider.js';
import { RouteServiceProvider } from './src/providers/RouteServiceProvider.js';
import { DatabaseServiceProvider } from './src/providers/DatabaseServiceProvider.js';
import { EventServiceProvider } from './src/providers/EventServiceProvider.js';
import { CacheServiceProvider } from './src/providers/CacheServiceProvider.js';

/**
 * Create and configure the HyperZ application.
 */
export function createApp(): Application {
    const app = new Application();

    // ── Register Service Providers ──────────────────────────
    // Order matters: App → Database → Events → Cache → Routes (last)
    app.register(AppServiceProvider);
    app.register(DatabaseServiceProvider);
    app.register(EventServiceProvider);
    app.register(CacheServiceProvider);
    app.register(RouteServiceProvider);  // Routes must be registered last

    return app;
}

export { Application };
