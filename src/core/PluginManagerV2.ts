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
import type { Application } from './Application.js';
import type {
    HyperZPlugin,
    PluginRegistryEntry,
    PluginEvent,
    PluginEventType,
    PluginDependency,
} from './PluginContract.js';

export class PluginManager {
    private app: Application;
    private registry: Map<string, PluginRegistryEntry> = new Map();
    private eventLog: PluginEvent[] = [];
    private listeners: Map<PluginEventType, Array<(event: PluginEvent) => void>> = new Map();

    constructor(app: Application) {
        this.app = app;
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

        this.registry.set(name, {
            plugin,
            status: 'registered',
            loadedAt: new Date(),
            source,
        });

        this.emit('plugin:registered', name);
        Logger.info(`  🔌 Plugin registered: ${name} v${plugin.meta.version}`);
    }

    // ── Boot ─────────────────────────────────────────────────

    /**
     * Boot all registered plugins (call boot hooks, register routes/commands).
     * Must be called after app.boot().
     */
    async bootAll(): Promise<void> {
        // Resolve boot order based on dependencies
        const ordered = this.resolveDependencyOrder();

        for (const name of ordered) {
            const entry = this.registry.get(name);
            if (!entry || entry.status !== 'registered') continue;

            try {
                // Check dependencies are satisfied
                this.checkDependencies(entry.plugin);

                // Boot hook
                if (entry.plugin.hooks?.boot) {
                    await entry.plugin.hooks.boot(this.app);
                }

                // Routes hook
                if (entry.plugin.hooks?.routes) {
                    await entry.plugin.hooks.routes(this.app);
                }

                // Commands hook
                if (entry.plugin.hooks?.commands) {
                    await entry.plugin.hooks.commands(this.app);
                }

                entry.status = 'booted';
                this.emit('plugin:booted', name);
                Logger.info(`  🔌 Plugin booted: ${name}`);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                entry.status = 'failed';
                entry.error = `Boot failed: ${message}`;
                this.emit('plugin:failed', name, { error: message });
                Logger.error(`[Plugin] "${name}" boot failed: ${message}`);
            }
        }
    }

    // ── Discovery ────────────────────────────────────────────

    /**
     * Auto-discover plugins from node_modules (package.json "hyperz-plugin" key)
     * and from the local plugins/ directory.
     */
    async discover(): Promise<void> {
        await this.discoverFromNodeModules();
        await this.discoverFromLocalPlugins();
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

            await this.registerFromPath(entryPath);
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
