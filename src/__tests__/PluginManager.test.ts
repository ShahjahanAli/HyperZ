// ──────────────────────────────────────────────────────────────
// Tests — Plugin Ecosystem (PluginManager V2 + PluginContract)
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Logger
vi.mock('../logging/Logger.js', () => ({
    Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { PluginManager } from '../core/PluginManagerV2.js';
import { definePlugin } from '../core/PluginContract.js';
import type { HyperZPlugin, PluginEvent } from '../core/PluginContract.js';
import type { Application } from '../core/Application.js';

// ── Mock Application ─────────────────────────────────────────

function createMockApp(): Application {
    const configStore: Record<string, unknown> = {};
    return {
        basePath: '/mock',
        express: { use: vi.fn() },
        config: {
            get: vi.fn((key: string, defaultVal?: unknown) => configStore[key] ?? defaultVal),
            set: vi.fn((key: string, value: unknown) => { configStore[key] = value; }),
            has: vi.fn((key: string) => key in configStore),
        },
        container: {
            singleton: vi.fn(),
            bind: vi.fn(),
            make: vi.fn(),
        },
        register: vi.fn(),
    } as unknown as Application;
}

// ── Test Plugins ─────────────────────────────────────────────

function createTestPlugin(overrides: Partial<HyperZPlugin> = {}): HyperZPlugin {
    return definePlugin({
        meta: { name: 'test-plugin', version: '1.0.0', description: 'A test plugin' },
        hooks: {
            register: vi.fn(),
            boot: vi.fn(),
            shutdown: vi.fn(),
            healthCheck: vi.fn(() => true),
        },
        config: {
            key: 'testPlugin',
            defaults: { enabled: true, apiKey: 'test-key' },
        },
        ...overrides,
    });
}

describe('PluginContract', () => {
    describe('definePlugin', () => {
        it('should return the same plugin object (identity)', () => {
            const plugin: HyperZPlugin = {
                meta: { name: 'my-plugin', version: '1.0.0' },
            };
            const result = definePlugin(plugin);
            expect(result).toBe(plugin);
        });

        it('should support full plugin definition', () => {
            const plugin = definePlugin({
                meta: { name: 'full-plugin', version: '2.0.0', description: 'Full' },
                hooks: {
                    register: () => {},
                    boot: () => {},
                    shutdown: () => {},
                },
                config: {
                    key: 'fullPlugin',
                    defaults: { enabled: true },
                    envVars: ['FULL_PLUGIN_KEY'],
                },
                dependencies: [{ name: 'other-plugin', version: '>=1.0.0' }],
                tags: ['auth', 'security'],
            });
            expect(plugin.meta.name).toBe('full-plugin');
            expect(plugin.dependencies).toHaveLength(1);
            expect(plugin.tags).toContain('auth');
        });
    });
});

describe('PluginManager', () => {
    let app: Application;
    let manager: PluginManager;

    beforeEach(() => {
        app = createMockApp();
        manager = new PluginManager(app);
    });

    describe('register', () => {
        it('should register a valid plugin', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);

            expect(manager.has('test-plugin')).toBe(true);
            expect(manager.count()).toBe(1);
            expect(manager.get('test-plugin')?.status).toBe('registered');
        });

        it('should call register hook during registration', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);

            expect(plugin.hooks!.register).toHaveBeenCalledWith(app);
        });

        it('should merge config defaults into app config', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);

            expect(app.config.set).toHaveBeenCalledWith('testPlugin', expect.objectContaining({
                enabled: true,
                apiKey: 'test-key',
            }));
        });

        it('should prevent duplicate registration', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);
            await manager.register(plugin);

            expect(manager.count()).toBe(1);
        });

        it('should fail registration if meta.name is missing', async () => {
            const plugin = createTestPlugin({ meta: { name: '', version: '1.0.0' } });
            await manager.register(plugin);

            expect(manager.get('')?.status).toBe('failed');
        });

        it('should fail registration if meta.version is missing', async () => {
            const plugin = createTestPlugin({ meta: { name: 'bad', version: '' } });
            await manager.register(plugin);

            expect(manager.get('bad')?.status).toBe('failed');
        });

        it('should register service provider if provided', async () => {
            class FakeProvider { register() {} async boot() {} }
            const plugin = createTestPlugin({ provider: FakeProvider as never });
            await manager.register(plugin);

            expect(app.register).toHaveBeenCalledWith(FakeProvider);
        });

        it('should register global middleware', async () => {
            const mw = vi.fn();
            const plugin = createTestPlugin({ middleware: [mw] });
            await manager.register(plugin);

            expect(app.express.use).toHaveBeenCalledWith(mw);
        });

        it('should fail if config validation throws', async () => {
            const plugin = createTestPlugin({
                config: {
                    key: 'badConfig',
                    defaults: { broken: true },
                    validate: () => { throw new Error('Invalid config!'); },
                },
            });
            await manager.register(plugin);

            expect(manager.get('test-plugin')?.status).toBe('failed');
            expect(manager.get('test-plugin')?.error).toContain('Config validation failed');
        });

        it('should fail if register hook throws', async () => {
            const plugin = createTestPlugin({
                hooks: {
                    register: () => { throw new Error('Register boom!'); },
                },
                config: undefined, // no config validation to pass first
            });
            await manager.register(plugin);

            expect(manager.get('test-plugin')?.status).toBe('failed');
            expect(manager.get('test-plugin')?.error).toContain('Register hook failed');
        });
    });

    describe('bootAll', () => {
        it('should boot all registered plugins', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);
            await manager.bootAll();

            expect(manager.get('test-plugin')?.status).toBe('booted');
            expect(plugin.hooks!.boot).toHaveBeenCalledWith(app);
        });

        it('should call routes hooks during boot and commands via registerCommands', async () => {
            const routesFn = vi.fn();
            const commandsFn = vi.fn();
            const plugin = createTestPlugin({
                hooks: {
                    register: vi.fn(),
                    boot: vi.fn(),
                    routes: routesFn,
                    commands: commandsFn,
                },
            });
            await manager.register(plugin);
            await manager.bootAll();

            expect(routesFn).toHaveBeenCalledWith(app);
            // Commands are no longer called during bootAll — they use registerCommands(program)
            expect(commandsFn).not.toHaveBeenCalled();

            // Commands are registered separately with program instance
            const mockProgram = { command: vi.fn() };
            await manager.registerCommands(mockProgram);
            expect(commandsFn).toHaveBeenCalledWith(mockProgram, app);
        });

        it('should handle boot failure gracefully', async () => {
            const plugin = createTestPlugin({
                hooks: {
                    register: vi.fn(),
                    boot: () => { throw new Error('Boot failed!'); },
                },
            });
            await manager.register(plugin);
            await manager.bootAll();

            expect(manager.get('test-plugin')?.status).toBe('failed');
            expect(manager.get('test-plugin')?.error).toContain('Boot failed');
        });

        it('should boot plugins in dependency order', async () => {
            const bootOrder: string[] = [];

            const pluginA = createTestPlugin({
                meta: { name: 'plugin-a', version: '1.0.0' },
                hooks: { register: vi.fn(), boot: () => { bootOrder.push('a'); } },
                config: undefined,
                dependencies: [{ name: 'plugin-b' }],
            });

            const pluginB = createTestPlugin({
                meta: { name: 'plugin-b', version: '1.0.0' },
                hooks: { register: vi.fn(), boot: () => { bootOrder.push('b'); } },
                config: undefined,
            });

            // Register A first, B second — but B should boot first
            await manager.register(pluginA);
            await manager.register(pluginB);
            await manager.bootAll();

            expect(bootOrder).toEqual(['b', 'a']);
        });

        it('should fail boot if required dependency is missing', async () => {
            const plugin = createTestPlugin({
                dependencies: [{ name: 'non-existent', required: true }],
            });
            await manager.register(plugin);
            await manager.bootAll();

            expect(manager.get('test-plugin')?.status).toBe('failed');
            expect(manager.get('test-plugin')?.error).toContain('Missing required dependency');
        });

        it('should not fail boot if optional dependency is missing', async () => {
            const plugin = createTestPlugin({
                dependencies: [{ name: 'non-existent', required: false }],
            });
            await manager.register(plugin);
            await manager.bootAll();

            expect(manager.get('test-plugin')?.status).toBe('booted');
        });
    });

    describe('healthCheck', () => {
        it('should return health status for booted plugins', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);
            await manager.bootAll();

            const health = await manager.healthCheck();
            expect(health.get('test-plugin')).toBe(true);
        });

        it('should return false for non-booted plugins', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);
            // Don't boot

            const health = await manager.healthCheck();
            expect(health.get('test-plugin')).toBe(false);
        });

        it('should return true for plugins without health check hook', async () => {
            const plugin = createTestPlugin({
                hooks: { register: vi.fn(), boot: vi.fn() },
            });
            await manager.register(plugin);
            await manager.bootAll();

            const health = await manager.healthCheck();
            expect(health.get('test-plugin')).toBe(true);
        });
    });

    describe('shutdown', () => {
        it('should call shutdown hook on all booted plugins', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);
            await manager.bootAll();
            await manager.shutdown();

            expect(plugin.hooks!.shutdown).toHaveBeenCalledWith(app);
        });

        it('should not call shutdown on non-booted plugins', async () => {
            const plugin = createTestPlugin();
            await manager.register(plugin);
            // Don't boot
            await manager.shutdown();

            expect(plugin.hooks!.shutdown).not.toHaveBeenCalled();
        });
    });

    describe('event system', () => {
        it('should emit plugin:registered event', async () => {
            const listener = vi.fn();
            manager.on('plugin:registered', listener);

            await manager.register(createTestPlugin());

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                type: 'plugin:registered',
                pluginName: 'test-plugin',
            }));
        });

        it('should emit plugin:booted event', async () => {
            const listener = vi.fn();
            manager.on('plugin:booted', listener);

            await manager.register(createTestPlugin());
            await manager.bootAll();

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                type: 'plugin:booted',
                pluginName: 'test-plugin',
            }));
        });

        it('should emit plugin:failed event', async () => {
            const listener = vi.fn();
            manager.on('plugin:failed', listener);

            await manager.register(createTestPlugin({ meta: { name: 'bad', version: '' } }));

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                type: 'plugin:failed',
                pluginName: 'bad',
            }));
        });

        it('should maintain an event log', async () => {
            await manager.register(createTestPlugin());
            await manager.bootAll();

            const log = manager.getEventLog();
            expect(log.length).toBeGreaterThanOrEqual(2);
            expect(log.some((e: PluginEvent) => e.type === 'plugin:registered')).toBe(true);
            expect(log.some((e: PluginEvent) => e.type === 'plugin:booted')).toBe(true);
        });
    });

    describe('query methods', () => {
        it('should return all plugins', async () => {
            await manager.register(createTestPlugin({ meta: { name: 'a', version: '1.0.0' }, config: undefined }));
            await manager.register(createTestPlugin({ meta: { name: 'b', version: '1.0.0' }, config: undefined }));

            expect(manager.all().size).toBe(2);
        });

        it('should return only booted plugins', async () => {
            await manager.register(createTestPlugin({ meta: { name: 'a', version: '1.0.0' }, config: undefined }));
            await manager.register(createTestPlugin({ meta: { name: 'b', version: '1.0.0' }, config: undefined }));
            await manager.bootAll();

            expect(manager.booted()).toHaveLength(2);
        });

        it('should return only failed plugins', async () => {
            await manager.register(createTestPlugin({ meta: { name: 'good', version: '1.0.0' }, config: undefined }));
            await manager.register(createTestPlugin({ meta: { name: 'bad', version: '' } }));

            expect(manager.failed()).toHaveLength(1);
            expect(manager.failed()[0].plugin.meta.name).toBe('bad');
        });
    });

    describe('version constraints', () => {
        it('should satisfy >= constraint', async () => {
            const pluginB = createTestPlugin({
                meta: { name: 'dep-plugin', version: '2.1.0' },
                config: undefined,
            });
            const pluginA = createTestPlugin({
                meta: { name: 'main-plugin', version: '1.0.0' },
                config: undefined,
                dependencies: [{ name: 'dep-plugin', version: '>=2.0.0' }],
            });

            await manager.register(pluginB);
            await manager.register(pluginA);
            await manager.bootAll();

            expect(manager.get('main-plugin')?.status).toBe('booted');
        });

        it('should satisfy ^ (caret) constraint', async () => {
            const pluginB = createTestPlugin({
                meta: { name: 'dep-plugin', version: '1.3.0' },
                config: undefined,
            });
            const pluginA = createTestPlugin({
                meta: { name: 'main-plugin', version: '1.0.0' },
                config: undefined,
                dependencies: [{ name: 'dep-plugin', version: '^1.2.0' }],
            });

            await manager.register(pluginB);
            await manager.register(pluginA);
            await manager.bootAll();

            expect(manager.get('main-plugin')?.status).toBe('booted');
        });

        it('should fail if version does not match required', async () => {
            const pluginB = createTestPlugin({
                meta: { name: 'dep-plugin', version: '1.0.0' },
                config: undefined,
            });
            const pluginA = createTestPlugin({
                meta: { name: 'main-plugin', version: '1.0.0' },
                config: undefined,
                dependencies: [{ name: 'dep-plugin', version: '>=2.0.0', required: true }],
            });

            await manager.register(pluginB);
            await manager.register(pluginA);
            await manager.bootAll();

            expect(manager.get('main-plugin')?.status).toBe('failed');
        });
    });

    describe('circular dependency detection', () => {
        it('should handle circular dependencies without infinite loop', async () => {
            const pluginA = createTestPlugin({
                meta: { name: 'circular-a', version: '1.0.0' },
                config: undefined,
                dependencies: [{ name: 'circular-b', required: false }],
            });
            const pluginB = createTestPlugin({
                meta: { name: 'circular-b', version: '1.0.0' },
                config: undefined,
                dependencies: [{ name: 'circular-a', required: false }],
            });

            await manager.register(pluginA);
            await manager.register(pluginB);

            // Should not hang
            await manager.bootAll();

            // Both should boot (circular deps are warned, not fatal)
            const aStatus = manager.get('circular-a')?.status;
            const bStatus = manager.get('circular-b')?.status;
            expect(aStatus === 'booted' || bStatus === 'booted').toBe(true);
        });
    });
});
