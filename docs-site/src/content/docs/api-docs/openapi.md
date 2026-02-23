---
title: "OpenAPI Generation"
description: "Automatically generate OpenAPI 3.x specifications from your HyperZ routes, Zod schemas, and controller metadata."
---

HyperZ can automatically generate an **OpenAPI 3.x specification** from your routes, validation schemas, and controller metadata — keeping your API documentation always in sync with your code.

## Auto-Generated Spec

Access the raw OpenAPI JSON at:

```
http://localhost:7700/api/docs/openapi.json
```

## How It Works

HyperZ scans your registered routes and generates OpenAPI paths and schemas:

```typescript
// This route definition...
router.post('/products', validate(createProductSchema), controller.store.bind(controller));

// ...automatically generates an OpenAPI path with:
// - POST /products
// - Request body schema derived from createProductSchema (Zod → JSON Schema)
// - Response schemas from controller response helpers
```

## Zod-to-OpenAPI Conversion

Zod schemas are automatically converted to JSON Schema for the OpenAPI spec:

```typescript
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food']),
});

// Generates:
// {
//   "type": "object",
//   "required": ["name", "price", "category"],
//   "properties": {
//     "name": { "type": "string", "minLength": 1, "maxLength": 255 },
//     "price": { "type": "number", "exclusiveMinimum": 0 },
//     "category": { "type": "string", "enum": ["electronics", "clothing", "food"] }
//   }
// }
```

## Exporting the Spec

Download the OpenAPI spec for use with external tools:

```bash
curl http://localhost:7700/api/docs/openapi.json -o openapi.json
```

## Customization

Override generated metadata in `config/docs.ts`:

```typescript
export default {
  title: 'My API',
  version: '2.0.0',
  servers: [
    { url: 'https://api.example.com', description: 'Production' },
    { url: 'http://localhost:7700', description: 'Development' },
  ],
};
```
