import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid'; // I'll use my own helper if uuid isn't there, but let's see

export function requestIdMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
        // Use existing ID or generate new one
        const id = req.header('X-Request-ID') || (Math.random().toString(36).substring(2, 11));

        req.id = id;
        res.setHeader('X-Request-ID', id);

        next();
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
