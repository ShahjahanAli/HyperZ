---
title: "Models"
description: "Define data models in HyperZ — Active Record pattern with fillable fields, hidden attributes, CRUD operations, and soft deletes."
---

**Models** in HyperZ follow the Active Record pattern. Each model maps to a database table and provides static methods for common CRUD operations. Models extend the `Model` base class.

## Creating a Model

Use the CLI to scaffold a model (optionally with a migration):

```bash
npx tsx bin/hyperz.ts make:model Product -m
```

Or create one manually in `app/models/`:

```typescript
import { Model } from '../../src/database/Model.js';

export class Product extends Model {
  static table = 'products';

  static fillable = ['name', 'price', 'description', 'category'];

  static hidden = ['internal_notes'];

  static softDeletes = true;
}
```

## CRUD Operations

Models provide static methods for all standard database operations:

```typescript
// Retrieve all records
const products = await Product.all();

// Find a single record by ID
const product = await Product.find(1);

// Create a new record
const newProduct = await Product.create({
  name: 'Widget',
  price: 29.99,
  category: 'electronics',
});

// Update a record
const updated = await Product.update(1, { price: 24.99 });

// Delete a record
await Product.delete(1);
```

## Fillable & Hidden

- **`fillable`** — Only these fields can be mass-assigned via `create()` and `update()`, protecting against mass-assignment vulnerabilities.
- **`hidden`** — These fields are excluded when the model is serialized to JSON.

```typescript
export class User extends Model {
  static table = 'users';
  static fillable = ['name', 'email', 'role'];
  static hidden = ['password', 'remember_token'];
}
```

## Soft Deletes

When `softDeletes` is enabled, records are not permanently removed. Instead, a `deleted_at` timestamp is set:

```typescript
export class Post extends Model {
  static table = 'posts';
  static softDeletes = true;
}

// Soft delete — sets deleted_at
await Post.delete(1);

// Query includes only non-deleted by default
const posts = await Post.all();
```
