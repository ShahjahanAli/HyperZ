// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — Rate Limiting
// ──────────────────────────────────────────────────────────────

import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

interface RateLimitOptions {
    windowMs?: number;   // Time window in ms (default: 15 min)
    max?: number;        // Max requests per window (default: 100)
    message?: string;
}

/**
 * Rate limiter middleware.
 */
export function rateLimitMiddleware(options?: RateLimitOptions): RequestHandler {
    return rateLimit({
        windowMs: options?.windowMs ?? 15 * 60 * 1000,
        max: options?.max ?? 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            status: 429,
            message: options?.message ?? 'Too many requests, please try again later',
        },
    }) as unknown as RequestHandler;
}
