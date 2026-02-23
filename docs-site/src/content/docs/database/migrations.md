---
title: "Migrations"
description: "Manage database schema changes in HyperZ with TypeORM migrations — create tables, modify columns, and rollback changes."
---

**Migrations** provide a version-controlled way to modify your database schema over time. HyperZ uses TypeORM migrations with `up()` and `down()` methods for forward and reverse operations.

## Creating a Migration

Use the CLI to scaffold a timestamped migration:

```bash
npx tsx bin/hyperz.ts make:migration create_products_table
```

This creates a file in `database/migrations/` with a timestamp prefix:

```typescript
import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';

export class CreateProductsTable1708012800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          { name: 'id', type: 'integer', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
```

## Running Migrations

```bash
# Run all pending migrations
npx tsx bin/hyperz.ts migrate

# Rollback the last batch of migrations
npx tsx bin/hyperz.ts migrate:rollback
```

## Modifying Tables

Create a new migration to alter existing tables:

```typescript
export class AddCategoryToProducts1708099200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('products', new TableColumn({
      name: 'category',
      type: 'varchar',
      length: '100',
      isNullable: true,
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('products', 'category');
  }
}
```

## Best Practices

- Always implement both `up()` and `down()` for reversibility
- Use descriptive migration names (`create_products_table`, `add_category_to_products`)
- Never modify an already-executed migration — create a new one instead
- Run migrations after creating them: `npx tsx bin/hyperz.ts migrate`
