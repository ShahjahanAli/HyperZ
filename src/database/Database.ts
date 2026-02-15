// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Database Manager (Knex + Mongoose)
// ──────────────────────────────────────────────────────────────

import knex, { type Knex } from 'knex';
import mongoose from 'mongoose';
import { Logger } from '../logging/Logger.js';
import { env, envBool } from '../support/helpers.js';

export class Database {
    private static knexInstance: Knex | null = null;
    private static mongoConnected = false;

    // ── SQL (Knex) ────────────────────────────────────────────

    /**
     * Initialize Knex SQL connection.
     */
    static async connectSQL(config: Knex.Config): Promise<Knex> {
        if (this.knexInstance) return this.knexInstance;

        this.knexInstance = knex(config);

        // Test connection
        try {
            await this.knexInstance.raw('SELECT 1');
            Logger.info('✦ SQL database connected successfully');
        } catch (err: any) {
            Logger.error('✖ SQL database connection failed', { error: err.message });
            throw err;
        }

        return this.knexInstance;
    }

    /**
     * Get the Knex instance.
     */
    static getKnex(): Knex {
        if (!this.knexInstance) {
            throw new Error('[HyperZ] SQL database not initialized. Call Database.connectSQL() first.');
        }
        return this.knexInstance;
    }

    // ── MongoDB (Mongoose) ────────────────────────────────────

    /**
     * Initialize MongoDB connection via Mongoose.
     */
    static async connectMongo(uri?: string): Promise<typeof mongoose> {
        if (this.mongoConnected) return mongoose;

        const mongoUri = uri ?? env('MONGO_URI', 'mongodb://127.0.0.1:27017/hyperz');

        try {
            await mongoose.connect(mongoUri);
            this.mongoConnected = true;
            Logger.info('✦ MongoDB connected successfully');
        } catch (err: any) {
            Logger.error('✖ MongoDB connection failed', { error: err.message });
            throw err;
        }

        return mongoose;
    }

    /**
     * Get mongoose instance.
     */
    static getMongoose(): typeof mongoose {
        if (!this.mongoConnected) {
            throw new Error('[HyperZ] MongoDB not initialized. Call Database.connectMongo() first.');
        }
        return mongoose;
    }

    // ── Utilities ─────────────────────────────────────────────

    /**
     * Run a callback within a database transaction.
     * Automatically commits on success, rolls back on error.
     *
     * @example
     * await Database.transaction(async (trx) => {
     *     await trx('users').insert({ name: 'John' });
     *     await trx('orders').insert({ user_id: 1, total: 99.99 });
     * });
     */
    static async transaction<T>(callback: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
        const knex = this.getKnex();
        return knex.transaction(async (trx) => {
            return callback(trx);
        });
    }

    /**
     * Execute a raw SQL query.
     *
     * @example
     * const result = await Database.raw('SELECT COUNT(*) FROM users WHERE active = ?', [true]);
     */
    static async raw(sql: string, bindings: any[] = []): Promise<any> {
        return this.getKnex().raw(sql, bindings);
    }

    /**
     * Get the configured database driver name.
     */
    static getDriverName(): string | null {
        if (!this.knexInstance) return null;
        return (this.knexInstance.client as any)?.config?.client ?? null;
    }

    /**
     * Disconnect all database connections.
     */
    static async disconnect(): Promise<void> {
        if (this.knexInstance) {
            await this.knexInstance.destroy();
            this.knexInstance = null;
            Logger.info('SQL database disconnected');
        }

        if (this.mongoConnected) {
            await mongoose.disconnect();
            this.mongoConnected = false;
            Logger.info('MongoDB disconnected');
        }
    }

    /**
     * Check if SQL is connected.
     */
    static isSQLConnected(): boolean {
        return this.knexInstance !== null;
    }

    /**
     * Check if MongoDB is connected.
     */
    static isMongoConnected(): boolean {
        return this.mongoConnected;
    }
}
