// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Base Model (Active Record Pattern)
// Works with Knex (SQL databases)
// ──────────────────────────────────────────────────────────────

import { type Knex } from 'knex';
import { Database } from './Database.js';

export abstract class Model {
    /** Table name — override in subclass */
    protected static tableName: string;

    /** Primary key column */
    protected static primaryKey = 'id';

    /** Enable timestamps (created_at, updated_at) */
    protected static timestamps = true;

    /** Enable soft deletes (deleted_at column) */
    protected static softDeletes = false;

    /** Fillable fields (mass assignment protection) */
    protected static fillable: string[] = [];

    /** Hidden fields (excluded from toJSON) */
    protected static hidden: string[] = [];

    /** Instance attributes */
    [key: string]: any;

    constructor(attributes: Record<string, any> = {}) {
        Object.assign(this, attributes);
    }

    // ── Query Methods (static) ────────────────────────────────

    /**
     * Get Knex query builder for this model's table.
     */
    protected static query(): Knex.QueryBuilder {
        const qb = Database.getKnex()(this.tableName);
        if (this.softDeletes) {
            return qb.whereNull('deleted_at');
        }
        return qb;
    }

    /**
     * Find a record by primary key.
     */
    static async find<T extends Model>(
        this: new (attrs: any) => T & { constructor: typeof Model },
        id: any
    ): Promise<T | null> {
        const ctor = this as any as typeof Model;
        const row = await ctor.query().where(ctor.primaryKey, id).first();
        return row ? new this(row) : null;
    }

    /**
     * Find or throw.
     */
    static async findOrFail<T extends Model>(
        this: new (attrs: any) => T & { constructor: typeof Model },
        id: any
    ): Promise<T> {
        const result = await (this as any).find(id);
        if (!result) throw new Error(`${(this as any).name} with ID ${id} not found`);
        return result;
    }

    /**
     * Get all records.
     */
    static async all<T extends Model>(
        this: new (attrs: any) => T & { constructor: typeof Model }
    ): Promise<T[]> {
        const ctor = this as any as typeof Model;
        const rows = await ctor.query().select('*');
        return rows.map((row: any) => new this(row));
    }

    /**
     * Where clause — returns query builder.
     */
    static where(
        column: string | Record<string, any>,
        operator?: any,
        value?: any
    ): Knex.QueryBuilder {
        const qb = this.query();
        if (typeof column === 'object') {
            return qb.where(column);
        }
        if (value === undefined) {
            return qb.where(column, operator);
        }
        return qb.where(column, operator, value);
    }

    /**
     * Create a new record.
     */
    static async create<T extends Model>(
        this: new (attrs: any) => T & { constructor: typeof Model },
        attributes: Record<string, any>
    ): Promise<T> {
        const ctor = this as any as typeof Model;
        const data = { ...attributes };

        // Apply fillable filter
        if (ctor.fillable.length > 0) {
            for (const key of Object.keys(data)) {
                if (!ctor.fillable.includes(key)) delete data[key];
            }
        }

        // Add timestamps
        if (ctor.timestamps) {
            const now = new Date().toISOString();
            data.created_at = now;
            data.updated_at = now;
        }

        const [id] = await Database.getKnex()(ctor.tableName).insert(data);
        const row = await ctor.query().where(ctor.primaryKey, id).first();
        return new this(row);
    }

    // ── Instance Methods ──────────────────────────────────────

    /**
     * Save (update) the current instance.
     */
    async save(): Promise<this> {
        const ctor = (this.constructor as typeof Model);
        const pk = ctor.primaryKey;
        const data = this.toObject();
        delete data[pk];

        if (ctor.timestamps) {
            data.updated_at = new Date().toISOString();
        }

        await Database.getKnex()(ctor.tableName)
            .where(pk, this[pk])
            .update(data);

        return this;
    }

    /**
     * Delete the current record (soft delete if enabled).
     */
    async delete(): Promise<void> {
        const ctor = (this.constructor as typeof Model);
        const pk = ctor.primaryKey;

        if (ctor.softDeletes) {
            await Database.getKnex()(ctor.tableName)
                .where(pk, this[pk])
                .update({ deleted_at: new Date().toISOString() });
        } else {
            await Database.getKnex()(ctor.tableName)
                .where(pk, this[pk])
                .delete();
        }
    }

    /**
     * Force delete (even if soft deletes enabled).
     */
    async forceDelete(): Promise<void> {
        const ctor = (this.constructor as typeof Model);
        const pk = ctor.primaryKey;
        await Database.getKnex()(ctor.tableName)
            .where(pk, this[pk])
            .delete();
    }

    /**
     * Restore a soft-deleted record.
     */
    async restore(): Promise<this> {
        const ctor = (this.constructor as typeof Model);
        if (!ctor.softDeletes) throw new Error('Soft deletes not enabled on this model');

        const pk = ctor.primaryKey;
        await Database.getKnex()(ctor.tableName)
            .where(pk, this[pk])
            .update({ deleted_at: null });

        this.deleted_at = null;
        return this;
    }

    // ── Serialization ─────────────────────────────────────────

    /**
     * Convert to plain object (excludes hidden fields).
     */
    toJSON(): Record<string, any> {
        const ctor = (this.constructor as typeof Model);
        const obj = this.toObject();
        for (const key of ctor.hidden) {
            delete obj[key];
        }
        return obj;
    }

    /**
     * Convert to raw object (includes all fields).
     */
    toObject(): Record<string, any> {
        const obj: Record<string, any> = {};
        for (const key of Object.keys(this)) {
            if (typeof this[key] !== 'function') {
                obj[key] = this[key];
            }
        }
        return obj;
    }
}
