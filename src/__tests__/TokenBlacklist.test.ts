// ──────────────────────────────────────────────────────────────
// Tests — TokenBlacklist
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { TokenBlacklist } from '../auth/TokenBlacklist.js';
import type { BlacklistStore } from '../auth/TokenBlacklist.js';

/**
 * A simple test store that wraps a Map for deterministic testing.
 */
class TestBlacklistStore implements BlacklistStore {
    private store = new Map<string, number>();

    async add(jti: string, expiresInMs: number): Promise<void> {
        this.store.set(jti, Date.now() + expiresInMs);
    }

    async has(jti: string): Promise<boolean> {
        const expiresAt = this.store.get(jti);
        if (expiresAt === undefined) return false;
        if (Date.now() > expiresAt) {
            this.store.delete(jti);
            return false;
        }
        return true;
    }
}

describe('TokenBlacklist', () => {
    beforeEach(() => {
        // Use a fresh store for each test
        TokenBlacklist.useStore(new TestBlacklistStore());
    });

    it('reports a non-revoked token as not revoked', async () => {
        expect(await TokenBlacklist.isRevoked('random-jti')).toBe(false);
    });

    it('revokes a token and detects it', async () => {
        await TokenBlacklist.revoke('abc-123', 60_000);
        expect(await TokenBlacklist.isRevoked('abc-123')).toBe(true);
    });

    it('does not affect other tokens', async () => {
        await TokenBlacklist.revoke('revoked-token', 60_000);
        expect(await TokenBlacklist.isRevoked('different-token')).toBe(false);
    });

    it('auto-expires after TTL', async () => {
        // Revoke with 1ms TTL
        await TokenBlacklist.revoke('short-lived', 1);

        // Wait for expiry
        await new Promise((r) => setTimeout(r, 10));

        expect(await TokenBlacklist.isRevoked('short-lived')).toBe(false);
    });
});
