// ──────────────────────────────────────────────────────────────
// Tests — Phase 4: Route Registry, Metrics, Testing Utils,
//                  Dev Watcher
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Mock Logger
vi.mock('../logging/Logger.js', () => ({
    Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ═════════════════════════════════════════════════════════════
// Route Registry
// ═════════════════════════════════════════════════════════════

describe('RouteRegistry', () => {
    let RouteRegistry: typeof import('../http/RouteRegistry.js').RouteRegistry;

    beforeEach(async () => {
        const mod = await import('../http/RouteRegistry.js');
        RouteRegistry = mod.RouteRegistry;
    });

    it('should register routes and track them', () => {
        const registry = new RouteRegistry();
        const collisions = registry.register('GET', '/api/users', 'app');

        expect(collisions).toHaveLength(0);
        expect(registry.count()).toBe(1);
        expect(registry.all()).toHaveLength(1);
        expect(registry.all()[0].method).toBe('GET');
        expect(registry.all()[0].path).toBe('/api/users');
        expect(registry.all()[0].source).toBe('app');
    });

    it('should detect exact route collisions', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/api/users', 'app');
        const collisions = registry.register('GET', '/api/users', 'plugin-a');

        expect(collisions).toHaveLength(1);
        expect(collisions[0].method).toBe('GET');
        expect(collisions[0].path).toBe('/api/users');
        expect(collisions[0].routes).toHaveLength(1); // The first match
    });

    it('should detect parameter-style collisions', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/api/users/:id', 'app');
        const collisions = registry.register('GET', '/api/users/:userId', 'plugin-b');

        expect(collisions).toHaveLength(1);
    });

    it('should NOT detect collisions for different methods', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/api/users', 'app');
        const collisions = registry.register('POST', '/api/users', 'app');

        expect(collisions).toHaveLength(0);
    });

    it('should NOT detect collisions for different paths', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/api/users', 'app');
        const collisions = registry.register('GET', '/api/posts', 'plugin');

        expect(collisions).toHaveLength(0);
    });

    it('should normalize paths with trailing slashes', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/api/users/', 'app');
        const collisions = registry.register('GET', '/api/users', 'plugin');

        expect(collisions).toHaveLength(1);
    });

    it('should return all collisions via getCollisions()', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/api/users', 'app');
        registry.register('GET', '/api/users', 'plugin-a');
        registry.register('POST', '/api/items', 'app');
        registry.register('POST', '/api/items', 'plugin-b');

        const collisions = registry.getCollisions();
        expect(collisions).toHaveLength(2);
    });

    it('should batch register routes', () => {
        const registry = new RouteRegistry();

        const collisions = registry.registerBatch([
            { method: 'GET', path: '/api/a' },
            { method: 'POST', path: '/api/b' },
            { method: 'GET', path: '/api/a' }, // collision!
        ], 'app');

        expect(collisions).toHaveLength(1);
        expect(registry.count()).toBe(3);
    });

    it('should filter routes by source', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/a', 'source-1');
        registry.register('GET', '/b', 'source-2');
        registry.register('GET', '/c', 'source-1');

        const filtered = registry.bySource('source-1');
        expect(filtered).toHaveLength(2);
    });

    it('should summarize routes by source', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/a', 'app');
        registry.register('POST', '/b', 'app');
        registry.register('GET', '/c', 'plugin');

        const summary = registry.summary();
        expect(summary.get('app')).toBe(2);
        expect(summary.get('plugin')).toBe(1);
    });

    it('should clear all routes', () => {
        const registry = new RouteRegistry();

        registry.register('GET', '/a', 'app');
        registry.register('GET', '/b', 'app');
        expect(registry.count()).toBe(2);

        registry.clear();
        expect(registry.count()).toBe(0);
    });

    it('should export a singleton routeRegistry', async () => {
        const { routeRegistry } = await import('../http/RouteRegistry.js');
        expect(routeRegistry).toBeDefined();
        expect(typeof routeRegistry.register).toBe('function');
    });
});

// ═════════════════════════════════════════════════════════════
// Plugin Metrics
// ═════════════════════════════════════════════════════════════

import { PluginManager } from '../core/PluginManagerV2.js';
import { definePlugin } from '../core/PluginContract.js';
import type { Application } from '../core/Application.js';

function createMockApp(basePath?: string): Application {
    const configStore: Record<string, unknown> = {};
    const base = basePath ?? '/mock';

    return {
        basePath: base,
        express: { use: vi.fn() },
        config: {
            get: vi.fn((key: string, defaultVal?: unknown) => configStore[key] ?? defaultVal),
            set: vi.fn((key: string, value: unknown) => { configStore[key] = value; }),
            has: vi.fn((key: string) => key in configStore),
        },
        container: {
            singleton: vi.fn(),
            bind: vi.fn(),
            make: vi.fn(() => undefined),
            instance: vi.fn(),
        },
        register: vi.fn(),
        plugins: null as unknown,
    } as unknown as Application;
}

