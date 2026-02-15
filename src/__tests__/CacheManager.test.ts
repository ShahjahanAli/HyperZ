import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../cache/CacheManager.js';

describe('CacheManager (Memory)', () => {
    let cache: CacheManager;

    beforeEach(() => {
        cache = new CacheManager('memory');
        cache.flush();
    });

    it('can store and retrieve values', async () => {
        await cache.put('foo', 'bar');
        expect(await cache.get('foo')).toBe('bar');
    });

    it('returns null for missing keys', async () => {
        expect(await cache.get('ghost')).toBeNull();
    });

    it('returns default value for missing keys', async () => {
        expect(await cache.get('ghost', 'default')).toBe('default');
    });

    it('can check for existence', async () => {
        await cache.put('exists', true);
        expect(await cache.has('exists')).toBe(true);
        expect(await cache.has('ghost')).toBe(false);
    });

    it('can forget keys', async () => {
        await cache.put('foo', 'bar');
        await cache.forget('foo');
        expect(await cache.get('foo')).toBeNull();
    });

    it('can increment and decrement', async () => {
        await cache.put('count', 10);
        expect(await cache.increment('count')).toBe(11);
        expect(await cache.increment('count', 5)).toBe(16);
        expect(await cache.decrement('count')).toBe(15);
    });

    it('can remember values', async () => {
        let calls = 0;
        const factory = async () => {
            calls++;
            return 'computed';
        };

        const result1 = await cache.remember('key', 60, factory);
        const result2 = await cache.remember('key', 60, factory);

        expect(result1).toBe('computed');
        expect(result2).toBe('computed');
        expect(calls).toBe(1);
    });

    it('supports tags', async () => {
        const tagged = cache.tags(['user1', 'orders']);
        await tagged.put('order1', { id: 1 });
        await tagged.put('order2', { id: 2 });

        expect(await tagged.get('order1')).toEqual({ id: 1 });
        expect(await cache.get('order1')).toBeNull(); // Should be in scoped keyspace

        await tagged.flush();
        expect(await tagged.get('order1')).toBeNull();
    });
});
