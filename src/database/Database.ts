// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Database Manager (Knex + Mongoose)
// ──────────────────────────────────────────────────────────────

import knex, { type Knex } from 'knex';
import mongoose from 'mongoose';
import { DataSource, EntityManager } from 'typeorm';
import { Logger } from '../logging/Logger.js';
import { env, envBool, envNumber } from '../support/helpers.js';

export class Database {
    private static knexInstance: Knex | null = null;
    private static tenantPool = new Map<string, Knex>();
    private static mongoConnected = false;
    private static typeormDataSource: DataSource | null = null;

    // ── SQL (Knex) ────────────────────────────────────────────

    /**
     * Initialize Knex SQL connection.
     */
    static async connectSQL(config: Knex.Config): Promise<Knex> {
        if (this.knexInstance) return this.knexInstance;

        this.knexInstance = knex(config);

        // Slow Query Logging
        const queries = new Map<string, number>();
        this.knexInstance.on('query', (data: any) => {
            queries.set(data.__knexUid, Date.now());
        });
        this.knexInstance.on('query-response', (response: any, data: any) => {
            const start = queries.get(data.__knexUid);
            if (start) {
                const duration = Date.now() - start;
                queries.delete(data.__knexUid);
                const threshold = envNumber('DB_SLOW_QUERY_THRESHOLD', 1000);
                if (duration > threshold) {
                    Logger.warn(`[Database] Slow query detected (${duration}ms): ${data.sql}`, {
                        duration,
                        sql: data.sql,
                    });
                }
            }
        });

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
     * Perform a health check on all connected databases.
     */
    static async healthCheck(): Promise<any> {
        const status: any = {
            sql: 'disconnected',
            mongo: 'disconnected',
            typeorm: 'disconnected',
            timestamp: new Date().toISOString(),
        };

        if (this.knexInstance) {
            try {
                await this.knexInstance.raw('SELECT 1');
                status.sql = 'connected';
            } catch (err) {
                status.sql = 'error';
            }
        }

        if (this.mongoConnected) {
            try {
                await mongoose.connection.db?.admin().ping();
                status.mongo = 'connected';
            } catch (err) {
                status.mongo = 'error';
            }
        }

        if (this.typeormDataSource?.isInitialized) {
            status.typeorm = 'connected';
        }

        return status;
    }

    /**
     * Get a tenant-specific Knex instance.
     */
    static async getTenantKnex(tenantId: string, config: Knex.Config): Promise<Knex> {
        let instance = this.tenantPool.get(tenantId);

        if (!instance) {
            Logger.info(`[Database] Initializing connection for tenant: ${tenantId}`);
            instance = knex(config);
            this.tenantPool.set(tenantId, instance);
        }

        return instance;
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

    // ── TypeORM ───────────────────────────────────────────────

    /**
     * Set TypeORM DataSource.
     */
    static setDataSource(ds: DataSource): void {
        console.log("SETTING_DATASOURCE_IN_DATABASE_CLASS", ds.isInitialized);
        this.typeormDataSource = ds;
    }

    /**
     * Get TypeORM DataSource.
     */
    static getDataSource(): DataSource {
        if (!this.typeormDataSource) {
            console.log("GETTING_DATASOURCE_BUT_ITS_NULL", this.typeormDataSource);
            throw new Error('[HyperZ] TypeORM DataSource not initialized.');
        }
        return this.typeormDataSource;
    }

    /**
     * Get TypeORM EntityManager.
     */
    static getEntityManager(): EntityManager {
        return this.getDataSource().manager;
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

        if (this.typeormDataSource?.isInitialized) {
            await this.typeormDataSource.destroy();
            this.typeormDataSource = null;
            Logger.info('TypeORM DataSource disconnected');
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

    /**
     * Check if TypeORM is connected.
     */
    static isTypeORMConnected(): boolean {
        return this.typeormDataSource?.isInitialized ?? false;
    }
}
