// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Plugin Dev Watcher
//
// Watches the plugins/ directory for file changes during
// development and reloads plugin modules. Used when running
// the dev server to enable rapid plugin iteration.
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logging/Logger.js';
import type { Application } from './Application.js';

export class PluginDevWatcher {
    private app: Application;
    private watcher: fs.FSWatcher | null = null;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private debounceMs: number;
    private watching = false;
    private onReload?: (pluginDir: string) => void | Promise<void>;

    constructor(app: Application, options: { debounceMs?: number } = {}) {
        this.app = app;
        this.debounceMs = options.debounceMs ?? 500;
    }

    /**
     * Set a callback to be invoked when a plugin file changes.
     */
    onPluginReload(callback: (pluginDir: string) => void | Promise<void>): this {
        this.onReload = callback;
        return this;
    }

    /**
     * Start watching the plugins/ directory for changes.
     * Only works in development mode.
     */
    start(): void {
        const env = this.app.config.get<string>('app.env', 'development');
        if (env !== 'development') {
            Logger.debug('[PluginDevWatcher] Skipping — not in development mode');
            return;
        }

        const pluginsDir = path.join(this.app.basePath, 'plugins');

        if (!fs.existsSync(pluginsDir)) {
            Logger.debug('[PluginDevWatcher] No plugins/ directory found — skipping');
            return;
        }

        if (this.watching) {
            Logger.warn('[PluginDevWatcher] Already watching');
            return;
        }

        try {
            this.watcher = fs.watch(pluginsDir, { recursive: true }, (eventType, filename) => {
                if (!filename) return;

                // Only respond to .ts and .js file changes
                if (!filename.endsWith('.ts') && !filename.endsWith('.js')) return;

                // Debounce to avoid rapid-fire reloads
                if (this.debounceTimer) {
                    clearTimeout(this.debounceTimer);
                }

                this.debounceTimer = setTimeout(() => {
                    this.handleChange(eventType, filename, pluginsDir);
                }, this.debounceMs);
            });

            this.watching = true;
            Logger.info('  👁 Plugin dev watcher active (plugins/ directory)');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            Logger.error(`[PluginDevWatcher] Failed to start: ${message}`);
        }
    }

    /**
     * Stop watching.
     */
    stop(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        this.watching = false;
        Logger.debug('[PluginDevWatcher] Stopped');
    }

    /**
     * Check if the watcher is currently active.
     */
    isWatching(): boolean {
        return this.watching;
    }

    // ── Private ──────────────────────────────────────────────

    private handleChange(eventType: string, filename: string, pluginsDir: string): void {
        // Extract the plugin directory name from the changed file path
        const parts = filename.split(path.sep);
        const pluginDirName = parts[0];

        if (!pluginDirName) return;

        const pluginDir = path.join(pluginsDir, pluginDirName);

        Logger.info(`  👁 Plugin file changed: ${filename} (${eventType})`);
        Logger.info(`     → Reload plugin: ${pluginDirName}`);

        // Notify callback
        if (this.onReload) {
            try {
                const result = this.onReload(pluginDir);
                // If it's a promise, catch errors
                if (result && typeof (result as Promise<void>).catch === 'function') {
                    (result as Promise<void>).catch((err: unknown) => {
                        const msg = err instanceof Error ? err.message : String(err);
                        Logger.error(`[PluginDevWatcher] Reload callback error: ${msg}`);
                    });
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                Logger.error(`[PluginDevWatcher] Reload callback error: ${msg}`);
            }
        }
    }
}
