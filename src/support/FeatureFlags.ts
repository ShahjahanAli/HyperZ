// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Feature Flags
// ──────────────────────────────────────────────────────────────
//
// A lightweight, driver-based feature flag system. Flags can be
// evaluated against global state, per-user, per-tenant, or
// via custom resolvers.
//
// Drivers:
//   - 'config' (default): Reads from config/features.ts or in-memory
//   - 'env': Reads from environment variables (FEATURE_<NAME>=true)
//   - 'database': Reads from a `feature_flags` table (bring your own query)
//   - Custom: Implement FeatureFlagDriver interface
//
// Usage:
//   import { FeatureFlags } from '../../src/support/FeatureFlags.js';
//
//   FeatureFlags.define('new-dashboard', true);
//   FeatureFlags.define('beta-ai', (context) => context.user?.role === 'beta');
//
//   if (FeatureFlags.enabled('new-dashboard')) { ... }
//   if (FeatureFlags.enabled('beta-ai', { user })) { ... }
//
// Middleware:
//   import { featureMiddleware } from '../../src/support/FeatureFlags.js';
//
//   router.get('/v2/dashboard', featureMiddleware('new-dashboard'), handler);
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ── Types ───────────────────────────────────────────────────

export interface FeatureFlagContext {
    user?: { id: string | number; role?: string; [key: string]: unknown };
    tenant?: { id: string; plan?: string; [key: string]: unknown };
    [key: string]: unknown;
}

export type FeatureFlagResolver = boolean | ((context: FeatureFlagContext) => boolean | Promise<boolean>);

export interface FeatureFlagDriver {
    get(name: string, context: FeatureFlagContext): Promise<boolean>;
    set(name: string, value: FeatureFlagResolver): void;
    all(): Map<string, FeatureFlagResolver>;
}

// ── In-memory / Config driver ───────────────────────────────

class ConfigFlagDriver implements FeatureFlagDriver {
    private flags = new Map<string, FeatureFlagResolver>();

    async get(name: string, context: FeatureFlagContext): Promise<boolean> {
        const resolver = this.flags.get(name);
        if (resolver === undefined) return false;
        if (typeof resolver === 'boolean') return resolver;
        return resolver(context);
    }

    set(name: string, value: FeatureFlagResolver): void {
        this.flags.set(name, value);
    }

    all(): Map<string, FeatureFlagResolver> {
        return new Map(this.flags);
    }
}

// ── Environment variable driver ─────────────────────────────

class EnvFlagDriver implements FeatureFlagDriver {
    async get(name: string, _context: FeatureFlagContext): Promise<boolean> {
        const envKey = `FEATURE_${name.toUpperCase().replace(/-/g, '_')}`;
        const val = process.env[envKey];
        return val === 'true' || val === '1';
    }

    set(): void {
        throw new Error('EnvFlagDriver is read-only. Set flags via environment variables.');
    }

    all(): Map<string, FeatureFlagResolver> {
        const flags = new Map<string, FeatureFlagResolver>();
        for (const [key, val] of Object.entries(process.env)) {
            if (key.startsWith('FEATURE_')) {
                const flagName = key.replace('FEATURE_', '').toLowerCase().replace(/_/g, '-');
                flags.set(flagName, val === 'true' || val === '1');
            }
        }
        return flags;
    }
}

// ── Public API ──────────────────────────────────────────────

export class FeatureFlags {
    private static driver: FeatureFlagDriver = new ConfigFlagDriver();

    /**
     * Switch the underlying driver.
     */
    static useDriver(driver: FeatureFlagDriver | 'config' | 'env'): void {
        if (driver === 'config') {
            this.driver = new ConfigFlagDriver();
        } else if (driver === 'env') {
            this.driver = new EnvFlagDriver();
        } else {
            this.driver = driver;
        }
    }

    /**
     * Define a feature flag.
     *
     * @param name — Flag name (kebab-case recommended).
     * @param resolver — `true`/`false` or a function receiving context.
     *
     * @example
     * FeatureFlags.define('new-dashboard', true);
     * FeatureFlags.define('beta-ai', (ctx) => ctx.user?.role === 'beta');
     */
    static define(name: string, resolver: FeatureFlagResolver): void {
        this.driver.set(name, resolver);
    }

    /**
     * Check if a feature is enabled.
     *
     * @param name — Feature flag name.
     * @param context — Optional context (user, tenant, etc.).
     */
    static async enabled(name: string, context: FeatureFlagContext = {}): Promise<boolean> {
        return this.driver.get(name, context);
    }

    /**
     * Check if a feature is disabled.
     */
    static async disabled(name: string, context: FeatureFlagContext = {}): Promise<boolean> {
        return !(await this.enabled(name, context));
    }

    /**
     * Get all defined flags (for admin dashboard).
     */
    static all(): Map<string, FeatureFlagResolver> {
        return this.driver.all();
    }

    /**
     * Batch-define flags from a config object.
     *
     * @example
     * FeatureFlags.register({
     *   'new-ui': true,
     *   'ai-chat': (ctx) => ctx.tenant?.plan === 'pro',
     *   'maintenance': false,
     * });
     */
    static register(flags: Record<string, FeatureFlagResolver>): void {
        for (const [name, resolver] of Object.entries(flags)) {
            this.define(name, resolver);
        }
    }
}

// ── Middleware ───────────────────────────────────────────────

/**
 * Gate a route behind a feature flag.
 * Returns 404 if the flag is disabled (feature doesn't "exist" yet).
 *
 * @example
 * router.get('/v2/dashboard', featureMiddleware('new-dashboard'), handler);
 */
export function featureMiddleware(flagName: string): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const context: FeatureFlagContext = {
            user: (req as unknown as Record<string, unknown>)['user'] as FeatureFlagContext['user'],
            tenant: (req as unknown as Record<string, unknown>)['tenant'] as FeatureFlagContext['tenant'],
        };

        const isEnabled = await FeatureFlags.enabled(flagName, context);

        if (!isEnabled) {
            res.status(404).json({
                success: false,
                message: 'Not found.',
            });
            return;
        }

        next();
    };
}
