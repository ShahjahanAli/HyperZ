// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Route Registry & Collision Detection
//
// Tracks all registered routes from application code and plugins.
// Detects and reports route collisions before they cause silent
// override bugs in production.
// ──────────────────────────────────────────────────────────────

import { Logger } from '../logging/Logger.js';

export interface RegisteredRoute {
    /** HTTP method (GET, POST, etc.) */
    method: string;

    /** Full route path (e.g., '/api/users/:id') */
    path: string;

    /** Source identifier — where this route was defined */
    source: string;

    /** Optional route name */
    name?: string;

    /** When the route was registered */
    registeredAt: Date;
}

export interface RouteCollision {
    /** HTTP method */
    method: string;

    /** Path pattern */
    path: string;

    /** The routes that collide */
    routes: RegisteredRoute[];
}

export class RouteRegistry {
    private routes: RegisteredRoute[] = [];

    /**
     * Register a route from a specific source.
     * @returns Array of collisions detected (empty if none)
     */
    register(method: string, path: string, source: string, name?: string): RouteCollision[] {
        const normalizedPath = this.normalizePath(path);
        const normalizedMethod = method.toUpperCase();

        const route: RegisteredRoute = {
            method: normalizedMethod,
            path: normalizedPath,
            source,
            name,
            registeredAt: new Date(),
        };

        // Check for collisions before adding
        const collisions = this.detectCollision(route);

        this.routes.push(route);

        if (collisions.length > 0) {
            for (const collision of collisions) {
                const sources = collision.routes.map(r => r.source).join(', ');
                Logger.warn(
                    `[RouteRegistry] Route collision: ${collision.method} ${collision.path} — defined by: ${sources} and ${source}`
                );
            }
        }

        return collisions;
    }

    /**
     * Register multiple routes from a source (batch).
     */
    registerBatch(
        routes: Array<{ method: string; path: string; name?: string }>,
        source: string
    ): RouteCollision[] {
        const allCollisions: RouteCollision[] = [];

        for (const r of routes) {
            const collisions = this.register(r.method, r.path, source, r.name);
            allCollisions.push(...collisions);
        }

        return allCollisions;
    }

    /**
     * Get all registered routes.
     */
    all(): RegisteredRoute[] {
        return [...this.routes];
    }

    /**
     * Get all routes from a specific source.
     */
    bySource(source: string): RegisteredRoute[] {
        return this.routes.filter(r => r.source === source);
    }

    /**
     * Get all detected collisions across the entire registry.
     */
    getCollisions(): RouteCollision[] {
        const collisions: RouteCollision[] = [];
        const seen = new Set<string>();

        for (const route of this.routes) {
            const key = `${route.method}:${route.path}`;
            if (seen.has(key)) continue;

            const duplicates = this.routes.filter(
                r => r.method === route.method && this.pathsMatch(r.path, route.path)
            );

            if (duplicates.length > 1) {
                collisions.push({
                    method: route.method,
                    path: route.path,
                    routes: duplicates,
                });
                seen.add(key);
            }
        }

        return collisions;
    }

    /**
     * Clear all registered routes (useful for testing).
     */
    clear(): void {
        this.routes = [];
    }

    /**
     * Get the total number of registered routes.
     */
    count(): number {
        return this.routes.length;
    }

    /**
     * Get a summary grouped by source.
     */
    summary(): Map<string, number> {
        const map = new Map<string, number>();
        for (const route of this.routes) {
            map.set(route.source, (map.get(route.source) ?? 0) + 1);
        }
        return map;
    }

    // ── Private Helpers ──────────────────────────────────────

    private detectCollision(route: RegisteredRoute): RouteCollision[] {
        const collisions: RouteCollision[] = [];

        const matching = this.routes.filter(
            r => r.method === route.method && this.pathsMatch(r.path, route.path)
        );

        if (matching.length > 0) {
            collisions.push({
                method: route.method,
                path: route.path,
                routes: matching,
            });
        }

        return collisions;
    }

    /**
     * Check if two route paths would match the same URLs.
     * Normalizes parameter names so `/users/:id` matches `/users/:userId`.
     */
    private pathsMatch(a: string, b: string): boolean {
        const patternA = this.toPattern(a);
        const patternB = this.toPattern(b);
        return patternA === patternB;
    }

    /**
     * Convert a route path to a normalized pattern for comparison.
     * Replaces named parameters with a placeholder.
     */
    private toPattern(routePath: string): string {
        return routePath
            .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, ':_PARAM_')
            .replace(/\*$/g, ':_WILDCARD_');
    }

    /**
     * Normalize a route path: ensure leading slash, remove trailing slash,
     * lowercase the static segments.
     */
    private normalizePath(routePath: string): string {
        let normalized = routePath.trim();

        // Ensure leading slash
        if (!normalized.startsWith('/')) {
            normalized = '/' + normalized;
        }

        // Remove trailing slash (except for root)
        if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    }
}

/** Singleton route registry instance */
export const routeRegistry = new RouteRegistry();
