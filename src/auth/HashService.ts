// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Hash Service
// ──────────────────────────────────────────────────────────────
//
// Standalone password hashing facade using bcryptjs.
// Provides a clean API independent of AuthManager for use in
// controllers, seeders, CLI commands, and middleware.
//
// Usage:
//   import { HashService } from '../../src/auth/HashService.js';
//
//   const hash = await HashService.make('password');
//   const valid = await HashService.check('password', hash);
// ──────────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs';

export interface HashOptions {
    rounds: number;
}

const defaults: HashOptions = {
    rounds: 12,
};

export class HashService {
    private static options: HashOptions = { ...defaults };

    /**
     * Override default options (call once at boot time).
     */
    static configure(options: Partial<HashOptions>): void {
        this.options = { ...defaults, ...options };
    }

    /**
     * Hash a plaintext value (typically a password).
     *
     * @param plain - The plaintext string to hash.
     * @returns A bcrypt hash string.
     *
     * @example
     * const hashed = await HashService.make('SuperSecret123!');
     */
    static async make(plain: string): Promise<string> {
        const salt = await bcrypt.genSalt(this.options.rounds);
        return bcrypt.hash(plain, salt);
    }

    /**
     * Verify a plaintext value against a previously hashed value.
     * Uses bcrypt's built-in timing-safe comparison.
     *
     * @param plain - The plaintext string to verify.
     * @param hashed - The bcrypt hash to compare against.
     * @returns `true` if the plaintext matches the hash.
     *
     * @example
     * const valid = await HashService.check('SuperSecret123!', storedHash);
     */
    static async check(plain: string, hashed: string): Promise<boolean> {
        if (!plain || !hashed) return false;
        try {
            return await bcrypt.compare(plain, hashed);
        } catch {
            return false;
        }
    }

    /**
     * Check if an existing hash needs to be re-hashed.
     * This is true when the configured rounds have changed since the hash
     * was originally created.
     *
     * @example
     * if (HashService.needsRehash(user.password)) {
     *     user.password = await HashService.make(plainPassword);
     *     await user.save();
     * }
     */
    static needsRehash(hashed: string): boolean {
        if (!hashed || !hashed.startsWith('$2')) return true;
        try {
            const existingRounds = bcrypt.getRounds(hashed);
            return existingRounds !== this.options.rounds;
        } catch {
            return true;
        }
    }

    /**
     * Get the current configured rounds.
     */
    static getRounds(): number {
        return this.options.rounds;
    }
}
