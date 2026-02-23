// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Hono Adapter
// Optional adapter for Hono (requires `hono` and `@hono/node-server` packages)
// ──────────────────────────────────────────────────────────────

import type { Server } from 'node:http';
import type { HttpAdapter, HandlerFn, MiddlewareFn, HyperZRequest, HyperZResponse } from './HttpAdapter.js';

/**
 * Dynamically import Hono to avoid hard dependency.
 */
async function loadHono(): Promise<{ Hono: new () => Record<string, Function> }> {
    try {
        return await import('hono') as unknown as { Hono: new () => Record<string, Function> };
    } catch {
        throw new Error(
            '[HyperZ] Hono adapter requires the "hono" and "@hono/node-server" packages.\n' +
            'Install them: npm install hono @hono/node-server'
        );
    }
}

async function loadNodeServer(): Promise<{ serve: Function }> {
    try {
        return await import('@hono/node-server') as unknown as { serve: Function };
    } catch {
        throw new Error(
            '[HyperZ] Hono adapter requires "@hono/node-server".\n' +
            'Install it: npm install @hono/node-server'
        );
    }
}

export class HonoAdapter implements HttpAdapter {
    readonly name = 'hono' as const;
    private honoApp: Record<string, Function> | null = null;
    private server: Server | null = null;
    private _ready = false;

    /**
     * Initialize the Hono instance. Must be called before using the adapter.
     */
    async init(): Promise<void> {
        const { Hono } = await loadHono();
        this.honoApp = new Hono();
        this._ready = true;
    }

    private ensureReady(): void {
        if (!this._ready || !this.honoApp) {
            throw new Error('[HyperZ] HonoAdapter.init() must be called before use.');
        }
    }

    private wrapRequest(c: Record<string, unknown>): HyperZRequest {
        const req = c.req as Record<string, Function>;
        const url = new URL(req.url() as string, 'http://localhost');
        const query: Record<string, string> = {};
        url.searchParams.forEach((v, k) => { query[k] = v; });

        return {
            method: req.method() as string,
            url: req.url() as string,
            path: req.path() as string,
            params: (req.param() as Record<string, string>) ?? {},
            query,
            headers: Object.fromEntries(
                (req.raw as unknown as globalThis.Request)?.headers?.entries?.() ?? []
            ) as Record<string, string>,
            body: null, // Hono parses body lazily via c.req.json()
            ip: '',
            raw: c,
        };
    }

    private wrapResponse(c: Record<string, Function>): HyperZResponse {
        let statusCode = 200;
        const headers: Record<string, string> = {};

        const wrapped: HyperZResponse = {
            status(code: number) {
                statusCode = code;
                return wrapped;
            },
            json(data: unknown) {
                c.json(data, statusCode);
            },
            send(body: string | Buffer) {
                c.body(body, statusCode);
            },
            header(name: string, value: string) {
                headers[name] = value;
                c.header(name, value);
                return wrapped;
            },
            redirect(url: string, code = 302) {
                c.redirect(url, code);
            },
            raw: c,
        };
        return wrapped;
    }

    use(middleware: MiddlewareFn): void {
        this.ensureReady();
        this.honoApp!.use('*', async (c: Record<string, unknown>, next: Function) => {
            await new Promise<void>((resolve) => {
                middleware(this.wrapRequest(c), this.wrapResponse(c as Record<string, Function>), () => {
                    resolve();
                });
            });
            await next();
        });
    }

    useNative(middleware: unknown): void {
        this.ensureReady();
        if (typeof middleware === 'function') {
            this.honoApp!.use('*', middleware);
        }
    }

    route(method: string, path: string, ...handlers: HandlerFn[]): void {
        this.ensureReady();
        const honoMethod = method.toLowerCase();
        // Convert :param to Hono's :param style (they're the same)
        (this.honoApp as Record<string, Function>)[honoMethod](path, async (c: Record<string, unknown>) => {
            const hReq = this.wrapRequest(c);
            const hRes = this.wrapResponse(c as Record<string, Function>);
            for (const handler of handlers) {
                await new Promise<void>((resolve) => {
                    handler(hReq, hRes, resolve);
                });
            }
        });
    }

    getNativeApp(): unknown {
        this.ensureReady();
        return this.honoApp;
    }

    async listen(port: number, callback?: () => void): Promise<Server> {
        this.ensureReady();
        const { serve } = await loadNodeServer();
        return new Promise((resolve) => {
            this.server = serve({
                fetch: (this.honoApp as Record<string, unknown>).fetch,
                port,
            }, () => {
                callback?.();
                resolve(this.server!);
            }) as Server;
        });
    }

    enableJsonParsing(_options?: { limit?: string }): void {
        // Hono has built-in JSON parsing, no-op
    }

    enableUrlEncodedParsing(_options?: { extended?: boolean; limit?: string }): void {
        // Hono handles this natively, no-op
    }

    mount(prefix: string, handler: unknown): void {
        this.ensureReady();
        this.honoApp!.route(prefix, handler);
    }

    getServer(): Server | null {
        return this.server;
    }

    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) return resolve();
            this.server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}
