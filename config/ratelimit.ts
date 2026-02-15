// ──────────────────────────────────────────────────────────────
// HyperZ Config — Rate Limiting
// ──────────────────────────────────────────────────────────────

import { env, envNumber, envBool } from '../src/support/helpers.js';

export default {
    /** Enable/disable rate limiting globally */
    enabled: envBool('RATE_LIMIT_ENABLED', true),

    /** Default global limit (requests per window) */
    global: {
        windowMs: envNumber('RATE_LIMIT_WINDOW_MS', 60 * 1000),     // 1 minute
        maxRequests: envNumber('RATE_LIMIT_MAX', 100),
    },

    /**
     * Named tiers for per-user / per-API-key throttling.
     * Usage in routes: middleware: ['throttle:pro']
     */
    tiers: {
        free: {
            windowMs: 60 * 1000,
            maxRequests: 60,
        },
        standard: {
            windowMs: 60 * 1000,
            maxRequests: 300,
        },
        pro: {
            windowMs: 60 * 1000,
            maxRequests: 1000,
        },
        enterprise: {
            windowMs: 60 * 1000,
            maxRequests: 10000,
        },
    },

    /** Header to check for API key */
    apiKeyHeader: env('RATE_LIMIT_API_KEY_HEADER', 'X-API-Key'),

    /** Include standard rate limit headers in responses */
    headers: true,

    /** Redis store config (uses app Redis connection if available) */
    store: env('RATE_LIMIT_STORE', 'memory'),    // 'memory' | 'redis'

    /** Message returned when rate limited */
    message: {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
    },

    /** Skip rate limiting for these paths */
    skip: ['/api/docs', '/api/health', '/api/playground'],
};
