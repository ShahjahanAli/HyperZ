// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — Request Sanitization
// ──────────────────────────────────────────────────────────────
//
// Recursively sanitizes string values in req.body, req.query,
// and req.params to prevent XSS and prototype-pollution attacks.
//
// Usage:
//   import { sanitizeMiddleware } from '../../src/http/middleware/SanitizeMiddleware.js';
//
//   // Global (via SecurityServiceProvider)
//   app.use(sanitizeMiddleware());
//
//   // Per-route (with raw HTML exception)
//   app.post('/articles', sanitizeMiddleware({ except: ['body_html'] }), handler);
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ── Internal helpers ────────────────────────────────────────

/** Keys that must NEVER appear on a user-supplied object. */
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Encode dangerous characters that could form XSS vectors.
 */
function encodeHtmlEntities(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\0/g, '');        // strip null bytes
}

/**
 * Recursively sanitize a value.
 */
function sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
        // Strip HTML tags first, then encode remaining entities
        const stripped = value.replace(/<[^>]*>/g, '');
        return encodeHtmlEntities(stripped);
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (value !== null && typeof value === 'object') {
        return sanitizeObject(value as Record<string, unknown>);
    }

    return value;
}

/**
 * Sanitize all keys and values of an object.
 * Blocks prototype-pollution keys.
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(obj)) {
        if (BLOCKED_KEYS.has(key)) continue;
        result[key] = sanitizeValue(val);
    }

    return result;
}

// ── Options ─────────────────────────────────────────────────

export interface SanitizeOptions {
    /** Sanitize req.body (default: true) */
    body: boolean;
    /** Sanitize req.query (default: true) */
    query: boolean;
    /** Sanitize req.params (default: true) */
    params: boolean;
    /** Field names to skip (e.g. 'password', 'html_content') */
    except: string[];
}

const defaults: SanitizeOptions = {
    body: true,
    query: true,
    params: true,
    except: ['password', 'password_confirmation', 'current_password'],
};

// ── Middleware factory ───────────────────────────────────────

/**
 * Create a sanitization middleware with the given options.
 */
export function sanitizeMiddleware(options?: Partial<SanitizeOptions>): RequestHandler {
    const config: SanitizeOptions = { ...defaults, ...options };

    return (req: Request, _res: Response, next: NextFunction): void => {
        // ── Body ────────────────────────────────────────────
        if (config.body && req.body && typeof req.body === 'object') {
            const original = req.body as Record<string, unknown>;
            const sanitized = sanitizeObject(original);

            // Restore excluded fields with their original unsanitized values
            for (const field of config.except) {
                if (field in original) {
                    sanitized[field] = original[field];
                }
            }

            req.body = sanitized;
        }

        // ── Query ───────────────────────────────────────────
        if (config.query && req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(
                req.query as Record<string, unknown>,
            ) as typeof req.query;
        }

        // ── Params ──────────────────────────────────────────
        if (config.params && req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params) as typeof req.params;
        }

        next();
    };
}