describe('PluginManager — Metrics', () => {
    let app: Application;
    let manager: PluginManager;

    beforeEach(() => {
        app = createMockApp();
        manager = new PluginManager(app);
        (app as Record<string, unknown>).plugins = manager;
    });

    it('should record registration time', async () => {
        const plugin = definePlugin({
            meta: { name: 'metric-test', version: '1.0.0' },
            hooks: { register: vi.fn(), boot: vi.fn() },
        });

        await manager.register(plugin);

        const metrics = manager.getMetrics('metric-test');
        expect(metrics).toBeDefined();
        expect(metrics!.registerTime).toBeGreaterThanOrEqual(0);
        expect(metrics!.bootTime).toBe(0); // Not booted yet
        expect(metrics!.errorCount).toBe(0);
    });

    it('should record boot time', async () => {
        const plugin = definePlugin({
            meta: { name: 'boot-metric', version: '1.0.0' },
            hooks: {
                boot: vi.fn(async () => {
                    // Simulate some work
                    await new Promise(resolve => setTimeout(resolve, 5));
                }),
            },
        });

        await manager.register(plugin);
        await manager.bootAll();

        const metrics = manager.getMetrics('boot-metric');
        expect(metrics).toBeDefined();
        expect(metrics!.bootTime).toBeGreaterThan(0);
    });

    it('should track error count on boot failure', async () => {
        const plugin = definePlugin({
            meta: { name: 'error-metric', version: '1.0.0' },
            hooks: {
                boot: vi.fn(() => { throw new Error('Boot explosion'); }),
            },
        });

        await manager.register(plugin);
        await manager.bootAll();

        const metrics = manager.getMetrics('error-metric');
        expect(metrics).toBeDefined();
        expect(metrics!.errorCount).toBe(1);
    });

    it('should return all metrics', async () => {
        const pluginA = definePlugin({ meta: { name: 'a', version: '1.0.0' }, hooks: { boot: vi.fn() } });
        const pluginB = definePlugin({ meta: { name: 'b', version: '1.0.0' }, hooks: { boot: vi.fn() } });

        await manager.register(pluginA);
        await manager.register(pluginB);
        await manager.bootAll();

        const allMetrics = manager.getAllMetrics();
        expect(allMetrics.size).toBe(2);
        expect(allMetrics.has('a')).toBe(true);
        expect(allMetrics.has('b')).toBe(true);
    });

    it('should track total boot time', async () => {
        const plugin = definePlugin({
            meta: { name: 'total-boot', version: '1.0.0' },
            hooks: { boot: vi.fn() },
        });

        await manager.register(plugin);
        await manager.bootAll();

        expect(manager.getBootTime()).toBeGreaterThanOrEqual(0);
    });
});

// ═════════════════════════════════════════════════════════════
// Plugin Testing Utilities
// ═════════════════════════════════════════════════════════════

import {
    createTestApp,
    testPlugin,
    assertPluginRegistered,
    assertPluginBooted,
    assertPluginHealthy,
    assertConfigSet,
    assertBound,
} from '../testing/PluginTestUtils.js';

