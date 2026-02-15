// ──────────────────────────────────────────────────────────────
// HyperZ Config — Queue
// ──────────────────────────────────────────────────────────────

import { env, envNumber } from '../src/support/helpers.js';

export default {
    driver: env('QUEUE_DRIVER', 'sync'),

    redis: {
        host: env('REDIS_HOST', '127.0.0.1'),
        port: envNumber('REDIS_PORT', 6379),
        password: env('REDIS_PASSWORD', ''),
    },

    defaultQueue: 'default',
};
