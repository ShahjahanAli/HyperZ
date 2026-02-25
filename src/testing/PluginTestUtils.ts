// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Plugin Testing Utilities
//
// Provides test helpers for plugin authors to test their plugins
// in isolation. Includes a mock application, plugin harness, and
// assertion helpers.
// ──────────────────────────────────────────────────────────────

import type { Application } from '../core/Application.js';
import type { HyperZPlugin, PluginRegistryEntry } from '../core/PluginContract.js';
import { PluginManager } from '../core/PluginManagerV2.js';

// ── Mock Config Store ────────────────────────────────────────

class MockConfigManager {
    private store: Record<string, unknown> = {};

    get<T = unknown>(key: string, defaultVal?: T): T {
        const parts = key.split('.');
        let current: unknown = this.store;

        for (const part of parts) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return defaultVal as T;
            }
            current = (current as Record<string, unknown>)[part];
        }

        return (current ?? defaultVal) as T;
    }

    set(key: string, value: unknown): void {
        const parts = key.split('.');
        let current: Record<string, unknown> = this.store;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
                current[parts[i]] = {};
            }
            current = current[parts[i]] as Record<string, unknown>;
        }

        current[parts[parts.length - 1]] = value;
    }

    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    all(): Record<string, unknown> {
        return { ...this.store };
    }
}

// ── Mock Service Container ───────────────────────────────────

class MockServiceContainer {
    private bindings = new Map<string | symbol, unknown>();
    private singletons = new Map<string | symbol, unknown>();
    private factories = new Map<string | symbol, () => unknown>();

    singleton(key: string | symbol, factory: () => unknown): void {
        this.factories.set(key, factory);
    }

    bind(key: string | symbol, factory: () => unknown): void {
        this.factories.set(key, factory);
    }

    instance(key: string | symbol, value: unknown): void {
        this.bindings.set(key, value);
    }

    make<T = unknown>(key: string | symbol): T {
        // Check direct instances first
        if (this.bindings.has(key)) {
            return this.bindings.get(key) as T;
        }

        // Check singletons
        if (this.singletons.has(key)) {
            return this.singletons.get(key) as T;
        }

        // Resolve factory
        if (this.factories.has(key)) {
            const factory = this.factories.get(key) as () => unknown;
            const result = factory();
            this.singletons.set(key, result);
            return result as T;
        }

        return undefined as T;
    }

    has(key: string | symbol): boolean {
        return this.bindings.has(key) || this.factories.has(key) || this.singletons.has(key);
    }
}

// ── Mock Express App ─────────────────────────────────────────

class MockExpress {
    private middleware: Array<(...args: unknown[]) => unknown> = [];
    private routeHandlers = new Map<string, Array<(...args: unknown[]) => unknown>>();

    use(...args: unknown[]): void {
        for (const arg of args) {
            if (typeof arg === 'function') {
                this.middleware.push(arg as (...args: unknown[]) => unknown);
            }
        }
    }

    get(path: string, ...handlers: unknown[]): void {
        this.addRouteHandler('GET', path, handlers);
    }

    post(path: string, ...handlers: unknown[]): void {
        this.addRouteHandler('POST', path, handlers);
    }

    put(path: string, ...handlers: unknown[]): void {
        this.addRouteHandler('PUT', path, handlers);
    }

    delete(path: string, ...handlers: unknown[]): void {
        this.addRouteHandler('DELETE', path, handlers);
    }

    /** Get all registered middleware for assertions */
    getMiddleware(): Array<(...args: unknown[]) => unknown> {
        return [...this.middleware];
    }

    /** Get route handlers for a specific method+path */
    getRouteHandlers(method: string, path: string): Array<(...args: unknown[]) => unknown> {
        return this.routeHandlers.get(`${method}:${path}`) ?? [];
    }

    private addRouteHandler(method: string, path: string, handlers: unknown[]): void {
        const key = `${method}:${path}`;
        const existing = this.routeHandlers.get(key) ?? [];
        existing.push(...handlers.filter(h => typeof h === 'function') as Array<(...args: unknown[]) => unknown>);
        this.routeHandlers.set(key, existing);
    }
}

// ── Test Application Factory ─────────────────────────────────

export interface TestAppOptions {
    /** Base path for the test app (defaults to process.cwd()) */
    basePath?: string;

    /** Initial config values */
    config?: Record<string, unknown>;

    /** Pre-register container bindings */
    bindings?: Record<string, unknown>;
}

/**
 * Create a mock Application for plugin testing.
 * Provides a fully functional config manager, container, and express mock.
 */
