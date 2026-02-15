// ──────────────────────────────────────────────────────────────
// HyperZ — Route Service Provider
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ServiceProvider } from '../core/ServiceProvider.js';
import { HyperZRouter } from '../http/Router.js';
import { ExceptionHandler } from '../http/exceptions/Handler.js';
import { Logger } from '../logging/Logger.js';

export class RouteServiceProvider extends ServiceProvider {
    register(): void {
        // Register the main router
        const router = new HyperZRouter();
        this.app.container.instance('router', router);
    }

    async boot(): Promise<void> {
        const routesDir = path.join(this.app.basePath, 'app', 'routes');

        if (!fs.existsSync(routesDir)) return;

        const files = fs.readdirSync(routesDir).filter(
            f => f.endsWith('.ts') || f.endsWith('.js')
        );

        for (const file of files) {
            try {
                const filePath = path.join(routesDir, file);
                const routeModule = await import(`file://${filePath.replace(/\\/g, '/')}`);
                const router: HyperZRouter = routeModule.default;

                if (router && typeof router.mount === 'function') {
                    const prefix = file.replace(/\.(ts|js)$/, '') === 'web' ? '' : '/api';
                    router.mount(this.app.express, prefix);
                    Logger.debug(`  → Loaded routes: ${file} (prefix: ${prefix || '/'})`);
                }
            } catch (err: any) {
                Logger.error(`Failed to load route file: ${file}`, { error: err.message });
            }
        }

        // 404 handler — MUST come after all routes
        this.app.express.use(ExceptionHandler.notFound());

        // Global error handler — MUST be last
        this.app.express.use(ExceptionHandler.handle());
    }
}
