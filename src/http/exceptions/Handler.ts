// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Global Exception Handler
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { HttpException } from './HttpException.js';
import { Logger } from '../../logging/Logger.js';

export type ErrorReporter = (err: Error, req: Request) => void | Promise<void>;
export type ErrorRenderer = (err: Error, req: Request, res: Response) => void;

export class ExceptionHandler {
    /** Custom reporters (e.g. Sentry, Datadog) */
    private static reporters: ErrorReporter[] = [];

    /** Exception types to NOT report */
    private static dontReport: Set<string> = new Set([
        'ValidationException',
        'NotFoundException',
        'UnauthorizedException',
    ]);

    /** Custom error renderer override */
    private static customRenderer: ErrorRenderer | null = null;

    /**
     * Register a custom error reporter.
     * @example
     * ExceptionHandler.reportTo(async (err, req) => {
     *     await Sentry.captureException(err);
     * });
     */
    static reportTo(reporter: ErrorReporter): void {
        this.reporters.push(reporter);
    }

    /**
     * Set a custom error renderer to override the default JSON response.
     * @example
     * ExceptionHandler.renderWith((err, req, res) => {
     *     res.status(500).json({ error: err.message, requestId: req.headers['x-request-id'] });
     * });
     */
    static renderWith(renderer: ErrorRenderer): void {
        this.customRenderer = renderer;
    }

    /**
     * Add exception types that should NOT be reported.
     * Validation, 404, and 401 errors are ignored by default.
     */
    static ignore(...exceptionNames: string[]): void {
        for (const name of exceptionNames) {
            this.dontReport.add(name);
        }
    }

    /**
     * Determine if an error should be reported.
     */
    static shouldReport(err: Error): boolean {
        return !this.dontReport.has(err.name);
    }

    /**
     * Report an error to all registered reporters.
     */
    private static async report(err: Error, req: Request): Promise<void> {
        if (!this.shouldReport(err)) return;

        for (const reporter of this.reporters) {
            try {
                await reporter(err, req);
            } catch (reportErr: any) {
                Logger.error('Error reporter failed', { error: reportErr.message });
            }
        }
    }

    /**
     * Express error handling middleware.
     * Mount as the LAST middleware in the pipeline.
     */
    static handle() {
        return async (err: Error, req: Request, res: Response, _next: NextFunction): Promise<void> => {
            // Report to custom reporters
            await this.report(err, req);

            // Known HTTP exception
            if (err instanceof HttpException) {
                res.status(err.statusCode).json(err.toJSON());
                return;
            }

            // Log unknown errors
            Logger.error('Unhandled exception', {
                message: err.message,
                stack: err.stack,
                url: req.originalUrl,
                method: req.method,
            });

            // Use custom renderer if set
            if (this.customRenderer) {
                this.customRenderer(err, req, res);
                return;
            }

            const isDebug = process.env.APP_DEBUG === 'true';

            res.status(500).json({
                success: false,
                status: 500,
                message: isDebug ? err.message : 'Internal server error',
                ...(isDebug ? { stack: err.stack?.split('\n') } : {}),
            });
        };
    }

    /**
     * 404 catch-all — mount before the error handler.
     */
    static notFound() {
        return (req: Request, res: Response, _next: NextFunction): void => {
            res.status(404).json({
                success: false,
                status: 404,
                message: `Route ${req.method} ${req.originalUrl} not found`,
            });
        };
    }
}
