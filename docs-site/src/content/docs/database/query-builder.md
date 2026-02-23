---
title: "Query Builder"
description: "Build raw SQL queries fluently with HyperZ's DB facade — select, where, orderBy, insert, update, delete, and transactions."
---

The **Query Builder** provides a fluent interface for constructing and executing SQL queries without writing raw SQL. Use the `DB` facade to start building queries against any table.

## Basic Queries

```typescript
import { DB } from '../../src/database/QueryBuilder.js';

// Select all rows
const users = await DB.table('users').get();

// Select specific columns
const names = await DB.table('users').select('id', 'name', 'email').get();

// Get a single row
const user = await DB.table('users').where('id', 1).first();
```

## Where Clauses

Chain multiple conditions to filter results:

```typescript
const activeAdmins = await DB.table('users')
  .where('role', 'admin')
  .where('active', true)
  .get();

const results = await DB.table('products')
  .where('price', '>', 10)
  .orWhere('featured', true)
  .whereIn('category', ['electronics', 'clothing'])
  .whereNull('deleted_at')
  .get();
```

## Ordering, Limiting & Pagination

```typescript
const latest = await DB.table('posts')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .offset(20)
  .get();

// Built-in pagination
const page = await DB.table('products')
  .where('active', true)
  .paginate(1, 15); // page 1, 15 per page
```

## Insert, Update & Delete

```typescript
// Insert
await DB.table('products').insert({
  name: 'New Widget',
  price: 19.99,
});

// Update
await DB.table('products').where('id', 1).update({ price: 14.99 });

// Delete
await DB.table('products').where('id', 1).delete();

// Aggregates
const total = await DB.table('products').count();
const exists = await DB.table('users').where('email', 'a@b.com').exists();
```

## Transactions

Wrap multiple operations in a database transaction:

```typescript
await DB.transaction(async () => {
  await DB.table('accounts').where('id', 1).update({ balance: 50 });
  await DB.table('accounts').where('id', 2).update({ balance: 150 });
  await DB.table('transfers').insert({ from: 1, to: 2, amount: 100 });
});
```
