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
}
