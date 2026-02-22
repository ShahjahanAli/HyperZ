// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Query Builder (DB Facade)
// ──────────────────────────────────────────────────────────────
//
// Provides a fluent, Laravel-style query builder for raw SQL
// access beyond the Active Record pattern.
//
// Usage:
//   import { DB } from '../../src/database/QueryBuilder.js';
//
//   // Select
//   const users = await DB.table('users').where('role', 'admin').get();
//
//   // Insert
//   await DB.table('posts').insert({ title: 'Hello', body: '...' });
//
//   // Update
//   await DB.table('users').where('id', 5).update({ name: 'New Name' });
//
//   // Delete
//   await DB.table('users').where('id', 5).delete();
//
//   // Raw
//   const result = await DB.raw('SELECT COUNT(*) as total FROM users');
//
//   // Transactions
//   await DB.transaction(async (qb) => {
//     await qb.table('accounts').where('id', 1).update({ balance: 100 });
//     await qb.table('ledger').insert({ account_id: 1, amount: -50 });
//   });
// ──────────────────────────────────────────────────────────────

import { Database } from './Database.js';

// ── Types ───────────────────────────────────────────────────

type WhereOperator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';

interface WhereClause {
    column: string;
    operator: WhereOperator;
    value: unknown;
    conjunction: 'AND' | 'OR';
}

interface OrderClause {
    column: string;
    direction: 'ASC' | 'DESC';
}

// ── Query Builder ───────────────────────────────────────────

export class QueryBuilder {
    private tableName: string;
    private whereClauses: WhereClause[] = [];
    private orderClauses: OrderClause[] = [];
    private selectColumns: string[] = ['*'];
    private limitValue: number | null = null;
    private offsetValue: number | null = null;
    private groupByColumns: string[] = [];

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    // ── Selection ───────────────────────────────────────────

    /**
     * Specify columns to select.
     */
    select(...columns: string[]): this {
        this.selectColumns = columns;
        return this;
    }

    // ── Where ───────────────────────────────────────────────

    /**
     * Add a WHERE clause.
     * Supports 2-arg (column, value) or 3-arg (column, operator, value).
     */
    where(column: string, operatorOrValue: unknown, value?: unknown): this {
        if (value === undefined) {
            this.whereClauses.push({ column, operator: '=', value: operatorOrValue, conjunction: 'AND' });
        } else {
            this.whereClauses.push({ column, operator: operatorOrValue as WhereOperator, value, conjunction: 'AND' });
        }
        return this;
    }

    /**
     * Add an OR WHERE clause.
     */
    orWhere(column: string, operatorOrValue: unknown, value?: unknown): this {
        if (value === undefined) {
            this.whereClauses.push({ column, operator: '=', value: operatorOrValue, conjunction: 'OR' });
        } else {
            this.whereClauses.push({ column, operator: operatorOrValue as WhereOperator, value, conjunction: 'OR' });
        }
        return this;
    }

    /**
     * WHERE column IS NULL.
     */
    whereNull(column: string): this {
        this.whereClauses.push({ column, operator: 'IS NULL', value: null, conjunction: 'AND' });
        return this;
    }

    /**
     * WHERE column IS NOT NULL.
     */
    whereNotNull(column: string): this {
        this.whereClauses.push({ column, operator: 'IS NOT NULL', value: null, conjunction: 'AND' });
        return this;
    }

    /**
     * WHERE column IN (...values).
     */
    whereIn(column: string, values: unknown[]): this {
        this.whereClauses.push({ column, operator: 'IN', value: values, conjunction: 'AND' });
        return this;
    }

    // ── Ordering & Limits ───────────────────────────────────

    orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this.orderClauses.push({ column, direction });
        return this;
    }

    limit(count: number): this {
        this.limitValue = count;
        return this;
    }

    offset(count: number): this {
        this.offsetValue = count;
        return this;
    }

    groupBy(...columns: string[]): this {
        this.groupByColumns = columns;
        return this;
    }

    // ── Execution ───────────────────────────────────────────

    /**
     * Execute SELECT and return all matching rows.
     */
    async get<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<T[]> {
        const { sql, params } = this.buildSelect();
        return Database.raw(sql, params) as Promise<T[]>;
    }

    /**
     * Execute SELECT and return the first matching row, or null.
     */
    async first<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<T | null> {
        this.limitValue = 1;
        const results = await this.get<T>();
        return results[0] ?? null;
    }

    /**
     * Get COUNT(*).
     */
    async count(): Promise<number> {
        const saved = this.selectColumns;
        this.selectColumns = ['COUNT(*) as count'];
        const { sql, params } = this.buildSelect();
        this.selectColumns = saved;

        const results = await Database.raw(sql, params) as Record<string, unknown>[];
        const row = results[0];
        return row ? Number(row['count'] ?? 0) : 0;
    }

    /**
     * Check if any rows match.
     */
    async exists(): Promise<boolean> {
        return (await this.count()) > 0;
    }

    /**
     * Paginate results.
     */
    async paginate<T extends Record<string, unknown> = Record<string, unknown>>(
        page = 1,
        perPage = 15,
    ): Promise<{ data: T[]; total: number; page: number; perPage: number; totalPages: number }> {
        const total = await this.count();
        this.limitValue = perPage;
        this.offsetValue = (page - 1) * perPage;
        const data = await this.get<T>();

        return {
            data,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        };
    }

    /**
     * INSERT a row.
     */
    async insert(data: Record<string, unknown>): Promise<void> {
        const columns = Object.keys(data);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(data);

        const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        await Database.raw(sql, values);
    }

    /**
     * UPDATE matching rows.
     */
    async update(data: Record<string, unknown>): Promise<void> {
        const entries = Object.entries(data);
        const setClauses = entries.map(([col], i) => `${col} = $${i + 1}`);
        const values = entries.map(([, val]) => val);

        const { whereSQL, whereParams } = this.buildWhereClause(values.length);
        const sql = `UPDATE ${this.tableName} SET ${setClauses.join(', ')}${whereSQL}`;
        await Database.raw(sql, [...values, ...whereParams]);
    }

    /**
     * DELETE matching rows.
     */
    async delete(): Promise<void> {
        const { whereSQL, whereParams } = this.buildWhereClause(0);
        const sql = `DELETE FROM ${this.tableName}${whereSQL}`;
        await Database.raw(sql, whereParams);
    }

    // ── SQL Building ────────────────────────────────────────

    private buildSelect(): { sql: string; params: unknown[] } {
        const { whereSQL, whereParams } = this.buildWhereClause(0);

        let sql = `SELECT ${this.selectColumns.join(', ')} FROM ${this.tableName}`;
        sql += whereSQL;

        if (this.groupByColumns.length > 0) {
            sql += ` GROUP BY ${this.groupByColumns.join(', ')}`;
        }

        if (this.orderClauses.length > 0) {
            const orders = this.orderClauses.map((o) => `${o.column} ${o.direction}`);
            sql += ` ORDER BY ${orders.join(', ')}`;
        }

        if (this.limitValue !== null) sql += ` LIMIT ${this.limitValue}`;
        if (this.offsetValue !== null) sql += ` OFFSET ${this.offsetValue}`;

        return { sql, params: whereParams };
    }

    private buildWhereClause(paramOffset: number): { whereSQL: string; whereParams: unknown[] } {
        if (this.whereClauses.length === 0) return { whereSQL: '', whereParams: [] };

        const parts: string[] = [];
        const params: unknown[] = [];
        let paramIndex = paramOffset + 1;

        for (let i = 0; i < this.whereClauses.length; i++) {
            const clause = this.whereClauses[i]!;
            let fragment: string;

            if (clause.operator === 'IS NULL') {
                fragment = `${clause.column} IS NULL`;
            } else if (clause.operator === 'IS NOT NULL') {
                fragment = `${clause.column} IS NOT NULL`;
            } else if (clause.operator === 'IN' || clause.operator === 'NOT IN') {
                const values = clause.value as unknown[];
                const placeholders = values.map(() => `$${paramIndex++}`).join(', ');
                fragment = `${clause.column} ${clause.operator} (${placeholders})`;
                params.push(...values);
            } else {
                fragment = `${clause.column} ${clause.operator} $${paramIndex++}`;
                params.push(clause.value);
            }

            if (i === 0) {
                parts.push(fragment);
            } else {
                parts.push(`${clause.conjunction} ${fragment}`);
            }
        }

        return { whereSQL: ` WHERE ${parts.join(' ')}`, whereParams: params };
    }
}

// ── DB Facade ───────────────────────────────────────────────

export class DB {
    /**
     * Start a query for the given table.
     *
     * @example
     * const users = await DB.table('users').where('active', true).get();
     */
    static table(tableName: string): QueryBuilder {
        return new QueryBuilder(tableName);
    }

    /**
     * Execute raw SQL.
     *
     * @example
     * const result = await DB.raw('SELECT 1 + 1 AS answer');
     */
    static async raw(sql: string, bindings: unknown[] = []): Promise<unknown> {
        return Database.raw(sql, bindings);
    }

    /**
     * Run a callback inside a database transaction.
     *
     * @example
     * await DB.transaction(async () => {
     *   await DB.table('accounts').where('id', 1).update({ balance: 50 });
     *   await DB.table('ledger').insert({ account_id: 1, amount: -50 });
     * });
     */
    static async transaction<T>(callback: () => Promise<T>): Promise<T> {
        return Database.transaction(async () => callback());
    }
}
