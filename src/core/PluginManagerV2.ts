// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Enhanced Plugin Manager
//
// Manages the full plugin lifecycle: discovery, validation,
// dependency resolution, registration, boot, health checks,
// and shutdown. Supports auto-discovery from node_modules,
// local plugins from plugins/, and manual registration.
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logging/Logger.js';
import { routeRegistry } from '../http/RouteRegistry.js';
import type { Application } from './Application.js';
import type {
    HyperZPlugin,
    PluginRegistryEntry,
    PluginEvent,
    PluginEventType,
    PluginDependency,
    PublishableResource,
} from './PluginContract.js';

export interface PluginMetrics {
    /** Time taken to register the plugin (ms) */
    registerTime: number;

    /** Time taken to boot the plugin (ms) */
    bootTime: number;

    /** Number of errors encountered */
    errorCount: number;

    /** Total discovery time (set once after discover()) */
    discoveryTime?: number;
}

export class PluginManager {
    private app: Application;
    private registry: Map<string, PluginRegistryEntry> = new Map();
    private eventLog: PluginEvent[] = [];
    private listeners: Map<PluginEventType, Array<(event: PluginEvent) => void>> = new Map();

    /** Additional migration paths registered by plugins */
    private migrationPaths: string[] = [];

    /** Additional seeder paths registered by plugins */
    private seederPaths: string[] = [];

    /** Additional entity/model paths registered by plugins */
    private entityPaths: string[] = [];

    /** Plugin root directory paths (name → absolute path) */
    private pluginRoots: Map<string, string> = new Map();

    /** All publishable resources from plugins */
    private publishableResources: PublishableResource[] = [];

    /** Plugin performance metrics */
    private metrics: Map<string, PluginMetrics> = new Map();

    /** Total discovery time (ms) */
    private totalDiscoveryTime = 0;

    /** Total boot time (ms) */
    private totalBootTime = 0;

    constructor(app: Application) {
        this.app = app;
    }

    // ── Metrics Accessors ────────────────────────────────────

    /** Get metrics for a specific plugin */
    getMetrics(name: string): PluginMetrics | undefined {
        return this.metrics.get(name);
    }

    /** Get metrics for all plugins */
    getAllMetrics(): Map<string, PluginMetrics> {
        return new Map(this.metrics);
    }

    /** Get total discovery time (ms) */
    getDiscoveryTime(): number {
        return this.totalDiscoveryTime;
    }

    /** Get total boot time (ms) */
    getBootTime(): number {
        return this.totalBootTime;
    }

    // ── Resource Path Accessors ──────────────────────────────

    /** Get all additional migration paths registered by plugins */
    getMigrationPaths(): string[] {
        return [...this.migrationPaths];
    }

    /** Get all additional seeder paths registered by plugins */
    getSeederPaths(): string[] {
        return [...this.seederPaths];
    }

    /** Get all additional entity/model paths registered by plugins */
    getEntityPaths(): string[] {
        return [...this.entityPaths];
    }

    /** Get all publishable resources from all plugins */
    getPublishableResources(tag?: string): PublishableResource[] {
        if (tag) {
            return this.publishableResources.filter(r => r.tag === tag);
        }
        return [...this.publishableResources];
    }

    /** Get the root directory path of a registered plugin */
    getPluginRoot(name: string): string | undefined {
        return this.pluginRoots.get(name);
    }

    // ── Registration ─────────────────────────────────────────

    /**
     * Manually register a plugin.
     */
    async register(plugin: HyperZPlugin): Promise<void> {
        await this.registerPlugin(plugin, 'manual');
    }

    /**
     * Register a plugin from a local file path.
     */
    async registerFromPath(pluginPath: string): Promise<void> {
        try {
            const mod = await import(pluginPath);
            const plugin: HyperZPlugin = mod.default ?? mod;
            if (!plugin.meta?.name) {
                Logger.error(`[Plugin] Invalid plugin at ${pluginPath}: missing meta.name`);
                return;
            }
            await this.registerPlugin(plugin, 'local');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            Logger.error(`[Plugin] Failed to load plugin from ${pluginPath}`, { error: message });
        }
    }

