// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Redis Cache Driver
// ──────────────────────────────────────────────────────────────

import Redis from 'ioredis';
import { Logger } from '../logging/Logger.js';
import { env, envNumber } from '../support/helpers.js';

interface CacheDriver {
    get(key: string): Promise<any | null>;
    put(key: string, value: any, ttlSeconds?: number): Promise<void>;
    forget(key: string): Promise<void>;
    flush(): Promise<void>;
    has(key: string): Promise<boolean>;
}

export class RedisDriver implements CacheDriver {
    private client: Redis;
    private prefix: string;

    constructor(config?: { host?: string; port?: number; password?: string; prefix?: string }) {
        this.prefix = config?.prefix ?? 'hyperz:cache:';
        this.client = new Redis({
            host: config?.host ?? env('REDIS_HOST', '127.0.0.1'),
            port: config?.port ?? envNumber('REDIS_PORT', 6379),
            password: config?.password ?? env('REDIS_PASSWORD', '') || undefined,
            lazyConnect: true,
        });

        this.client.on('error', (err) => {
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

    async disconnect(): Promise<void> {
        await this.client.quit();
    }
}
