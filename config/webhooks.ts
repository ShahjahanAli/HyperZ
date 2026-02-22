// ──────────────────────────────────────────────────────────────
// HyperZ Config — Webhooks
// ──────────────────────────────────────────────────────────────

import { env, envNumber } from '../src/support/helpers.js';

export default {
    /** Secret used for signing outgoing webhooks (default). Individual endpoints can override. */
    secret: env('WEBHOOK_SECRET', ''),

    /** Max retry attempts for failed deliveries */
    maxRetries: envNumber('WEBHOOK_MAX_RETRIES', 3),

    /** Timeout per delivery attempt in ms */
    timeout: envNumber('WEBHOOK_TIMEOUT', 10000),

    /** Max number of delivery logs to keep in memory */
    maxDeliveryLog: envNumber('WEBHOOK_MAX_LOG', 1000),
};