    private async registerPlugin(
        plugin: HyperZPlugin,
        source: PluginRegistryEntry['source']
    ): Promise<void> {
        const name = plugin.meta.name;
        const startTime = performance.now();

        // Prevent duplicate registration
        if (this.registry.has(name)) {
            Logger.warn(`[Plugin] "${name}" is already registered — skipping`);
            return;
        }

        // Validate plugin structure
        const validationError = this.validatePlugin(plugin);
        if (validationError) {
            this.registry.set(name, {
                plugin,
                status: 'failed',
                loadedAt: new Date(),
                error: validationError,
                source,
            });
            this.emit('plugin:failed', name, { error: validationError });
            Logger.error(`[Plugin] "${name}" validation failed: ${validationError}`);
            return;
        }

        // Register config defaults
        if (plugin.config) {
            const currentConfig = this.app.config.get(plugin.config.key, {}) as Record<string, unknown>;
            const mergedConfig = { ...plugin.config.defaults, ...currentConfig };
            this.app.config.set(plugin.config.key, mergedConfig);

            // Validate config if validator is provided
            if (plugin.config.validate) {
                try {
                    await plugin.config.validate(mergedConfig);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    this.registry.set(name, {
                        plugin,
                        status: 'failed',
                        loadedAt: new Date(),
                        error: `Config validation failed: ${message}`,
                        source,
                    });
                    this.emit('plugin:failed', name, { error: message });
                    Logger.error(`[Plugin] "${name}" config validation failed: ${message}`);
                    return;
                }
            }
        }

        // Register the service provider if provided
        if (plugin.provider) {
            this.app.register(plugin.provider);
        }

        // Call the register hook
        if (plugin.hooks?.register) {
            try {
                await plugin.hooks.register(this.app);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                this.registry.set(name, {
                    plugin,
                    status: 'failed',
                    loadedAt: new Date(),
                    error: `Register hook failed: ${message}`,
                    source,
                });
                this.emit('plugin:failed', name, { error: message });
                Logger.error(`[Plugin] "${name}" register hook failed: ${message}`);
                return;
            }
        }

        // Register global middleware
        if (plugin.middleware) {
            for (const mw of plugin.middleware) {
                this.app.express.use(mw as never);
            }
        }

        // Register named route middleware
        if (plugin.routeMiddleware) {
            const existing = this.app.container.make<Record<string, unknown>>('middleware.route') ?? {};
            for (const [middlewareName, handler] of Object.entries(plugin.routeMiddleware)) {
                if (existing[middlewareName]) {
                    Logger.warn(`[Plugin] "${name}" route middleware "${middlewareName}" conflicts with existing — skipping`);
                } else {
                    existing[middlewareName] = handler;
                }
            }
            this.app.container.instance('middleware.route', existing);
        }

        // Register publishable resources
        if (plugin.publishable) {
            this.publishableResources.push(...plugin.publishable);
        }

        this.registry.set(name, {
            plugin,
            status: 'registered',
            loadedAt: new Date(),
            source,
        });

        this.emit('plugin:registered', name);

        // Record registration metrics
        const registerTime = performance.now() - startTime;
        this.metrics.set(name, { registerTime, bootTime: 0, errorCount: 0 });

        Logger.info(`  🔌 Plugin registered: ${name} v${plugin.meta.version} (${registerTime.toFixed(1)}ms)`);
    }

    // ── Boot ─────────────────────────────────────────────────

    /**
     * Boot all registered plugins (call boot hooks, register routes/commands).
     * Must be called after app.boot().
     */
    async bootAll(): Promise<void> {
        const bootStart = performance.now();

        // Resolve boot order based on dependencies
        const ordered = this.resolveDependencyOrder();

        for (const name of ordered) {
            const entry = this.registry.get(name);
            if (!entry || entry.status !== 'registered') continue;

            const pluginBootStart = performance.now();

            try {
                // Check dependencies are satisfied
                this.checkDependencies(entry.plugin);

                // Register resource paths (migrations, seeders, models)
                this.registerResourcePaths(name, entry.plugin);

                // Boot hook
                if (entry.plugin.hooks?.boot) {
                    await entry.plugin.hooks.boot(this.app);
                }

                // Routes hook
                if (entry.plugin.hooks?.routes) {
                    await entry.plugin.hooks.routes(this.app);
                }

                // Schedule hook
                if (entry.plugin.hooks?.schedule) {
                    const scheduler = this.app.container.make('scheduler');
                    if (scheduler) {
                        await entry.plugin.hooks.schedule(scheduler, this.app);
                    }
                }

                // Record boot time
                const bootTime = performance.now() - pluginBootStart;
                const existing = this.metrics.get(name);
                if (existing) {
                    existing.bootTime = bootTime;
                }

                entry.status = 'booted';
                this.emit('plugin:booted', name);
                Logger.info(`  🔌 Plugin booted: ${name} (${bootTime.toFixed(1)}ms)`);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                entry.status = 'failed';
                entry.error = `Boot failed: ${message}`;

                // Record error in metrics
                const existing = this.metrics.get(name);
                if (existing) {
                    existing.errorCount++;
                }

                this.emit('plugin:failed', name, { error: message });
                Logger.error(`[Plugin] "${name}" boot failed: ${message}`);
            }
        }

        // Record total boot time
        this.totalBootTime = performance.now() - bootStart;

        // Check for route collisions after all plugins have registered routes
        const collisions = routeRegistry.getCollisions();
        if (collisions.length > 0) {
            Logger.warn(`[Plugin] ⚠ ${collisions.length} route collision(s) detected:`);
            for (const collision of collisions) {
                const sources = collision.routes.map(r => r.source).join(', ');
                Logger.warn(`  → ${collision.method} ${collision.path} — sources: ${sources}`);
            }
        }

        if (this.registry.size > 0) {
            Logger.info(`  🔌 Plugin boot complete (${this.totalBootTime.toFixed(1)}ms total)`);
        }
    }

