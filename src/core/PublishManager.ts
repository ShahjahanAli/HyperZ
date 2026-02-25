// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Publish Manager
//
// Handles publishing (copying) of plugin resources into the
// application directories. Supports config, migrations, seeders,
// language files, views, and custom publishable resources.
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logging/Logger.js';
import type { Application } from './Application.js';
import type { PublishableResource } from './PluginContract.js';

export interface PublishResult {
    source: string;
    destination: string;
    status: 'published' | 'skipped' | 'failed';
    reason?: string;
}

export class PublishManager {
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    /**
     * Publish resources for a specific plugin.
     * @param pluginName - Name of the plugin to publish from
     * @param options - Publish options
     */
    async publish(pluginName: string, options: {
        tag?: string;
        force?: boolean;
    } = {}): Promise<PublishResult[]> {
        const results: PublishResult[] = [];
        const pluginManager = this.app.plugins;

        // Check if plugin exists
        const entry = pluginManager.get(pluginName);
        if (!entry) {
            Logger.error(`[Publish] Plugin "${pluginName}" is not registered`);
            return [{ source: '', destination: '', status: 'failed', reason: 'Plugin not registered' }];
        }

        const plugin = entry.plugin;
        const pluginRoot = pluginManager.getPluginRoot(pluginName);

        if (!pluginRoot) {
            Logger.error(`[Publish] Plugin "${pluginName}" has no known root directory`);
            return [{ source: '', destination: '', status: 'failed', reason: 'Plugin root not found' }];
        }

        // Collect resources to publish
        const resources: PublishableResource[] = [];

        // Add explicitly declared publishable resources
        if (plugin.publishable) {
            resources.push(...plugin.publishable);
        }

        // Auto-generate publishable entries from resources declaration
        if (plugin.resources) {
            if (plugin.resources.config) {
                const configSource = path.resolve(pluginRoot, plugin.resources.config);
                if (fs.existsSync(configSource)) {
                    resources.push({
                        source: configSource,
                        destination: path.join(this.app.basePath, 'config'),
                        tag: 'config',
                    });
                }
            }

            if (plugin.resources.migrations) {
                const migSource = path.resolve(pluginRoot, plugin.resources.migrations);
                if (fs.existsSync(migSource)) {
                    resources.push({
                        source: migSource,
                        destination: path.join(this.app.basePath, 'database', 'migrations'),
                        tag: 'migrations',
                    });
                }
            }

            if (plugin.resources.seeders) {
                const seederSource = path.resolve(pluginRoot, plugin.resources.seeders);
                if (fs.existsSync(seederSource)) {
                    resources.push({
                        source: seederSource,
                        destination: path.join(this.app.basePath, 'database', 'seeders'),
                        tag: 'seeders',
                    });
                }
            }

            if (plugin.resources.lang) {
                const langSource = path.resolve(pluginRoot, plugin.resources.lang);
                if (fs.existsSync(langSource)) {
                    resources.push({
                        source: langSource,
                        destination: path.join(this.app.basePath, 'lang'),
                        tag: 'lang',
                    });
                }
            }

            if (plugin.resources.views) {
                const viewsSource = path.resolve(pluginRoot, plugin.resources.views);
                if (fs.existsSync(viewsSource)) {
                    resources.push({
                        source: viewsSource,
                        destination: path.join(this.app.basePath, 'resources', 'views', 'vendor', pluginName),
                        tag: 'views',
                    });
                }
            }
        }

        // Filter by tag if specified
        const filtered = options.tag
            ? resources.filter(r => r.tag === options.tag)
            : resources;

        if (filtered.length === 0) {
            Logger.info(`[Publish] No publishable resources found for "${pluginName}"${options.tag ? ` with tag "${options.tag}"` : ''}`);
            return results;
        }

        // Publish each resource
        for (const resource of filtered) {
            const result = await this.publishResource(resource, pluginRoot, options.force ?? false);
            results.push(...result);
        }

        const published = results.filter(r => r.status === 'published').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        Logger.info(`[Publish] "${pluginName}": ${published} published, ${skipped} skipped`);

        return results;
    }

