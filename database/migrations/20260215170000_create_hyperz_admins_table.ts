import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('hyperz_admins', (table) => {
        table.increments('id').primary();
        table.string('email', 255).notNullable().unique();
        table.string('password', 255).notNullable();
        table.string('name', 255).notNullable();
        table.string('role', 50).notNullable().defaultTo('super_admin');
        table.integer('failed_attempts').notNullable().defaultTo(0);
        table.timestamp('locked_until').nullable();
        table.timestamp('last_login_at').nullable();
        table.string('last_login_ip', 45).nullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('hyperz_admins');
}
