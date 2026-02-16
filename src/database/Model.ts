// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Base Model (TypeORM + Knex Support)
// ──────────────────────────────────────────────────────────────

import {
    BaseEntity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    FindOptionsWhere,
    FindManyOptions
} from 'typeorm';
import { Database } from './Database.js';

/**
 * Pagination Result Interface
 */
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

export abstract class Model extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deleted_at!: Date | null;

    /**
     * Hidden fields (excluded from toJSON)
     */
    protected static hidden: string[] = [];

    /**
     * Convert to plain object (excludes hidden fields)
     */
    toJSON(): Record<string, any> {
        const obj: any = { ...this };
        const ctor = this.constructor as typeof Model;

        if (ctor.hidden) {
            for (const key of ctor.hidden) {
                delete obj[key];
            }
        }

        return obj;
    }

    /**
     * Paginate results using TypeORM.
     */
    static async paginate<T extends Model>(
        this: typeof Model & (new () => T),
        page = 1,
        perPage = 15,
        options: FindManyOptions<T> = {}
    ): Promise<PaginationResult<T>> {
        const skip = (page - 1) * perPage;

        const [data, total] = await (this as any).findAndCount({
            ...options,
            take: perPage,
            skip: skip,
        });

        return {
            data,
            pagination: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
                hasNextPage: page * perPage < total,
                hasPrevPage: page > 1,
            },
        };
    }

    /**
     * Find a record by ID or throw.
     */
    static async findOrFail<T extends Model>(
        this: typeof Model & (new () => T),
        id: any
    ): Promise<T> {
        const result = await (this as any).findOneBy({ id } as any);
        if (!result) {
            throw new Error(`${this.name} with ID ${id} not found`);
        }
        return result;
    }

    // ── Compatibility Layer (Knex) ────────────────────────────

    /**
     * Get Knex query builder for this model's table.
     * Note: This is maintained for backward compatibility.
     */
    static knex() {
        // We assume the table name matches pluralized class name or is specified
        const tableName = (this as any).tableName || this.name.toLowerCase() + 's';
        return Database.getKnex()(tableName);
    }

    /**
     * Relationship: One-to-One
     */
    protected hasOne<T>(related: any, foreignKey?: string, localKey?: string): any {
        // Placeholder for ActiveRecord compatibility
        return null;
    }

    /**
     * Relationship: One-to-Many
     */
    protected hasMany<T>(related: any, foreignKey?: string, localKey?: string): any {
        // Placeholder for ActiveRecord compatibility
        return null;
    }

    /**
     * Relationship: Inverse One-to-One or Many-to-One
     */
    protected belongsTo<T>(related: any, foreignKey?: string, ownerKey?: string): any {
        // Placeholder for ActiveRecord compatibility
        return null;
    }
}
