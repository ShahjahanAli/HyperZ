// ──────────────────────────────────────────────────────────────
// Tests — SanitizeMiddleware
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { sanitizeMiddleware } from '../http/middleware/SanitizeMiddleware.js';

function createMockReqRes(
    body?: Record<string, unknown>,
    query?: Record<string, unknown>,
    params?: Record<string, unknown>,
) {
    const req = {
        body: body ?? {},
        query: query ?? {},
        params: params ?? {},
    } as unknown as Request;

    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    return { req, res, next };
}

describe('SanitizeMiddleware', () => {
    it('strips HTML tags from body strings', () => {
        const { req, res, next } = createMockReqRes({
            name: '<script>alert("xss")</script>Hello',
            bio: '<b>Bold</b> text',
        });

        sanitizeMiddleware()(req, res, next);

        expect((req.body as Record<string, string>).name).toBe('alert(&quot;xss&quot;)Hello');
        expect((req.body as Record<string, string>).bio).toBe('Bold text');
        expect(next).toHaveBeenCalled();
    });

    it('preserves non-string values', () => {
        const { req, res, next } = createMockReqRes({
            count: 42,
            active: true,
            tags: ['a', 'b'],
        });

        sanitizeMiddleware()(req, res, next);

        expect((req.body as Record<string, unknown>).count).toBe(42);
        expect((req.body as Record<string, unknown>).active).toBe(true);
        expect(next).toHaveBeenCalled();
    });

    it('blocks prototype pollution keys', () => {
        const { req, res, next } = createMockReqRes({
            __proto__: { admin: true },
            constructor: 'evil',
            prototype: 'also evil',
            safeKey: 'kept',
        });

        sanitizeMiddleware()(req, res, next);

        const body = req.body as Record<string, unknown>;
        // __proto__, constructor, prototype keys must NOT be own properties
        expect(Object.hasOwn(body, '__proto__')).toBe(false);
        expect(Object.hasOwn(body, 'constructor')).toBe(false);
        expect(Object.hasOwn(body, 'prototype')).toBe(false);
        expect(body['safeKey']).toBe('kept');
    });

    it('skips excepted fields (passwords)', () => {
        const { req, res, next } = createMockReqRes({
            email: '<b>user@test.com</b>',
            password: '<raw>P@ssw0rd!</raw>',
        });

        sanitizeMiddleware({ except: ['password'] })(req, res, next);

        expect((req.body as Record<string, string>).email).toBe('user@test.com');
        // Password should be untouched
        expect((req.body as Record<string, string>).password).toBe('<raw>P@ssw0rd!</raw>');
    });

    it('sanitizes query parameters', () => {
        const { req, res, next } = createMockReqRes(
            {},
            { search: '<img src=x onerror=alert(1)>' },
        );

        sanitizeMiddleware()(req, res, next);

        expect((req.query as Record<string, string>).search).not.toContain('<img');
    });

    it('sanitizes nested objects recursively', () => {
        const { req, res, next } = createMockReqRes({
            user: {
                name: '<em>Test</em>',
                address: {
                    street: '<script>evil</script>Main St',
                },
            },
        });

        sanitizeMiddleware()(req, res, next);

        const user = (req.body as Record<string, Record<string, unknown>>).user;
        expect(user.name).toBe('Test');
        expect((user.address as Record<string, string>).street).toBe('evilMain St');
    });

    it('can be disabled per-target', () => {
        const { req, res, next } = createMockReqRes(
            { html: '<b>bold</b>' },
            { q: '<script>x</script>' },
        );

        sanitizeMiddleware({ body: false, query: true })(req, res, next);

        // Body should remain unsanitized
        expect((req.body as Record<string, string>).html).toBe('<b>bold</b>');
        // Query should be sanitized
        expect((req.query as Record<string, string>).q).not.toContain('<script>');
    });
});
