// ──────────────────────────────────────────────────────────────
// Tests — Encrypter
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock env() so we don't need a real .env file
vi.mock('../support/helpers.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../support/helpers.js')>();
    return {
        ...actual,
        env: (key: string, fallback: string = '') => {
            if (key === 'APP_KEY') return 'test-app-key-for-unit-tests-must-be-long-enough';
            return fallback;
        },
    };
});

import { Encrypter } from '../support/Encrypter.js';

describe('Encrypter', () => {
    it('encrypts and decrypts a string', () => {
        const plaintext = 'Hello, HyperZ Framework!';
        const encrypted = Encrypter.encrypt(plaintext);

        expect(encrypted).not.toBe(plaintext);
        expect(encrypted).toMatch(/^v1:/);
        expect(Encrypter.decrypt(encrypted)).toBe(plaintext);
    });

    it('handles empty strings', () => {
        const encrypted = Encrypter.encrypt('');
        expect(Encrypter.decrypt(encrypted)).toBe('');
    });

    it('handles unicode content', () => {
        const text = '你好世界 🌍 مرحبا';
        const encrypted = Encrypter.encrypt(text);
        expect(Encrypter.decrypt(encrypted)).toBe(text);
    });

    it('produces different ciphertext for the same plaintext (random IV)', () => {
        const a = Encrypter.encrypt('same input');
        const b = Encrypter.encrypt('same input');
        expect(a).not.toBe(b);

        // But both decrypt to the same value
        expect(Encrypter.decrypt(a)).toBe('same input');
        expect(Encrypter.decrypt(b)).toBe('same input');
    });

    it('throws on tampered ciphertext', () => {
        const encrypted = Encrypter.encrypt('secret');
        const tampered = encrypted.slice(0, -3) + 'xxx';
        expect(() => Encrypter.decrypt(tampered)).toThrow();
    });

    it('throws on invalid payload format', () => {
        expect(() => Encrypter.decrypt('not:valid')).toThrow('unsupported format');
        expect(() => Encrypter.decrypt('v2:a:b:c')).toThrow('unsupported format');
        expect(() => Encrypter.decrypt('')).toThrow();
    });

    it('encrypts and decrypts URL-safe strings', () => {
        const text = 'URL safe content with special chars: +/=';
        const encrypted = Encrypter.encryptUrlSafe(text);

        // Should not contain URL-unsafe characters
        expect(encrypted).not.toMatch(/[+/=]/);
        expect(Encrypter.decryptUrlSafe(encrypted)).toBe(text);
    });
});
