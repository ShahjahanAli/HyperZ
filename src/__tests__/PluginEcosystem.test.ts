// ──────────────────────────────────────────────────────────────
// Tests — Plugin Ecosystem (Resources, Publishing, Integration)
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Mock Logger
vi.mock('../logging/Logger.js', () => ({
    Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { PluginManager } from '../core/PluginManagerV2.js';
import { PublishManager } from '../core/PublishManager.js';
import { definePlugin } from '../core/PluginContract.js';
import type { HyperZPlugin } from '../core/PluginContract.js';
import type { Application } from '../core/Application.js';

// ── Mock Application ─────────────────────────────────────────

function createMockApp(basePath?: string): Application {
    const configStore: Record<string, unknown> = {};
    const routeMiddleware: Record<string, unknown> = {};
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
            make: vi.fn((key: string) => {
                if (key === 'middleware.route') return routeMiddleware;
                if (key === 'scheduler') return null;
                return undefined;
            }),
            instance: vi.fn(),
        },
        register: vi.fn(),
        plugins: null as unknown, // Will be set after PluginManager is created
    } as unknown as Application;
}

// ── Test Plugin Factory ──────────────────────────────────────

function createResourcePlugin(overrides: Partial<HyperZPlugin> = {}): HyperZPlugin {
    return definePlugin({
        meta: { name: 'resource-plugin', version: '1.0.0', description: 'Plugin with resources' },
        config: {
            key: 'resourcePlugin',
            defaults: { enabled: true },
        },
        resources: {
            migrations: './database/migrations',
            seeders: './database/seeders',
            config: './config',
            lang: './lang',
            models: './models',
        },
        hooks: {
            register: vi.fn(),
            boot: vi.fn(),
            shutdown: vi.fn(),
            healthCheck: vi.fn(() => true),
        },
        tags: ['resource-test'],
        ...overrides,
    });
}

function createPluginWithMiddleware(): HyperZPlugin {
    return definePlugin({
        meta: { name: 'middleware-plugin', version: '1.0.0' },
        middleware: [vi.fn()],
        routeMiddleware: {
            'oauth': vi.fn(),
            'apiLimit': vi.fn(),
        },
        hooks: {
            register: vi.fn(),
            boot: vi.fn(),
        },
    });
}

function createPluginWithPublishable(pluginRoot: string): HyperZPlugin {
    return definePlugin({
        meta: { name: 'publishable-plugin', version: '1.0.0' },
        publishable: [
            {
                source: path.join(pluginRoot, 'config', 'publishable.ts'),
                destination: '/mock/config',
                tag: 'config',
            },
        ],
        resources: {
            config: './config',
        },
        hooks: {
            boot: vi.fn(),
        },
    });
}

function createPluginWithCommands(): HyperZPlugin {
    const commandsFn = vi.fn();
    return definePlugin({
        meta: { name: 'commands-plugin', version: '1.0.0' },
        hooks: {
            commands: commandsFn,
            boot: vi.fn(),
        },
    });
}

function createPluginWithSchedule(): HyperZPlugin {
    const scheduleFn = vi.fn();
    return definePlugin({
        meta: { name: 'schedule-plugin', version: '1.0.0' },
        hooks: {
            schedule: scheduleFn,
            boot: vi.fn(),
        },
    });
}

// ═════════════════════════════════════════════════════════════
// Plugin Contract Extensions
// ═════════════════════════════════════════════════════════════

describe('PluginContract Extensions', () => {
    it('should support resources field in plugin definition', () => {
        const plugin = createResourcePlugin();
        expect(plugin.resources).toBeDefined();
        expect(plugin.resources?.migrations).toBe('./database/migrations');
        expect(plugin.resources?.seeders).toBe('./database/seeders');
        expect(plugin.resources?.config).toBe('./config');
        expect(plugin.resources?.lang).toBe('./lang');
        expect(plugin.resources?.models).toBe('./models');
    });

    it('should support routeMiddleware field', () => {
        const plugin = createPluginWithMiddleware();
        expect(plugin.routeMiddleware).toBeDefined();
        expect(plugin.routeMiddleware?.['oauth']).toBeDefined();
        expect(plugin.routeMiddleware?.['apiLimit']).toBeDefined();
    });

    it('should support publishable field', () => {
        const plugin = createPluginWithPublishable('/mock/plugins/test');
        expect(plugin.publishable).toBeDefined();
        expect(plugin.publishable).toHaveLength(1);
        expect(plugin.publishable?.[0].tag).toBe('config');
    });

    it('should support commands hook with program parameter', () => {
        const plugin = createPluginWithCommands();
        expect(plugin.hooks?.commands).toBeDefined();
    });

    it('should support schedule hook', () => {
        const plugin = createPluginWithSchedule();
        expect(plugin.hooks?.schedule).toBeDefined();
    });
});

// ═════════════════════════════════════════════════════════════
// PluginManager — Resource Paths
// ═════════════════════════════════════════════════════════════

describe('PluginManager — Resource Paths', () => {
    let app: Application;
    let manager: PluginManager;

    beforeEach(() => {
        app = createMockApp();
        manager = new PluginManager(app);
        (app as Record<string, unknown>).plugins = manager;
    });

    it('should start with empty resource paths', () => {
        expect(manager.getMigrationPaths()).toEqual([]);
        expect(manager.getSeederPaths()).toEqual([]);
        expect(manager.getEntityPaths()).toEqual([]);
    });

    it('should track publishable resources from registered plugins', async () => {
        const plugin = definePlugin({
            meta: { name: 'pub-plugin', version: '1.0.0' },
            publishable: [
                { source: './config/pub.ts', destination: '/app/config', tag: 'config' },
                { source: './lang/', destination: '/app/lang', tag: 'lang' },
            ],
        });

        await manager.register(plugin);
        const resources = manager.getPublishableResources();
        expect(resources).toHaveLength(2);
        expect(resources[0].tag).toBe('config');
        expect(resources[1].tag).toBe('lang');
    });

    it('should filter publishable resources by tag', async () => {
        const plugin = definePlugin({
            meta: { name: 'tag-plugin', version: '1.0.0' },
            publishable: [
                { source: './config/a.ts', destination: '/app/config', tag: 'config' },
                { source: './lang/', destination: '/app/lang', tag: 'lang' },
                { source: './config/b.ts', destination: '/app/config', tag: 'config' },
            ],
        });

        await manager.register(plugin);
        const configOnly = manager.getPublishableResources('config');
        expect(configOnly).toHaveLength(2);
        const langOnly = manager.getPublishableResources('lang');
        expect(langOnly).toHaveLength(1);
    });

    it('should get and set plugin root directories', async () => {
        expect(manager.getPluginRoot('nonexistent')).toBeUndefined();
    });
});

// ═════════════════════════════════════════════════════════════
// PluginManager — Route Middleware Registration
// ═════════════════════════════════════════════════════════════

describe('PluginManager — Route Middleware', () => {
    let app: Application;
    let manager: PluginManager;

    beforeEach(() => {
        app = createMockApp();
        manager = new PluginManager(app);
        (app as Record<string, unknown>).plugins = manager;
    });

    it('should register route middleware from plugins', async () => {
        const plugin = createPluginWithMiddleware();
        await manager.register(plugin);

        // Verify container.instance was called with updated route middleware
        expect(app.container.instance).toHaveBeenCalledWith(
            'middleware.route',
            expect.objectContaining({
                oauth: expect.any(Function),
                apiLimit: expect.any(Function),
            })
        );
    });

    it('should register global middleware from plugins', async () => {
        const plugin = createPluginWithMiddleware();
        await manager.register(plugin);

        expect(app.express.use).toHaveBeenCalled();
    });
});

// ═════════════════════════════════════════════════════════════
// PluginManager — Commands Registration
// ═════════════════════════════════════════════════════════════

describe('PluginManager — Commands Registration', () => {
    let app: Application;
    let manager: PluginManager;

    beforeEach(() => {
        app = createMockApp();
        manager = new PluginManager(app);
        (app as Record<string, unknown>).plugins = manager;
    });

    it('should register commands from plugins with program instance', async () => {
        const commandsFn = vi.fn();
        const plugin = definePlugin({
            meta: { name: 'cmd-plugin', version: '1.0.0' },
            hooks: { commands: commandsFn, boot: vi.fn() },
        });

        await manager.register(plugin);

        const mockProgram = { command: vi.fn() };
        await manager.registerCommands(mockProgram);

        expect(commandsFn).toHaveBeenCalledWith(mockProgram, app);
    });

    it('should skip command registration for failed plugins', async () => {
        const commandsFn = vi.fn();
        const plugin = definePlugin({
            meta: { name: 'fail-cmd', version: '1.0.0' },
            hooks: { commands: commandsFn },
            config: {
                key: 'failCmd',
                defaults: {},
                validate: () => { throw new Error('Invalid config'); },
            },
        });

        await manager.register(plugin);
        await manager.registerCommands({});

        expect(commandsFn).not.toHaveBeenCalled();
    });
});

// ═════════════════════════════════════════════════════════════
// PublishManager
// ═════════════════════════════════════════════════════════════

describe('PublishManager', () => {
    let app: Application;
    let manager: PluginManager;
    let publisher: PublishManager;
    let tmpDir: string;

    beforeEach(() => {
        // Create a temp dir for file operations
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hyperz-test-'));
        app = createMockApp(tmpDir);
        manager = new PluginManager(app);
        (app as Record<string, unknown>).plugins = manager;
        publisher = new PublishManager(app);
    });

    afterEach(() => {
        // Clean up temp dir
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should return error for unregistered plugin', async () => {
        const results = await publisher.publish('nonexistent');
        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('failed');
        expect(results[0].reason).toContain('not registered');
    });

    it('should publish files from source to destination', async () => {
        // Create plugin source structure
        const pluginRoot = path.join(tmpDir, 'plugins', 'test-pub');
        const configDir = path.join(pluginRoot, 'config');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'test.ts'), 'export default { key: "value" };');

        const plugin = definePlugin({
            meta: { name: 'test-pub', version: '1.0.0' },
            publishable: [
                {
                    source: path.join(pluginRoot, 'config', 'test.ts'),
                    destination: path.join(tmpDir, 'config'),
                    tag: 'config',
                },
            ],
        });

        await manager.register(plugin);

        // Mock pluginRoots
        (manager as unknown as Record<string, unknown>)['pluginRoots'] = new Map([[
            'test-pub', pluginRoot,
        ]]);

        const results = await publisher.publish('test-pub');
        expect(results.some(r => r.status === 'published')).toBe(true);

        // Verify file was copied
        const destFile = path.join(tmpDir, 'config', 'test.ts');
        expect(fs.existsSync(destFile)).toBe(true);
    });

    it('should skip existing files without --force', async () => {
        const pluginRoot = path.join(tmpDir, 'plugins', 'skip-test');
        const configDir = path.join(pluginRoot, 'config');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'exists.ts'), 'export default {};');

        // Pre-create the destination file
        const destDir = path.join(tmpDir, 'config');
        fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(path.join(destDir, 'exists.ts'), 'existing content');

        const plugin = definePlugin({
            meta: { name: 'skip-test', version: '1.0.0' },
            publishable: [
                {
                    source: path.join(pluginRoot, 'config', 'exists.ts'),
                    destination: destDir,
                    tag: 'config',
                },
            ],
        });

        await manager.register(plugin);
        (manager as unknown as Record<string, unknown>)['pluginRoots'] = new Map([[
            'skip-test', pluginRoot,
        ]]);

        const results = await publisher.publish('skip-test');
        expect(results.some(r => r.status === 'skipped')).toBe(true);
    });

    it('should overwrite existing files with force flag', async () => {
        const pluginRoot = path.join(tmpDir, 'plugins', 'force-test');
        const configDir = path.join(pluginRoot, 'config');
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'force.ts'), 'new content');

        const destDir = path.join(tmpDir, 'config');
        fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(path.join(destDir, 'force.ts'), 'old content');

        const plugin = definePlugin({
            meta: { name: 'force-test', version: '1.0.0' },
            publishable: [
                {
                    source: path.join(pluginRoot, 'config', 'force.ts'),
                    destination: destDir,
                    tag: 'config',
                },
            ],
        });

        await manager.register(plugin);
        (manager as unknown as Record<string, unknown>)['pluginRoots'] = new Map([[
            'force-test', pluginRoot,
        ]]);

        const results = await publisher.publish('force-test', { force: true });
        expect(results.some(r => r.status === 'published')).toBe(true);

        const content = fs.readFileSync(path.join(destDir, 'force.ts'), 'utf-8');
        expect(content).toBe('new content');
    });

    it('should filter publishable resources by tag', async () => {
        const pluginRoot = path.join(tmpDir, 'plugins', 'tag-filter');
        const configDir = path.join(pluginRoot, 'config');
        const langDir = path.join(pluginRoot, 'lang');
        fs.mkdirSync(configDir, { recursive: true });
        fs.mkdirSync(langDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, 'cfg.ts'), 'config');
        fs.writeFileSync(path.join(langDir, 'en.json'), '{}');

        const plugin = definePlugin({
            meta: { name: 'tag-filter', version: '1.0.0' },
            publishable: [
                { source: path.join(pluginRoot, 'config', 'cfg.ts'), destination: path.join(tmpDir, 'config'), tag: 'config' },
                { source: path.join(pluginRoot, 'lang', 'en.json'), destination: path.join(tmpDir, 'lang'), tag: 'lang' },
            ],
        });

        await manager.register(plugin);
        (manager as unknown as Record<string, unknown>)['pluginRoots'] = new Map([[
            'tag-filter', pluginRoot,
        ]]);

        const results = await publisher.publish('tag-filter', { tag: 'config' });
        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('published');
    });

    it('should list all publishable resources', async () => {
        const pluginRoot = path.join(tmpDir, 'plugins', 'list-test');
        fs.mkdirSync(pluginRoot, { recursive: true });

        const plugin = definePlugin({
            meta: { name: 'list-test', version: '1.0.0' },
            publishable: [
                { source: './config/a.ts', destination: '/app/config', tag: 'config' },
                { source: './lang/', destination: '/app/lang', tag: 'lang' },
            ],
            resources: {
                config: './config',
                lang: './lang',
            },
        });

        await manager.register(plugin);
        (manager as unknown as Record<string, unknown>)['pluginRoots'] = new Map([[
            'list-test', pluginRoot,
        ]]);

        const items = publisher.listPublishable();
        expect(items.length).toBeGreaterThanOrEqual(2);
        expect(items.some(i => i.tag === 'config')).toBe(true);
        expect(items.some(i => i.tag === 'lang')).toBe(true);
    });

    it('should publish directory contents recursively', async () => {
        const pluginRoot = path.join(tmpDir, 'plugins', 'dir-test');
        const langDir = path.join(pluginRoot, 'lang', 'en');
        fs.mkdirSync(langDir, { recursive: true });
        fs.writeFileSync(path.join(langDir, 'messages.json'), '{"hello": "world"}');
        fs.writeFileSync(path.join(pluginRoot, 'lang', 'index.json'), '["en"]');

        const destDir = path.join(tmpDir, 'lang');

        const plugin = definePlugin({
            meta: { name: 'dir-test', version: '1.0.0' },
            publishable: [
                { source: path.join(pluginRoot, 'lang'), destination: destDir, tag: 'lang' },
            ],
        });

        await manager.register(plugin);
        (manager as unknown as Record<string, unknown>)['pluginRoots'] = new Map([[
            'dir-test', pluginRoot,
        ]]);

        const results = await publisher.publish('dir-test');
        expect(results.filter(r => r.status === 'published')).toHaveLength(2);
        expect(fs.existsSync(path.join(destDir, 'en', 'messages.json'))).toBe(true);
        expect(fs.existsSync(path.join(destDir, 'index.json'))).toBe(true);
    });
});

