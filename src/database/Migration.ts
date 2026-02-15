// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Migration Runner
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { type Knex } from 'knex';
import { Database } from './Database.js';
import { Logger } from '../logging/Logger.js';

export interface MigrationFile {
    up(knex: Knex): Promise<void>;
    down(knex: Knex): Promise<void>;
}

export class Migration {
    private migrationsDir: string;
    private tableName: string;

    constructor(migrationsDir: string, tableName = 'hyperz_migrations') {
        this.migrationsDir = migrationsDir;
        this.tableName = tableName;
    }

    /**
     * Ensure the migrations tracking table exists.
     */
    private async ensureTable(knex: Knex): Promise<void> {
        const exists = await knex.schema.hasTable(this.tableName);
        if (!exists) {
            await knex.schema.createTable(this.tableName, (table) => {
                table.increments('id');
                table.string('name').notNullable();
                table.integer('batch').notNullable();
                table.timestamp('migrated_at').defaultTo(knex.fn.now());
            });
        }
    }

    /**
     * Get all migration files sorted by name.
     */
    private getMigrationFiles(): string[] {
        if (!fs.existsSync(this.migrationsDir)) return [];
        return fs
            .readdirSync(this.migrationsDir)
            .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
            .sort();
    }

    /**
     * Get already-ran migration names.
     */
    private async getRanMigrations(knex: Knex): Promise<string[]> {
        const rows = await knex(this.tableName).select('name').orderBy('name');
        return rows.map((r: any) => r.name);
    }

    /**
     * Run all pending migrations.
     */
    async migrate(): Promise<string[]> {
        const knex = Database.getKnex();
        await this.ensureTable(knex);

        const files = this.getMigrationFiles();
        const ran = await this.getRanMigrations(knex);
        const pending = files.filter(f => !ran.includes(f));

        if (pending.length === 0) {
            Logger.info('Nothing to migrate.');
            return [];
        }

        // Determine batch number
        const lastBatch = await knex(this.tableName).max('batch as batch').first();
        const batch = ((lastBatch as any)?.batch ?? 0) + 1;

        const migrated: string[] = [];

        for (const file of pending) {
            const filePath = path.join(this.migrationsDir, file);
            const migration: MigrationFile = await import(`file://${filePath.replace(/\\/g, '/')}`);

            await migration.up(knex);
            await knex(this.tableName).insert({ name: file, batch });

            Logger.info(`  ✓ Migrated: ${file}`);
            migrated.push(file);
        }

        Logger.info(`✦ Migrated ${migrated.length} file(s) in batch ${batch}`);
        return migrated;
    }

    /**
     * Rollback the last batch of migrations.
     */
    async rollback(): Promise<string[]> {
        const knex = Database.getKnex();
        await this.ensureTable(knex);

        const lastBatch = await knex(this.tableName).max('batch as batch').first();
        const batch = (lastBatch as any)?.batch ?? 0;

        if (batch === 0) {
            Logger.info('Nothing to rollback.');
            return [];
        }

        const rows = await knex(this.tableName)
            .where('batch', batch)
            .orderBy('name', 'desc');

        const rolledBack: string[] = [];

        for (const row of rows as any[]) {
            const filePath = path.join(this.migrationsDir, row.name);
            const migration: MigrationFile = await import(`file://${filePath.replace(/\\/g, '/')}`);

            await migration.down(knex);
            await knex(this.tableName).where('id', row.id).delete();

            Logger.info(`  ↩ Rolled back: ${row.name}`);
            rolledBack.push(row.name);
        }

        Logger.info(`✦ Rolled back ${rolledBack.length} migration(s)`);
        return rolledBack;
    }

    /**
     * Get migration status.
     */
    async status(): Promise<{ name: string; ran: boolean }[]> {
        const knex = Database.getKnex();
        await this.ensureTable(knex);

        const files = this.getMigrationFiles();
        const ran = await this.getRanMigrations(knex);

        return files.map(f => ({ name: f, ran: ran.includes(f) }));
    }
}
