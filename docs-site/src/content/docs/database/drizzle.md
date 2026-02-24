---
title: Drizzle ORM
description: Use Drizzle ORM as an alternative to TypeORM
---

## Overview

HyperZ supports **Drizzle ORM** as an alternative (or complement) to TypeORM. Drizzle is a lightweight, type-safe SQL toolkit with zero dependencies and excellent TypeScript inference.

## Configuration

Set the ORM driver in your `.env`:

```bash
ORM_DRIVER=drizzle     # Use Drizzle ORM
ORM_DRIVER=typeorm     # Default — TypeORM
```

Both ORMs can coexist in the same project.

## Setup

### SQLite

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

### PostgreSQL

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

### MySQL

```bash
npm install drizzle-orm mysql2
npm install -D drizzle-kit
```

## Initialization

Drizzle is managed via the `DrizzleManager`:

```typescript
import { DrizzleManager } from './src/database/DrizzleManager.js';

// Initialize from environment variables
await DrizzleManager.initialize();

// Or with explicit config
await DrizzleManager.initialize({
    driver: 'sqlite',
    database: './storage/database.sqlite',
});
```

## Defining Schemas

Unlike TypeORM's decorator-based entities, Drizzle uses plain TypeScript schemas:

```typescript
// database/schema/products.ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    price: real('price').notNull(),
    description: text('description'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});
```

## Querying

```typescript
import { DrizzleManager } from './src/database/DrizzleManager.js';
import { products } from '../database/schema/products.js';
import { eq } from 'drizzle-orm';

const db = DrizzleManager.getInstance();

// Select all
const allProducts = await db.select().from(products);

// Select with conditions
const expensive = await db
    .select()
    .from(products)
    .where(eq(products.price, 29.99));

// Insert
await db.insert(products).values({
    name: 'Widget',
    price: 29.99,
});

// Update
await db.update(products)
    .set({ price: 39.99 })
    .where(eq(products.id, 1));

// Delete
await db.delete(products).where(eq(products.id, 1));
```

## Migrations with Drizzle Kit

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Open Drizzle Studio (visual database browser)
npx drizzle-kit studio
```

## Coexisting with TypeORM

You can use both ORMs in the same project:

- **TypeORM** — for existing models and the HyperZ `Model` base class
- **Drizzle** — for new features, complex queries, or performance-critical paths

```typescript
// TypeORM model (existing)
const users = await User.all();

// Drizzle query (new)
const db = DrizzleManager.getInstance();
const analytics = await db.select().from(pageViews).where(...);
```