// ═════════════════════════════════════════════════════════════
// Integration: Application + PluginManager
// ═════════════════════════════════════════════════════════════

describe('Application + PluginManager Integration', () => {
    it('should have plugins property on Application mock', () => {
        const app = createMockApp();
        const manager = new PluginManager(app);
        (app as Record<string, unknown>).plugins = manager;
        expect(app.plugins).toBe(manager);
    });

    it('should register and boot plugins through manager lifecycle', async () => {
        const app = createMockApp();
        const manager = new PluginManager(app);
        (app as Record<string, unknown>).plugins = manager;

        const bootFn = vi.fn();
        const registerFn = vi.fn();

        const plugin = definePlugin({
            meta: { name: 'lifecycle-test', version: '1.0.0' },
            hooks: {
                register: registerFn,
                boot: bootFn,
                healthCheck: () => true,
            },
        });

        await manager.register(plugin);
        expect(registerFn).toHaveBeenCalled();
        expect(manager.count()).toBe(1);

        await manager.bootAll();
        expect(bootFn).toHaveBeenCalled();
        expect(manager.booted()).toHaveLength(1);

        const health = await manager.healthCheck();
        expect(health.get('lifecycle-test')).toBe(true);
    });

    it('should shutdown plugins in reverse order', async () => {
        const app = createMockApp();
        const manager = new PluginManager(app);
        (app as Record<string, unknown>).plugins = manager;

        const shutdownOrder: string[] = [];

        const pluginA = definePlugin({
            meta: { name: 'a-plugin', version: '1.0.0' },
            hooks: {
                boot: vi.fn(),
                shutdown: () => { shutdownOrder.push('a'); },
            },
        });

        const pluginB = definePlugin({
            meta: { name: 'b-plugin', version: '1.0.0' },
            dependencies: [{ name: 'a-plugin' }],
            hooks: {
                boot: vi.fn(),
                shutdown: () => { shutdownOrder.push('b'); },
            },
        });

        await manager.register(pluginA);
        await manager.register(pluginB);
        await manager.bootAll();
        await manager.shutdown();

        // B depends on A, so B should shutdown first (reverse of boot order)
        expect(shutdownOrder).toEqual(['b', 'a']);
    });
});

// ═════════════════════════════════════════════════════════════
// DataSource — Plugin Path Registration
// ═════════════════════════════════════════════════════════════

describe('DataSource Plugin Paths', () => {
    it('should export registerMigrationPaths and registerEntityPaths', async () => {
        const { registerMigrationPaths, registerEntityPaths } = await import('../database/DataSource.js');
        expect(typeof registerMigrationPaths).toBe('function');
        expect(typeof registerEntityPaths).toBe('function');
    });
});

// ═════════════════════════════════════════════════════════════
// Seeder — Multiple Directory Support
// ═════════════════════════════════════════════════════════════

describe('Seeder Multi-Directory', () => {
    it('should accept additional seeder paths', async () => {
        const { Seeder } = await import('../database/Seeder.js');
        const seeder = new Seeder('/nonexistent');
        expect(typeof seeder.addSeederPaths).toBe('function');
        seeder.addSeederPaths(['/extra/seeders']);
    });
});
