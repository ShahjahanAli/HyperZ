// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — API Key Authentication
// ──────────────────────────────────────────────────────────────
//
// Authenticates requests via `X-API-Key` header or
// `Authorization: Bearer <api_key>`.
//
// Keys are stored as SHA-256 hashes in the database — never raw.
//
// Usage:
//   import { apiKeyMiddleware, hashApiKey } from '../../src/auth/ApiKeyMiddleware.js';
//
//   // Route-level
//   router.get('/external', apiKeyMiddleware(lookupFn), handler);
//
//   // With required scopes
//   router.post('/webhooks', apiKeyMiddleware(lookupFn, ['webhooks:send']), handler);
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { createHash } from 'node:crypto';

// ── Types ───────────────────────────────────────────────────

export interface ApiKeyRecord {
    /** Primary key / identifier */
    id: string;
    /** SHA-256 hashed key (as stored in the database) */
    hashedKey: string;
    /** Associated tenant ID, if any */
    tenantId: string | null;
    /** Granted scopes */
    scopes: string[];
    /** Expiration date, or null for no expiry */
    expiresAt: Date | null;
    /** Whether the key is active */
    active: boolean;
}

/**
 * A function that resolves an API key record from a hashed key.
 * Implement this in your app to look up from your database.
 */
export type ApiKeyResolver = (hashedKey: string) => Promise<ApiKeyRecord | null>;

// ── Helpers ─────────────────────────────────────────────────

/**
 * SHA-256 hash a raw API key for secure storage.
 * Always hash before persisting — never store raw keys.
 *
 * @example
 * const hashed = hashApiKey(rawKey);
 * await db.insert('api_keys', { hashed_key: hashed, ... });
 */
export function hashApiKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Extract a Bearer token from an Authorization header.
 */
function extractBearerToken(header: string | undefined): string | undefined {
    if (!header || !header.startsWith('Bearer ')) return undefined;
    return header.slice(7);
}

// ── Middleware factory ───────────────────────────────────────

/**
 * API key authentication middleware.
 *
 * Reads the key from `X-API-Key` header or `Authorization: Bearer <key>`,
 * hashes it, resolves the record via the provided callback, and validates
 * status, expiry, and scopes.
 *
 * On success, `req.apiKey` is populated with the resolved `ApiKeyRecord`.
 *
 * @param resolver — Callback to find the API key record from hashed key.
 * @param requiredScopes — Scopes the key must possess (all must match).
 */
export function apiKeyMiddleware(
    resolver: ApiKeyResolver,
    requiredScopes: string[] = [],
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // ── Extract key ─────────────────────────────────────
        const raw =
            (req.headers['x-api-key'] as string | undefined) ??
            extractBearerToken(req.headers.authorization);

        if (!raw) {
            res.status(401).json({
                success: false,
                message: 'Missing API key. Provide via X-API-Key header or Authorization: Bearer <key>.',
            });
            return;
        }

        // ── Resolve record ──────────────────────────────────
        const hashed = hashApiKey(raw);
        const record = await resolver(hashed);

        if (!record || !record.active) {
            res.status(401).json({
                success: false,
                message: 'Invalid or inactive API key.',
            });
            return;
        }

        // ── Check expiration ────────────────────────────────
        if (record.expiresAt && new Date() > record.expiresAt) {
            res.status(401).json({
                success: false,
                message: 'API key has expired.',
            });
            return;
        }

        // ── Check scopes ────────────────────────────────────
        if (requiredScopes.length > 0) {
            const hasAll = requiredScopes.every((s) => record.scopes.includes(s));
            if (!hasAll) {
                res.status(403).json({
                    success: false,
                    message: `API key missing required scopes: ${requiredScopes.join(', ')}`,
                });
                return;
            }
        }

        // ── Attach to request ───────────────────────────────
        (req as unknown as Record<string, unknown>)['apiKey'] = record;
        next();
    };
}

// ── Type augmentation ───────────────────────────────────────

declare global {
    namespace Express {
        interface Request {
            apiKey?: ApiKeyRecord;
        }
    }
}
