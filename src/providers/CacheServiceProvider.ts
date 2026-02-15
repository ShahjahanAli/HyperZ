// ──────────────────────────────────────────────────────────────
// HyperZ — Cache Service Provider
// ──────────────────────────────────────────────────────────────

import { ServiceProvider } from '../core/ServiceProvider.js';
import { CacheManager } from '../cache/CacheManager.js';

export class CacheServiceProvider extends ServiceProvider {
    register(): void {
        this.app.container.singleton('cache', (container) => {
            const config = this.app.config.get<any>('cache');
            return new CacheManager(config?.driver ?? 'memory');
        });
    }

    async boot(): Promise<void> {
        // Register graceful shutdown hook
        this.app.terminating(async () => {
            const cache = this.app.make<CacheManager>('cache');
            const driver = (cache as any).driver;
            if (driver.disconnect) {
                await driver.disconnect();
            }
        });
    }
}
