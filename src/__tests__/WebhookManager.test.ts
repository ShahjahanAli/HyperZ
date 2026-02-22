// ──────────────────────────────────────────────────────────────
// Tests — WebhookManager
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookManager } from '../webhooks/WebhookManager.js';

// ── Tests ───────────────────────────────────────────────────

describe('WebhookManager', () => {
    beforeEach(() => {
        WebhookManager.clear();
    });

    // ── Registration ────────────────────────────────────────

    it('should register and retrieve endpoints', () => {
        const ep = WebhookManager.register({
            url: 'https://example.com/hook',
            events: ['user.created'],
            secret: 'test-secret',
        });

        expect(ep.id).toBeDefined();
        expect(ep.active).toBe(true);
        expect(ep.url).toBe('https://example.com/hook');

        const all = WebhookManager.getEndpoints();
        expect(all).toHaveLength(1);
    });

    it('should unregister endpoints', () => {
        const ep = WebhookManager.register({
            url: 'https://example.com/hook',
            events: ['*'],
            secret: 's',
        });

        expect(WebhookManager.unregister(ep.id)).toBe(true);
        expect(WebhookManager.getEndpoints()).toHaveLength(0);
    });

    it('should return specific endpoint by ID', () => {
        const ep = WebhookManager.register({
            url: 'https://example.com/hook',
            events: ['order.completed'],
            secret: 's',
        });

        expect(WebhookManager.getEndpoint(ep.id)?.url).toBe('https://example.com/hook');
        expect(WebhookManager.getEndpoint('nonexistent')).toBeUndefined();
    });

    // ── Signature ───────────────────────────────────────────

    it('should sign and verify payloads', () => {
        const payload = '{"event":"test","data":"hello"}';
        const secret = 'my-secret';
        const signature = WebhookManager.sign(payload, secret);

        expect(signature).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex
        expect(WebhookManager.verifySignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid signatures', () => {
        const payload = '{"event":"test"}';
        const secret = 'my-secret';
        const wrongSig = WebhookManager.sign(payload, 'wrong-secret');

        expect(WebhookManager.verifySignature(payload, wrongSig, secret)).toBe(false);
    });

    it('should reject tampered payloads', () => {
        const payload = '{"event":"test"}';
        const secret = 'my-secret';
        const sig = WebhookManager.sign(payload, secret);

        expect(WebhookManager.verifySignature('{"event":"tampered"}', sig, secret)).toBe(false);
    });

    // ── Dispatch ────────────────────────────────────────────

    it('should dispatch to matching endpoints', async () => {
        const fetchSpy = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
        });
        vi.stubGlobal('fetch', fetchSpy);

        WebhookManager.register({
            url: 'https://example.com/hook1',
            events: ['user.created'],
            secret: 's1',
        });

        WebhookManager.register({
            url: 'https://example.com/hook2',
            events: ['order.completed'],
            secret: 's2',
        });

        const result = await WebhookManager.dispatch('user.created', { id: 1 });

        expect(result.event).toBe('user.created');
        expect(result.deliveries).toHaveLength(1);
        expect(result.deliveries[0]!.status).toBe('success');
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        vi.unstubAllGlobals();
    });

    it('should dispatch to wildcard (*) endpoints', async () => {
        const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
        vi.stubGlobal('fetch', fetchSpy);

        WebhookManager.register({
            url: 'https://example.com/all',
            events: ['*'],
            secret: 's',
        });

        const result = await WebhookManager.dispatch('anything.happened', { data: true });

        expect(result.deliveries).toHaveLength(1);
        expect(result.deliveries[0]!.status).toBe('success');

        vi.unstubAllGlobals();
    });

    it('should not dispatch to inactive endpoints', async () => {
        const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
        vi.stubGlobal('fetch', fetchSpy);

        WebhookManager.register({
            url: 'https://example.com/inactive',
            events: ['*'],
            secret: 's',
            active: false,
        });

        const result = await WebhookManager.dispatch('test.event', {});
        expect(result.deliveries).toHaveLength(0);
        expect(fetchSpy).not.toHaveBeenCalled();

        vi.unstubAllGlobals();
    });

    // ── Stats / Delivery log ────────────────────────────────

    it('should track delivery stats', async () => {
        const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
        vi.stubGlobal('fetch', fetchSpy);

        WebhookManager.register({ url: 'https://example.com/hook', events: ['*'], secret: 's' });
        await WebhookManager.dispatch('event1', {});
        await WebhookManager.dispatch('event2', {});

        const stats = WebhookManager.stats();
        expect(stats.total).toBe(2);
        expect(stats.success).toBe(2);
        expect(stats.failed).toBe(0);
        expect(stats.endpoints).toBe(1);

        vi.unstubAllGlobals();
    });

    it('should return delivery logs', async () => {
        const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
        vi.stubGlobal('fetch', fetchSpy);

        WebhookManager.register({ url: 'https://example.com/hook', events: ['*'], secret: 's' });
        await WebhookManager.dispatch('user.created', { id: 1 });

        const deliveries = WebhookManager.getDeliveries({ event: 'user.created' });
        expect(deliveries).toHaveLength(1);
        expect(deliveries[0]!.event).toBe('user.created');
        expect(deliveries[0]!.status).toBe('success');

        vi.unstubAllGlobals();
    });
});
