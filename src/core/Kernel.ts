// ──────────────────────────────────────────────────────────────
// HyperZ Framework — HTTP Kernel
// ──────────────────────────────────────────────────────────────

import type { Express, RequestHandler } from 'express';
import express from 'express';
import type { Application } from './Application.js';

export class Kernel {
    protected app: Application;
    protected expressApp: Express;

    /**
     * Global middleware stack — applied to every request.
     * Override in your app's Kernel to customize.
     */
    protected middleware: RequestHandler[] = [];

    /**
     * Route middleware aliases — reference by name in routes.
     * e.g. { auth: AuthMiddleware, admin: AdminMiddleware }
     */
    protected routeMiddleware: Record<string, RequestHandler> = {};

    constructor(app: Application) {
        this.app = app;
        this.expressApp = app.express;
    }

    /**
     * Bootstrap the HTTP kernel — register global middleware.
     */
    bootstrap(): void {
        // Built-in Express middleware
        this.expressApp.use(express.json({ limit: '10mb' }));
        this.expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Apply global middleware stack
        for (const mw of this.middleware) {
            this.expressApp.use(mw);
        }

        // Register route middleware in the container for easy lookup
        this.app.container.instance('middleware.route', this.routeMiddleware);
    }

    /**
     * Get a named route middleware.
     */
    getRouteMiddleware(name: string): RequestHandler | undefined {
        return this.routeMiddleware[name];
    }

    /**
     * Register additional global middleware at runtime.
     */
    pushMiddleware(handler: RequestHandler): void {
        this.middleware.push(handler);
        this.expressApp.use(handler);
    }
}
