// ──────────────────────────────────────────────────────────────
// Tests — ApiKeyMiddleware
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { apiKeyMiddleware, hashApiKey } from '../auth/ApiKeyMiddleware.js';
import type { ApiKeyRecord, ApiKeyResolver } from '../auth/ApiKeyMiddleware.js';

function createMockReqRes(headers: Record<string, string> = {}) {
    const req = {
        headers: { ...headers },
        body: {},
    } as unknown as Request;

    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as unknown as NextFunction;

    return { req, res, next };
}

// A mock resolver that recognizes one valid key
const VALID_RAW_KEY = 'hz_test_key_12345';
const VALID_HASHED_KEY = hashApiKey(VALID_RAW_KEY);

const validRecord: ApiKeyRecord = {
    id: 'key-1',
    hashedKey: VALID_HASHED_KEY,
    tenantId: 'tenant-1',
    scopes: ['read', 'write'],
    expiresAt: null,
    active: true,
};

const mockResolver: ApiKeyResolver = async (hashedKey: string) => {
    if (hashedKey === VALID_HASHED_KEY) return validRecord;
    return null;
};

describe('ApiKeyMiddleware', () => {
    it('authenticates a valid X-API-Key header', async () => {
        const { req, res, next } = createMockReqRes({
            'x-api-key': VALID_RAW_KEY,
        });

        await apiKeyMiddleware(mockResolver)(req, res, next);
        expect(next).toHaveBeenCalled();
        expect((req as unknown as Record<string, unknown>)['apiKey']).toBeDefined();
    });

    it('authenticates a valid Bearer token', async () => {
        const { req, res, next } = createMockReqRes({
            authorization: `Bearer ${VALID_RAW_KEY}`,
        });

        await apiKeyMiddleware(mockResolver)(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('rejects missing API key with 401', async () => {
        const { req, res, next } = createMockReqRes();

        await apiKeyMiddleware(mockResolver)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an invalid API key with 401', async () => {
        const { req, res, next } = createMockReqRes({
            'x-api-key': 'hz_invalid_key',
        });

        await apiKeyMiddleware(mockResolver)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects key missing required scopes with 403', async () => {
        const { req, res, next } = createMockReqRes({
            'x-api-key': VALID_RAW_KEY,
        });

        await apiKeyMiddleware(mockResolver, ['admin'])(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows key with matching scopes', async () => {
        const { req, res, next } = createMockReqRes({
            'x-api-key': VALID_RAW_KEY,
        });

        await apiKeyMiddleware(mockResolver, ['read'])(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('hashApiKey produces consistent SHA-256 hex output', () => {
        const hash1 = hashApiKey('test-key');
        const hash2 = hashApiKey('test-key');
        expect(hash1).toBe(hash2);
        expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex = 64 chars
    });
});
