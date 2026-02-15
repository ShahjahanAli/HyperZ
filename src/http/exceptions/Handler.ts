// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Global Exception Handler
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { HttpException } from './HttpException.js';
import { Logger } from '../../logging/Logger.js';

export class ExceptionHandler {
    /**
     * Express error handling middleware.
     * Mount as the LAST middleware in the pipeline.
     */
    static handle() {
        return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
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
