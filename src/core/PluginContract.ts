// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Plugin Contract & Types
// ──────────────────────────────────────────────────────────────
//
// Defines the formal interface for HyperZ plugins. Plugins can
// hook into the framework lifecycle, register services, routes,
// middleware, CLI commands, and more.
// ──────────────────────────────────────────────────────────────

import type { Application } from './Application.js';
import type { ServiceProvider } from './ServiceProvider.js';

// ── Plugin Metadata ──────────────────────────────────────────

export interface PluginMeta {
    /** Unique plugin identifier (e.g., 'hyperz-auth-oauth2') */
    name: string;

    /** Semver version string (e.g., '1.2.0') */
    version: string;

    /** Human-readable description */
    description?: string;

    /** Author name or object */
    author?: string | { name: string; email?: string; url?: string };

    /** HyperZ framework version constraint (semver range, e.g., '>=1.0.0') */
    hyperz?: string;

    /** Plugin homepage URL */
    homepage?: string;

    /** License identifier (e.g., 'MIT') */
    license?: string;
}

// ── Plugin Configuration Schema ──────────────────────────────

export interface PluginConfigSchema {
    /** Configuration key namespace (e.g., 'oauth2') — merged into app config under this key */
    key: string;

    /** Default configuration values */
    defaults: Record<string, unknown>;

    /** Required environment variables */
    envVars?: string[];

    /** Validate the resolved config — throw if invalid */
    validate?: (config: Record<string, unknown>) => void | Promise<void>;
}

// ── Plugin Resource Paths ────────────────────────────────────

export interface PluginResources {
    /** Path to plugin's migrations directory (relative to plugin root) */
    migrations?: string;

    /** Path to plugin's seeders directory (relative to plugin root) */
    seeders?: string;

    /** Path to publishable config files (relative to plugin root) */
    config?: string;

    /** Path to translation files (relative to plugin root) */
    lang?: string;

    /** Path to publishable view/asset files (relative to plugin root) */
    views?: string;

    /** Path to plugin's model/entity files (relative to plugin root) */
    models?: string;
}

// ── Plugin Publishable Resources ─────────────────────────────

export interface PublishableResource {
    /** Source path (within the plugin) */
    source: string;

    /** Destination path (within the application) */
    destination: string;

    /** Tag for selective publishing (e.g., 'config', 'migrations', 'lang') */
    tag: string;
}

// ── Plugin Lifecycle Hooks ───────────────────────────────────

export interface PluginHooks {
    /** Called before the application boots — register bindings, config */
    register?: (app: Application) => void | Promise<void>;

    /** Called after all providers have been registered and the app has booted */
    boot?: (app: Application) => void | Promise<void>;

    /** Called when the plugin is being unloaded / app shuts down */
    shutdown?: (app: Application) => void | Promise<void>;

    /** Called after all routes have been loaded — useful for adding plugin routes */
    routes?: (app: Application) => void | Promise<void>;

    /** Called to register CLI commands from the plugin */
    commands?: (program: unknown, app: Application) => void | Promise<void>;

    /** Register scheduled tasks from the plugin */
    schedule?: (scheduler: unknown, app: Application) => void | Promise<void>;

    /** Health check — should return true if the plugin is healthy */
    healthCheck?: (app: Application) => boolean | Promise<boolean>;
}

// ── Plugin Dependencies ──────────────────────────────────────

export interface PluginDependency {
    /** Name of the required plugin */
    name: string;

    /** Semver version constraint (e.g., '>=1.0.0', '^2.0.0') */
    version?: string;

    /** If false, the dependency is optional (default: true) */
    required?: boolean;
}

// ── Full Plugin Contract ─────────────────────────────────────

export interface HyperZPlugin {
    /** Plugin metadata */
    meta: PluginMeta;

    /** Service provider class (optional — can use hooks instead) */
    provider?: new (...args: unknown[]) => ServiceProvider;

    /** Plugin lifecycle hooks */
    hooks?: PluginHooks;

    /** Configuration schema and defaults */
    config?: PluginConfigSchema;

    /** Dependencies on other plugins */
    dependencies?: PluginDependency[];

    /** Middleware to register globally */
    middleware?: Array<(...args: unknown[]) => unknown>;

    /** Named route middleware to register (e.g., { 'oauth': oauthMiddleware }) */
    routeMiddleware?: Record<string, (...args: unknown[]) => unknown>;

    /** Plugin resource paths (migrations, seeders, config, lang, views, models) */
    resources?: PluginResources;

    /** Publishable resources with source → destination mappings */
    publishable?: PublishableResource[];

    /** Tags for categorization / filtering */
    tags?: string[];
}

// ── Plugin Registry Entry ────────────────────────────────────

export interface PluginRegistryEntry {
    plugin: HyperZPlugin;
    status: 'registered' | 'booted' | 'failed' | 'disabled';
    loadedAt: Date;
    error?: string;
    source: 'auto-discover' | 'manual' | 'local';
}

// ── Plugin Events ────────────────────────────────────────────

export type PluginEventType =
    | 'plugin:registered'
    | 'plugin:booted'
    | 'plugin:failed'
    | 'plugin:shutdown'
    | 'plugin:health-check';

export interface PluginEvent {
    type: PluginEventType;
    pluginName: string;
    timestamp: Date;
    data?: Record<string, unknown>;
}

// ── definePlugin helper for type-safe plugin definitions ─────

/**
 * Type-safe helper to define a HyperZ plugin.
 *
 * @example
 * ```ts
 * export default definePlugin({
 *   meta: { name: 'my-plugin', version: '1.0.0' },
 *   hooks: {
 *     register(app) { app.container.singleton('myService', () => new MyService()); },
 *     boot(app) { console.log('My plugin booted!'); },
 *   },
 *   config: {
 *     key: 'myPlugin',
 *     defaults: { enabled: true, apiKey: '' },
 *     envVars: ['MY_PLUGIN_API_KEY'],
 *   },
 * });
 * ```
 */
export function definePlugin(plugin: HyperZPlugin): HyperZPlugin {
    return plugin;
}
