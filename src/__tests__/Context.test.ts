// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Context (AsyncLocalStorage) Tests
// ──────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { requestContext, getContext, getRequestId } from '../core/Context.js';

describe('RequestContext', () => {
    it('returns undefined outside of a context', () => {
        expect(getContext()).toBeUndefined();
        expect(getRequestId()).toBeUndefined();
    });

    it('stores and retrieves request context', () => {
        requestContext.run({ requestId: 'req-123' }, () => {
            expect(getContext()).toEqual({ requestId: 'req-123' });
            expect(getRequestId()).toBe('req-123');
        });
    });

    it('isolates context between runs', () => {
        requestContext.run({ requestId: 'A' }, () => {
            expect(getRequestId()).toBe('A');
        });
        requestContext.run({ requestId: 'B' }, () => {
            expect(getRequestId()).toBe('B');
        });
    });

    it('supports custom properties on context', () => {
        requestContext.run({ requestId: 'req-1', userId: '42', tenant: 'acme' }, () => {
            const ctx = getContext();
            expect(ctx?.userId).toBe('42');
            expect(ctx?.tenant).toBe('acme');
        });
    });

    it('context is undefined after run completes', () => {
        requestContext.run({ requestId: 'temp' }, () => {
            // inside
        });
        expect(getContext()).toBeUndefined();
    });
});
