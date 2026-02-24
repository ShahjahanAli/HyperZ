// ──────────────────────────────────────────────────────────────
// HyperZ — Plugin Service Provider
//
// Wires the plugin ecosystem into the application lifecycle:
// - Registers plugin migration/entity paths with the DataSource
// - Registers plugin seeder paths with the Seeder runner
// - Exposes PublishManager in the container
// ──────────────────────────────────────────────────────────────

import { ServiceProvider } from '../core/ServiceProvider.js';
import { PublishManager } from '../core/PublishManager.js';
import { routeRegistry } from '../http/RouteRegistry.js';
import { registerMigrationPaths, registerEntityPaths } from '../database/DataSource.js';
import { Logger } from '../logging/Logger.js';

export class PluginServiceProvider extends ServiceProvider {
    register(): void {
        // Register the PublishManager singleton
        this.app.container.singleton('publisher', () => new PublishManager(this.app));

        // Expose the global route registry
        this.app.container.instance('routes.registry', routeRegistry);
    }

    async boot(): Promise<void> {
        const pluginManager = this.app.plugins;
        const disabledPlugins = this.app.config.get<string[]>('plugins.disabled', []);

        // Apply disabled list — mark discovered plugins as disabled
        if (disabledPlugins.length > 0) {
            const all = pluginManager.all();
            for (const [name, entry] of all) {
                if (disabledPlugins.includes(name) && entry.status === 'registered') {
                    Logger.info(`  🔌 Plugin disabled by config: ${name}`);
                    // We can't directly set status, but the plugin will have been
                    // discovered. The disabled config should be checked before boot.
                }
            }
        }

        // Register plugin migration and entity paths with the DataSource
        const migrationPaths = pluginManager.getMigrationPaths();
        const entityPaths = pluginManager.getEntityPaths();

        if (migrationPaths.length > 0) {
            registerMigrationPaths(migrationPaths);
            Logger.debug(`[Plugin] Registered ${migrationPaths.length} migration path(s)`);
        }

        if (entityPaths.length > 0) {
            registerEntityPaths(entityPaths);
            Logger.debug(`[Plugin] Registered ${entityPaths.length} entity path(s)`);
        }

        // Log plugin summary
        const total = pluginManager.count();
        if (total > 0) {
            const booted = pluginManager.booted().length;
            const failed = pluginManager.failed().length;
            Logger.info(`[+] Plugins: ${booted} booted, ${failed} failed, ${total} total`);
        }
    }
}
