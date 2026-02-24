// ──────────────────────────────────────────────────────────────
// HyperZ Config — Security
// ──────────────────────────────────────────────────────────────

import { env, envBool } from '../src/support/helpers.js';

export default {
    /*
    |--------------------------------------------------------------------------
    | HTTPS Enforcement
    |--------------------------------------------------------------------------
    | When enabled, HTTP requests are redirected to HTTPS in production.
    | `trustProxy` should be true when running behind a load balancer / reverse proxy.
    */
    https: {
        enforce: envBool('SECURITY_HTTPS_ENFORCE', true),
        trustProxy: envBool('SECURITY_TRUST_PROXY', true),
    },

    /*
    |--------------------------------------------------------------------------
    | Request Sanitization
    |--------------------------------------------------------------------------
    | Recursively sanitizes string values in req.body, req.query, and req.params
    | to prevent XSS and prototype pollution attacks.
    |
    | Fields listed in `except` are skipped (e.g. password fields).
    */
    sanitize: {
        enabled: envBool('SECURITY_SANITIZE_ENABLED', true),
        body: true,
        query: true,
        params: true,
        except: ['password', 'password_confirmation', 'current_password'],
    },

    /*
    |--------------------------------------------------------------------------
    | CSRF Protection
    |--------------------------------------------------------------------------
    | Double-submit cookie pattern. A `_csrf` cookie is set on safe requests
    | and must be echoed back in the `X-CSRF-Token` header on state-changing
    | requests (POST, PUT, PATCH, DELETE).
    |
    | Only applies to web/session routes — API routes using Bearer tokens
    | should be excluded via `excludePaths`.
    */
    csrf: {
        enabled: envBool('SECURITY_CSRF_ENABLED', false),
        cookieName: '_csrf',
        headerName: 'x-csrf-token',
        excludePaths: ['/api'],
    },

    /*
    |--------------------------------------------------------------------------
    | Hashing
    |--------------------------------------------------------------------------
    | Configuration for the HashService password hashing facade.
    | Uses bcryptjs (already a project dependency).
    */
    hashing: {
        driver: 'bcrypt' as const,
        bcrypt: {
            rounds: 12,
        },
    },

    /*
    |--------------------------------------------------------------------------
    | Encryption
    |--------------------------------------------------------------------------
    | Uses APP_KEY from .env for AES-256-GCM encryption.
    | Run `npx hyperz key:generate` to create a key.
    */
    encryption: {
        algorithm: 'aes-256-gcm' as const,
        key: env('APP_KEY', ''),
    },

    /*
    |--------------------------------------------------------------------------
    | Signed URLs
    |--------------------------------------------------------------------------
    | HMAC-SHA256 signed URLs for tamper-proof links (file downloads, etc.).
    | Uses APP_KEY as the signing secret.
    */
    signedUrls: {
        secret: env('APP_KEY', ''),
    },

    /*
    |--------------------------------------------------------------------------
    | Token Blacklist
    |--------------------------------------------------------------------------
    | Store for revoked JWT tokens. Supports 'memory' for single-process
    | and 'redis' for multi-process deployments.
    */
    tokenBlacklist: {
        driver: env('TOKEN_BLACKLIST_DRIVER', 'memory') as 'memory' | 'redis',
    },
};
