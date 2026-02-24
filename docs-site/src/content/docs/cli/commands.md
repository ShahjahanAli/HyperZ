---
title: "CLI Commands"
description: "Reference for all HyperZ CLI commands — migrations, seeding, key generation, route listing, REPL, and more."
---

HyperZ includes a powerful CLI for managing your application. All commands are run via `npx hyperz`.

## Available Commands

### Database

```bash
# Run all pending migrations
npx hyperz migrate

# Rollback the last batch of migrations
npx hyperz migrate:rollback

# Run database seeders
npx hyperz db:seed
```

### Security

```bash
# Generate APP_KEY and JWT_SECRET
npx hyperz key:generate
```

### Routes

```bash
# List all registered routes
npx hyperz route:list
```

### Interactive REPL

```bash
# Start an interactive TypeScript REPL with access to your app
npx hyperz tinker
```

### Scaffolding

All `make:*` commands are covered in the [CLI Scaffolding](scaffolding) guide.

## Command Output

Commands provide colored, structured output:

```bash
$ npx hyperz migrate

  ✓ 20260215170000_create_hyperz_admins_table ... migrated (12ms)
  ✓ 20260216100000_create_products_table ........ migrated (8ms)

  All migrations completed successfully.
```

## Environment

Commands respect your `.env` configuration. Set `APP_ENV` to control behavior:

```bash
APP_ENV=production npx hyperz migrate
```
