// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Features Service Provider
// ──────────────────────────────────────────────────────────────
//
// Wires the "gap-analysis" features into the boot lifecycle:
//   1. Lifecycle Hooks (onRequest / onResponse / onError / onFinish)
//   2. Feature Flags (from config/features.ts)
//   3. Audit Log middleware (for non-GET requests)
//
// Registered in app.ts between Security and Database providers.
// ──────────────────────────────────────────────────────────────

import { ServiceProvider } from '../core/ServiceProvider.js';
import { LifecycleHooks } from '../http/LifecycleHooks.js';
import { FeatureFlags } from '../support/FeatureFlags.js';
import { AuditLog, auditMiddleware } from '../logging/AuditLog.js';
import { Logger } from '../logging/Logger.js';
import type { FeatureFlagResolver } from '../support/FeatureFlags.js';

export class FeaturesServiceProvider extends ServiceProvider {
    register(): void {
        // Make services available via DI container
        this.app.container.instance('lifecycle', LifecycleHooks);
        this.app.container.instance('features', FeatureFlags);
        this.app.container.instance('audit', AuditLog);
    }

    async boot(): Promise<void> {
        const express = this.app.express;

        // ── 1. Lifecycle Hooks ──────────────────────────────
        // Must be early in the middleware chain to capture all requests
        express.use(LifecycleHooks.middleware());
        Logger.info('✦ Lifecycle hooks middleware registered');

        // ── 2. Feature Flags ────────────────────────────────
        // Load flags from config/features.ts if available
        try {
            const featureConfig = this.app.config.get<Record<string, FeatureFlagResolver>>('features', {});
            if (featureConfig && Object.keys(featureConfig).length > 0) {
                FeatureFlags.register(featureConfig);
                Logger.info(`✦ Feature flags loaded: ${Object.keys(featureConfig).length} flags`);
            }
        } catch {
            // Config may not exist — that's fine
        }

        // ── 3. Audit Log ────────────────────────────────────
        // Automatically audit state-changing requests (POST/PUT/PATCH/DELETE)
        express.use(auditMiddleware());
        Logger.info('✦ Audit log middleware registered');
    }
}
