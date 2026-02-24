---
description: How to work with migrations, seeders, and factories
---

# Database Operations

## Steps

// turbo-all

### Create a Migration

1. Scaffold:
```bash
npx hyperz make:migration create_<table_name>_table
```

2. Edit the migration file in `database/migrations/` — define columns in the `up()` function:
```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('<table_name>', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('<table_name>');
}
```

3. Run:
```bash
npx hyperz migrate
```

4. Rollback if needed:
```bash
npx hyperz migrate:rollback
```

### Create a Seeder

1. Scaffold:
```bash
npx hyperz make:seeder <Name>Seeder
```

2. Edit the seeder file in `database/seeders/` to insert data.

3. Run all seeders:
```bash
npx hyperz db:seed
```

4. Run a specific seeder:
```bash
npx hyperz db:seed -c <Name>Seeder
```

### Create a Factory

1. Scaffold:
```bash
npx hyperz make:factory <Name>Factory
```

2. Define factory fields using `Factory.define()`.

3. Use in seeders: `Factory.create('table')` or `Factory.createMany('table', 50)`.
