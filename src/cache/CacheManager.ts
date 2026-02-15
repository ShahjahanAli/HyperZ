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
    increment(key: string, value?: number): Promise<number>;
    decrement(key: string, value?: number): Promise<number>;
    tags(names: string[]): CacheDriver;
}

/**
 * In-memory cache driver.
 */
class MemoryDriver implements CacheDriver {
    private store = new Map<string, CacheEntry>();
    private tagMap = new Map<string, Set<string>>();

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
        this.tagMap.clear();
    }

    async has(key: string): Promise<boolean> {
        return (await this.get(key)) !== null;
    }

    async increment(key: string, value = 1): Promise<number> {
        const current = (await this.get(key)) ?? 0;
        const next = Number(current) + value;
        await this.put(key, next);
        return next;
    }

    async decrement(key: string, value = 1): Promise<number> {
        return this.increment(key, -value);
    }

    tags(names: string[]): CacheDriver {
        // Simple scoped driver for tags
        return new TaggedMemoryDriver(this, names);
    }

    /**
     * Internal method to flush tags
     */
    async flushTags(names: string[]): Promise<void> {
        for (const name of names) {
            const keys = this.tagMap.get(name);
            if (keys) {
                for (const key of keys) {
                    this.store.delete(key);
                }
                this.tagMap.delete(name);
            }
        }
    }

    /**
     * Internal method to track keys in tags
     */
    trackTag(key: string, names: string[]) {
        for (const name of names) {
            if (!this.tagMap.has(name)) this.tagMap.set(name, new Set());
            this.tagMap.get(name)!.add(key);
        }
    }
}

/**
 * Scoped memory driver for tags
 */
class TaggedMemoryDriver implements CacheDriver {
    private prefix: string;

    constructor(private parent: MemoryDriver, private tagNames: string[]) {
        this.prefix = 'tags:' + tagNames.sort().join(',') + ':';
    }

    private k(key: string) { return this.prefix + key; }

    async get(key: string) { return this.parent.get(this.k(key)); }
    async put(key: string, value: any, ttlSeconds?: number) {
        this.parent.trackTag(this.k(key), this.tagNames);
        return this.parent.put(this.k(key), value, ttlSeconds);
    }
    async forget(key: string) { return this.parent.forget(this.k(key)); }
    async flush() { return this.parent.flushTags(this.tagNames); }
    async has(key: string) { return this.parent.has(this.k(key)); }
    async increment(key: string, value?: number) { return this.parent.increment(this.k(key), value); }
    async decrement(key: string, value?: number) { return this.parent.decrement(this.k(key), value); }
    tags(names: string[]): CacheDriver {
        return new TaggedMemoryDriver(this.parent, [...this.tagNames, ...names]);
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
            this.driver = (global as any).hyperzMemoryCache ??= new MemoryDriver();
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

    async increment(key: string, value?: number): Promise<number> {
        return this.driver.increment(key, value);
    }

    async decrement(key: string, value?: number): Promise<number> {
        return this.driver.decrement(key, value);
    }

    /**
     * Begin a tagged cache operation.
     */
    tags(names: string[] | string): CacheManager {
        const tagNames = Array.isArray(names) ? names : [names];
        const newManager = new CacheManager();
        newManager.driver = this.driver.tags(tagNames);
        return newManager;
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
