---
title: "Testing"
description: "Write and run tests for your HyperZ application — unit tests, feature tests, HTTP test client, and Vitest configuration."
---

HyperZ uses [Vitest](https://vitest.dev) as its test runner. The framework includes an HTTP test client for feature tests and conventions for organizing unit tests.

## Creating Tests

Use the CLI to scaffold tests:

```bash
# Unit test
npx tsx bin/hyperz.ts make:test Product

# Feature test (HTTP integration)
npx tsx bin/hyperz.ts make:test Product -f
```

## Writing Unit Tests

Place unit tests in `src/__tests__/`:

```typescript
import { describe, it, expect } from 'vitest';
import { Product } from '../../app/models/Product.js';

describe('Product', () => {
  it('should have a table name', () => {
    expect(Product.table).toBe('products');
  });

  it('should define fillable fields', () => {
    expect(Product.fillable).toContain('name');
    expect(Product.fillable).toContain('price');
  });
});
```

## Feature Tests (HTTP)

Use the built-in HTTP test client to test API endpoints:

```typescript
import { describe, it, expect } from 'vitest';
import { TestClient } from '../../src/testing/TestClient.js';

describe('GET /api/products', () => {
  it('should return a list of products', async () => {
    const client = new TestClient();

    const response = await client.get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should require authentication for POST', async () => {
    const client = new TestClient();

    const response = await client.post('/api/products', {
      name: 'Test Product',
      price: 9.99,
    });

    expect(response.status).toBe(401);
  });
});
```

## Running Tests

```bash
# Run all tests
npx vitest run

# Run a specific test file
npx vitest run src/__tests__/Product.test.ts

# Watch mode
npx vitest
```

## Configuration

Test configuration is defined in `vitest.config.js` at the project root.
