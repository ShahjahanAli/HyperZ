// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Migration Runner (TypeORM)
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Database } from './Database.js';
import { Logger } from '../logging/Logger.js';

export class Migration {
    private migrationsDir: string;

    constructor(migrationsDir: string) {
        this.migrationsDir = migrationsDir;
    }

    /**
     * Run all pending migrations using TypeORM.
     */
    async migrate(): Promise<any[]> {
        const ds = Database.getDataSource();

        Logger.info('⚡ Running pending TypeORM migrations...');
        const executed = await ds.runMigrations({
            transaction: 'all',
        });

        if (executed.length === 0) {
            Logger.info('Nothing to migrate.');
        } else {
            executed.forEach(m => Logger.info(`  ✓ Migrated: ${m.name}`));
            Logger.info(`✦ Migrated ${executed.length} file(s)`);
        }

        return executed;
    }

    /**
     * Rollback the last migration using TypeORM.
     */
    async rollback(): Promise<void> {
        const ds = Database.getDataSource();

        Logger.info('↩ Rolling back last TypeORM migration...');
        await ds.undoLastMigration({
            transaction: 'all',
        });

        Logger.info('✦ Rollback complete');
    }

    /**
     * Get migration status.
     */
    async status(): Promise<void> {
        const ds = Database.getDataSource();
        await ds.showMigrations();
    }
}
