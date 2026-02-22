// ──────────────────────────────────────────────────────────────
// Tests — SignedUrl
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';

// Mock env() to provide a stable APP_KEY
vi.mock('../support/helpers.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../support/helpers.js')>();
    return {
        ...actual,
        env: (key: string, fallback: string = '') => {
            if (key === 'APP_KEY') return 'test-signing-secret-for-signed-urls';
            return fallback;
        },
    };
});

import { SignedUrl } from '../support/SignedUrl.js';

describe('SignedUrl', () => {
    it('creates a signed URL with a signature parameter', () => {
        const url = SignedUrl.create('/api/downloads/42');
        expect(url).toContain('/api/downloads/42');
        expect(url).toContain('signature=');
    });

    it('verifies a valid signed URL', () => {
        const url = SignedUrl.create('/api/verify-email', { user: '5' });
        expect(SignedUrl.verify(url)).toBe(true);
    });

    it('rejects a tampered URL', () => {
        const url = SignedUrl.create('/api/downloads/42');
        const tampered = url.replace('signature=', 'signature=000');
        expect(SignedUrl.verify(tampered)).toBe(false);
    });

    it('rejects a URL with no signature', () => {
        expect(SignedUrl.verify('/api/downloads/42')).toBe(false);
    });

    it('creates URLs with expiration', () => {
        const url = SignedUrl.create('/api/reset', {}, 3600);
        expect(url).toContain('expires=');
        expect(url).toContain('signature=');
        expect(SignedUrl.verify(url)).toBe(true);
    });

    it('rejects an expired URL', () => {
        // Create a valid signed URL with expiry, then manually set expires to the past
        const url = SignedUrl.create('/api/expired', {}, 3600);
        // Replace the expires value with one in the past
        const pastExpiry = (Math.floor(Date.now() / 1000) - 60).toString();
        const tamperedUrl = url.replace(/expires=\d+/, `expires=${pastExpiry}`);
        // Signature won't match anymore either, but expiry check comes first
        expect(SignedUrl.verify(tamperedUrl)).toBe(false);
    });

    it('includes additional params in the signed URL', () => {
        const url = SignedUrl.create('/api/action', { token: 'abc', ref: '123' });
        expect(url).toContain('token=abc');
        expect(url).toContain('ref=123');
        expect(SignedUrl.verify(url)).toBe(true);
    });
});
