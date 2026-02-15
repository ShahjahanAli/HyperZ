// ──────────────────────────────────────────────────────────────
// HyperZ Framework — RBAC Role Middleware
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';
import { ForbiddenException } from '../../http/exceptions/HttpException.js';

/**
 * Middleware that checks if the authenticated user has
 * one of the required roles.
 *
 * @example
 * router.get('/admin', authMiddleware(), roleMiddleware('admin', 'super-admin'), handler);
 */
export function roleMiddleware(...roles: string[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user) {
            throw new ForbiddenException('No authenticated user');
        }

        const userRole = user.role ?? user.roles ?? [];
        const userRoles = Array.isArray(userRole) ? userRole : [userRole];

        const hasRole = roles.some(role => userRoles.includes(role));
        if (!hasRole) {
            throw new ForbiddenException(
                `Required role: ${roles.join(' or ')}. Your role: ${userRoles.join(', ')}`
            );
        }

        next();
    };
}

/**
 * Middleware that checks if the authenticated user has
 * one of the required permissions.
 */
export function permissionMiddleware(...permissions: string[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user) {
            throw new ForbiddenException('No authenticated user');
        }

        const userPerms: string[] = user.permissions ?? [];
        const hasPermission = permissions.some(perm => userPerms.includes(perm));

        if (!hasPermission) {
            throw new ForbiddenException(
                `Required permission: ${permissions.join(' or ')}`
            );
        }

        next();
    };
}
