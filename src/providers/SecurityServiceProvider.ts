// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Security Service Provider
// ──────────────────────────────────────────────────────────────
//
// Wires all security middleware into the application boot lifecycle.
// Registered in app.ts — runs after AppServiceProvider (which sets
// up the Kernel and core Express middleware) and before RouteServiceProvider.
//
// What this provider does:
//   1. HTTPS enforcement (production only)
//   2. Trust proxy configuration
//   3. Request sanitization (XSS + prototype‐pollution protection)
//   4. CSRF protection (web routes, if enabled)
//   5. HashService configuration
//   6. TokenBlacklist store configuration
// ──────────────────────────────────────────────────────────────

import { ServiceProvider } from '../core/ServiceProvider.js';
import { sanitizeMiddleware } from '../http/middleware/SanitizeMiddleware.js';
import { httpsMiddleware } from '../http/middleware/HttpsMiddleware.js';
import { csrfMiddleware } from '../http/middleware/CsrfMiddleware.js';
import { HashService } from '../auth/HashService.js';
import { TokenBlacklist } from '../auth/TokenBlacklist.js';
import { Logger } from '../logging/Logger.js';
import { env } from '../support/helpers.js';

export class SecurityServiceProvider extends ServiceProvider {
    register(): void {
        // Register security services in the container for DI
        this.app.container.instance('hash', HashService);
        this.app.container.instance('tokenBlacklist', TokenBlacklist);
    }

    async boot(): Promise<void> {
        const express = this.app.express;

        // Load security config (fall back to sensible defaults)
        const securityConfig = this.app.config.get<Record<string, unknown>>('security', {});

        // ── 1. HTTPS Enforcement ────────────────────────────
        const httpsConfig = (securityConfig as Record<string, Record<string, unknown>>)?.https;
        if (httpsConfig?.enforce !== false) {
            express.use(httpsMiddleware({
                productionOnly: true,
                enforceIn: ['production'],
            }));
        }

        // ── 2. Trust Proxy ──────────────────────────────────
        const trustProxy = (httpsConfig?.trustProxy !== false);
        if (trustProxy && env('APP_ENV', 'development') === 'production') {
            express.set('trust proxy', 1);
        }

        // ── 3. Request Sanitization ─────────────────────────
        const sanitizeConfig = (securityConfig as Record<string, Record<string, unknown>>)?.sanitize;
        if (sanitizeConfig?.enabled !== false) {
            express.use(sanitizeMiddleware({
                body: (sanitizeConfig?.body as boolean) ?? true,
                query: (sanitizeConfig?.query as boolean) ?? true,
                params: (sanitizeConfig?.params as boolean) ?? true,
                except: (sanitizeConfig?.except as string[]) ?? [
                    'password',
                    'password_confirmation',
                    'current_password',
                ],
            }));
        }

        // ── 4. CSRF Protection ──────────────────────────────
        const csrfConfig = (securityConfig as Record<string, Record<string, unknown>>)?.csrf;
        if (csrfConfig?.enabled === true) {
            express.use(csrfMiddleware({
                cookieName: (csrfConfig?.cookieName as string) ?? '_csrf',
                headerName: (csrfConfig?.headerName as string) ?? 'x-csrf-token',
                excludePaths: (csrfConfig?.excludePaths as string[]) ?? ['/api'],
            }));
        }

        // ── 5. HashService Configuration ────────────────────
        const hashConfig = (securityConfig as Record<string, Record<string, Record<string, unknown>>>)?.hashing;
        if (hashConfig?.bcrypt?.rounds) {
            HashService.configure({
                rounds: hashConfig.bcrypt.rounds as number,
            });
        }

        Logger.info('[+] Security provider booted');
    }
}
