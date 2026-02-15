// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — Helmet (Security Headers)
// ──────────────────────────────────────────────────────────────

import helmet from 'helmet';
import type { RequestHandler } from 'express';

/**
 * Security headers middleware via Helmet.
 */
export function helmetMiddleware(options?: Parameters<typeof helmet>[0]): RequestHandler {
    return helmet(options) as unknown as RequestHandler;
}
