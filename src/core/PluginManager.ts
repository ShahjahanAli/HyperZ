// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Plugin Manager (Auto-Discovery)
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logging/Logger.js';
import type { Application } from './Application.js';

interface PluginManifest {
    name: string;
    provider: string; // Export name of the ServiceProvider
}

export class PluginManager {
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    /**
     * Discover and register plugins from node_modules.
     * A package is a HyperZ plugin if its package.json has a "hyperz-plugin" key:
     *
     * {
     *   "hyperz-plugin": {
     *     "provider": "MyServiceProvider"
     *   }
     * }
     */
    async discover(): Promise<void> {
        const nodeModules = path.join(this.app.basePath, 'node_modules');
        if (!fs.existsSync(nodeModules)) return;

        const dirs = fs.readdirSync(nodeModules);

        for (const dir of dirs) {
            // Handle scoped packages (@org/package)
            if (dir.startsWith('@')) {
                const scopedDir = path.join(nodeModules, dir);
                const scopedPackages = fs.readdirSync(scopedDir);
                for (const pkg of scopedPackages) {
                    await this.tryRegisterPlugin(path.join(scopedDir, pkg), `${dir}/${pkg}`);
                }
                continue;
            }

            await this.tryRegisterPlugin(path.join(nodeModules, dir), dir);
        }
    }

    private async tryRegisterPlugin(pkgDir: string, pkgName: string): Promise<void> {
        try {
            const pkgJsonPath = path.join(pkgDir, 'package.json');
            if (!fs.existsSync(pkgJsonPath)) return;

            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
            const manifest: PluginManifest | undefined = pkgJson['hyperz-plugin'];
            if (!manifest) return;

            // Dynamically import the plugin's provider
            const pluginModule = await import(pkgName);
            const ProviderClass = pluginModule[manifest.provider] ?? pluginModule.default;

            if (ProviderClass) {
                this.app.register(ProviderClass);
                Logger.info(`  🔌 Plugin loaded: ${pkgName}`);
            }
        } catch (err: any) {
            Logger.error(`[Plugin] Failed to load "${pkgName}"`, { error: err.message });
        }
    }
}
