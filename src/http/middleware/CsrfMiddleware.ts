// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — CSRF Protection
// ──────────────────────────────────────────────────────────────
//
// Double-submit cookie pattern:
//   1. Safe requests (GET, HEAD, OPTIONS) receive a `_csrf` cookie.
//   2. State-changing requests (POST, PUT, PATCH, DELETE) must
//      echo the cookie value in the `X-CSRF-Token` header.
//
// Intended for web/session routes. API routes using Bearer tokens
// should be excluded via `excludePaths`.
//
// Usage:
//   import { csrfMiddleware } from '../../src/http/middleware/CsrfMiddleware.js';
//
//   // Apply to web routes only
//   app.use('/web', csrfMiddleware());
//
//   // With custom config
//   app.use(csrfMiddleware({ excludePaths: ['/api', '/webhooks'] }));
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';

// ── Options ─────────────────────────────────────────────────

export interface CsrfOptions {
    /** Cookie name (default: '_csrf') */
    cookieName: string;
    /** Header name to check (default: 'x-csrf-token') */
    headerName: string;
    /** Token byte length → will be hex-encoded (default: 32 → 64 hex chars) */
    tokenLength: number;
    /** Paths that bypass CSRF checks entirely */
    excludePaths: string[];
}

const defaults: CsrfOptions = {
    cookieName: '_csrf',
    headerName: 'x-csrf-token',
    tokenLength: 32,
    excludePaths: ['/api'],
};

/** HTTP methods that do NOT mutate state and are safe to skip. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// ── Middleware factory ───────────────────────────────────────

/**
 * Create a CSRF protection middleware.
 */
export function csrfMiddleware(options?: Partial<CsrfOptions>): RequestHandler {
    const config: CsrfOptions = { ...defaults, ...options };

    return (req: Request, res: Response, next: NextFunction): void => {
        // ── Skip excluded paths ─────────────────────────────
        if (config.excludePaths.some((p) => req.path.startsWith(p))) {
            next();
            return;
        }

        // ── Read or generate the CSRF token ─────────────────
        const existingToken = req.cookies?.[config.cookieName] as string | undefined;
        const token = existingToken ?? randomBytes(config.tokenLength).toString('hex');

        // Set the cookie if it doesn't exist yet
        if (!existingToken) {
            res.cookie(config.cookieName, token, {
                httpOnly: false,   // JS must read this to send as header
                sameSite: 'strict',
                secure: req.secure,
                path: '/',
            });
        }

        // ── Safe methods → allow through ────────────────────
        if (SAFE_METHODS.has(req.method)) {
            next();
            return;
        }

        // ── Validate: header must match cookie ──────────────
        const headerToken = req.headers[config.headerName] as string | undefined;

        if (!headerToken || !existingToken) {
            res.status(403).json({
                success: false,
                message: 'CSRF token mismatch. Include the token in the X-CSRF-Token header.',
            });
            return;
        }

        // Timing-safe comparison
        const headerBuf = Buffer.from(headerToken);
        const cookieBuf = Buffer.from(existingToken);

        if (headerBuf.length !== cookieBuf.length || !timingSafeEqual(headerBuf, cookieBuf)) {
            res.status(403).json({
                success: false,
                message: 'CSRF token mismatch.',
            });
            return;
        }

        next();
    };
}
