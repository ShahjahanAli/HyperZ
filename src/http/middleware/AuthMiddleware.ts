// ──────────────────────────────────────────────────────────────
// HyperZ Middleware — Authentication
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../support/helpers.js';
import { UnauthorizedException } from '../exceptions/HttpException.js';

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
        const secret = env('JWT_SECRET', 'your-secret-key');

        try {
            const decoded = jwt.verify(token, secret);
            (req as any).user = decoded;
            next();
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    };
}
