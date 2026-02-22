// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — HTTPS Enforcement
// ──────────────────────────────────────────────────────────────
//
// Redirects HTTP → HTTPS in production environments.
// Respects the X-Forwarded-Proto header when behind a load balancer.
//
// Usage:
//   import { httpsMiddleware } from '../../src/http/middleware/HttpsMiddleware.js';
//   app.use(httpsMiddleware());
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { env } from '../../support/helpers.js';

export interface HttpsOptions {
    /** Only enforce in production (default: true) */
    productionOnly: boolean;
    /** Custom environments to enforce in (default: ['production']) */
    enforceIn: string[];
}

const defaults: HttpsOptions = {
    productionOnly: true,
    enforceIn: ['production'],
};

/**
 * Create HTTPS enforcement middleware.
 */
export function httpsMiddleware(options?: Partial<HttpsOptions>): RequestHandler {
    const config: HttpsOptions = { ...defaults, ...options };

    return (req: Request, res: Response, next: NextFunction): void => {
        const currentEnv = env('APP_ENV', 'development');

        // Skip enforcement outside target environments
        if (config.productionOnly && !config.enforceIn.includes(currentEnv)) {
            next();
            return;
        }

        // Check protocol — trust X-Forwarded-Proto behind proxies
        const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol;

        if (proto !== 'https') {
            const host = req.headers.host ?? 'localhost';
            res.redirect(301, `https://${host}${req.originalUrl}`);
            return;
        }

        next();
    };
}
