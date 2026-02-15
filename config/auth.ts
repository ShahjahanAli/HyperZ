// ──────────────────────────────────────────────────────────────
// HyperZ Config — Authentication
// ──────────────────────────────────────────────────────────────

import { env } from '../src/support/helpers.js';

export default {
    // Default guard
    defaultGuard: 'jwt',

    guards: {
        jwt: {
            driver: 'jwt',
            secret: env('JWT_SECRET', 'your-secret-key'),
            expiration: env('JWT_EXPIRATION', '7d'),
        },
        session: {
            driver: 'session',
        },
    },

    // Passwords
    passwords: {
        saltRounds: 10,
    },

    // User model table / collection
    userModel: 'User',
    userTable: 'users',
};