export function createTestApp(options: TestAppOptions = {}): Application {
    const basePath = options.basePath ?? process.cwd();
    const config = new MockConfigManager();
    const container = new MockServiceContainer();
    const express = new MockExpress();

    // Apply initial config
    if (options.config) {
        for (const [key, value] of Object.entries(options.config)) {
            config.set(key, value);
        }
    }

    const app: Record<string, unknown> = {
        basePath,
        config,
        container,
        express,
        plugins: null, // Set after creation
        register: () => app,
        terminating: () => app,
        make: <T>(key: string) => container.make<T>(key),
        appPath: (...segments: string[]) => [basePath, 'app', ...segments].join('/'),
        databasePath: (...segments: string[]) => [basePath, 'database', ...segments].join('/'),
        storagePath: (...segments: string[]) => [basePath, 'storage', ...segments].join('/'),
        configPath: (...segments: string[]) => [basePath, 'config', ...segments].join('/'),
        pluginsPath: (...segments: string[]) => [basePath, 'plugins', ...segments].join('/'),
    };

    // Create plugin manager and attach
    const plugins = new PluginManager(app as unknown as Application);
    app.plugins = plugins;

    // Register core instances
    container.instance('app', app);
    container.instance('express', express);
    container.instance('config', config);
    container.instance('plugins', plugins);

    // Apply pre-registered bindings
    if (options.bindings) {
        for (const [key, value] of Object.entries(options.bindings)) {
            container.instance(key, value);
        }
    }

    return app as unknown as Application;
}

// ── Plugin Test Harness ──────────────────────────────────────

export interface PluginTestResult {
    /** Whether the plugin registered successfully */
    registered: boolean;

    /** Whether the plugin booted successfully */
    booted: boolean;

    /** Any errors encountered */
    errors: string[];

    /** The mock application instance */
    app: Application;

    /** The plugin manager */
    pluginManager: PluginManager;

    /** The plugin registry entry (if registered) */
    entry?: PluginRegistryEntry;

    /** Config values after plugin registration */
    config: Record<string, unknown>;

    /** Health check result (if plugin has health check) */
    healthy?: boolean;
}

/**
 * Test a plugin through its full lifecycle in isolation.
 * Registers, boots, and optionally health-checks the plugin.
 */
export async function testPlugin(
    plugin: HyperZPlugin,
    options: TestAppOptions & {
        /** Whether to also run the boot phase (default: true) */
        boot?: boolean;
        /** Whether to run health check (default: true if plugin has one) */
        healthCheck?: boolean;
        /** Additional plugins to register as dependencies */
        dependencies?: HyperZPlugin[];
    } = {}
): Promise<PluginTestResult> {
    const app = createTestApp(options);
    const pluginManager = app.plugins;
    const errors: string[] = [];
    let registered = false;
    let booted = false;
    let healthy: boolean | undefined;

    // Register dependency plugins first
    if (options.dependencies) {
        for (const dep of options.dependencies) {
            try {
                await pluginManager.register(dep);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`Dependency ${dep.meta.name} failed to register: ${msg}`);
            }
        }
    }

    // Register the plugin under test
    try {
        await pluginManager.register(plugin);
        const entry = pluginManager.get(plugin.meta.name);
        registered = entry?.status === 'registered';

        if (!registered && entry?.error) {
            errors.push(entry.error);
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Registration failed: ${msg}`);
    }

    // Boot if requested
    if (registered && (options.boot ?? true)) {
        try {
            await pluginManager.bootAll();
            const entry = pluginManager.get(plugin.meta.name);
            booted = entry?.status === 'booted';

            if (!booted && entry?.error) {
                errors.push(entry.error);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Boot failed: ${msg}`);
        }
    }

    // Health check
    const shouldHealthCheck = options.healthCheck ?? !!plugin.hooks?.healthCheck;
    if (booted && shouldHealthCheck) {
        const results = await pluginManager.healthCheck();
        healthy = results.get(plugin.meta.name);
    }

    return {
        registered,
        booted,
        errors,
        app,
        pluginManager,
        entry: pluginManager.get(plugin.meta.name),
        config: (app.config as unknown as MockConfigManager).all(),
        healthy,
    };
}

// ── Assertion Helpers ────────────────────────────────────────

/**
 * Assert that a plugin registered successfully.
 * Throws if registration failed.
 */
export function assertPluginRegistered(result: PluginTestResult): void {
    if (!result.registered) {
        throw new Error(
            `Plugin failed to register. Errors:\n${result.errors.join('\n')}`
        );
    }
}

/**
 * Assert that a plugin booted successfully.
 * Throws if boot failed.
 */
export function assertPluginBooted(result: PluginTestResult): void {
    if (!result.booted) {
        throw new Error(
            `Plugin failed to boot. Errors:\n${result.errors.join('\n')}`
        );
    }
}

/**
 * Assert that a plugin is healthy.
 * Throws if the health check failed or was not run.
 */
export function assertPluginHealthy(result: PluginTestResult): void {
    if (result.healthy !== true) {
        throw new Error(
            `Plugin health check failed. Healthy: ${result.healthy}. Errors:\n${result.errors.join('\n')}`
        );
    }
}

/**
 * Assert that a config key was set by the plugin.
 */
export function assertConfigSet(result: PluginTestResult, key: string, expectedValue?: unknown): void {
    const value = (result.app.config as unknown as MockConfigManager).get(key);
    if (value === undefined) {
        throw new Error(`Expected config key "${key}" to be set, but it was undefined`);
    }
    if (expectedValue !== undefined && value !== expectedValue) {
        throw new Error(
            `Expected config "${key}" to be ${JSON.stringify(expectedValue)}, got ${JSON.stringify(value)}`
        );
    }
}

/**
 * Assert that a container binding exists.
 */
export function assertBound(result: PluginTestResult, key: string): void {
    const has = (result.app.container as unknown as MockServiceContainer).has(key);
    if (!has) {
        throw new Error(`Expected container binding "${key}" to exist`);
    }
}
