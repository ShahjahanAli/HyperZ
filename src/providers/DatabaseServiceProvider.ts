// ──────────────────────────────────────────────────────────────
// HyperZ — Database Service Provider
// ──────────────────────────────────────────────────────────────

import { ServiceProvider } from '../core/ServiceProvider.js';
import { Database } from '../database/Database.js';
import { initializeDataSource } from '../database/DataSource.js';
import { Logger } from '../logging/Logger.js';
import { envBool } from '../support/helpers.js';

export class DatabaseServiceProvider extends ServiceProvider {
    register(): void {
        this.app.container.singleton('db', () => Database);
    }

    async boot(): Promise<void> {
        // Initialize TypeORM
        try {
            const dataSource = await initializeDataSource();
            Database.setDataSource(dataSource);
            Logger.info('[+] TypeORM DataSource initialized');
        } catch (err: any) {
            Logger.error('[x] TypeORM initialization failed', { error: err.message, stack: err.stack });
        }

        const dbConfig = this.app.config.get<any>('database');
        if (!dbConfig) return;

        // Connect MongoDB if enabled
        if (dbConfig.mongodb?.enabled) {
            try {
                await Database.connectMongo(dbConfig.mongodb.uri);
            } catch {
                // Connection failed — logged by Database class
            }
        }

        // Register graceful shutdown hook
        this.app.terminating(async () => {
            await Database.disconnect();
        });
    }
}
