// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Redis Cache Driver
// ──────────────────────────────────────────────────────────────

import { Redis } from 'ioredis';
import { Logger } from '../logging/Logger.js';
import { env, envNumber } from '../support/helpers.js';

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

export class RedisDriver implements CacheDriver {
    private client: Redis;
    private prefix: string;

    constructor(config?: { host?: string; port?: number; password?: string; prefix?: string }) {
        this.prefix = config?.prefix ?? 'hyperz:cache:';
        this.client = new Redis({
            host: config?.host ?? env('REDIS_HOST', '127.0.0.1'),
            port: config?.port ?? envNumber('REDIS_PORT', 6379),
            password: (config?.password ?? env('REDIS_PASSWORD', '')) || undefined,
            lazyConnect: true,
        });

        this.client.on('error', (err: any) => {
            Logger.error('[Cache:Redis] Connection error', { error: err.message });
        });

        this.client.connect().catch(() => { });
    }

    private key(k: string): string {
        return `${this.prefix}${k}`;
    }

    async get(key: string): Promise<any | null> {
        const raw = await this.client.get(this.key(key));
        if (raw === null) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    }

    async put(key: string, value: any, ttlSeconds?: number): Promise<void> {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await this.client.setex(this.key(key), ttlSeconds, serialized);
        } else {
            await this.client.set(this.key(key), serialized);
        }
    }

    async forget(key: string): Promise<void> {
        await this.client.del(this.key(key));
    }

    async flush(): Promise<void> {
        const keys = await this.client.keys(`${this.prefix}*`);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
    }

    async has(key: string): Promise<boolean> {
        return (await this.client.exists(this.key(key))) === 1;
    }

    async increment(key: string, value = 1): Promise<number> {
        return this.client.incrby(this.key(key), value);
    }

    async decrement(key: string, value = 1): Promise<number> {
        return this.client.decrby(this.key(key), value);
    }

    tags(names: string[]): CacheDriver {
        const tagPrefix = names.sort().join(':') + ':';
        return new TaggedRedisDriver(this, tagPrefix, names);
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    async flushTags(names: string[]): Promise<void> {
        for (const name of names) {
            const tagKey = `${this.prefix}tags:${name}`;
            const keys = await this.client.smembers(tagKey);
            if (keys.length > 0) {
                await this.client.del(...keys);
                await this.client.del(tagKey);
            }
        }
    }

    async trackTag(key: string, names: string[]) {
        for (const name of names) {
            await this.client.sadd(`${this.prefix}tags:${name}`, this.key(key));
        }
    }
}

class TaggedRedisDriver implements CacheDriver {
    private prefix: string;

    constructor(private parent: RedisDriver, private baseTagPrefix: string, private tagNames: string[]) {
        this.prefix = baseTagPrefix + tagNames.sort().join(':') + ':';
    }

    private k(key: string) { return this.prefix + key; }

    async get(key: string) { return this.parent.get(this.k(key)); }
    async put(key: string, value: any, ttlSeconds?: number) {
        const fullKey = this.k(key);
        await this.parent.trackTag(fullKey, this.tagNames);
        return this.parent.put(fullKey, value, ttlSeconds);
    }
    async forget(key: string) { return this.parent.forget(this.k(key)); }
    async flush() { return this.parent.flushTags(this.tagNames); }
    async has(key: string) { return this.parent.has(this.k(key)); }
    async increment(key: string, value?: number) { return this.parent.increment(this.k(key), value); }
    async decrement(key: string, value?: number) { return this.parent.decrement(this.k(key), value); }
    tags(names: string[]): CacheDriver {
        return new TaggedRedisDriver(this.parent, this.prefix, [...this.tagNames, ...names]);
    }
}
