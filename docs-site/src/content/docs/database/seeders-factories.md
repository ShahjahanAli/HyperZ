---
title: "Seeders & Factories"
description: "Populate your database with test data using HyperZ seeders and Faker-powered model factories."
---

**Seeders** let you populate your database with initial or test data, while **Factories** generate realistic fake data using Faker. Together, they streamline development and testing workflows.

## Creating a Seeder

Use the CLI to scaffold a seeder:

```bash
npx hyperz make:seeder ProductSeeder
```

Define the seeder in `database/seeders/`:

```typescript
import { DB } from '../../src/database/QueryBuilder.js';

export class ProductSeeder {
  async run(): Promise<void> {
    await DB.table('products').insert([
      { name: 'Widget A', price: 29.99, category: 'electronics' },
      { name: 'Widget B', price: 49.99, category: 'electronics' },
      { name: 'T-Shirt', price: 19.99, category: 'clothing' },
    ]);
  }
}
```

## Running Seeders

```bash
npx hyperz db:seed
```

## Creating a Factory

Use the CLI to scaffold a factory:

```bash
npx hyperz make:factory ProductFactory
```

Define the factory in `database/factories/`:

```typescript
import { Factory } from '../../src/database/Factory.js';
import { faker } from '@faker-js/faker';

export class ProductFactory extends Factory {
  definition(): Record<string, unknown> {
    return {
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      description: faker.commerce.productDescription(),
      category: faker.helpers.arrayElement(['electronics', 'clothing', 'food']),
      created_at: faker.date.recent(),
    };
  }
}
```

## Using Factories

Generate records programmatically in seeders or tests:

```typescript
const factory = new ProductFactory();

// Create a single record
const product = await factory.create();

// Create multiple records
const products = await factory.createMany(50);

// Override specific attributes
const premium = await factory.create({ price: 999.99, category: 'electronics' });
```
