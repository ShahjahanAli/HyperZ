import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventDispatcher } from '../events/EventDispatcher.js';

describe('EventDispatcher', () => {
    beforeEach(() => {
        EventDispatcher.clear();
    });

    it('can listen and dispatch events', async () => {
        const handler = vi.fn();
        EventDispatcher.on('foo', handler);
        await EventDispatcher.dispatch('foo', 'bar');
        expect(handler).toHaveBeenCalledWith('bar');
    });

    it('supports once listeners', async () => {
        const handler = vi.fn();
        EventDispatcher.once('foo', handler);
        await EventDispatcher.dispatch('foo');
        await EventDispatcher.dispatch('foo');
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('can remove listeners', async () => {
        const handler = vi.fn();
        EventDispatcher.on('foo', handler);
        EventDispatcher.off('foo', handler);
        await EventDispatcher.dispatch('foo');
        expect(handler).not.toHaveBeenCalled();
    });

    it('supports wildcard listeners', async () => {
        const handler = vi.fn();
        EventDispatcher.on('user.*', handler);

        await EventDispatcher.dispatch('user.created', { id: 1 });
        await EventDispatcher.dispatch('user.updated', { id: 1 });
        await EventDispatcher.dispatch('other.event');

        expect(handler).toHaveBeenCalledTimes(2);
    });

    it('can dispatch events synchronously', async () => {
        const results: number[] = [];
        EventDispatcher.on('foo', async () => { results.push(1); });
        EventDispatcher.on('foo', async () => { results.push(2); });

        await EventDispatcher.dispatchSync('foo');
        expect(results).toEqual([1, 2]);
    });

    it('checks for listeners', () => {
        EventDispatcher.on('foo.*', () => { });
        expect(EventDispatcher.hasListeners('foo.bar')).toBe(true);
        expect(EventDispatcher.hasListeners('baz')).toBe(false);
    });
});
