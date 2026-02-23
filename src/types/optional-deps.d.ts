// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Ambient Type Declarations
//
// Declares optional dependency modules that may not be installed.
// This prevents TypeScript "Cannot find module" compile errors
// while still allowing dynamic imports at runtime.
// ──────────────────────────────────────────────────────────────

// ── HTTP Adapters (optional) ─────────────────────────────────

declare module 'fastify' {
    const fastify: unknown;
    export default fastify;
    export type FastifyInstance = Record<string, unknown>;
    export type FastifyRequest = Record<string, unknown>;
    export type FastifyReply = Record<string, unknown>;
}

declare module '@fastify/formbody' {
    const plugin: unknown;
    export default plugin;
}

declare module 'hono' {
    export class Hono {
        use(...args: unknown[]): unknown;
        all(...args: unknown[]): unknown;
        fetch(...args: unknown[]): unknown;
    }

    export class Context {
        req: unknown;
        json(data: unknown, status?: number): Response;
        text(data: string, status?: number): Response;
        body(data: unknown, status?: number): Response;
        header(name: string, value: string): void;
        status(code: number): void;
    }
}

declare module '@hono/node-server' {
    export function serve(options: { fetch: unknown; port: number }): unknown;
}

// ── Drizzle ORM (optional) ──────────────────────────────────

declare module 'drizzle-orm/better-sqlite3' {
    export function drizzle(client: unknown): unknown;
}

declare module 'drizzle-orm/mysql2' {
    export function drizzle(client: unknown): unknown;
}

declare module 'drizzle-orm/node-postgres' {
    export function drizzle(client: unknown): unknown;
}

declare module 'better-sqlite3' {
    class Database {
        constructor(filename: string);
        close(): void;
    }
    export default Database;
}

declare module 'pg' {
    export class Pool {
        constructor(config: Record<string, unknown>);
        end(): Promise<void>;
        query(text: string, values?: unknown[]): Promise<unknown>;
    }
    export class Client {
        constructor(config: Record<string, unknown>);
        connect(): Promise<void>;
        end(): Promise<void>;
        query(text: string, values?: unknown[]): Promise<unknown>;
    }
}
