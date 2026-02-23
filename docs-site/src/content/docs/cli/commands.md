---
title: "CLI Commands"
description: "Reference for all HyperZ CLI commands — migrations, seeding, key generation, route listing, REPL, and more."
---

HyperZ includes a powerful CLI for managing your application. All commands are run via `npx tsx bin/hyperz.ts`.

## Available Commands

### Database

```bash
# Run all pending migrations
npx tsx bin/hyperz.ts migrate

# Rollback the last batch of migrations
npx tsx bin/hyperz.ts migrate:rollback

# Run database seeders
npx tsx bin/hyperz.ts db:seed
```

### Security

```bash
# Generate APP_KEY and JWT_SECRET
npx tsx bin/hyperz.ts key:generate
```

### Routes

```bash
# List all registered routes
npx tsx bin/hyperz.ts route:list
```

### Interactive REPL

```bash
# Start an interactive TypeScript REPL with access to your app
npx tsx bin/hyperz.ts tinker
```

### Scaffolding

All `make:*` commands are covered in the [CLI Scaffolding](scaffolding) guide.

## Command Output

Commands provide colored, structured output:

```bash
$ npx tsx bin/hyperz.ts migrate

  ✓ 20260215170000_create_hyperz_admins_table ... migrated (12ms)
  ✓ 20260216100000_create_products_table ........ migrated (8ms)

  All migrations completed successfully.
```

## Environment

Commands respect your `.env` configuration. Set `APP_ENV` to control behavior:

```bash
APP_ENV=production npx tsx bin/hyperz.ts migrate
```
