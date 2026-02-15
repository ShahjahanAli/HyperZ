// ──────────────────────────────────────────────────────────────
// HyperZ Config — Cache
// ──────────────────────────────────────────────────────────────

import { env, envNumber } from '../src/support/helpers.js';

export default {
    driver: env('CACHE_DRIVER', 'memory'),

    redis: {
        host: env('REDIS_HOST', '127.0.0.1'),
        port: envNumber('REDIS_PORT', 6379),
        password: env('REDIS_PASSWORD', ''),
    },

    // Default TTL in seconds
    ttl: 3600,
};
