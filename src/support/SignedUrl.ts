// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Signed URL Service
// ──────────────────────────────────────────────────────────────
//
// Creates and verifies HMAC-SHA256 signed URLs for tamper-proof
// links (e.g. file downloads, email verification, password resets).
//
// Usage:
//   import { SignedUrl } from '../../src/support/SignedUrl.js';
//
//   // Create a signed URL (expires in 1 hour)
//   const url = SignedUrl.create('/api/downloads/42', {}, 3600);
//
//   // Verify a signed URL
//   const valid = SignedUrl.verify(fullUrl);
// ──────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './helpers.js';

export class SignedUrl {
    // ── Secret ──────────────────────────────────────────────

    private static getSecret(): string {
        const key = env('APP_KEY', '');
        if (!key) {
            throw new Error(
                'APP_KEY is required for signed URLs. Run: npx hyperz key:generate'
            );
        }
        return key;
    }

    // ── Create ──────────────────────────────────────────────

    /**
     * Create a signed URL.
     *
     * @param url — The base URL path (e.g. `/api/downloads/42`).
     * @param params — Additional query parameters to include.
     * @param expiresInSeconds — Optional TTL in seconds.
     * @returns The full URL with a `signature` query parameter appended.
     *
     * @example
     * // No expiry
     * SignedUrl.create('/api/verify-email', { user: '5' });
     * // → /api/verify-email?user=5&signature=abc123...
     *
     * // With 1-hour expiry
     * SignedUrl.create('/api/downloads/42', {}, 3600);
     * // → /api/downloads/42?expires=1700000000&signature=abc123...
     */
    static create(
        url: string,
        params: Record<string, string> = {},
        expiresInSeconds?: number,
    ): string {
        const query = new URLSearchParams(params);

        if (expiresInSeconds !== undefined && expiresInSeconds > 0) {
            const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
            query.set('expires', expires.toString());
        }

        const queryString = query.toString();
        const baseUrl = queryString ? `${url}?${queryString}` : url;

        const signature = this.sign(baseUrl);
        const separator = baseUrl.includes('?') ? '&' : '?';

        return `${baseUrl}${separator}signature=${signature}`;
    }

    // ── Verify ──────────────────────────────────────────────

    /**
     * Verify a signed URL.
     *
     * 1. Checks that a `signature` parameter is present.
     * 2. If an `expires` parameter exists, checks it hasn't passed.
     * 3. Re-signs the URL (without the signature) and compares using
     *    a timing-safe comparison.
     *
     * @param fullUrl — The full URL string (absolute or relative).
     * @returns `true` if the signature is valid and the URL hasn't expired.
     */
    static verify(fullUrl: string): boolean {
        // Parse — use a dummy base if the URL is relative
        const url = new URL(fullUrl, 'http://localhost');
        const signature = url.searchParams.get('signature');
        if (!signature) return false;

        // ── Expiration check ────────────────────────────────
        const expires = url.searchParams.get('expires');
        if (expires) {
            const expiresAt = Number(expires);
            if (Number.isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
                return false;
            }
        }

        // ── Re-sign and compare ─────────────────────────────
        url.searchParams.delete('signature');
        const urlWithoutSig = `${url.pathname}${url.search}`;
        const expectedSignature = this.sign(urlWithoutSig);

        // Timing-safe comparison
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (sigBuffer.length !== expectedBuffer.length) return false;
        return timingSafeEqual(sigBuffer, expectedBuffer);
    }

    // ── Internal ────────────────────────────────────────────

    private static sign(data: string): string {
        return createHmac('sha256', this.getSecret()).update(data).digest('hex');
    }
}