    /**
     * Register CLI commands from all plugins.
     * Called by the CLI entry point with the Commander program instance.
     */
    async registerCommands(program: unknown): Promise<void> {
        for (const [name, entry] of this.registry) {
            if (entry.status === 'failed' || entry.status === 'disabled') continue;
            if (entry.plugin.hooks?.commands) {
                try {
                    await entry.plugin.hooks.commands(program, this.app);
                    Logger.debug(`[Plugin] "${name}" commands registered`);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    Logger.error(`[Plugin] "${name}" command registration failed: ${message}`);
                }
            }
        }
    }

    /**
     * Register resource paths (migrations, seeders, models) from a plugin.
     */
    private registerResourcePaths(name: string, plugin: HyperZPlugin): void {
        const pluginRoot = this.pluginRoots.get(name);
        if (!pluginRoot || !plugin.resources) return;

        if (plugin.resources.migrations) {
            const migrationPath = path.resolve(pluginRoot, plugin.resources.migrations);
            if (fs.existsSync(migrationPath)) {
                this.migrationPaths.push(path.join(migrationPath, '**/*.{ts,js}'));
                Logger.debug(`[Plugin] "${name}" migrations registered: ${migrationPath}`);
            }
        }

        if (plugin.resources.seeders) {
            const seederPath = path.resolve(pluginRoot, plugin.resources.seeders);
            if (fs.existsSync(seederPath)) {
                this.seederPaths.push(seederPath);
                Logger.debug(`[Plugin] "${name}" seeders registered: ${seederPath}`);
            }
        }

        if (plugin.resources.models) {
            const modelPath = path.resolve(pluginRoot, plugin.resources.models);
            if (fs.existsSync(modelPath)) {
                this.entityPaths.push(path.join(modelPath, '**/*.{ts,js}'));
                Logger.debug(`[Plugin] "${name}" models registered: ${modelPath}`);
            }
        }
    }

    // ── Discovery ────────────────────────────────────────────

    /**
     * Auto-discover plugins from node_modules (package.json "hyperz-plugin" key)
     * and from the local plugins/ directory.
     */
    async discover(): Promise<void> {
        const start = performance.now();
        await this.discoverFromNodeModules();
        await this.discoverFromLocalPlugins();
        this.totalDiscoveryTime = performance.now() - start;

        if (this.registry.size > 0) {
            Logger.info(`  🔌 Plugin discovery: ${this.registry.size} found (${this.totalDiscoveryTime.toFixed(1)}ms)`);
        }
    }

    private async discoverFromNodeModules(): Promise<void> {
        const nodeModules = path.join(this.app.basePath, 'node_modules');
        if (!fs.existsSync(nodeModules)) return;

        const dirs = fs.readdirSync(nodeModules);

        for (const dir of dirs) {
            if (dir.startsWith('.')) continue;

            // Handle scoped packages (@org/package)
            if (dir.startsWith('@')) {
                const scopedDir = path.join(nodeModules, dir);
                if (!fs.statSync(scopedDir).isDirectory()) continue;
                const scopedPackages = fs.readdirSync(scopedDir);
                for (const pkg of scopedPackages) {
                    await this.tryDiscoverPackage(path.join(scopedDir, pkg), `${dir}/${pkg}`);
                }
                continue;
            }

            await this.tryDiscoverPackage(path.join(nodeModules, dir), dir);
        }
    }

