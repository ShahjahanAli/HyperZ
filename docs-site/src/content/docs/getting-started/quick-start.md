---
title: Quick Start
description: Build your first API with HyperZ in 5 minutes
---

## Scaffold a Resource

The fastest way to create a full CRUD API is using the `make:module` command:

```bash
npx hyperz make:module Product
```

This generates:
- `app/controllers/ProductController.ts`
- `app/models/Product.ts`
- `app/routes/products.ts`
- `database/migrations/YYYYMMDD_create_products_table.ts`

## Run Migration

```bash
npx hyperz migrate
```

## Your API is Ready

Start the server with `npm run dev` and you now have:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get a product |
| `POST` | `/api/products` | Create a product |
| `PUT` | `/api/products/:id` | Update a product |
| `DELETE` | `/api/products/:id` | Delete a product |

## Test It

```bash
# Create a product
curl -X POST http://localhost:7700/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Widget", "price": 29.99}'

# List products
curl http://localhost:7700/api/products
```

## What Happened?

### The Controller

```typescript
// app/controllers/ProductController.ts
import { Controller } from '../../src/http/Controller.js';
import type { Request, Response } from 'express';
import { Product } from '../models/Product.js';

export class ProductController extends Controller {
    async index(req: Request, res: Response) {
        const products = await Product.all();
        return this.success(res, products, 'Products retrieved');
    }

    async store(req: Request, res: Response) {
        const product = await Product.create(req.body);
        return this.created(res, product, 'Product created');
    }

    async show(req: Request, res: Response) {
        const product = await Product.findOrFail(Number(req.params.id));
        return this.success(res, product);
    }

    async update(req: Request, res: Response) {
        const product = await Product.update(
            Number(req.params.id), req.body
        );
        return this.success(res, product, 'Product updated');
    }

    async destroy(req: Request, res: Response) {
        await Product.delete(Number(req.params.id));
        return this.noContent(res);
    }
}
```

### The Model

```typescript
// app/models/Product.ts
import { Model } from '../../src/database/Model.js';

export class Product extends Model {
    static table = 'products';
    static fillable = ['name', 'price', 'description'];
    static hidden = [];
}
```

### The Route

```typescript
// app/routes/products.ts
import { HyperZRouter } from '../../src/http/Router.js';
import { ProductController } from '../controllers/ProductController.js';

const router = new HyperZRouter();
const controller = new ProductController();

router.resource('/products', controller);

export default router;
```

## Add Validation

```typescript
import { z } from 'zod';
import { validate } from '../../src/validation/Validator.js';

const createProductSchema = z.object({
    name: z.string().min(1).max(255),
    price: z.number().positive(),
    description: z.string().optional(),
});

// In your route file:
router.post('/products',
    validate(createProductSchema),
    controller.store.bind(controller)
);
```

## Next Steps

- [Routing](/http/routing/) — Advanced routing patterns
- [Controllers](/http/controllers/) — Response helpers and best practices
- [Models](/database/models/) — Relationships and query scopes
- [Authentication](/security/authentication/) — Protect your endpoints
