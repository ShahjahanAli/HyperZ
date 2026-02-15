// ──────────────────────────────────────────────────────────────
// HyperZ — Event Service Provider
// ──────────────────────────────────────────────────────────────

import { ServiceProvider } from '../core/ServiceProvider.js';
import { EventDispatcher } from '../events/EventDispatcher.js';

export class EventServiceProvider extends ServiceProvider {
    register(): void {
        this.app.container.instance('events', EventDispatcher);
    }

    async boot(): Promise<void> {
        // Register default event listeners here
        // EventDispatcher.on('user.registered', async (user) => { ... });
    }
}
