// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Database Factory (Faker-Powered)
// ──────────────────────────────────────────────────────────────

import { Database } from './Database.js';
import { Logger } from '../logging/Logger.js';

type FactoryDefinition<T = Record<string, any>> = () => T;

export class Factory {
    private static definitions = new Map<string, FactoryDefinition>();

    /**
     * Define a factory for a table.
     * @example
     * Factory.define('users', () => ({
     *   name: faker.person.fullName(),
     *   email: faker.internet.email(),
     *   password: '$2a$10$...',
     * }));
     */
    static define(tableName: string, definition: FactoryDefinition): void {
        this.definitions.set(tableName, definition);
    }

    /**
     * Create a single record.
     */
    static async create<T = any>(tableName: string, overrides?: Partial<T>): Promise<T> {
        const definition = this.definitions.get(tableName);
        if (!definition) throw new Error(`[Factory] No definition for table "${tableName}"`);

        const data = { ...definition(), ...overrides } as any;
        const knex = Database.getKnex();
        const [id] = await knex(tableName).insert(data).returning('*');

        Logger.debug(`[Factory] Created 1 record in "${tableName}"`);
        return (typeof id === 'object' ? id : { ...data, id }) as T;
    }

    /**
     * Create multiple records.
     */
    static async createMany<T = any>(
        tableName: string,
        count: number,
        overrides?: Partial<T>
    ): Promise<T[]> {
        const definition = this.definitions.get(tableName);
        if (!definition) throw new Error(`[Factory] No definition for table "${tableName}"`);

        const records: any[] = [];
        const knex = Database.getKnex();

        for (let i = 0; i < count; i++) {
            const data = { ...definition(), ...overrides };
            const [id] = await knex(tableName).insert(data).returning('*');
            records.push(typeof id === 'object' ? id : { ...data, id });
        }

        Logger.debug(`[Factory] Created ${count} records in "${tableName}"`);
        return records;
    }

    /**
     * Build record data without persisting.
     */
    static build<T = any>(tableName: string, overrides?: Partial<T>): T {
        const definition = this.definitions.get(tableName);
        if (!definition) throw new Error(`[Factory] No definition for table "${tableName}"`);
        return { ...definition(), ...overrides } as T;
    }

    /**
     * Build multiple records without persisting.
     */
    static buildMany<T = any>(tableName: string, count: number, overrides?: Partial<T>): T[] {
        return Array.from({ length: count }, () => this.build<T>(tableName, overrides));
    }
}
