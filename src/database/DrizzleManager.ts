// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Drizzle ORM Integration
// Provides a Drizzle-based ORM layer alongside TypeORM
// ──────────────────────────────────────────────────────────────

import { Logger } from '../logging/Logger.js';
import { env } from '../support/helpers.js';

/**
 * Supported Drizzle database drivers.
 */
export type DrizzleDriver = 'sqlite' | 'mysql' | 'postgres';

/**
 * Drizzle connection configuration.
 */
export interface DrizzleConfig {
    driver: DrizzleDriver;
    url?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
}

/**
 * DrizzleManager — manages Drizzle ORM connections.
 *
 * Provides a unified interface for initializing and accessing
 * Drizzle ORM across SQLite, MySQL, and PostgreSQL.
 *
 * This is designed to coexist with TypeORM — use Drizzle for
 * type-safe queries and TypeORM for migrations/ActiveRecord.
 *
 * @example
 * ```typescript
 * // Initialize from env
 * await DrizzleManager.initialize();
 *
 * // Get the Drizzle instance
 * const db = DrizzleManager.getInstance();
 *
 * // Use with Drizzle schema
 * import { users } from './schema.js';
 * const allUsers = await db.select().from(users);
 * ```
 */
export class DrizzleManager {
    private static instance: unknown = null;
    private static client: unknown = null;
    private static currentDriver: DrizzleDriver | null = null;
    private static _initialized = false;

    /**
     * Initialize Drizzle ORM from environment or explicit config.
     */
    static async initialize(config?: DrizzleConfig): Promise<void> {
        const driver = (config?.driver ?? env('DB_DRIVER', 'sqlite')) as DrizzleDriver;
        this.currentDriver = driver;

        try {
            switch (driver) {
                case 'sqlite':
                    await this.initSQLite(config);
                    break;
                case 'mysql':
                    await this.initMySQL(config);
                    break;
                case 'postgres':
                    await this.initPostgres(config);
                    break;
                default:
                    throw new Error(`Unsupported Drizzle driver: ${driver}`);
            }

            this._initialized = true;
            Logger.info(`[+] Drizzle ORM initialized (${driver})`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            Logger.error(`[x] Drizzle ORM initialization failed`, { error: message });
            throw err;
        }
    }

    /**
     * Initialize SQLite via better-sqlite3.
     */
    private static async initSQLite(config?: DrizzleConfig): Promise<void> {
        try {
            const betterSqlite3 = await import('better-sqlite3');
            const { drizzle } = await import('drizzle-orm/better-sqlite3');

            const dbPath = config?.database ?? config?.url ?? env('DB_NAME', 'hyperz.db');
            const BetterSqlite3 = betterSqlite3.default ?? betterSqlite3;
            this.client = new BetterSqlite3(dbPath);
            this.instance = drizzle(this.client as never);
        } catch (err: unknown) {
            throw new Error(
                'Drizzle SQLite requires "better-sqlite3" and "drizzle-orm".\n' +
                'Install: npm install drizzle-orm better-sqlite3'
            );
        }
    }

    /**
     * Initialize MySQL via mysql2.
     */
    private static async initMySQL(config?: DrizzleConfig): Promise<void> {
        try {
            const mysql2 = await import('mysql2/promise');
            const { drizzle } = await import('drizzle-orm/mysql2');

            const connection = await mysql2.createConnection({
                host: config?.host ?? env('DB_HOST', '127.0.0.1'),
                port: config?.port ?? Number(env('DB_PORT', '3306')),
                database: config?.database ?? env('DB_NAME', 'hyperz'),
                user: config?.user ?? env('DB_USER', 'root'),
                password: config?.password ?? env('DB_PASSWORD', ''),
            });

            this.client = connection;
            this.instance = drizzle(connection);
        } catch (err: unknown) {
            throw new Error(
                'Drizzle MySQL requires "mysql2" and "drizzle-orm".\n' +
                'Install: npm install drizzle-orm mysql2'
            );
        }
    }

    /**
     * Initialize PostgreSQL via node-postgres.
     */
    private static async initPostgres(config?: DrizzleConfig): Promise<void> {
        try {
            const pg = await import('pg');
            const { drizzle } = await import('drizzle-orm/node-postgres');

            const Pool = pg.default?.Pool ?? pg.Pool;
            const pool = new Pool({
                host: config?.host ?? env('DB_HOST', '127.0.0.1'),
                port: config?.port ?? Number(env('DB_PORT', '5432')),
                database: config?.database ?? env('DB_NAME', 'hyperz'),
                user: config?.user ?? env('DB_USER', 'postgres'),
                password: config?.password ?? env('DB_PASSWORD', ''),
            });

            this.client = pool;
            this.instance = drizzle(pool);
        } catch (err: unknown) {
            throw new Error(
                'Drizzle PostgreSQL requires "pg" and "drizzle-orm".\n' +
                'Install: npm install drizzle-orm pg'
            );
        }
    }

    /**
     * Get the Drizzle ORM instance.
     * @returns The drizzle database instance (type varies by driver)
     */
    static getInstance<T = unknown>(): T {
        if (!this._initialized || !this.instance) {
            throw new Error('[HyperZ] Drizzle ORM not initialized. Call DrizzleManager.initialize() first.');
        }
        return this.instance as T;
    }

    /**
     * Get the raw database client (better-sqlite3 Database, mysql2 Connection, pg Pool).
     */
    static getClient<T = unknown>(): T {
        if (!this.client) {
            throw new Error('[HyperZ] Drizzle client not available.');
        }
        return this.client as T;
    }

    /**
     * Get the current driver name.
     */
    static getDriver(): DrizzleDriver | null {
        return this.currentDriver;
    }

    /**
     * Check if Drizzle is initialized.
     */
    static isInitialized(): boolean {
        return this._initialized;
    }

    /**
     * Disconnect and clean up.
     */
    static async disconnect(): Promise<void> {
        if (!this._initialized) return;

        try {
            if (this.currentDriver === 'mysql' && this.client) {
                await (this.client as { end(): Promise<void> }).end();
            } else if (this.currentDriver === 'postgres' && this.client) {
                await (this.client as { end(): Promise<void> }).end();
            } else if (this.currentDriver === 'sqlite' && this.client) {
                (this.client as { close(): void }).close();
            }
        } catch {
            // Ignore disconnect errors
        }

        this.instance = null;
        this.client = null;
        this.currentDriver = null;
        this._initialized = false;
        Logger.info('[+] Drizzle ORM disconnected');
    }

    /**
     * Build a Drizzle config from environment variables.
     */
    static configFromEnv(): DrizzleConfig {
        return {
            driver: env('DB_DRIVER', 'sqlite') as DrizzleDriver,
            host: env('DB_HOST', '127.0.0.1'),
            port: Number(env('DB_PORT', '3306')),
            database: env('DB_NAME', 'hyperz'),
            user: env('DB_USER', 'root'),
            password: env('DB_PASSWORD', ''),
        };
    }
}
