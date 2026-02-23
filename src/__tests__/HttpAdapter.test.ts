// ──────────────────────────────────────────────────────────────
// HyperZ Framework — HTTP Adapter Tests
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, afterEach } from 'vitest';
import { ExpressAdapter } from '../http/adapters/ExpressAdapter.js';
import { createAdapter } from '../http/adapters/index.js';
import type { HyperZRequest, HyperZResponse } from '../http/adapters/HttpAdapter.js';

describe('ExpressAdapter', () => {
    let adapter: ExpressAdapter;

    afterEach(async () => {
        if (adapter) await adapter.close();
    });

    it('has name "express"', () => {
        adapter = new ExpressAdapter();
        expect(adapter.name).toBe('express');
    });

    it('returns native Express app', () => {
        adapter = new ExpressAdapter();
        const nativeApp = adapter.getNativeApp();
        expect(nativeApp).toBeDefined();
        expect(typeof (nativeApp as unknown as Record<string, unknown>).use).toBe('function');
    });

    it('getServer() returns null before listen', () => {
        adapter = new ExpressAdapter();
        expect(adapter.getServer()).toBeNull();
    });

    it('listens on a port and returns a server', async () => {
        adapter = new ExpressAdapter();
        adapter.enableJsonParsing();
        adapter.route('GET', '/test', (_req: HyperZRequest, res: HyperZResponse) => {
            res.json({ ok: true });
        });

        const server = await adapter.listen(0); // random port
        expect(server).toBeDefined();
        expect(adapter.getServer()).toBe(server);
    });

    it('registers routes via route()', async () => {
        adapter = new ExpressAdapter();
        adapter.enableJsonParsing();

        let captured: string | undefined;
        adapter.route('GET', '/hello', (req: HyperZRequest, res: HyperZResponse) => {
            captured = req.method;
            res.json({ greeting: 'hi' });
        });

        const server = await adapter.listen(0);
        const port = (server.address() as { port: number }).port;

        const response = await fetch(`http://127.0.0.1:${port}/hello`);
        const data = await response.json() as Record<string, unknown>;

        expect(response.status).toBe(200);
        expect(data.greeting).toBe('hi');
        expect(captured).toBe('GET');
    });

    it('use() registers middleware', async () => {
        adapter = new ExpressAdapter();
        adapter.enableJsonParsing();

        const log: string[] = [];
        adapter.use((_req, _res, next) => {
            log.push('middleware');
            next();
        });
        adapter.route('GET', '/mw', (_req: HyperZRequest, res: HyperZResponse) => {
            res.json({ ok: true });
        });

        const server = await adapter.listen(0);
        const port = (server.address() as { port: number }).port;

        await fetch(`http://127.0.0.1:${port}/mw`);
        expect(log).toContain('middleware');
    });

    it('close() shuts down the server', async () => {
        adapter = new ExpressAdapter();
        await adapter.listen(0);
        // Should resolve without error
        await expect(adapter.close()).resolves.toBeUndefined();
    });

    it('close() resolves when no server exists', async () => {
        adapter = new ExpressAdapter();
        await expect(adapter.close()).resolves.toBeUndefined();
    });

    it('useNative() accepts Express middleware', () => {
        adapter = new ExpressAdapter();
        // Should not throw
        adapter.useNative((_req: unknown, _res: unknown, next: Function) => next());
    });
});

describe('createAdapter', () => {
    it('creates ExpressAdapter by default', async () => {
        const ad = await createAdapter();
        expect(ad.name).toBe('express');
    });

    it('creates ExpressAdapter explicitly', async () => {
        const ad = await createAdapter('express');
        expect(ad.name).toBe('express');
    });

    it('throws for unknown adapter', async () => {
        await expect(createAdapter('unknown' as never)).rejects.toThrow('Unknown HTTP adapter');
    });
});