    private async tryDiscoverPackage(pkgDir: string, pkgName: string): Promise<void> {
        try {
            const pkgJsonPath = path.join(pkgDir, 'package.json');
            if (!fs.existsSync(pkgJsonPath)) return;

            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
            const manifest = pkgJson['hyperz-plugin'];
            if (!manifest) return;

            // New-style: plugin exports a HyperZPlugin object
            if (manifest.entry || manifest.main) {
                const entryFile = manifest.entry || manifest.main || pkgJson.main || 'index.js';
                const fullPath = path.join(pkgDir, entryFile);
                const mod = await import(fullPath);
                const plugin: HyperZPlugin = mod.default ?? mod;

                if (plugin.meta?.name) {
                    this.pluginRoots.set(plugin.meta.name, pkgDir);
                    await this.registerPlugin(plugin, 'auto-discover');
                    return;
                }
            }

            // Legacy-style: just a provider name
            if (manifest.provider) {
                const pluginModule = await import(pkgName);
                const ProviderClass = pluginModule[manifest.provider] ?? pluginModule.default;

                if (ProviderClass) {
                    const legacyPlugin: HyperZPlugin = {
                        meta: {
                            name: pkgName,
                            version: pkgJson.version || '0.0.0',
                            description: pkgJson.description,
                        },
                        provider: ProviderClass,
                    };
                    this.pluginRoots.set(pkgName, pkgDir);
                    await this.registerPlugin(legacyPlugin, 'auto-discover');
                }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            Logger.error(`[Plugin] Failed to discover "${pkgName}"`, { error: message });
        }
    }

    private async discoverFromLocalPlugins(): Promise<void> {
        const pluginsDir = path.join(this.app.basePath, 'plugins');
        if (!fs.existsSync(pluginsDir)) return;

        const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            const pluginDir = path.join(pluginsDir, entry.name);
            const indexPath = path.join(pluginDir, 'index.ts');
            const indexJsPath = path.join(pluginDir, 'index.js');
            const entryPath = fs.existsSync(indexPath) ? indexPath : fs.existsSync(indexJsPath) ? indexJsPath : null;

            if (!entryPath) {
                Logger.warn(`[Plugin] Local plugin "${entry.name}" has no index.ts/js — skipping`);
                continue;
            }

            // Track local plugin root before loading
            try {
                const mod = await import(`file://${entryPath.replace(/\\/g, '/')}`);
                const plugin: HyperZPlugin = mod.default ?? mod;
                if (plugin.meta?.name) {
                    this.pluginRoots.set(plugin.meta.name, pluginDir);
                }
                await this.registerPlugin(plugin, 'local');
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                Logger.error(`[Plugin] Failed to load local plugin "${entry.name}"`, { error: message });
            }
        }
    }

    // ── Dependency Resolution ────────────────────────────────

    private resolveDependencyOrder(): string[] {
        const visited = new Set<string>();
        const ordered: string[] = [];

        const visit = (name: string, ancestors: Set<string> = new Set()) => {
            if (visited.has(name)) return;
            if (ancestors.has(name)) {
                Logger.warn(`[Plugin] Circular dependency detected involving "${name}"`);
                return;
            }

            ancestors.add(name);
            const entry = this.registry.get(name);
            if (!entry) return;

            for (const dep of entry.plugin.dependencies ?? []) {
                if (this.registry.has(dep.name)) {
                    visit(dep.name, new Set(ancestors));
                }
            }

            visited.add(name);
            ordered.push(name);
        };

        for (const name of this.registry.keys()) {
            visit(name);
        }

        return ordered;
    }

    private checkDependencies(plugin: HyperZPlugin): void {
        for (const dep of plugin.dependencies ?? []) {
            const entry = this.registry.get(dep.name);
            const required = dep.required !== false;

            if (!entry) {
                if (required) {
                    throw new Error(`Missing required dependency: ${dep.name}`);
                }
                continue;
            }

            if (entry.status === 'failed') {
                if (required) {
                    throw new Error(`Dependency "${dep.name}" is in failed state`);
                }
            }

            // Version check (basic semver major.minor.patch comparison)
            if (dep.version && entry.plugin.meta.version) {
                if (!this.satisfiesVersion(entry.plugin.meta.version, dep.version)) {
                    const msg = `Dependency "${dep.name}" version ${entry.plugin.meta.version} does not satisfy ${dep.version}`;
                    if (required) throw new Error(msg);
                    Logger.warn(`[Plugin] ${msg}`);
                }
            }
        }
    }

