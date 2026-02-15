// ──────────────────────────────────────────────────────────────
// HyperZ — Database Service Provider
// ──────────────────────────────────────────────────────────────

import { ServiceProvider } from '../core/ServiceProvider.js';
import { Database } from '../database/Database.js';
import { envBool } from '../support/helpers.js';

export class DatabaseServiceProvider extends ServiceProvider {
    register(): void {
        this.app.container.singleton('db', () => Database);
    }

    async boot(): Promise<void> {
        const dbConfig = this.app.config.get<any>('database');
        if (!dbConfig) return;

        // Connect SQL
        const driver = dbConfig.driver ?? 'sqlite';
        const connConfig = dbConfig.connections?.[driver];
        if (connConfig) {
            try {
                await Database.connectSQL(connConfig);
            } catch {
                // Connection failed — logged by Database class
            }
        }

        // Connect MongoDB if enabled
        if (dbConfig.mongodb?.enabled) {
            try {
                await Database.connectMongo(dbConfig.mongodb.uri);
            } catch {
                // Connection failed — logged by Database class
            }
        }
    }
}
