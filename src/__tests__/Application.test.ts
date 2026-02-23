// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Application Core Tests
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Application } from '../core/Application.js';
import { ServiceProvider } from '../core/ServiceProvider.js';

describe('Application', () => {
    let app: Application;

    beforeEach(() => {
        app = new Application('/tmp/test-app');
    });

    // ── Constructor & Paths ───────────────────────────────────

    it('sets basePath from constructor', () => {
        expect(app.basePath).toBe('/tmp/test-app');
    });

    it('defaults basePath to cwd when not provided', () => {
        const defaultApp = new Application();
        expect(defaultApp.basePath).toBe(process.cwd());
    });

    it('registers core instances in the container', () => {
        expect(app.container.has('app')).toBe(true);
        expect(app.container.has('express')).toBe(true);
        expect(app.container.has('config')).toBe(true);
        expect(app.container.has('path.base')).toBe(true);
        expect(app.container.has('path.app')).toBe(true);
        expect(app.container.has('path.config')).toBe(true);
        expect(app.container.has('path.database')).toBe(true);
        expect(app.container.has('path.storage')).toBe(true);
        expect(app.container.has('path.src')).toBe(true);
    });

    it('resolves app instance from container', () => {
        expect(app.make('app')).toBe(app);
    });

    it('resolves express instance from container', () => {
        expect(app.make('express')).toBe(app.express);
    });

    // ── Path Helpers ──────────────────────────────────────────

    it('appPath() builds correct path', () => {
        const result = app.appPath('controllers', 'HomeController.ts');
        expect(result).toContain('app');
        expect(result).toContain('controllers');
        expect(result).toContain('HomeController.ts');
    });

    it('databasePath() builds correct path', () => {
        const result = app.databasePath('migrations');
        expect(result).toContain('database');
        expect(result).toContain('migrations');
    });

    it('storagePath() builds correct path', () => {
        const result = app.storagePath('logs', 'app.log');
        expect(result).toContain('storage');
        expect(result).toContain('logs');
    });

    it('configPath() builds correct path', () => {
        const result = app.configPath('app.ts');
        expect(result).toContain('config');
        expect(result).toContain('app.ts');
    });

    // ── Service Providers ─────────────────────────────────────

    it('registers a service provider instance', () => {
        class TestProvider extends ServiceProvider {
            register() {
                this.app.container.instance('test-val', 42);
            }
        }

        app.register(new TestProvider(app));
        expect(app.make('test-val')).toBe(42);
    });

    it('registers a service provider class', () => {
        class TestProvider extends ServiceProvider {
            register() {
                this.app.container.instance('class-val', 'hello');
            }
        }

        app.register(TestProvider);
        expect(app.make('class-val')).toBe('hello');
    });

    it('boots all registered providers', async () => {
        const bootOrder: string[] = [];

        class ProviderA extends ServiceProvider {
            async boot() { bootOrder.push('A'); }
        }
        class ProviderB extends ServiceProvider {
            async boot() { bootOrder.push('B'); }
        }

        app.register(ProviderA);
        app.register(ProviderB);
        await app.boot();

        expect(bootOrder).toEqual(['A', 'B']);
    });

    it('only boots once', async () => {
        let bootCount = 0;

        class CountProvider extends ServiceProvider {
            async boot() { bootCount++; }
        }

        app.register(CountProvider);
        await app.boot();
        await app.boot(); // second call should be a no-op

        expect(bootCount).toBe(1);
    });

    // ── Terminating / Shutdown ────────────────────────────────

    it('registers terminating callbacks', () => {
        const fn = vi.fn();
        app.terminating(fn);
        // Fluent API
        expect(app.terminating(() => {})).toBe(app);
    });

    it('setShutdownTimeout returns self for chaining', () => {
        expect(app.setShutdownTimeout(5000)).toBe(app);
    });

    // ── make() delegates to container ─────────────────────────

    it('make() resolves from container', () => {
        app.container.instance('key', 'value');
        expect(app.make('key')).toBe('value');
    });

    it('make() throws for unregistered binding', () => {
        expect(() => app.make('nonexistent')).toThrow();
    });
});
