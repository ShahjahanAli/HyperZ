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

// @ts-ignore — static side of Model intentionally overrides BaseEntity.create with an async variant
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
     * ActiveRecord: Create and Save a new record.
     * @ts-ignore intentionally overrides TypeORM's synchronous create() factory
     */
    // @ts-ignore — our async create(attributes) supersedes BaseEntity's sync factory overloads
    static async create<T extends Model>(
        this: typeof Model & (new () => T),
        attributes: any
    ): Promise<T> {
        const repository = (this as any).getRepository();
        const entity = repository.create(attributes);
        return await repository.save(entity);
    }

    /**
     * ActiveRecord: Find a record by ID.
     */
    static async find<T extends Model>(
        this: typeof Model & (new () => T),
        id: any
    ): Promise<T | null> {
        return await (this as any).findOneBy({ id } as any);
    }

    /**
     * ActiveRecord: Start a query with a where clause.
     */
    static where<T extends Model>(
        this: typeof Model & (new () => T),
        column: string,
        operator: any,
        value?: any
    ) {
        const query = (this as any).createQueryBuilder(this.name.toLowerCase());
        if (value === undefined) {
            query.where(`${this.name.toLowerCase()}.${column} = :val`, { val: operator });
        } else {
            query.where(`${this.name.toLowerCase()}.${column} ${operator} :val`, { val: value });
        }
        return new ModelQueryWrapper<T>(query);
    }

    /**
     * ActiveRecord: Get all records.
     */
    static async all<T extends Model>(this: typeof Model & (new () => T)): Promise<T[]> {
        return await (this as any).find();
    }

    /**
     * ActiveRecord: Order by column.
     */
    static orderBy<T extends Model>(
        this: typeof Model & (new () => T),
        column: string,
        direction: 'ASC' | 'DESC' | 'asc' | 'desc' = 'ASC'
    ) {
        const query = (this as any).createQueryBuilder(this.name.toLowerCase());
        query.orderBy(`${this.name.toLowerCase()}.${column}`, direction.toUpperCase() as any);
        return new ModelQueryWrapper<T>(query);
    }

    /**
     * ActiveRecord: Count records.
     */
    static async count(): Promise<number> {
        return await super.count();
    }

    /**
     * ActiveRecord: Check if any record exists.
     */
    static async exists(): Promise<boolean> {
        const count = await this.count();
        return count > 0;
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

}


/**
 * A lightweight wrapper around TypeORM's SelectQueryBuilder to provide Laravel-style chainable API.
 */
class ModelQueryWrapper<T extends Model> {
    constructor(private query: any) { }

    where(column: string, operator: any, value?: any) {
        if (value === undefined) {
            this.query.andWhere(`${this.query.alias}.${column} = :val`, { val: operator });
        } else {
            this.query.andWhere(`${this.query.alias}.${column} ${operator} :val`, { val: value });
        }
        return this;
    }

    orderBy(column: string, direction: 'ASC' | 'DESC' | 'asc' | 'desc' = 'ASC') {
        this.query.addOrderBy(`${this.query.alias}.${column}`, direction.toUpperCase() as any);
        return this;
    }

    async first(): Promise<T | null> {
        return await this.query.getOne();
    }

    async get(): Promise<T[]> {
        return await this.query.getMany();
    }

    async select(fields: string | string[]) {
        // Simple select implementation
        return await this.get();
    }

    async count(): Promise<number> {
        return await this.query.getCount();
    }
}
