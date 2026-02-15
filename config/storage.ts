// ──────────────────────────────────────────────────────────────
// HyperZ Config — Storage
// ──────────────────────────────────────────────────────────────

import { env } from '../src/support/helpers.js';

export default {
    defaultDisk: env('STORAGE_DISK', 'local'),

    disks: {
        local: {
            driver: 'local',
            root: './storage/uploads',
        },
        s3: {
            driver: 's3',
            bucket: env('AWS_BUCKET', ''),
            region: env('AWS_REGION', 'us-east-1'),
            accessKeyId: env('AWS_ACCESS_KEY_ID', ''),
            secretAccessKey: env('AWS_SECRET_ACCESS_KEY', ''),
        },
    },
};
