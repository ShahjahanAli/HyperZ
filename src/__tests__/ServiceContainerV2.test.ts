import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceContainer } from '../core/ServiceContainer.js';
import { Injectable, Singleton } from '../core/Decorators.js';

@Injectable()
class Logger {
    log(msg: string) { return `log: ${msg}`; }
}

@Injectable()
class Database {
    constructor(private logger: Logger) { }
    query(sql: string) { return this.logger.log(`query: ${sql}`); }
}

@Singleton()
class Config {
    public id = Math.random();
}

@Injectable()
class App {
    constructor(public db: Database, public config: Config) { }
}

describe('ServiceContainer (Auto-resolution)', () => {
    let container: ServiceContainer;

    beforeEach(() => {
        container = new ServiceContainer();
    });

    it('can auto-resolve a class with no dependencies', () => {
        const logger = container.make(Logger);
        expect(logger).toBeInstanceOf(Logger);
        expect(logger.log('test')).toBe('log: test');
    });

    it('can auto-resolve nested dependencies', () => {
        const db = container.make(Database);
        expect(db).toBeInstanceOf(Database);
        expect(db.query('SELECT 1')).toBe('log: query: SELECT 1');
    });

    it('honors @Singleton decorator', () => {
        const c1 = container.make(Config);
        const c2 = container.make(Config);
        expect(c1.id).toBe(c2.id);
        expect(c1).toBe(c2);
    });

    it('can resolve deeply nested trees', () => {
        const app = container.make(App);
        expect(app).toBeInstanceOf(App);
        expect(app.db).toBeInstanceOf(Database);
        expect(app.config).toBeInstanceOf(Config);
        expect(app.db.query('test')).toBe('log: query: test');
    });

    it('can inject the ServiceContainer itself', () => {
        @Injectable()
        class ContainerAware {
            constructor(public container: ServiceContainer) { }
        }
        const instance = container.make(ContainerAware);
        expect(instance.container).toBe(container);
    });
});
