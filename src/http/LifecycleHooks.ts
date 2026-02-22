// ──────────────────────────────────────────────────────────────
// HyperZ Framework — HTTP Lifecycle Hooks
// ──────────────────────────────────────────────────────────────
//
// Global request/response lifecycle hooks that run beyond
// normal middleware. Useful for telemetry, audit logging,
// request transformation, and response modification.
//
// Hook order:
//   onRequest  → middleware → handler → onResponse → onFinish
//                                      onError (if thrown)
//
// Usage:
//   import { LifecycleHooks } from '../../src/http/LifecycleHooks.js';
//
//   LifecycleHooks.onRequest((req) => { req.startedAt = Date.now() });
//   LifecycleHooks.onResponse((req, res) => { ... });
//   LifecycleHooks.onError((err, req, res) => { ... });
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';

// ── Types ───────────────────────────────────────────────────

export type RequestHook = (req: Request, res: Response) => void | Promise<void>;
export type ResponseHook = (req: Request, res: Response) => void | Promise<void>;
export type ErrorHook = (err: Error, req: Request, res: Response) => void | Promise<void>;
export type FinishHook = (req: Request, res: Response, duration: number) => void | Promise<void>;

// ── Hook Registry ───────────────────────────────────────────

export class LifecycleHooks {
    private static requestHooks: RequestHook[] = [];
    private static responseHooks: ResponseHook[] = [];
    private static errorHooks: ErrorHook[] = [];
    private static finishHooks: FinishHook[] = [];

    // ── Registration ────────────────────────────────────────

    /**
     * Register a hook that runs at the START of every request,
     * before any middleware or route handler.
     */
    static onRequest(hook: RequestHook): void {
        this.requestHooks.push(hook);
    }

    /**
     * Register a hook that runs after the route handler has
     * written a response but BEFORE the response is flushed.
     */
    static onResponse(hook: ResponseHook): void {
        this.responseHooks.push(hook);
    }

    /**
     * Register a hook that runs when an unhandled error occurs.
     * Runs BEFORE the global error handler.
     */
    static onError(hook: ErrorHook): void {
        this.errorHooks.push(hook);
    }

    /**
     * Register a hook that runs when the response finishes
     * (the `finish` event). Receives the request duration in ms.
     */
    static onFinish(hook: FinishHook): void {
        this.finishHooks.push(hook);
    }

    // ── Middleware factories ─────────────────────────────────

    /**
     * Returns an Express middleware that fires `onRequest` hooks
     * and sets up `onResponse` / `onFinish` listeners.
     *
     * Register this EARLY in the middleware stack (before routes).
     */
    static middleware(): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const startTime = Date.now();

            // ── Fire onRequest hooks ────────────────────────
            try {
                for (const hook of this.requestHooks) {
                    await hook(req, res);
                }
            } catch (err) {
                next(err);
                return;
            }

            // ── Set up onFinish hooks (fires when response is fully sent) ──
            if (this.finishHooks.length > 0 || this.responseHooks.length > 0) {
                res.on('finish', async () => {
                    const duration = Date.now() - startTime;

                    // Fire onResponse hooks
                    for (const hook of this.responseHooks) {
                        try { await hook(req, res); } catch { /* swallow */ }
                    }

                    // Fire onFinish hooks
                    for (const hook of this.finishHooks) {
                        try { await hook(req, res, duration); } catch { /* swallow */ }
                    }
                });
            }

            next();
        };
    }

    /**
     * Returns an Express error-handling middleware that fires
     * `onError` hooks before passing the error through.
     *
     * Register this AFTER routes but BEFORE the global error handler.
     */
    static errorMiddleware(): ErrorRequestHandler {
        return async (err: Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
            for (const hook of this.errorHooks) {
                try { await hook(err, req, res); } catch { /* swallow */ }
            }
            next(err);
        };
    }

    // ── Admin / Reset ───────────────────────────────────────

    /**
     * Clear all registered hooks (useful for testing).
     */
    static clear(): void {
        this.requestHooks = [];
        this.responseHooks = [];
        this.errorHooks = [];
        this.finishHooks = [];
    }

    /**
     * Get hook counts for monitoring/admin dashboard.
     */
    static stats(): Record<string, number> {
        return {
            onRequest: this.requestHooks.length,
            onResponse: this.responseHooks.length,
            onError: this.errorHooks.length,
            onFinish: this.finishHooks.length,
        };
    }
}
