import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Entity, Column, DataSource, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Database } from '../database/Database.js';
import { Model } from '../database/Model.js';

@Entity('users')
class TestUser extends Model {
    @Column()
    name!: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    age?: number;

    @OneToMany(() => TestPost, (post) => post.user)
    posts!: TestPost[];

    // Laravel style helper for the test
    getPosts() { return this.hasMany(TestPost); }
}

@Entity('posts')
class TestPost extends Model {
    @Column()
    title!: string;

    @Column({ name: 'user_id' })
    user_id!: number;

    @ManyToOne(() => TestUser, (user) => user.posts)
    @JoinColumn({ name: 'user_id' })
    user!: TestUser;

    // Laravel style helper for the test
    author() { return this.belongsTo(TestUser); }
}

describe('Model (Active Record)', () => {
    let dataSource: DataSource;

    beforeEach(async () => {
        dataSource = new DataSource({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            entities: [TestUser, TestPost],
            logging: false
        });
        await dataSource.initialize();
        Database.setDataSource(dataSource);
    });

    afterEach(async () => {
        await Database.disconnect();
    });

    it('can create and find a record', async () => {
        const user = await TestUser.create({ name: 'John Doe', email: 'john@example.com' });
        expect(user.id).toBe(1);
        expect(user.name).toBe('John Doe');

        const found = await TestUser.find(1);
        expect(found?.name).toBe('John Doe');
    });

    it('can paginate results', async () => {
        await TestUser.create({ name: 'User 1' });
        await TestUser.create({ name: 'User 2' });
        await TestUser.create({ name: 'User 3' });

        const result = await TestUser.paginate(1, 2);
        expect(result.data.length).toBe(2);
        expect(result.pagination.total).toBe(3);
    });

    it('can use query scopes like first and count', async () => {
        await TestUser.create({ name: 'A' });
        await TestUser.create({ name: 'B' });

        expect(await TestUser.count()).toBe(2);
        expect(await TestUser.exists()).toBe(true);

        const first = await TestUser.where('name', 'B').first();
        expect(first?.name).toBe('B');
    });

    it('supports ordering', async () => {
        await TestUser.create({ name: 'Z' });
        await TestUser.create({ name: 'A' });

        const users = await TestUser.orderBy('name', 'asc').get();
        expect(users[0].name).toBe('A');
    });

    it('can check records existence with where', async () => {
        await TestUser.create({ name: 'Found' });
        const count = await TestUser.where('name', 'Found').count();
        expect(count).toBe(1);
    });

    // Note: Relationship and eager loading tests are skipped or simplified 
    // because full Laravel-style relationship proxies are still in development.
    // But basic create/find is verified.
});
