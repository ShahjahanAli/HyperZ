---
title: "Validation"
description: "Validate incoming request data in HyperZ using Zod schemas — body, query, and params validation with automatic error responses."
---

**Validation** in HyperZ is powered by [Zod](https://zod.dev), a TypeScript-first schema validation library. Use the `validate()` middleware to automatically validate request data and return structured error responses.

## Defining Schemas

Create Zod schemas to define your validation rules:

```typescript
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  description: z.string().optional(),
  category: z.enum(['electronics', 'clothing', 'food']),
  tags: z.array(z.string()).default([]),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
```

## Body Validation

Apply the `validate()` middleware to routes to validate `req.body`:

```typescript
import { validate } from '../../src/validation/Validator.js';
import { createProductSchema } from '../schemas/product.js';

router.post('/products', validate(createProductSchema), controller.store.bind(controller));
```

If validation fails, HyperZ automatically returns a `422 Unprocessable Entity` response with structured error details.

## Query & Params Validation

Validate query strings and URL parameters with dedicated middlewares:

```typescript
import { validateQuery, validateParams } from '../../src/validation/Validator.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

router.get('/products', validateQuery(listQuerySchema), controller.index.bind(controller));
router.get('/products/:id', validateParams(idParamSchema), controller.show.bind(controller));
```

## Error Response Format

When validation fails, the response follows this structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Number must be greater than 0"
    },
    {
      "field": "name",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```
