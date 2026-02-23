// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Drizzle ORM Tests
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { DrizzleManager } from '../database/DrizzleManager.js';

describe('DrizzleManager', () => {
    beforeEach(() => {
        // Reset static state
        (DrizzleManager as unknown as Record<string, unknown>)['_initialized'] = false;
        (DrizzleManager as unknown as Record<string, unknown>)['instance'] = null;
        (DrizzleManager as unknown as Record<string, unknown>)['client'] = null;
        (DrizzleManager as unknown as Record<string, unknown>)['currentDriver'] = null;
    });

    it('isInitialized() returns false before init', () => {
        expect(DrizzleManager.isInitialized()).toBe(false);
    });

    it('getDriver() returns null before init', () => {
        expect(DrizzleManager.getDriver()).toBeNull();
    });

    it('getInstance() throws when not initialized', () => {
        expect(() => DrizzleManager.getInstance()).toThrow('Drizzle ORM not initialized');
    });

    it('getClient() throws when not initialized', () => {
        expect(() => DrizzleManager.getClient()).toThrow('Drizzle client not available');
    });

    it('configFromEnv() returns a config object', () => {
        const config = DrizzleManager.configFromEnv();
        expect(config).toHaveProperty('driver');
        expect(config).toHaveProperty('host');
        expect(config).toHaveProperty('port');
        expect(config).toHaveProperty('database');
        expect(config).toHaveProperty('user');
        expect(typeof config.driver).toBe('string');
    });

    it('disconnect() is safe to call when not initialized', async () => {
        await expect(DrizzleManager.disconnect()).resolves.toBeUndefined();
    });

    it('initialize() throws with unsupported driver', async () => {
        await expect(
            DrizzleManager.initialize({ driver: 'oracle' as never })
        ).rejects.toThrow('Unsupported Drizzle driver');
    });

    it('initialize() throws meaningful error when drizzle-orm is not installed', async () => {
        // SQLite will fail because better-sqlite3 is not installed
        await expect(
            DrizzleManager.initialize({ driver: 'sqlite', database: ':memory:' })
        ).rejects.toThrow();
    });
});
