// ──────────────────────────────────────────────────────────────
// HyperZ Framework — ConfigManager Tests
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../config/index.js';

describe('ConfigManager', () => {
    let config: ConfigManager;

    beforeEach(() => {
        config = new ConfigManager('/tmp/test-config');
    });

    it('set and get a simple value', () => {
        config.set('app.name', 'HyperZ');
        expect(config.get('app.name')).toBe('HyperZ');
    });

    it('get returns default when key is missing', () => {
        expect(config.get('missing.key', 'fallback')).toBe('fallback');
    });

    it('get returns undefined when no default', () => {
        expect(config.get('missing.key')).toBeUndefined();
    });

    it('supports deep dot notation', () => {
        config.set('database.connections.mysql.host', '127.0.0.1');
        expect(config.get('database.connections.mysql.host')).toBe('127.0.0.1');
    });

    it('set creates nested objects', () => {
        config.set('a.b.c', 'deep');
        expect(config.get('a.b.c')).toBe('deep');
        expect(config.get('a.b')).toEqual({ c: 'deep' });
    });

    it('has() returns true for existing keys', () => {
        config.set('exists', true);
        expect(config.has('exists')).toBe(true);
    });

    it('has() returns false for missing keys', () => {
        expect(config.has('ghost')).toBe(false);
    });

    it('all() returns shallow copy of items', () => {
        config.set('foo', 'bar');
        const items = config.all();
        expect(items.foo).toBe('bar');
        // Mutating copy doesn't affect original
        items.foo = 'baz';
        expect(config.get('foo')).toBe('bar');
    });

    it('handles overwriting values', () => {
        config.set('key', 'first');
        config.set('key', 'second');
        expect(config.get('key')).toBe('second');
    });

    it('can store various types', () => {
        config.set('num', 42);
        config.set('bool', false);
        config.set('arr', [1, 2, 3]);
        config.set('obj', { nested: true });

        expect(config.get('num')).toBe(42);
        expect(config.get('bool')).toBe(false);
        expect(config.get('arr')).toEqual([1, 2, 3]);
        expect(config.get('obj')).toEqual({ nested: true });
    });
});
