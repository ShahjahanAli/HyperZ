// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — CORS
// ──────────────────────────────────────────────────────────────

import cors from 'cors';
import type { RequestHandler } from 'express';

/**
 * CORS middleware with sensible defaults.
 */
export function corsMiddleware(options?: cors.CorsOptions): RequestHandler {
    return cors({
        origin: options?.origin ?? '*',
        methods: options?.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: options?.allowedHeaders ?? ['Content-Type', 'Authorization', 'X-Requested-With'],
        credentials: options?.credentials ?? true,
        maxAge: options?.maxAge ?? 86400,
        ...options,
    });
}
