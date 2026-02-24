// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Fastify Adapter
// Optional adapter for Fastify (requires `fastify` package)
// ──────────────────────────────────────────────────────────────

import type { Server } from 'node:http';
import type { HttpAdapter, HandlerFn, MiddlewareFn, HyperZRequest, HyperZResponse } from './HttpAdapter.js';

/**
 * Dynamically import Fastify to avoid hard dependency.
 */
async function loadFastify(): Promise<typeof import('fastify')> {
    try {
        return await import('fastify');
    } catch {
        throw new Error(
            '[HyperZ] Fastify adapter requires the "fastify" package.\n' +
            'Install it: npm install fastify @fastify/formbody'
        );
    }
}

export class FastifyAdapter implements HttpAdapter {
    readonly name = 'fastify' as const;
    private fastifyInstance: Record<string, Function> | null = null;
    private server: Server | null = null;
    private _ready = false;

    /**
     * Initialize the Fastify instance. Must be called before using the adapter.
     */
    async init(): Promise<void> {
        const fastifyMod = await loadFastify();
        const Fastify = fastifyMod.default ?? fastifyMod;
        this.fastifyInstance = (Fastify as Function)({ logger: false }) as Record<string, Function>;
        this._ready = true;
    }

    private ensureReady(): void {
        if (!this._ready || !this.fastifyInstance) {
            throw new Error('[HyperZ] FastifyAdapter.init() must be called before use.');
        }
    }

    private wrapRequest(req: Record<string, unknown>): HyperZRequest {
        return {
            method: (req.method as string) ?? 'GET',
            url: (req.url as string) ?? '/',
            path: (req.url as string)?.split('?')[0] ?? '/',
            params: (req.params as Record<string, string>) ?? {},
            query: (req.query as Record<string, string>) ?? {},
            headers: (req.headers as Record<string, string | string[] | undefined>) ?? {},
            body: req.body,
            ip: (req.ip as string) ?? '',
            raw: req,
        };
    }

    private wrapResponse(reply: Record<string, Function>): HyperZResponse {
        const wrapped: HyperZResponse = {
            status(code: number) {
                reply.code(code);
                return wrapped;
            },
            json(data: unknown) {
                reply.send(data);
            },
            send(body: string | Buffer) {
                reply.send(body);
            },
            header(name: string, value: string) {
                reply.header(name, value);
                return wrapped;
            },
            redirect(url: string, statusCode = 302) {
                reply.redirect(statusCode, url);
            },
            raw: reply,
        };
        return wrapped;
    }

    use(middleware: MiddlewareFn): void {
        this.ensureReady();
        this.fastifyInstance!.addHook('onRequest', async (req: Record<string, unknown>, reply: Record<string, Function>) => {
            await new Promise<void>((resolve) => {
                middleware(this.wrapRequest(req), this.wrapResponse(reply), resolve);
            });
        });
    }

    useNative(middleware: unknown): void {
        this.ensureReady();
        // For Fastify, native middleware is registered via plugin or hook
        if (typeof middleware === 'function') {
            this.fastifyInstance!.register(middleware);
        }
    }

    route(method: string, path: string, ...handlers: HandlerFn[]): void {
        this.ensureReady();
        const fastifyMethod = method.toLowerCase();
        (this.fastifyInstance as Record<string, Function>)[fastifyMethod](
            path,
            async (req: Record<string, unknown>, reply: Record<string, Function>) => {
                const hReq = this.wrapRequest(req);
                const hRes = this.wrapResponse(reply);
                for (const handler of handlers) {
                    await new Promise<void>((resolve) => {
                        handler(hReq, hRes, resolve);
                    });
                }
            }
        );
    }

    getNativeApp(): unknown {
        this.ensureReady();
        return this.fastifyInstance;
    }

    async listen(port: number, callback?: () => void): Promise<Server> {
        this.ensureReady();
        await (this.fastifyInstance as Record<string, Function>).listen({ port, host: '0.0.0.0' });
        this.server = (this.fastifyInstance as Record<string, unknown>).server as Server;
        callback?.();
        return this.server;
    }

    enableJsonParsing(_options?: { limit?: string }): void {
        // Fastify has built-in JSON parsing, no-op
    }

    enableUrlEncodedParsing(_options?: { extended?: boolean; limit?: string }): void {
        this.ensureReady();
        // Requires @fastify/formbody
        import('@fastify/formbody').then((mod) => {
            this.fastifyInstance!.register(mod.default ?? mod);
        }).catch(() => {
            // Optional dependency
        });
    }

    mount(prefix: string, handler: unknown): void {
        this.ensureReady();
        this.fastifyInstance!.register(handler as Function, { prefix });
    }

    getServer(): Server | null {
        return this.server;
    }

    async close(): Promise<void> {
        if (this.fastifyInstance) {
            await (this.fastifyInstance as Record<string, Function>).close();
            this.server = null;
        }
    }
}
