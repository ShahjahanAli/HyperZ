// ──────────────────────────────────────────────────────────────
// Tests — FeatureFlags
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureFlags, featureMiddleware } from '../support/FeatureFlags.js';
import type { FeatureFlagDriver, FeatureFlagContext, FeatureFlagResolver } from '../support/FeatureFlags.js';

// ── Tests ───────────────────────────────────────────────────

describe('FeatureFlags', () => {
    beforeEach(() => {
        // Reset to config driver
        FeatureFlags.useDriver('config');
    });

    it('should return false for undefined flags', async () => {
        expect(await FeatureFlags.enabled('nonexistent')).toBe(false);
    });

    it('should define and check boolean flags', async () => {
        FeatureFlags.define('maintenance', true);
        FeatureFlags.define('beta', false);

        expect(await FeatureFlags.enabled('maintenance')).toBe(true);
        expect(await FeatureFlags.enabled('beta')).toBe(false);
    });

    it('should support function-based flags with context', async () => {
        FeatureFlags.define('admin-only', (ctx) => ctx.user?.role === 'admin');

        expect(await FeatureFlags.enabled('admin-only', { user: { id: '1', role: 'admin' } })).toBe(true);
        expect(await FeatureFlags.enabled('admin-only', { user: { id: '2', role: 'user' } })).toBe(false);
        expect(await FeatureFlags.enabled('admin-only', {})).toBe(false);
    });

    it('should batch register flags', async () => {
        FeatureFlags.register({
            'flag-a': true,
            'flag-b': false,
            'flag-c': () => true,
        });

        expect(await FeatureFlags.enabled('flag-a')).toBe(true);
        expect(await FeatureFlags.enabled('flag-b')).toBe(false);
        expect(await FeatureFlags.enabled('flag-c')).toBe(true);
    });

    it('should support disabled() helper', async () => {
        FeatureFlags.define('active', true);
        FeatureFlags.define('inactive', false);

        expect(await FeatureFlags.disabled('active')).toBe(false);
        expect(await FeatureFlags.disabled('inactive')).toBe(true);
    });

    it('should list all defined flags', () => {
        FeatureFlags.define('x', true);
        FeatureFlags.define('y', false);

        const all = FeatureFlags.all();
        expect(all.size).toBe(2);
        expect(all.get('x')).toBe(true);
    });

    it('should support env driver', async () => {
        process.env['FEATURE_NEW_UI'] = 'true';
        process.env['FEATURE_DARK_MODE'] = '0';

        FeatureFlags.useDriver('env');

        expect(await FeatureFlags.enabled('new-ui')).toBe(true);
        expect(await FeatureFlags.enabled('dark-mode')).toBe(false);

        delete process.env['FEATURE_NEW_UI'];
        delete process.env['FEATURE_DARK_MODE'];
    });

    it('should support custom drivers', async () => {
        const customDriver: FeatureFlagDriver = {
            get: async (name: string) => name === 'custom-flag',
            set: vi.fn(),
            all: () => new Map<string, FeatureFlagResolver>(),
        };

        FeatureFlags.useDriver(customDriver);
        expect(await FeatureFlags.enabled('custom-flag')).toBe(true);
        expect(await FeatureFlags.enabled('other-flag')).toBe(false);
    });
});

describe('featureMiddleware', () => {
    beforeEach(() => {
        FeatureFlags.useDriver('config');
    });

    it('should allow access when flag is enabled', async () => {
        FeatureFlags.define('open-feature', true);

        const middleware = featureMiddleware('open-feature');
        const req = {} as never;
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as never;
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should return 404 when flag is disabled', async () => {
        FeatureFlags.define('closed-feature', false);

        const middleware = featureMiddleware('closed-feature');
        const req = {} as never;
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as never;
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect((res as unknown as { status: ReturnType<typeof vi.fn> }).status).toHaveBeenCalledWith(404);
    });
});
