// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Request Helpers
// ──────────────────────────────────────────────────────────────

import type { Request } from 'express';

/**
 * Extended request helpers — use as standalone functions
 * that accept a req object. These augment the Express Request.
 */
export class HyperZRequest {
    constructor(private req: Request) { }

    /**
     * Get an input value from body, query, or params (in that order).
     */
    input<T = any>(key: string, defaultValue?: T): T {
        return (
            (this.req.body as any)?.[key] ??
            (this.req.query as any)?.[key] ??
            (this.req.params as any)?.[key] ??
            defaultValue
        ) as T;
    }

    /**
     * Get all input data merged from body, query, and params.
     */
    all(): Record<string, any> {
        return {
            ...this.req.params,
            ...(this.req.query as any),
            ...(this.req.body as any),
        };
    }

    /**
     * Get only specified keys.
     */
    only(...keys: string[]): Record<string, any> {
        const all = this.all();
        const result: Record<string, any> = {};
        for (const key of keys) {
            if (key in all) result[key] = all[key];
        }
        return result;
    }

    /**
     * Get all input except specified keys.
     */
    except(...keys: string[]): Record<string, any> {
        const all = this.all();
        const result: Record<string, any> = {};
        for (const key of Object.keys(all)) {
            if (!keys.includes(key)) result[key] = all[key];
        }
        return result;
    }

    /**
     * Check if a key exists in input.
     */
    has(key: string): boolean {
        return this.input(key) !== undefined;
    }

    /**
     * Check if input key has a non-empty value.
     */
    filled(key: string): boolean {
        const val = this.input(key);
        return val !== undefined && val !== null && val !== '';
    }

    /**
     * Get bearer token from Authorization header.
     */
    bearerToken(): string | null {
        const auth = this.req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) return null;
        return auth.slice(7);
    }

    /**
     * Get the authenticated user (set by auth middleware).
     */
    user<T = any>(): T | null {
        return (this.req as any).user ?? null;
    }

    /**
     * Get client IP.
     */
    ip(): string {
        return this.req.ip ?? this.req.socket.remoteAddress ?? '';
    }

    /**
     * Check if request is JSON.
     */
    isJson(): boolean {
        const contentType = this.req.headers['content-type'] ?? '';
        return contentType.includes('application/json');
    }

    /**
     * Get the underlying Express request.
     */
    raw(): Request {
        return this.req;
    }
}

/**
 * Helper to wrap Express request with HyperZ helpers.
 */
export function hyperRequest(req: Request): HyperZRequest {
    return new HyperZRequest(req);
}
