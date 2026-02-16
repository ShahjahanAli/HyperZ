import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../database/Database.js';
import { Model } from '../database/Model.js';

// Use a class that can be safely used in tests
class TestUser extends Model {
    protected static tableName = 'users';
}

class TestPost extends Model {
    protected static tableName = 'posts';
    protected static timestamps = false; // Disable to avoid missing column error in test
    author() { return this.belongsTo(TestUser as any); }
}

describe('Model (Active Record)', () => {
    beforeEach(async () => {
        await Database.connectSQL({
            client: 'sqlite3',
            connection: { filename: ':memory:' },
            useNullAsDefault: true,
        });

        const knex = Database.getKnex();
        await knex.schema.createTable('users', (table) => {
            table.increments('id');
            table.string('name');
            table.string('email').nullable();
            table.integer('age').nullable();
            table.timestamps(true, true);
        });
    });

    afterEach(async () => {
        await Database.disconnect();
    });

    it('can create and find a record', async () => {
        const user = await (TestUser as any).create({ name: 'John Doe', email: 'john@example.com' });
        expect(user.id).toBe(1);
        expect(user.name).toBe('John Doe');

        const found = await (TestUser as any).find(1);
        expect(found?.name).toBe('John Doe');
    });

    it('can paginate results', async () => {
        await (TestUser as any).create({ name: 'User 1' });
        await (TestUser as any).create({ name: 'User 2' });
        await (TestUser as any).create({ name: 'User 3' });

        const result = await (TestUser as any).paginate(1, 2);
        expect(result.data.length).toBe(2);
        expect(result.pagination.total).toBe(3);
    });

    it('can use query scopes like first and count', async () => {
        await (TestUser as any).create({ name: 'A' });
        await (TestUser as any).create({ name: 'B' });

        expect(await (TestUser as any).count()).toBe(2);
        expect(await (TestUser as any).exists()).toBe(true);

        const first = await (TestUser as any).where('name', 'B').first();
        expect(first.name).toBe('B');
    });

    it('supports ordering', async () => {
        await (TestUser as any).create({ name: 'Z' });
        await (TestUser as any).create({ name: 'A' });

        const users = await (TestUser as any).orderBy('name', 'asc').select('*');
        expect(users[0].name).toBe('A');
    });

    it('can handle relationships (belongsTo/hasMany)', async () => {
        const knex = Database.getKnex();
        await knex.schema.dropTableIfExists('posts');
        await knex.schema.createTable('posts', (table) => {
            table.increments('id');
            table.string('title');
            table.integer('user_id');
        });

        (TestUser.prototype as any).posts = function () { return this.hasMany(TestPost as any); };

        const user = await (TestUser as any).create({ name: 'Author' });
        await (TestPost as any).create({ title: 'Post 1', user_id: user.id });
        await (TestPost as any).create({ title: 'Post 2', user_id: user.id });

        const authorPosts = await (user as any).posts();
        expect(authorPosts.length).toBe(2);
        expect(authorPosts[0].title).toBe('Post 1');

        const post1 = await (TestPost as any).find(1);
        const postAuthor = await (post1 as any).author();
        expect(postAuthor.name).toBe('Author');
    });

    it('supports eager loading with "with"', async () => {
        const knex = Database.getKnex();
        await knex.schema.dropTableIfExists('posts');
        await knex.schema.createTable('posts', (table) => {
            table.increments('id');
            table.string('title');
            table.integer('user_id');
        });

        (TestUser.prototype as any).posts = function () { return this.hasMany(TestPost as any); };

        const user = await (TestUser as any).create({ name: 'Eager Author' });
        await (TestPost as any).create({ title: 'Eager Post', user_id: user.id });

        const users = await (TestUser as any).with('posts');
        expect(users[0]._posts).toBeDefined();
        expect(users[0]._posts.length).toBe(1);
    });

    it('can run database transactions', async () => {
        await Database.transaction(async (trx) => {
            await (trx as any)('users').insert({ name: 'Transacted' });
        });

        const found = await (TestUser as any).where('name', 'Transacted').first();
        expect(found).toBeDefined();
        expect(found?.name).toBe('Transacted');
    });
});
