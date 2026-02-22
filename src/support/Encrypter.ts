// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Encrypter
// ──────────────────────────────────────────────────────────────
//
// AES-256-GCM authenticated encryption using APP_KEY.
// Provides encrypt/decrypt for arbitrary strings and
// URL-safe variants for use in query parameters.
//
// Usage:
//   import { Encrypter } from '../../src/support/Encrypter.js';
//
//   const cipher = Encrypter.encrypt('sensitive data');
//   const plain  = Encrypter.decrypt(cipher);
// ──────────────────────────────────────────────────────────────

import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    createHash,
} from 'node:crypto';
import { env } from './helpers.js';

export class Encrypter {
    private static readonly ALGORITHM = 'aes-256-gcm' as const;
    private static readonly IV_LENGTH = 16;
    private static readonly AUTH_TAG_LENGTH = 16;
    private static readonly CURRENT_VERSION = 1;

    // ── Key derivation ──────────────────────────────────────

    /**
     * Derive a 256-bit key from APP_KEY using SHA-256.
     * Throws if APP_KEY is missing or too short.
     */
    private static getKey(): Buffer {
        const appKey = env('APP_KEY', '');
        if (!appKey || appKey.length < 16) {
            throw new Error(
                'APP_KEY is not set or too short. Run: npx tsx bin/hyperz.ts key:generate'
            );
        }
        return createHash('sha256').update(appKey).digest();
    }

    // ── Encrypt / Decrypt ───────────────────────────────────

    /**
     * Encrypt a plaintext string.
     * Returns a versioned, colon-separated, base64-encoded payload.
     *
     * Wire format: `v1:<iv>:<authTag>:<ciphertext>` (all base64)
     */
    static encrypt(plaintext: string): string {
        const key = this.getKey();
        const iv = randomBytes(this.IV_LENGTH);

        const cipher = createCipheriv(this.ALGORITHM, key, iv, {
            authTagLength: this.AUTH_TAG_LENGTH,
        });

        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();

        return [
            `v${this.CURRENT_VERSION}`,
            iv.toString('base64'),
            authTag.toString('base64'),
            encrypted.toString('base64'),
        ].join(':');
    }

    /**
     * Decrypt a previously encrypted payload.
     * Throws on tampered, malformed, or invalid data.
     */
    static decrypt(payload: string): string {
        const parts = payload.split(':');

        if (parts.length !== 4 || parts[0] !== `v${this.CURRENT_VERSION}`) {
            throw new Error('Invalid encrypted payload: unsupported format or version.');
        }

        const [, ivB64, tagB64, dataB64] = parts;
        if (!ivB64 || !tagB64 || dataB64 === undefined) {
            throw new Error('Invalid encrypted payload: missing segments.');
        }

        const key = this.getKey();
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(tagB64, 'base64');
        const encrypted = Buffer.from(dataB64, 'base64');

        const decipher = createDecipheriv(this.ALGORITHM, key, iv, {
            authTagLength: this.AUTH_TAG_LENGTH,
        });
        decipher.setAuthTag(authTag);

        try {
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final(),
            ]);
            return decrypted.toString('utf8');
        } catch {
            throw new Error('Decryption failed: payload may have been tampered with.');
        }
    }

    // ── URL-safe variants ───────────────────────────────────

    /**
     * Encrypt a value and return a URL-safe string.
     * Safe for use in query parameters without additional encoding.
     */
    static encryptUrlSafe(plaintext: string): string {
        return this.encrypt(plaintext)
            .replaceAll('+', '-')
            .replaceAll('/', '_')
            .replaceAll('=', '');
    }

    /**
     * Decrypt a URL-safe encrypted string.
     */
    static decryptUrlSafe(payload: string): string {
        const restored = payload.replaceAll('-', '+').replaceAll('_', '/');
        return this.decrypt(restored);
    }
}