    private satisfiesVersion(actual: string, constraint: string): boolean {
        // Basic semver check — supports >=, ^, and exact match
        const parse = (v: string) => {
            const match = v.match(/(\d+)\.(\d+)\.(\d+)/);
            if (!match) return { major: 0, minor: 0, patch: 0 };
            return { major: parseInt(match[1]), minor: parseInt(match[2]), patch: parseInt(match[3]) };
        };

        const actualV = parse(actual);
        const cleanConstraint = constraint.replace(/^[>=^~]+/, '');
        const constraintV = parse(cleanConstraint);

        if (constraint.startsWith('>=')) {
            return (
                actualV.major > constraintV.major ||
                (actualV.major === constraintV.major && actualV.minor > constraintV.minor) ||
                (actualV.major === constraintV.major && actualV.minor === constraintV.minor && actualV.patch >= constraintV.patch)
            );
        }

        if (constraint.startsWith('^')) {
            // Compatible with — same major, >= minor.patch
            return actualV.major === constraintV.major && (
                actualV.minor > constraintV.minor ||
                (actualV.minor === constraintV.minor && actualV.patch >= constraintV.patch)
            );
        }

        // Exact match
        return actualV.major === constraintV.major && actualV.minor === constraintV.minor && actualV.patch === constraintV.patch;
    }

    // ── Validation ───────────────────────────────────────────

    private validatePlugin(plugin: HyperZPlugin): string | null {
        if (!plugin.meta) return 'Plugin must have a "meta" property';
        if (!plugin.meta.name) return 'Plugin meta.name is required';
        if (!plugin.meta.version) return 'Plugin meta.version is required';

        if (plugin.config) {
            if (!plugin.config.key) return 'Plugin config.key is required';
            if (typeof plugin.config.defaults !== 'object' || plugin.config.defaults === null) {
                return 'Plugin config.defaults must be an object';
            }
        }

        if (plugin.dependencies) {
            for (const dep of plugin.dependencies) {
                if (!dep.name) return 'Dependency name is required';
            }
        }

        return null;
    }

    // ── Health Checks ────────────────────────────────────────

    /**
     * Run health checks for all booted plugins.
     * Returns a map of plugin name → healthy boolean.
     */
    async healthCheck(): Promise<Map<string, boolean>> {
        const results = new Map<string, boolean>();

        for (const [name, entry] of this.registry) {
            if (entry.status !== 'booted') {
                results.set(name, false);
                continue;
            }

            if (entry.plugin.hooks?.healthCheck) {
                try {
                    const healthy = await entry.plugin.hooks.healthCheck(this.app);
                    results.set(name, healthy);
                    this.emit('plugin:health-check', name, { healthy });
                } catch {
                    results.set(name, false);
                }
            } else {
                results.set(name, true); // No health check = assumed healthy
            }
        }

        return results;
    }

    // ── Shutdown ─────────────────────────────────────────────

    /**
     * Gracefully shut down all booted plugins.
     */
    async shutdown(): Promise<void> {
        // Shutdown in reverse boot order
        const ordered = this.resolveDependencyOrder().reverse();

        for (const name of ordered) {
            const entry = this.registry.get(name);
            if (!entry || entry.status !== 'booted') continue;

            if (entry.plugin.hooks?.shutdown) {
                try {
                    await entry.plugin.hooks.shutdown(this.app);
                    this.emit('plugin:shutdown', name);
                    Logger.info(`  🔌 Plugin shutdown: ${name}`);
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    Logger.error(`[Plugin] "${name}" shutdown failed: ${message}`);
                }
            }
        }
    }

    // ── Query Methods ────────────────────────────────────────

    /** Get a registered plugin by name */
    get(name: string): PluginRegistryEntry | undefined {
        return this.registry.get(name);
    }

    /** Check if a plugin is registered */
    has(name: string): boolean {
        return this.registry.has(name);
    }

    /** Get all registered plugins */
    all(): Map<string, PluginRegistryEntry> {
        return new Map(this.registry);
    }

    /** Get only booted plugins */
    booted(): PluginRegistryEntry[] {
        return [...this.registry.values()].filter((e) => e.status === 'booted');
    }

    /** Get only failed plugins */
    failed(): PluginRegistryEntry[] {
        return [...this.registry.values()].filter((e) => e.status === 'failed');
    }

    /** Get plugin count */
    count(): number {
        return this.registry.size;
    }

    /** Get the full event log */
    getEventLog(): PluginEvent[] {
        return [...this.eventLog];
    }

    // ── Event System ─────────────────────────────────────────

    on(event: PluginEventType, listener: (event: PluginEvent) => void): void {
        const list = this.listeners.get(event) ?? [];
        list.push(listener);
        this.listeners.set(event, list);
    }

    private emit(type: PluginEventType, pluginName: string, data?: Record<string, unknown>): void {
        const event: PluginEvent = { type, pluginName, timestamp: new Date(), data };
        this.eventLog.push(event);

        const listeners = this.listeners.get(type) ?? [];
        for (const listener of listeners) {
            try {
                listener(event);
            } catch {
                // Swallow listener errors
            }
        }
    }
}
