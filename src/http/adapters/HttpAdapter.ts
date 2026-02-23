// ──────────────────────────────────────────────────────────────
// HyperZ Framework — HTTP Adapter Interface
// Abstracts away the underlying HTTP framework (Express/Fastify/Hono)
// ──────────────────────────────────────────────────────────────

import type { IncomingMessage, ServerResponse, Server } from 'node:http';

/**
 * Normalized request object that adapters map to.
 */
export interface HyperZRequest {
    method: string;
    url: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, string>;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
    ip: string;
    raw: unknown; // Original framework request
}

/**
 * Normalized response object that adapters map to.
 */
export interface HyperZResponse {
    status(code: number): HyperZResponse;
    json(data: unknown): void;
    send(body: string | Buffer): void;
    header(name: string, value: string): HyperZResponse;
    redirect(url: string, statusCode?: number): void;
    raw: unknown; // Original framework response
}

/**
 * Handler function signature.
 */
export type HandlerFn = (req: HyperZRequest, res: HyperZResponse, next: () => void) => void | Promise<void>;

/**
 * Middleware function signature.
 */
export type MiddlewareFn = HandlerFn;

/**
 * Route definition for the adapter.
 */
export interface AdapterRoute {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
    path: string;
    handlers: HandlerFn[];
}

/**
 * HTTP Adapter interface that any framework adapter must implement.
 *
 * This allows HyperZ to swap between Express, Fastify, and Hono
 * while keeping the rest of the framework unchanged.
 */
export interface HttpAdapter {
    /** Adapter name (e.g. 'express', 'fastify', 'hono') */
    readonly name: string;

    /** Register global middleware */
    use(middleware: MiddlewareFn): void;

    /** Register native middleware (framework-specific, for backward compat) */
    useNative(middleware: unknown): void;

    /** Register a route */
    route(method: string, path: string, ...handlers: HandlerFn[]): void;

    /** Get the underlying native app (Express app, Fastify instance, Hono app) */
    getNativeApp(): unknown;

    /** Start listening on a port. Returns the HTTP server. */
    listen(port: number, callback?: () => void): Promise<Server>;

    /** Parse JSON bodies */
    enableJsonParsing(options?: { limit?: string }): void;

    /** Parse URL-encoded bodies */
    enableUrlEncodedParsing(options?: { extended?: boolean; limit?: string }): void;

    /** Mount a sub-router or handler at a prefix */
    mount(prefix: string, handler: unknown): void;

    /** Get the raw HTTP server (if started) */
    getServer(): Server | null;

    /** Close the server */
    close(): Promise<void>;
}

/**
 * Supported HTTP adapters.
 */
export type AdapterType = 'express' | 'fastify' | 'hono';
