// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Audit Log
// ──────────────────────────────────────────────────────────────
//
// Records "who did what, when" for compliance and debugging.
// Captures model changes, authentication events, and custom
// business actions.
//
// Stores audit entries in memory by default. In production,
// swap the store for a database-backed implementation.
//
// Usage:
//   import { AuditLog } from '../../src/logging/AuditLog.js';
//
//   // Manual logging
//   AuditLog.record({
//     action: 'user.login',
//     userId: user.id,
//     ip: req.ip,
//     metadata: { email: user.email },
//   });
//
//   // Model change tracking
//   AuditLog.recordChange({
//     model: 'User',
//     modelId: '42',
//     action: 'update',
//     userId: req.user.id,
//     before: { name: 'Old' },
//     after: { name: 'New' },
//   });
//
//   // Query audit trail
//   const entries = await AuditLog.query({ userId: '42', limit: 50 });
//
// Middleware:
//   import { auditMiddleware } from '../../src/logging/AuditLog.js';
//   app.use(auditMiddleware());
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ── Types ───────────────────────────────────────────────────

export interface AuditEntry {
    id: string;
    action: string;
    userId?: string | number;
    ip?: string;
    userAgent?: string;
    model?: string;
    modelId?: string | number;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

export interface AuditQueryOptions {
    userId?: string | number;
    action?: string;
    model?: string;
    modelId?: string | number;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
}

export interface AuditStore {
    save(entry: AuditEntry): Promise<void>;
    query(options: AuditQueryOptions): Promise<AuditEntry[]>;
    count(options: AuditQueryOptions): Promise<number>;
}

// ── In-memory store ─────────────────────────────────────────

class MemoryAuditStore implements AuditStore {
    private entries: AuditEntry[] = [];
    private maxEntries: number;

    constructor(maxEntries = 10_000) {
        this.maxEntries = maxEntries;
    }

    async save(entry: AuditEntry): Promise<void> {
        this.entries.push(entry);
        // Evict oldest entries if over limit
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }
    }

    async query(options: AuditQueryOptions): Promise<AuditEntry[]> {
        let results = this.filter(options);

        // Sort by newest first
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Pagination
        const offset = options.offset ?? 0;
        const limit = options.limit ?? 50;
        return results.slice(offset, offset + limit);
    }

    async count(options: AuditQueryOptions): Promise<number> {
        return this.filter(options).length;
    }

    private filter(options: AuditQueryOptions): AuditEntry[] {
        return this.entries.filter((entry) => {
            if (options.userId !== undefined && entry.userId !== options.userId) return false;
            if (options.action && entry.action !== options.action) return false;
            if (options.model && entry.model !== options.model) return false;
            if (options.modelId !== undefined && entry.modelId !== options.modelId) return false;
            if (options.from && entry.timestamp < options.from) return false;
            if (options.to && entry.timestamp > options.to) return false;
            return true;
        });
    }
}

// ── ID generator ────────────────────────────────────────────

let counter = 0;
function generateId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return `${ts}-${rand}-${++counter}`;
}

// ── Public API ──────────────────────────────────────────────

export class AuditLog {
    private static store: AuditStore = new MemoryAuditStore();

    /**
     * Replace the default in-memory store with a custom implementation
     * (e.g., database-backed).
     */
    static useStore(store: AuditStore): void {
        this.store = store;
    }

    /**
     * Record an audit entry.
     *
     * @example
     * AuditLog.record({
     *   action: 'user.login',
     *   userId: user.id,
     *   ip: req.ip,
     * });
     */
    static async record(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<AuditEntry> {
        const full: AuditEntry = {
            ...entry,
            id: generateId(),
            timestamp: new Date(),
        };
        await this.store.save(full);
        return full;
    }

    /**
     * Record a model change (create/update/delete).
     *
     * @example
     * AuditLog.recordChange({
     *   model: 'User',
     *   modelId: '42',
     *   action: 'update',
     *   userId: currentUser.id,
     *   before: { name: 'Old Name' },
     *   after: { name: 'New Name' },
     * });
     */
    static async recordChange(change: {
        model: string;
        modelId: string | number;
        action: 'create' | 'update' | 'delete';
        userId?: string | number;
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
    }): Promise<AuditEntry> {
        return this.record({
            action: `${change.model.toLowerCase()}.${change.action}`,
            userId: change.userId,
            model: change.model,
            modelId: change.modelId,
            before: change.before,
            after: change.after,
            metadata: change.metadata,
        });
    }

    /**
     * Query the audit trail.
     */
    static async query(options: AuditQueryOptions = {}): Promise<AuditEntry[]> {
        return this.store.query(options);
    }

    /**
     * Count audit entries matching the given criteria.
     */
    static async count(options: AuditQueryOptions = {}): Promise<number> {
        return this.store.count(options);
    }

    /**
     * Get the underlying store (for admin/monitoring endpoints).
     */
    static getStore(): AuditStore {
        return this.store;
    }
}

// ── Middleware ───────────────────────────────────────────────

/**
 * Express middleware that automatically records an audit entry
 * for every non-GET request.
 *
 * Records: method, path, userId, IP, userAgent, response status.
 */
export function auditMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Only audit state-changing requests
        if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
            next();
            return;
        }

        res.on('finish', () => {
            const user = (req as unknown as Record<string, unknown>)['user'] as
                | { id?: string | number }
                | undefined;

            AuditLog.record({
                action: `http.${req.method.toLowerCase()}`,
                userId: user?.id,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: {
                    method: req.method,
                    path: req.originalUrl,
                    statusCode: res.statusCode,
                },
            }).catch(() => {
                // Never let audit logging break the request
            });
        });

        next();
    };
}
