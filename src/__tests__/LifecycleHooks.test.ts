// ──────────────────────────────────────────────────────────────
// Tests — LifecycleHooks
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LifecycleHooks } from '../http/LifecycleHooks.js';

// ── Mock Express req/res/next ───────────────────────────────

function createMockReq(overrides: Record<string, unknown> = {}) {
    return { method: 'GET', path: '/', ...overrides } as never;
}

function createMockRes() {
    const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
    return {
        statusCode: 200,
        on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event]!.push(cb);
        }),
        _emit: (event: string, ...args: unknown[]) => listeners[event]?.forEach((cb) => cb(...args)),
    } as never;
}

// ── Tests ───────────────────────────────────────────────────

describe('LifecycleHooks', () => {
    beforeEach(() => {
        LifecycleHooks.clear();
    });

    it('should register and fire onRequest hooks', async () => {
        const spy = vi.fn();
        LifecycleHooks.onRequest(spy);

        const middleware = LifecycleHooks.middleware();
        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(spy).toHaveBeenCalledWith(req, res);
        expect(next).toHaveBeenCalled();
    });

    it('should fire onFinish hooks with duration on response finish', async () => {
        const spy = vi.fn();
        LifecycleHooks.onFinish(spy);

        const middleware = LifecycleHooks.middleware();
        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        // Simulate response finish
        (res as unknown as { _emit: (e: string) => void })._emit('finish');

        // Allow microtask to resolve
        await new Promise((r) => setTimeout(r, 10));

        expect(spy).toHaveBeenCalledWith(req, res, expect.any(Number));
    });

    it('should fire onError hooks via error middleware', async () => {
        const spy = vi.fn();
        LifecycleHooks.onError(spy);

        const errorMiddleware = LifecycleHooks.errorMiddleware();
        const err = new Error('test error');
        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn();

        await errorMiddleware(err, req, res, next);

        expect(spy).toHaveBeenCalledWith(err, req, res);
        expect(next).toHaveBeenCalledWith(err); // Must pass error through
    });

    it('should report stats correctly', () => {
        LifecycleHooks.onRequest(() => {});
        LifecycleHooks.onRequest(() => {});
        LifecycleHooks.onResponse(() => {});
        LifecycleHooks.onError(() => {});

        const stats = LifecycleHooks.stats();
        expect(stats).toEqual({
            onRequest: 2,
            onResponse: 1,
            onError: 1,
            onFinish: 0,
        });
    });

    it('should clear all hooks', () => {
        LifecycleHooks.onRequest(() => {});
        LifecycleHooks.onFinish(() => {});
        LifecycleHooks.clear();

        const stats = LifecycleHooks.stats();
        expect(stats.onRequest).toBe(0);
        expect(stats.onFinish).toBe(0);
    });

    it('should not break if onRequest hook throws', async () => {
        LifecycleHooks.onRequest(() => { throw new Error('boom'); });

        const middleware = LifecycleHooks.middleware();
        const req = createMockReq();
        const res = createMockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        // Should call next with error
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
