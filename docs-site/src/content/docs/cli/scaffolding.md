---
title: "CLI Scaffolding"
description: "Quickly generate controllers, models, migrations, middleware, jobs, and more with HyperZ's make:* CLI commands."
---

HyperZ's CLI scaffolding commands generate correctly structured files following framework conventions. Always prefer these commands over writing boilerplate manually.

## Scaffolding Commands

### Controllers

```bash
npx tsx bin/hyperz.ts make:controller ProductController
```

Creates `app/controllers/ProductController.ts` with the `Controller` base class extended and response helpers ready.

### Models

```bash
# Model only
npx tsx bin/hyperz.ts make:model Product

# Model with migration
npx tsx bin/hyperz.ts make:model Product -m
```

Creates `app/models/Product.ts` with `table`, `fillable`, and `hidden` properties. The `-m` flag also creates a timestamped migration in `database/migrations/`.

### Migrations

```bash
npx tsx bin/hyperz.ts make:migration create_products_table
```

Creates a timestamped migration file in `database/migrations/` with `up()` and `down()` methods.

### Other Generators

```bash
# Middleware
npx tsx bin/hyperz.ts make:middleware ThrottleMiddleware

# Route file
npx tsx bin/hyperz.ts make:route products

# Queue job
npx tsx bin/hyperz.ts make:job SendWelcomeEmail

# Seeder
npx tsx bin/hyperz.ts make:seeder ProductSeeder

# Factory
npx tsx bin/hyperz.ts make:factory ProductFactory

# AI Action
npx tsx bin/hyperz.ts make:ai-action SummarizeAction

# Test (unit or feature with -f)
npx tsx bin/hyperz.ts make:test ProductTest -f

# Full module (model + controller + route + migration + test)
npx tsx bin/hyperz.ts make:module Product

# Full auth system
npx tsx bin/hyperz.ts make:auth
```

## Module Scaffolding

The `make:module` command is the fastest way to scaffold a complete domain:

```bash
npx tsx bin/hyperz.ts make:module Product
```

This creates:
- `app/models/Product.ts`
- `app/controllers/ProductController.ts`
- `app/routes/products.ts`
- `database/migrations/<timestamp>_create_products_table.ts`
- `src/__tests__/Product.test.ts`
