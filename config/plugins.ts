// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Plugin Ecosystem Configuration
// ──────────────────────────────────────────────────────────────

import { env } from '../src/support/helpers.js';

export default {
    /*
    |--------------------------------------------------------------------------
    | Auto-Discovery
    |--------------------------------------------------------------------------
    |
    | When enabled, the framework will automatically discover plugins from
    | node_modules/ (packages with "hyperz-plugin" in package.json) and
    | from the plugins/ directory (local plugins).
    |
    */
    autoDiscover: env('PLUGIN_AUTO_DISCOVER', 'true') === 'true',

    /*
    |--------------------------------------------------------------------------
    | Discovery Paths
    |--------------------------------------------------------------------------
    |
    | Additional directories to scan for local plugins beyond the default
    | plugins/ directory. Paths are relative to the application root.
    |
    */
    paths: [
        'plugins',
    ],

    /*
    |--------------------------------------------------------------------------
    | Disabled Plugins
    |--------------------------------------------------------------------------
    |
    | List of plugin names that should NOT be loaded even if discovered.
    | Use this to temporarily disable a plugin without uninstalling it.
    |
    */
    disabled: [] as string[],

    /*
    |--------------------------------------------------------------------------
    | Plugin Load Order
    |--------------------------------------------------------------------------
    |
    | Override the default dependency-resolved boot order. Plugins listed
    | here will be booted in this exact order, before any remaining plugins.
    | Plugins not listed follow their normal dependency order after these.
    |
    */
    priority: [] as string[],

    /*
    |--------------------------------------------------------------------------
    | Health Check
    |--------------------------------------------------------------------------
    |
    | Configuration for plugin health check behavior.
    |
    */
    healthCheck: {
        /** Include plugin health in the /health endpoint */
        enabled: env('PLUGIN_HEALTH_CHECK', 'true') === 'true',

        /** Timeout for each plugin health check (ms) */
        timeout: 5000,
    },
};