describe('PluginTestUtils', () => {
    describe('createTestApp', () => {
        it('should create a mock application with working config', () => {
            const app = createTestApp({ config: { 'app.name': 'Test' } });
            expect(app.basePath).toBeDefined();
            expect(app.config.get('app.name')).toBe('Test');
            expect(app.plugins).toBeDefined();
        });

        it('should provide working container', () => {
            const app = createTestApp({
                bindings: { myService: { hello: 'world' } },
            });

            const svc = app.container.make<{ hello: string }>('myService');
            expect(svc.hello).toBe('world');
        });

        it('should have plugins manager attached', () => {
            const app = createTestApp();
            expect(app.plugins).toBeDefined();
            expect(typeof app.plugins.register).toBe('function');
        });
    });

    describe('testPlugin', () => {
        it('should test a plugin through full lifecycle', async () => {
            const plugin = definePlugin({
                meta: { name: 'test-lifecycle', version: '1.0.0' },
                config: {
                    key: 'testLifecycle',
                    defaults: { enabled: true },
                },
                hooks: {
                    register: vi.fn(),
                    boot: vi.fn(),
                    healthCheck: () => true,
                },
            });

            const result = await testPlugin(plugin);

            expect(result.registered).toBe(true);
            expect(result.booted).toBe(true);
            expect(result.healthy).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect registration failure', async () => {
            const plugin = definePlugin({
                meta: { name: 'fail-reg', version: '1.0.0' },
                config: {
                    key: 'failReg',
                    defaults: {},
                    validate: () => { throw new Error('Bad config'); },
                },
            });

            const result = await testPlugin(plugin);

            expect(result.registered).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should support skip-boot mode', async () => {
            const bootFn = vi.fn();
            const plugin = definePlugin({
                meta: { name: 'no-boot', version: '1.0.0' },
                hooks: { boot: bootFn },
            });

            const result = await testPlugin(plugin, { boot: false });

            expect(result.registered).toBe(true);
            expect(result.booted).toBe(false);
            expect(bootFn).not.toHaveBeenCalled();
        });

        it('should register dependency plugins first', async () => {
            const order: string[] = [];

            const depPlugin = definePlugin({
                meta: { name: 'dep', version: '1.0.0' },
                hooks: {
                    register: () => { order.push('dep-register'); },
                    boot: () => { order.push('dep-boot'); },
                },
            });

            const mainPlugin = definePlugin({
                meta: { name: 'main', version: '1.0.0' },
                dependencies: [{ name: 'dep' }],
                hooks: {
                    register: () => { order.push('main-register'); },
                    boot: () => { order.push('main-boot'); },
                },
            });

            const result = await testPlugin(mainPlugin, {
                dependencies: [depPlugin],
            });

            expect(result.registered).toBe(true);
            expect(result.booted).toBe(true);
            expect(order).toEqual(['dep-register', 'main-register', 'dep-boot', 'main-boot']);
        });
    });

    describe('assertion helpers', () => {
        it('assertPluginRegistered should throw on failure', async () => {
            const plugin = definePlugin({
                meta: { name: 'assert-fail', version: '1.0.0' },
                config: {
                    key: 'af',
                    defaults: {},
                    validate: () => { throw new Error('Nope'); },
                },
            });

            const result = await testPlugin(plugin);
            expect(() => assertPluginRegistered(result)).toThrow();
        });

        it('assertPluginBooted should throw on unbooted', async () => {
            const plugin = definePlugin({
                meta: { name: 'no-boot-assert', version: '1.0.0' },
            });

            const result = await testPlugin(plugin, { boot: false });
            expect(() => assertPluginBooted(result)).toThrow();
        });

        it('assertPluginHealthy should throw on unhealthy', async () => {
            const plugin = definePlugin({
                meta: { name: 'unhealthy', version: '1.0.0' },
                hooks: {
                    boot: vi.fn(),
                    healthCheck: () => false,
                },
            });

            const result = await testPlugin(plugin);
            expect(() => assertPluginHealthy(result)).toThrow();
        });

        it('assertConfigSet should validate plugin config', async () => {
            const plugin = definePlugin({
                meta: { name: 'cfg-assert', version: '1.0.0' },
                config: {
                    key: 'cfgAssert',
                    defaults: { enabled: true, limit: 100 },
                },
            });

            const result = await testPlugin(plugin);
            assertConfigSet(result, 'cfgAssert');
        });
    });
});

// ═════════════════════════════════════════════════════════════
// Plugin Dev Watcher
// ═════════════════════════════════════════════════════════════

import { PluginDevWatcher } from '../core/PluginDevWatcher.js';

describe('PluginDevWatcher', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hyperz-watcher-'));
        // Create plugins subdir
        fs.mkdirSync(path.join(tmpDir, 'plugins'), { recursive: true });
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should create watcher instance', () => {
        const app = createMockApp(tmpDir);
        // Mock config to return 'development'
        (app.config.get as ReturnType<typeof vi.fn>).mockImplementation((key: string, def?: unknown) => {
            if (key === 'app.env') return 'development';
            return def;
        });

        const watcher = new PluginDevWatcher(app);
        expect(watcher).toBeDefined();
        expect(watcher.isWatching()).toBe(false);
    });

    it('should not start in production mode', () => {
        const app = createMockApp(tmpDir);
        (app.config.get as ReturnType<typeof vi.fn>).mockImplementation((key: string, def?: unknown) => {
            if (key === 'app.env') return 'production';
            return def;
        });

        const watcher = new PluginDevWatcher(app);
        watcher.start();
        expect(watcher.isWatching()).toBe(false);
    });

    it('should start in development mode when plugins dir exists', () => {
        const app = createMockApp(tmpDir);
        (app.config.get as ReturnType<typeof vi.fn>).mockImplementation((key: string, def?: unknown) => {
            if (key === 'app.env') return 'development';
            return def;
        });

        const watcher = new PluginDevWatcher(app);
        watcher.start();
        expect(watcher.isWatching()).toBe(true);
        watcher.stop();
        expect(watcher.isWatching()).toBe(false);
    });

    it('should accept onReload callback', () => {
        const app = createMockApp(tmpDir);
        (app.config.get as ReturnType<typeof vi.fn>).mockImplementation((key: string, def?: unknown) => {
            if (key === 'app.env') return 'development';
            return def;
        });

        const callback = vi.fn();
        const watcher = new PluginDevWatcher(app);
        const result = watcher.onPluginReload(callback);

        expect(result).toBe(watcher);
        watcher.stop();
    });
});
