// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Adapter Factory
// Creates the appropriate HTTP adapter based on configuration
// ──────────────────────────────────────────────────────────────

import type { HttpAdapter, AdapterType } from './HttpAdapter.js';
import { ExpressAdapter } from './ExpressAdapter.js';

/**
 * Create an HTTP adapter based on the configured driver.
 *
 * @param type - The adapter type: 'express' | 'fastify' | 'hono'
 * @returns A ready-to-use HttpAdapter instance
 *
 * @example
 * const adapter = await createAdapter('express');
 * adapter.route('GET', '/health', (req, res) => res.json({ ok: true }));
 * await adapter.listen(7700);
 */
export async function createAdapter(type: AdapterType = 'express'): Promise<HttpAdapter> {
    switch (type) {
        case 'express':
            return new ExpressAdapter();

        case 'fastify': {
            const { FastifyAdapter } = await import('./FastifyAdapter.js');
            const adapter = new FastifyAdapter();
            await adapter.init();
            return adapter;
        }

        case 'hono': {
            const { HonoAdapter } = await import('./HonoAdapter.js');
            const adapter = new HonoAdapter();
            await adapter.init();
            return adapter;
        }

        default:
            throw new Error(
                `[HyperZ] Unknown HTTP adapter: "${type}". ` +
                `Supported adapters: express, fastify, hono`
            );
    }
}

export { ExpressAdapter } from './ExpressAdapter.js';
export type { HttpAdapter, AdapterType, HyperZRequest, HyperZResponse, HandlerFn, MiddlewareFn } from './HttpAdapter.js';
