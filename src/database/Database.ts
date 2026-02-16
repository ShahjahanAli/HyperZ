// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Database Manager (TypeORM + Mongoose)
// ──────────────────────────────────────────────────────────────

import knex, { type Knex } from 'knex';
import mongoose from 'mongoose';
import { DataSource, EntityManager } from 'typeorm';
import { Logger } from '../logging/Logger.js';
import { env, envBool, envNumber } from '../support/helpers.js';

export class Database {
    private static mongoConnected = false;
    private static typeormDataSource: DataSource | null = null;

    // ── SQL (Knex) ────────────────────────────────────────────

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

        if (this.typeormDataSource?.isInitialized) {
            status.typeorm = 'connected';
            try {
                await this.typeormDataSource.query('SELECT 1');
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

        return status;
    }


    /**
     * Get the Knex instance.
     * @deprecated Use TypeORM DataSource instead.
     */
    static getKnex(): Knex {
        throw new Error('[HyperZ] Knex has been deprecated in favor of TypeORM.');
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
     */
    static async transaction<T>(callback: (manager: EntityManager) => Promise<T>): Promise<T> {
        return this.getDataSource().transaction(callback);
    }

    /**
     * Execute a raw SQL query.
     */
    static async raw(sql: string, bindings: any[] = []): Promise<any> {
        return this.getDataSource().query(sql, bindings);
    }

    /**
     * Get the configured database driver name.
     */
    static getDriverName(): string | null {
        if (!this.typeormDataSource) return null;
        return this.typeormDataSource.options.type as string;
    }

    /**
     * Disconnect all database connections.
     */
    static async disconnect(): Promise<void> {
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
        return this.typeormDataSource?.isInitialized ?? false;
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
