// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — Authentication
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../support/helpers.js';
import { UnauthorizedException } from '../exceptions/HttpException.js';

/**
 * Get the JWT secret, throwing at startup if not configured.
 */
function getJwtSecret(): string {
    const secret = env('JWT_SECRET');
    if (!secret && env('APP_ENV', 'development') === 'production') {
        throw new Error('[HyperZ] JWT_SECRET is not set. This is required in production.');
    }
    return secret || 'dev-only-insecure-key';
}

/**
 * JWT authentication middleware.
 * Verifies the Bearer token and attaches user to req.user.
 */
export function authMiddleware() {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No authentication token provided');
        }

        const token = authHeader.slice(7);
        const secret = getJwtSecret();

        try {
            const decoded = jwt.verify(token, secret);
            (req as any).user = decoded;
            next();
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    };
}

/**
 * Optional authentication middleware.
 * Sets req.user if a valid token is present, but does NOT block the request
 * if no token is provided. Useful for routes that work differently for
 * authenticated vs. anonymous users.
 */
export function optionalAuth() {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.slice(7);
        const secret = getJwtSecret();

        try {
            const decoded = jwt.verify(token, secret);
            (req as any).user = decoded;
        } catch {
            // Token invalid — continue without user
        }

        next();
    };
}
