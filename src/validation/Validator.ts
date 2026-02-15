// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Validation Engine (Zod-powered)
// ──────────────────────────────────────────────────────────────

import { z, type ZodObject, type ZodRawShape, type ZodSchema, type ZodTypeAny } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { ValidationException } from '../http/exceptions/HttpException.js';

/**
 * Extract field-level errors from a Zod error.
 */
function extractErrors(error: z.ZodError): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
        const field = issue.path.join('.') || '_root';
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
    }
    return errors;
}

/**
 * Validate request body against a Zod schema or shape.
 * Throws ValidationException with field-level errors on failure.
 *
 * @example
 * // Using a shape object:
 * router.post('/users', validate({
 *   name: z.string().min(3),
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * }), userController.store);
 *
 * // Using a full Zod schema:
 * const UserSchema = z.object({ name: z.string(), email: z.string().email() });
 * router.post('/users', validate(UserSchema), userController.store);
 */
export function validate<T extends ZodRawShape | ZodSchema>(schemaOrShape: T) {
    const schema = schemaOrShape instanceof z.ZodType
        ? schemaOrShape
        : z.object(schemaOrShape as ZodRawShape);

    const middleware = (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            throw new ValidationException(extractErrors(result.error));
        }

        // Replace body with parsed (type-safe) data
        req.body = result.data;
        next();
    };

    // Attach schema for OpenAPI generation
    (middleware as any).zodSchema = schema;
    (middleware as any).validationType = 'body';

    return middleware;
}

/**
 * Validate query params against a Zod schema or shape.
 */
export function validateQuery<T extends ZodRawShape | ZodSchema>(schemaOrShape: T) {
    const schema = schemaOrShape instanceof z.ZodType
        ? schemaOrShape
        : z.object(schemaOrShape as ZodRawShape);

    const middleware = (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            throw new ValidationException(extractErrors(result.error), 'Query validation failed');
        }

        (req as any).validatedQuery = result.data;
        next();
    };

    (middleware as any).zodSchema = schema;
    (middleware as any).validationType = 'query';

    return middleware;
}

/**
 * Validate route params against a Zod schema or shape.
 */
export function validateParams<T extends ZodRawShape | ZodSchema>(schemaOrShape: T) {
    const schema = schemaOrShape instanceof z.ZodType
        ? schemaOrShape
        : z.object(schemaOrShape as ZodRawShape);

    const middleware = (req: Request, _res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.params);

        if (!result.success) {
            throw new ValidationException(extractErrors(result.error), 'Parameter validation failed');
        }

        next();
    };

    (middleware as any).zodSchema = schema;
    (middleware as any).validationType = 'params';

    return middleware;
}

/**
 * Validate body, query, and params all at once.
 * @example
 * router.post('/users/:id/posts', validateAll({
 *   body: { title: z.string(), content: z.string() },
 *   params: { id: z.string().regex(/^\d+$/) },
 *   query: { include: z.string().optional() },
 * }), controller.store);
 */
export function validateAll(schemas: {
    body?: ZodRawShape | ZodSchema;
    query?: ZodRawShape | ZodSchema;
    params?: ZodRawShape | ZodSchema;
}) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const allErrors: Record<string, string[]> = {};

        // Validate body
        if (schemas.body) {
            const schema = schemas.body instanceof z.ZodType
                ? schemas.body
                : z.object(schemas.body as ZodRawShape);
            const result = schema.safeParse(req.body);
            if (!result.success) {
                const errors = extractErrors(result.error);
                for (const [key, msgs] of Object.entries(errors)) {
                    allErrors[`body.${key}`] = msgs;
                }
            } else {
                req.body = result.data;
            }
        }

        // Validate query
        if (schemas.query) {
            const schema = schemas.query instanceof z.ZodType
                ? schemas.query
                : z.object(schemas.query as ZodRawShape);
            const result = schema.safeParse(req.query);
            if (!result.success) {
                const errors = extractErrors(result.error);
                for (const [key, msgs] of Object.entries(errors)) {
                    allErrors[`query.${key}`] = msgs;
                }
            } else {
                (req as any).validatedQuery = result.data;
            }
        }

        // Validate params
        if (schemas.params) {
            const schema = schemas.params instanceof z.ZodType
                ? schemas.params
                : z.object(schemas.params as ZodRawShape);
            const result = schema.safeParse(req.params);
            if (!result.success) {
                const errors = extractErrors(result.error);
                for (const [key, msgs] of Object.entries(errors)) {
                    allErrors[`params.${key}`] = msgs;
                }
            }
        }

        if (Object.keys(allErrors).length > 0) {
            throw new ValidationException(allErrors, 'Validation failed');
        }

        next();
    };
}

// Re-export Zod for convenience
export { z } from 'zod';
