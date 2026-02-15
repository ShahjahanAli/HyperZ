// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Cache Manager (Memory + Redis)
// ──────────────────────────────────────────────────────────────

import { Logger } from '../logging/Logger.js';
import { RedisDriver } from './RedisDriver.js';

interface CacheEntry {
    value: any;
    expiresAt: number | null; // null = never expires
}

export interface CacheDriver {
    get(key: string): Promise<any | null>;
    put(key: string, value: any, ttlSeconds?: number): Promise<void>;
    forget(key: string): Promise<void>;
    flush(): Promise<void>;
    has(key: string): Promise<boolean>;
}

/**
 * In-memory cache driver.
 */
class MemoryDriver implements CacheDriver {
    private store = new Map<string, CacheEntry>();

    async get(key: string): Promise<any | null> {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    async put(key: string, value: any, ttlSeconds?: number): Promise<void> {
        this.store.set(key, {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        });
    }

    async forget(key: string): Promise<void> {
        this.store.delete(key);
    }

    async flush(): Promise<void> {
        this.store.clear();
    }

    async has(key: string): Promise<boolean> {
        return (await this.get(key)) !== null;
    }
}

/**
 * Cache Manager — supports memory (default) and Redis drivers.
 */
export class CacheManager {
    private driver: CacheDriver;

    constructor(driverName: string = 'memory', config?: Record<string, any>) {
        if (driverName === 'redis') {
            this.driver = new RedisDriver(config);
        } else {
            this.driver = new MemoryDriver();
        }
        Logger.debug(`Cache driver: ${driverName}`);
    }

    async get<T = any>(key: string, defaultValue?: T): Promise<T | null> {
        const val = await this.driver.get(key);
        return (val ?? defaultValue ?? null) as T | null;
    }

    async put(key: string, value: any, ttlSeconds?: number): Promise<void> {
        return this.driver.put(key, value, ttlSeconds);
    }

    async forget(key: string): Promise<void> {
        return this.driver.forget(key);
    }

    async flush(): Promise<void> {
        return this.driver.flush();
    }

    async has(key: string): Promise<boolean> {
        return this.driver.has(key);
    }

    /**
     * Get or set — retrieve from cache or compute & store.
     */
    async remember<T>(key: string, ttlSeconds: number, callback: () => Promise<T>): Promise<T> {
        const existing = await this.get<T>(key);
        if (existing !== null) return existing;

        const value = await callback();
        await this.put(key, value, ttlSeconds);
        return value;
    }
}
