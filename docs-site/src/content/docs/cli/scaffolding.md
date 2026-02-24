---
title: "CLI Scaffolding"
description: "Quickly generate controllers, models, migrations, middleware, jobs, and more with HyperZ's make:* CLI commands."
---

HyperZ's CLI scaffolding commands generate correctly structured files following framework conventions. Always prefer these commands over writing boilerplate manually.

## Scaffolding Commands

### Controllers

```bash
npx hyperz make:controller ProductController
```

Creates `app/controllers/ProductController.ts` with the `Controller` base class extended and response helpers ready.

### Models

```bash
# Model only
npx hyperz make:model Product

# Model with migration
npx hyperz make:model Product -m
```

Creates `app/models/Product.ts` with `table`, `fillable`, and `hidden` properties. The `-m` flag also creates a timestamped migration in `database/migrations/`.

### Migrations

```bash
npx hyperz make:migration create_products_table
```

Creates a timestamped migration file in `database/migrations/` with `up()` and `down()` methods.

### Other Generators

```bash
# Middleware
npx hyperz make:middleware ThrottleMiddleware

# Route file
npx hyperz make:route products

# Queue job
npx hyperz make:job SendWelcomeEmail

# Seeder
npx hyperz make:seeder ProductSeeder

# Factory
npx hyperz make:factory ProductFactory

# AI Action
npx hyperz make:ai-action SummarizeAction

# Test (unit or feature with -f)
npx hyperz make:test ProductTest -f

# Full module (model + controller + route + migration + test)
npx hyperz make:module Product

# Full auth system
npx hyperz make:auth
```

## Module Scaffolding

The `make:module` command is the fastest way to scaffold a complete domain:

```bash
npx hyperz make:module Product
```

This creates:
- `app/models/Product.ts`
- `app/controllers/ProductController.ts`
- `app/routes/products.ts`
- `database/migrations/<timestamp>_create_products_table.ts`
- `src/__tests__/Product.test.ts`
