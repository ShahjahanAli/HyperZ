// ──────────────────────────────────────────────────────────────
// HyperZ Framework — JWT Token Blacklist
// ──────────────────────────────────────────────────────────────
//
// Provides a mechanism to revoke JWT tokens before their natural
// expiry. Tokens are identified by their `jti` (JWT ID) claim.
//
// Supports pluggable stores:
//   - MemoryBlacklistStore (default, single-process)
//   - Swap to a Redis implementation for multi-process deployments.
//
// Usage:
//   import { TokenBlacklist } from '../../src/auth/TokenBlacklist.js';
//
//   // Revoke a token (on logout, password change, etc.)
//   await TokenBlacklist.revoke(jti, remainingTtlMs);
//
//   // Check in auth middleware
//   if (await TokenBlacklist.isRevoked(jti)) { ... }
// ──────────────────────────────────────────────────────────────

// ── Store interface ─────────────────────────────────────────

export interface BlacklistStore {
    /** Add a JTI to the blacklist with an auto-expiry. */
    add(jti: string, expiresInMs: number): Promise<void>;
    /** Check if a JTI is blacklisted. */
    has(jti: string): Promise<boolean>;
}

// ── In-memory store ─────────────────────────────────────────

class MemoryBlacklistStore implements BlacklistStore {
    private store = new Map<string, number>(); // jti → expiresAt timestamp

    constructor() {
        // Garbage-collect expired entries every 5 minutes
        const interval = setInterval(() => {
            const now = Date.now();
            for (const [jti, expiresAt] of this.store) {
                if (now > expiresAt) this.store.delete(jti);
            }
        }, 300_000);
        interval.unref(); // Don't prevent process exit
    }

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

    /** Return the number of currently blacklisted tokens (for admin stats). */
    get size(): number {
        return this.store.size;
    }
}

// ── Public API ──────────────────────────────────────────────

export class TokenBlacklist {
    private static store: BlacklistStore = new MemoryBlacklistStore();

    /**
     * Replace the default in-memory store with a custom implementation.
     * Call this at boot time to use Redis or another backend.
     *
     * @example
     * TokenBlacklist.useStore(new RedisBlacklistStore(redisClient));
     */
    static useStore(store: BlacklistStore): void {
        this.store = store;
    }

    /**
     * Revoke a token by its JTI claim.
     *
     * @param jti — The JWT `jti` (ID) claim value.
     * @param expiresInMs — How long to keep the blacklist entry.
     *   Should match the token's remaining TTL so the entry auto-expires
     *   after the token would have expired naturally.
     *
     * @example
     * // Token expires in 2 hours — blacklist for that duration
     * await TokenBlacklist.revoke(decoded.jti, 2 * 60 * 60 * 1000);
     */
    static async revoke(jti: string, expiresInMs: number): Promise<void> {
        await this.store.add(jti, expiresInMs);
    }

    /**
     * Check if a token has been revoked.
     *
     * @param jti — The JWT `jti` claim value.
     * @returns `true` if the token is blacklisted and should be rejected.
     */
    static async isRevoked(jti: string): Promise<boolean> {
        return this.store.has(jti);
    }

    /**
     * Get the underlying store (useful for admin/monitoring endpoints).
     */
    static getStore(): BlacklistStore {
        return this.store;
    }
}
