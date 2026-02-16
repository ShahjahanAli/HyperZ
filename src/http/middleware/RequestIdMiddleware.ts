import type { Request, Response, NextFunction } from 'express';
import { requestContext } from '../../core/Context.js';

export function requestIdMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
        // Use existing ID or generate new one
        const id = req.header('X-Request-ID') || (Math.random().toString(36).substring(2, 11));

        req.id = id;
        res.setHeader('X-Request-ID', id);

        // Wrap the rest of the request lifecycle in the context
        requestContext.run({ requestId: id }, () => {
            next();
        });
    };
}

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            id?: string;
        }
    }
}
