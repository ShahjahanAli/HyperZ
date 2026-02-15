// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Base Service Provider
// ──────────────────────────────────────────────────────────────

import type { Application } from './Application.js';

export abstract class ServiceProvider {
    protected app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    /**
     * Register bindings into the container.
     * Called before boot — do NOT access other services here.
     */
    register(): void {
        // Override in subclass
    }

    /**
     * Boot the provider after all providers have been registered.
     * Safe to resolve other services here.
     */
    async boot(): Promise<void> {
        // Override in subclass
    }
}
