// ──────────────────────────────────────────────────────────────
// HyperZ Config — Application
// ──────────────────────────────────────────────────────────────

import { env, envNumber, envBool } from '../src/support/helpers.js';

export default {
    name: env('APP_NAME', 'HyperZ'),
    env: env('APP_ENV', 'development'),
    port: envNumber('APP_PORT', 7700),
    debug: envBool('APP_DEBUG', true),
    key: env('APP_KEY', ''),
    url: env('APP_URL', 'http://localhost:3000'),
};
