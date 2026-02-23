// ──────────────────────────────────────────────────────────────
// HyperZ Config — Application
// ──────────────────────────────────────────────────────────────

import { env, envNumber, envBool } from '../src/support/helpers.js';

export default {
    name: env('APP_NAME', 'HyperZ'),
    env: env('APP_ENV', 'development'),
    port: envNumber('APP_PORT', 3000),
    debug: envBool('APP_DEBUG', true),
    key: env('APP_KEY', ''),
    url: env('APP_URL', 'http://localhost:3000'),

    /** HTTP adapter: 'express' | 'fastify' | 'hono' */
    adapter: env('HTTP_ADAPTER', 'express') as 'express' | 'fastify' | 'hono',

    /** ORM driver: 'typeorm' | 'drizzle' */
    orm: env('ORM_DRIVER', 'typeorm') as 'typeorm' | 'drizzle',
};
