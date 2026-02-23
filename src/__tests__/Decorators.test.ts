// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Decorators Tests
// ──────────────────────────────────────────────────────────────

import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import {
    Injectable,
    Singleton,
    Inject,
    INJECTABLE_METADATA_KEY,
    SCOPE_METADATA_KEY,
    PROPERTIES_METADATA_KEY,
} from '../core/Decorators.js';
import { ServiceContainer } from '../core/ServiceContainer.js';

describe('Decorators', () => {
    it('@Injectable() sets injectable metadata', () => {
        @Injectable()
        class MyService {}

        expect(Reflect.getMetadata(INJECTABLE_METADATA_KEY, MyService)).toBe(true);
    });

    it('@Singleton() sets both injectable and singleton scope metadata', () => {
        @Singleton()
        class MySingleton {}

        expect(Reflect.getMetadata(INJECTABLE_METADATA_KEY, MySingleton)).toBe(true);
        expect(Reflect.getMetadata(SCOPE_METADATA_KEY, MySingleton)).toBe('singleton');
    });

    it('@Inject() registers property metadata', () => {
        class Logger {}

        class MyController {
            @Inject(Logger)
            logger!: Logger;
        }

        const props: Map<string | symbol, unknown> = Reflect.getMetadata(
            PROPERTIES_METADATA_KEY,
            MyController
        );
        expect(props).toBeInstanceOf(Map);
        expect(props.get('logger')).toBe(Logger);
    });

    it('ServiceContainer auto-resolves @Injectable class', () => {
        @Injectable()
        class SimpleService {
            value = 'resolved';
        }

        const container = new ServiceContainer();
        const instance = container.make(SimpleService);
        expect(instance).toBeInstanceOf(SimpleService);
        expect(instance.value).toBe('resolved');
    });

    it('ServiceContainer returns same instance for @Singleton', () => {
        @Singleton()
        class SingleService {
            id = Math.random();
        }

        const container = new ServiceContainer();
        const a = container.make(SingleService);
        const b = container.make(SingleService);
        expect(a).toBe(b);
        expect(a.id).toBe(b.id);
    });
});
