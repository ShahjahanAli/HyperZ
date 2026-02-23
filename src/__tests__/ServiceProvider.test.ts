// ──────────────────────────────────────────────────────────────
// HyperZ Framework — ServiceProvider Base Class Tests
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import { ServiceProvider } from '../core/ServiceProvider.js';
import { Application } from '../core/Application.js';

describe('ServiceProvider', () => {
    it('receives app reference in constructor', () => {
        const app = new Application('/tmp/sp-test');

        class TestProvider extends ServiceProvider {
            getApp() { return this.app; }
        }

        const provider = new TestProvider(app);
        expect(provider.getApp()).toBe(app);
    });

    it('register() is a no-op by default', () => {
        const app = new Application('/tmp/sp-test');

        class EmptyProvider extends ServiceProvider {}
        const provider = new EmptyProvider(app);

        // Should not throw
        expect(() => provider.register()).not.toThrow();
    });

    it('boot() returns a promise by default', async () => {
        const app = new Application('/tmp/sp-test');

        class EmptyProvider extends ServiceProvider {}
        const provider = new EmptyProvider(app);

        await expect(provider.boot()).resolves.toBeUndefined();
    });

    it('subclass can register bindings', () => {
        const app = new Application('/tmp/sp-test');

        class MyProvider extends ServiceProvider {
            register() {
                this.app.container.instance('myService', { active: true });
            }
        }

        const provider = new MyProvider(app);
        provider.register();
        expect(app.make('myService')).toEqual({ active: true });
    });

    it('subclass can boot with async logic', async () => {
        const app = new Application('/tmp/sp-test');
        const bootLog: string[] = [];

        class AsyncProvider extends ServiceProvider {
            async boot() {
                await new Promise(r => setTimeout(r, 5));
                bootLog.push('booted');
            }
        }

        const provider = new AsyncProvider(app);
        await provider.boot();
        expect(bootLog).toEqual(['booted']);
    });

    it('multiple providers boot in registration order via Application', async () => {
        const app = new Application('/tmp/sp-test');
        const order: string[] = [];

        class FirstProvider extends ServiceProvider {
            async boot() { order.push('first'); }
        }
        class SecondProvider extends ServiceProvider {
            async boot() { order.push('second'); }
        }
        class ThirdProvider extends ServiceProvider {
            async boot() { order.push('third'); }
        }

        app.register(FirstProvider);
        app.register(SecondProvider);
        app.register(ThirdProvider);
        await app.boot();

        expect(order).toEqual(['first', 'second', 'third']);
    });
});
