---
title: "Routing"
description: "Define API routes in HyperZ using HyperZRouter — HTTP methods, resource routes, route groups, named routes, and more."
---

**Routing** in HyperZ is handled by `HyperZRouter`, a fluent API built on Express.js 5. Route files placed in `app/routes/` are auto-loaded — no manual registration required.

## Defining Routes

Use the standard HTTP method helpers to define routes:

```typescript
import { HyperZRouter } from '../../src/http/Router.js';
import { ProductController } from '../controllers/ProductController.js';

const router = new HyperZRouter();
const controller = new ProductController();

router.get('/products', controller.index.bind(controller));
router.post('/products', controller.store.bind(controller));
router.get('/products/:id', controller.show.bind(controller));
router.put('/products/:id', controller.update.bind(controller));
router.delete('/products/:id', controller.destroy.bind(controller));

export default router;
```

## Resource Routes

Generate a full CRUD route set with a single call:

```typescript
router.resource('/products', controller);
// Creates: GET /products, GET /products/:id, POST /products,
//          PUT /products/:id, DELETE /products/:id
```

## Route Groups

Group routes with shared prefixes and middleware:

```typescript
import { authMiddleware } from '../../src/auth/AuthMiddleware.js';

router.group({ prefix: '/v2', middleware: [authMiddleware] }, (r) => {
  r.get('/users', controller.index.bind(controller));
  r.post('/users', controller.store.bind(controller));
});
// Results in: GET /v2/users, POST /v2/users (both auth-protected)
```

## Named Routes

Assign names to routes for URL generation:

```typescript
router.get('/products/:id', controller.show.bind(controller)).name('products.show');

// Generate URL by name
const url = router.route('products.show', { id: 42 });
// => /products/42
```

## Route Middleware

Apply middleware to individual routes:

```typescript
import { validate } from '../../src/validation/Validator.js';
import { createProductSchema } from '../schemas/product.js';

router.post('/products', validate(createProductSchema), controller.store.bind(controller));
```