    /**
     * Publish all resources from all registered plugins.
     */
    async publishAll(options: { tag?: string; force?: boolean } = {}): Promise<Map<string, PublishResult[]>> {
        const allResults = new Map<string, PublishResult[]>();
        const all = this.app.plugins.all();

        for (const [name] of all) {
            const results = await this.publish(name, options);
            if (results.length > 0) {
                allResults.set(name, results);
            }
        }

        return allResults;
    }

    /**
     * List all available publishable resources across all plugins.
     */
    listPublishable(tag?: string): Array<{ plugin: string; tag: string; source: string; destination: string }> {
        const items: Array<{ plugin: string; tag: string; source: string; destination: string }> = [];
        const all = this.app.plugins.all();

        for (const [name, entry] of all) {
            const plugin = entry.plugin;
            const pluginRoot = this.app.plugins.getPluginRoot(name);
            if (!pluginRoot) continue;

            if (plugin.publishable) {
                for (const res of plugin.publishable) {
                    if (!tag || res.tag === tag) {
                        items.push({
                            plugin: name,
                            tag: res.tag,
                            source: path.resolve(pluginRoot, res.source),
                            destination: res.destination,
                        });
                    }
                }
            }

            if (plugin.resources) {
                const resourceTags: Array<{ field: keyof typeof plugin.resources; tag: string; dest: string }> = [
                    { field: 'config', tag: 'config', dest: path.join(this.app.basePath, 'config') },
                    { field: 'migrations', tag: 'migrations', dest: path.join(this.app.basePath, 'database', 'migrations') },
                    { field: 'seeders', tag: 'seeders', dest: path.join(this.app.basePath, 'database', 'seeders') },
                    { field: 'lang', tag: 'lang', dest: path.join(this.app.basePath, 'lang') },
                    { field: 'views', tag: 'views', dest: path.join(this.app.basePath, 'resources', 'views', 'vendor', name) },
                ];

                for (const rt of resourceTags) {
                    const resourcePath = plugin.resources[rt.field];
                    if (resourcePath && (!tag || rt.tag === tag)) {
                        items.push({
                            plugin: name,
                            tag: rt.tag,
                            source: path.resolve(pluginRoot, resourcePath),
                            destination: rt.dest,
                        });
                    }
                }
            }
        }

        return items;
    }

    // ── Private Helpers ──────────────────────────────────────

    private async publishResource(
        resource: PublishableResource,
        pluginRoot: string,
        force: boolean
    ): Promise<PublishResult[]> {
        const results: PublishResult[] = [];
        const sourcePath = path.isAbsolute(resource.source)
            ? resource.source
            : path.resolve(pluginRoot, resource.source);
        const destPath = resource.destination;

        if (!fs.existsSync(sourcePath)) {
            results.push({
                source: sourcePath,
                destination: destPath,
                status: 'failed',
                reason: 'Source path does not exist',
            });
            return results;
        }

        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
            // Copy all files from source directory to destination
            const files = this.getFilesRecursive(sourcePath);
            for (const file of files) {
                const relativePath = path.relative(sourcePath, file);
                const destFile = path.join(destPath, relativePath);
                results.push(this.copyFile(file, destFile, force));
            }
        } else {
            // Single file
            const destFile = path.join(destPath, path.basename(sourcePath));
            results.push(this.copyFile(sourcePath, destFile, force));
        }

        return results;
    }

    private copyFile(source: string, destination: string, force: boolean): PublishResult {
        try {
            if (fs.existsSync(destination) && !force) {
                return {
                    source,
                    destination,
                    status: 'skipped',
                    reason: 'File already exists (use --force to overwrite)',
                };
            }

            const dir = path.dirname(destination);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.copyFileSync(source, destination);
            return { source, destination, status: 'published' };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            return { source, destination, status: 'failed', reason: message };
        }
    }

    private getFilesRecursive(dir: string): string[] {
        const files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...this.getFilesRecursive(fullPath));
            } else {
                files.push(fullPath);
            }
        }

        return files;
    }
}
