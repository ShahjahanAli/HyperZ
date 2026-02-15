import { describe, it, expect } from 'vitest';
import { ServiceContainer } from '../core/ServiceContainer.js';

describe('ServiceContainer', () => {
    it('can bind and make a dependency', () => {
        const container = new ServiceContainer();
        container.bind('foo', () => 'bar');
        expect(container.make('foo')).toBe('bar');
    });

    it('can register singletons', () => {
        const container = new ServiceContainer();
        let count = 0;
        container.singleton('counter', () => {
            count++;
            return { count };
        });

        const instance1 = container.make<{ count: number }>('counter');
        const instance2 = container.make<{ count: number }>('counter');

        expect(instance1.count).toBe(1);
        expect(instance2.count).toBe(1);
        expect(instance1).toBe(instance2);
    });

    it('can register instance', () => {
        const container = new ServiceContainer();
        const obj = { baz: 'qux' };
        container.instance('config', obj);
        expect(container.make('config')).toBe(obj);
    });

    it('can alias bindings', () => {
        const container = new ServiceContainer();
        container.bind('original', () => 'hello');
        container.alias('alias', 'original');
        expect(container.make('alias')).toBe('hello');
    });

    it('can tag bindings', () => {
        const container = new ServiceContainer();
        container.bind('driver.a', () => 'A');
        container.bind('driver.b', () => 'B');
        container.tag(['driver.a', 'driver.b'], 'drivers');

        const drivers = container.tagged<string>('drivers');
        expect(drivers).toContain('A');
        expect(drivers).toContain('B');
        expect(drivers.length).toBe(2);
    });

    it('throws error if binding not found', () => {
        const container = new ServiceContainer();
        expect(() => container.make('ghost')).toThrow();
    });

    it('can forget bindings', () => {
        const container = new ServiceContainer();
        container.bind('foo', () => 'bar');
        container.forget('foo');
        expect(container.has('foo')).toBe(false);
    });

    it('can flush all bindings', () => {
        const container = new ServiceContainer();
        container.bind('foo', () => 'bar');
        container.tag(['foo'], 'tag');
        container.flush();
        expect(container.has('foo')).toBe(false);
        expect(container.tagged('tag')).toEqual([]);
    });
});
