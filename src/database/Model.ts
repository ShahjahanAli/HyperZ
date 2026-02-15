// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Base Model (Active Record Pattern)
// Works with Knex (SQL databases)
// ──────────────────────────────────────────────────────────────

import { type Knex } from 'knex';
import { Database } from './Database.js';

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

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

    // ── Query Scopes & Pagination ─────────────────────────────

    /**
     * Paginate results with metadata.
     */
    static async paginate<T extends Model>(
        this: new (attrs: any) => T & { constructor: typeof Model },
        page = 1,
        perPage = 15
    ): Promise<PaginationResult<T>> {
        const ctor = this as any as typeof Model;
        const offset = (page - 1) * perPage;

        const [{ count: total }] = await ctor.query().count('* as count');
        const totalCount = Number(total);
        const rows = await ctor.query().select('*').limit(perPage).offset(offset);

        return {
            data: rows.map((row: any) => new this(row)),
            pagination: {
                total: totalCount,
                page,
                perPage,
                totalPages: Math.ceil(totalCount / perPage),
                hasNextPage: page * perPage < totalCount,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * Get the first record matching the query.
     */
    static async first<T extends Model>(
        this: new (attrs: any) => T & { constructor: typeof Model }
    ): Promise<T | null> {
        const ctor = this as any as typeof Model;
        const row = await ctor.query().first();
        return row ? new this(row) : null;
    }

    /**
     * Count records.
     */
    static async count(): Promise<number> {
        const [{ count }] = await this.query().count('* as count');
        return Number(count);
    }

    /**
     * Check if any records exist.
     */
    static async exists(): Promise<boolean> {
        return (await this.count()) > 0;
    }

    /**
     * Order by column — returns query builder.
     */
    static orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): Knex.QueryBuilder {
        return this.query().orderBy(column, direction);
    }

    /**
     * Order by created_at descending (latest first).
     */
    static latest(column = 'created_at'): Knex.QueryBuilder {
        return this.orderBy(column, 'desc');
    }

    /**
     * Order by created_at ascending (oldest first).
     */
    static oldest(column = 'created_at'): Knex.QueryBuilder {
        return this.orderBy(column, 'asc');
    }

    /**
     * Limit the number of results.
     */
    static limit(count: number): Knex.QueryBuilder {
        return this.query().limit(count);
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

    // ── Relationships ─────────────────────────────────────────

    /**
     * Has-one relationship.
     * @example const profile = await user.hasOne(Profile, 'user_id');
     */
    async hasOne<T extends Model>(
        related: (new (attrs: any) => T) & { query(): Knex.QueryBuilder; tableName: string; primaryKey: string },
        foreignKey?: string,
        localKey?: string
    ): Promise<T | null> {
        const ctor = this.constructor as typeof Model;
        const fk = foreignKey ?? `${ctor.tableName.replace(/s$/, '')}_id`;
        const lk = localKey ?? ctor.primaryKey;

        const row = await (related as any).query()
            .where(fk, this[lk])
            .first();
        return row ? new related(row) : null;
    }

    /**
     * Has-many relationship.
     * @example const posts = await user.hasMany(Post, 'author_id');
     */
    async hasMany<T extends Model>(
        related: (new (attrs: any) => T) & { query(): Knex.QueryBuilder; tableName: string; primaryKey: string },
        foreignKey?: string,
        localKey?: string
    ): Promise<T[]> {
        const ctor = this.constructor as typeof Model;
        const fk = foreignKey ?? `${ctor.tableName.replace(/s$/, '')}_id`;
        const lk = localKey ?? ctor.primaryKey;

        const rows = await (related as any).query()
            .where(fk, this[lk])
            .select('*');
        return rows.map((row: any) => new related(row));
    }

    /**
     * Belongs-to relationship (inverse of hasOne/hasMany).
     * @example const author = await post.belongsTo(User, 'author_id');
     */
    async belongsTo<T extends Model>(
        related: (new (attrs: any) => T) & { query(): Knex.QueryBuilder; tableName: string; primaryKey: string },
        foreignKey?: string,
        ownerKey?: string
    ): Promise<T | null> {
        const relatedCtor = related as any;
        const fk = foreignKey ?? `${relatedCtor.tableName.replace(/s$/, '')}_id`;
        const ok = ownerKey ?? relatedCtor.primaryKey;

        const row = await relatedCtor.query()
            .where(ok, this[fk])
            .first();
        return row ? new related(row) : null;
    }

    /**
     * Eager-load relationships to avoid N+1 queries.
     * Each relation name must correspond to a method on the model instance
     * that returns a Promise (e.g. hasOne, hasMany, belongsTo).
     *
     * @example const users = await User.with('posts', 'profile');
     */
    static async with<T extends Model>(
        this: (new (attrs: any) => T) & typeof Model,
        ...relations: string[]
    ): Promise<T[]> {
        const ctor = this as any as typeof Model;
        const rows = await ctor.query().select('*');
        const instances = rows.map((row: any) => new this(row)) as T[];

        // Load each relationship for all instances
        for (const relation of relations) {
            await Promise.all(
                instances.map(async (instance) => {
                    if (typeof (instance as any)[relation] === 'function') {
                        (instance as any)[`_${relation}`] = await (instance as any)[relation]();
                    }
                })
            );
        }

        return instances;
    }
}
