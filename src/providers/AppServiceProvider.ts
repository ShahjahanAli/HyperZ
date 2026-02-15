// ──────────────────────────────────────────────────────────────
// HyperZ — App Service Provider
// ──────────────────────────────────────────────────────────────

import { ServiceProvider } from '../core/ServiceProvider.js';
import { Kernel } from '../core/Kernel.js';
import { corsMiddleware } from '../http/middleware/CorsMiddleware.js';
import { helmetMiddleware } from '../http/middleware/HelmetMiddleware.js';
import { rateLimitMiddleware } from '../http/middleware/RateLimitMiddleware.js';
import { loggingMiddleware } from '../http/middleware/LoggingMiddleware.js';

export class AppServiceProvider extends ServiceProvider {
    register(): void {
        // Register the HTTP kernel
        const kernel = new Kernel(this.app);
        this.app.container.instance('kernel', kernel);
    }

    async boot(): Promise<void> {
        const kernel = this.app.make<Kernel>('kernel');

        // Bootstrap core Express middleware (JSON, URL-encoded)
        kernel.bootstrap();

        // Push global middleware stack
        kernel.pushMiddleware(loggingMiddleware());
        kernel.pushMiddleware(corsMiddleware());
        kernel.pushMiddleware(helmetMiddleware());
        kernel.pushMiddleware(rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 200 }));
    }
}
