// ──────────────────────────────────────────────────────────────
// HyperZ Config — Mail
// ──────────────────────────────────────────────────────────────

import { env, envNumber } from '../src/support/helpers.js';

export default {
    driver: env('MAIL_DRIVER', 'smtp'),

    smtp: {
        host: env('MAIL_HOST', 'smtp.mailtrap.io'),
        port: envNumber('MAIL_PORT', 587),
        auth: {
            user: env('MAIL_USER', ''),
            pass: env('MAIL_PASSWORD', ''),
        },
    },

    from: {
        name: env('MAIL_FROM_NAME', 'HyperZ'),
        address: env('MAIL_FROM_ADDRESS', 'noreply@hyperz.dev'),
    },
};
