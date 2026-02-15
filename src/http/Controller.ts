// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Base Controller
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';

export abstract class Controller {
    /**
     * Send a success JSON response.
     */
    protected success(res: Response, data: any, message = 'Success', statusCode = 200): void {
        res.status(statusCode).json({
            success: true,
            status: statusCode,
            message,
            data,
        });
    }

    /**
     * Send a created response (201).
     */
    protected created(res: Response, data: any, message = 'Resource created'): void {
        this.success(res, data, message, 201);
    }

    /**
     * Send a no content response (204).
     */
    protected noContent(res: Response): void {
        res.status(204).send();
    }

    /**
     * Send a paginated response.
     */
    protected paginate(
        res: Response,
        data: any[],
        total: number,
        page: number,
        perPage: number,
        message = 'Success'
    ): void {
        res.status(200).json({
            success: true,
            status: 200,
            message,
            data,
            pagination: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
                hasNextPage: page * perPage < total,
                hasPrevPage: page > 1,
            },
        });
    }

    /**
     * Send an error response.
     */
    protected error(res: Response, message: string, statusCode = 400): void {
        res.status(statusCode).json({
            success: false,
            status: statusCode,
            message,
        });
    }
}
