// ──────────────────────────────────────────────────────────────
// HyperZ — Rate Limit Manager
//
// Provides per-user, per-API-key, and global rate limiting using
// a sliding-window counter stored in memory or Redis.
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';

interface WindowEntry {
    count: number;
    resetAt: number;
}

interface RateLimitTier {
    windowMs: number;
    maxRequests: number;
}

/**
 * In-memory sliding-window rate limit store.
 * Key → { count, resetAt }
 */
const store = new Map<string, WindowEntry>();

// Periodic cleanup of expired entries
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
    }
}, 60_000);

/**
 * Check and increment rate limit for a key.
 * Returns { allowed, remaining, resetAt, limit }.
 */
function checkLimit(key: string, tier: RateLimitTier): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        // New window
        entry = { count: 1, resetAt: now + tier.windowMs };
        store.set(key, entry);
        return { allowed: true, remaining: tier.maxRequests - 1, resetAt: entry.resetAt, limit: tier.maxRequests };
    }

    entry.count++;
    store.set(key, entry);
    const remaining = Math.max(0, tier.maxRequests - entry.count);
    return { allowed: entry.count <= tier.maxRequests, remaining, resetAt: entry.resetAt, limit: tier.maxRequests };
}

/**
 * Resolve the rate limit key from the request.
 * Priority: API key header → JWT user ID → IP address.
 */
function resolveKey(req: Request, config: any): { key: string; source: string } {
    // Check for API key
    const apiKeyHeader = config.apiKeyHeader || 'X-API-Key';
    const apiKey = req.headers[apiKeyHeader.toLowerCase()] as string;
    if (apiKey) return { key: `apikey:${apiKey}`, source: 'apikey' };

    // Check for authenticated user (JWT)
    const user = (req as any).user;
    if (user?.id) return { key: `user:${user.id}`, source: 'user' };

    // Fallback to IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return { key: `ip:${ip}`, source: 'ip' };
}

/**
 * Create global rate limit middleware.
 */
export function createGlobalRateLimiter(config: any): RequestHandler {
    if (!config.enabled) return (_req, _res, next) => next();

    const tier: RateLimitTier = config.global;
    const skipPaths: string[] = config.skip || [];

    return (req: Request, res: Response, next: NextFunction) => {
        // Skip certain paths
        if (skipPaths.some((p: string) => req.path.startsWith(p))) return next();

        const { key } = resolveKey(req, config);
        const result = checkLimit(key, tier);

        // Set standard rate limit headers
        if (config.headers !== false) {
            res.setHeader('X-RateLimit-Limit', result.limit);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));
        }

        if (!result.allowed) {
            res.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
            return res.status(429).json(config.message || { error: 'Too Many Requests' });
        }

        next();
    };
}

/**
 * Create a tier-specific rate limit middleware.
 * Usage: router.use(createTierRateLimiter(config, 'pro'))
 */
export function createTierRateLimiter(config: any, tierName: string): RequestHandler {
    const tier: RateLimitTier = config.tiers?.[tierName] || config.global;

    return (req: Request, res: Response, next: NextFunction) => {
        const { key } = resolveKey(req, config);
        const tierKey = `${key}:${tierName}`;
        const result = checkLimit(tierKey, tier);

        if (config.headers !== false) {
            res.setHeader('X-RateLimit-Limit', result.limit);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));
            res.setHeader('X-RateLimit-Tier', tierName);
        }

        if (!result.allowed) {
            res.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000));
            return res.status(429).json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded for tier "${tierName}". Please upgrade or try again later.`,
                tier: tierName,
                retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
            });
        }

        next();
    };
}

/**
 * Get current rate limit stats for admin dashboard.
 */
export function getRateLimitStats(): { totalKeys: number; entries: Array<{ key: string; count: number; resetAt: number }> } {
    const entries: Array<{ key: string; count: number; resetAt: number }> = [];
    for (const [key, entry] of store) {
        entries.push({ key, count: entry.count, resetAt: entry.resetAt });
    }
    return { totalKeys: store.size, entries: entries.slice(0, 100) };
}
