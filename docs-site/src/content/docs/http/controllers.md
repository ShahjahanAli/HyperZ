---
title: "Controllers"
description: "Build HTTP controllers in HyperZ — extend the Controller base class, use response helpers, and organize your API logic."
---

**Controllers** handle incoming HTTP requests and return responses. In HyperZ, controllers extend the `Controller` base class which provides convenient response helper methods for consistent API responses.

## Creating a Controller

Use the CLI to scaffold a controller:

```bash
npx hyperz make:controller ProductController
```

Or create one manually in `app/controllers/`:

```typescript
import type { Request, Response } from 'express';
import { Controller } from '../../src/http/Controller.js';
import { Product } from '../models/Product.js';

export class ProductController extends Controller {
  async index(req: Request, res: Response): Promise<void> {
    const products = await Product.all();
    this.success(res, products, 'Products retrieved successfully');
  }

  async store(req: Request, res: Response): Promise<void> {
    const product = await Product.create(req.body);
    this.created(res, product, 'Product created');
  }
}
```

## Response Helpers

The `Controller` base class provides these response methods:

```typescript
// 200 OK — with data and optional message
this.success(res, data, 'Operation successful');

// 201 Created — for newly created resources
this.created(res, data, 'Resource created');

// Error response — with custom status code (default 500)
this.error(res, 'Something went wrong', 422);

// 204 No Content — for deletions
this.noContent(res);

// Paginated response
this.paginate(res, data, total, page, perPage);
```

## Binding in Routes

Always bind controller methods when registering routes to preserve `this` context:

```typescript
const controller = new ProductController();

router.get('/products', controller.index.bind(controller));
router.post('/products', controller.store.bind(controller));
router.delete('/products/:id', controller.destroy.bind(controller));
```

## Dependency Injection

Controllers can receive dependencies through the constructor via the IoC container:

```typescript
import { Injectable } from '../../src/core/Container.js';

@Injectable()
export class OrderController extends Controller {
  constructor(private orderService: OrderService) {
    super();
  }

  async index(req: Request, res: Response): Promise<void> {
    const orders = await this.orderService.getAll();
    this.success(res, orders);
  }
}
```
