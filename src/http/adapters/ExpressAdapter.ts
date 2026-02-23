// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Express Adapter
// Default adapter, wraps Express.js 5
// ──────────────────────────────────────────────────────────────

import express, { type Express, type RequestHandler, type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import type { HttpAdapter, HandlerFn, MiddlewareFn, HyperZRequest, HyperZResponse } from './HttpAdapter.js';

/**
 * Map an Express Request to HyperZRequest.
 */
function wrapRequest(req: Request): HyperZRequest {
    return {
        method: req.method,
        url: req.url,
        path: req.path,
        params: req.params as Record<string, string>,
        query: req.query as Record<string, string>,
        headers: req.headers as Record<string, string | string[] | undefined>,
        body: req.body,
        ip: req.ip ?? req.socket.remoteAddress ?? '',
        raw: req,
    };
}

/**
 * Map an Express Response to HyperZResponse.
 */
function wrapResponse(res: Response): HyperZResponse {
    const wrapped: HyperZResponse = {
        status(code: number) {
            res.status(code);
            return wrapped;
        },
        json(data: unknown) {
            res.json(data);
        },
        send(body: string | Buffer) {
            res.send(body);
        },
        header(name: string, value: string) {
            res.setHeader(name, value);
            return wrapped;
        },
        redirect(url: string, statusCode = 302) {
            res.redirect(statusCode, url);
        },
        raw: res,
    };
    return wrapped;
}

/**
 * Convert a HyperZ HandlerFn to an Express RequestHandler.
 */
function toExpressHandler(fn: HandlerFn): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = fn(wrapRequest(req), wrapResponse(res), next);
        if (result && typeof (result as Promise<void>).catch === 'function') {
            (result as Promise<void>).catch(next);
        }
    };
}

export class ExpressAdapter implements HttpAdapter {
    readonly name = 'express' as const;
    private app: Express;
    private server: Server | null = null;

    constructor(existingApp?: Express) {
        this.app = existingApp ?? express();
    }

    use(middleware: MiddlewareFn): void {
        this.app.use(toExpressHandler(middleware));
    }

    useNative(middleware: unknown): void {
        this.app.use(middleware as RequestHandler);
    }

    route(method: string, path: string, ...handlers: HandlerFn[]): void {
        const expressMethod = method.toLowerCase();
        const expressHandlers = handlers.map(toExpressHandler);
        (this.app as unknown as Record<string, Function>)[expressMethod](path, ...expressHandlers);
    }

    getNativeApp(): Express {
        return this.app;
    }

    async listen(port: number, callback?: () => void): Promise<Server> {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                callback?.();
                resolve(this.server!);
            });
        });
    }

    enableJsonParsing(options?: { limit?: string }): void {
        this.app.use(express.json({ limit: options?.limit ?? '10mb' }));
    }

    enableUrlEncodedParsing(options?: { extended?: boolean; limit?: string }): void {
        this.app.use(express.urlencoded({
            extended: options?.extended ?? true,
            limit: options?.limit ?? '10mb',
        }));
    }

    mount(prefix: string, handler: unknown): void {
        this.app.use(prefix, handler as RequestHandler);
    }

    getServer(): Server | null {
        return this.server;
    }

    async close(): Promise<void> {
        if (!this.server) return;
        const server = this.server;
        return new Promise((resolve) => {
            // server.close() may throw "Server is not running" in Express 5
            // when no active connections exist
            try {
                server.close(() => resolve());
            } catch {
                resolve();
            }
        });
    }
}
