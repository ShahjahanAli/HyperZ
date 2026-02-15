// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Validation Engine (Zod-powered)
// ──────────────────────────────────────────────────────────────

import { z, type ZodObject, type ZodRawShape } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { ValidationException } from '../http/exceptions/HttpException.js';

/**
 * Validate request body against a Zod schema.
 * Throws ValidationException with field-level errors on failure.
 *
 * @example
 * // In a route:
 * router.post('/users', validate({
 *   name: z.string().min(3),
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * }), userController.store);
 */
export function validate<T extends ZodRawShape>(shape: T) {
    const schema = z.object(shape);

    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors: Record<string, string[]> = {};
            for (const issue of result.error.issues) {
                const field = issue.path.join('.');
                if (!errors[field]) errors[field] = [];
                errors[field].push(issue.message);
            }
            throw new ValidationException(errors);
        }

        // Replace body with parsed (type-safe) data
        req.body = result.data;
        next();
    };
}

/**
 * Validate query params against a Zod schema.
 */
export function validateQuery<T extends ZodRawShape>(shape: T) {
    const schema = z.object(shape);

    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            const errors: Record<string, string[]> = {};
            for (const issue of result.error.issues) {
                const field = issue.path.join('.');
                if (!errors[field]) errors[field] = [];
                errors[field].push(issue.message);
            }
            throw new ValidationException(errors, 'Query validation failed');
        }

        (req as any).validatedQuery = result.data;
        next();
    };
}

/**
 * Validate route params against a Zod schema.
 */
export function validateParams<T extends ZodRawShape>(shape: T) {
    const schema = z.object(shape);

    return (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            const errors: Record<string, string[]> = {};
            for (const issue of result.error.issues) {
                const field = issue.path.join('.');
                if (!errors[field]) errors[field] = [];
                errors[field].push(issue.message);
            }
            throw new ValidationException(errors, 'Parameter validation failed');
        }

        next();
    };
}

// Re-export Zod for convenience
export { z } from 'zod';
