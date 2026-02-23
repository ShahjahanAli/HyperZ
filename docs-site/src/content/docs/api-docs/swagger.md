---
title: "Swagger UI"
description: "Browse and test your HyperZ API with the built-in Swagger UI — interactive documentation, schema visualization, and live request execution."
---

HyperZ includes a built-in **Swagger UI** for visually exploring and testing your API. It renders your OpenAPI specification as an interactive documentation page.

## Accessing Swagger UI

By default, the Swagger UI is available at:

```
http://localhost:7700/api/docs
```

## Configuration

Configure the docs endpoint in `config/docs.ts`:

```typescript
export default {
  enabled: env('DOCS_ENABLED', 'true') === 'true',
  path: '/api/docs',
  title: 'HyperZ API Documentation',
  version: '1.0.0',
  description: 'API documentation for the HyperZ application.',
};
```

## Annotating Routes

Add OpenAPI metadata to your routes for richer documentation:

```typescript
router.get('/products', controller.index.bind(controller));
// Swagger auto-discovers routes and generates documentation

router.post('/products', validate(createProductSchema), controller.store.bind(controller));
// Zod schemas are automatically converted to OpenAPI request body schemas
```

## Authentication in Swagger

Include JWT tokens in Swagger requests using the "Authorize" button:

```
Bearer eyJhbGciOiJIUzI1NiIs...
```

## Disabling in Production

Disable Swagger UI in production via environment variables:

```bash
DOCS_ENABLED=false
```
