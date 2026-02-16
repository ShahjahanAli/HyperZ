// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Service Container (IoC / Dependency Injection)
// ──────────────────────────────────────────────────────────────

import 'reflect-metadata';
import { INJECTABLE_METADATA_KEY, SCOPE_METADATA_KEY, PARAM_TYPES_METADATA_KEY, PROPERTIES_METADATA_KEY } from './Decorators.js';

export type Constructor<T = any> = new (...args: any[]) => T;
export type Factory<T = any> = (container: ServiceContainer) => T;

interface Binding<T = any> {
    factory: Factory<T>;
    singleton: boolean;
    instance?: T;
}

export class ServiceContainer {
    private bindings = new Map<string | symbol | Function, Binding>();
    private instances = new Map<string | symbol | Function, any>();
    private aliases = new Map<string | symbol | Function, string | symbol | Function>();
    private tags = new Map<string, (string | symbol | Function)[]>();

    /**
     * Register a binding in the container.
     */
    bind<T>(abstract: string | symbol | Constructor<T>, factory: Factory<T>, singleton = false): this {
        this.bindings.set(abstract, { factory, singleton });
        return this;
    }

    /**
     * Register a shared (singleton) binding.
     */
    singleton<T>(abstract: string | symbol | Constructor<T>, factory: Factory<T>): this {
        return this.bind(abstract, factory, true);
    }

    /**
     * Register an existing instance as a singleton.
     */
    instance<T>(abstract: string | symbol | Constructor<T>, value: T): this {
        this.instances.set(abstract, value);
        return this;
    }

    /**
     * Register an alias for an abstract binding.
     */
    alias(alias: string | symbol | Function, abstract: string | symbol | Function): this {
        this.aliases.set(alias, abstract);
        return this;
    }

    /**
     * Tag one or more abstracts under a group name.
     */
    tag(abstracts: (string | symbol | Function)[], tagName: string): this {
        const existing = this.tags.get(tagName) ?? [];
        existing.push(...abstracts);
        this.tags.set(tagName, existing);
        return this;
    }

    /**
     * Resolve all bindings under a tag.
     */
    tagged<T = any>(tagName: string): T[] {
        const abstracts = this.tags.get(tagName) ?? [];
        return abstracts.map(ab => this.make<T>(ab as any));
    }

    /**
     * Resolve a binding from the container.
     */
    make<T = any>(abstract: string | symbol | Constructor<T>): T {
        // Resolve aliases
        const resolved = this.aliases.has(abstract)
            ? this.aliases.get(abstract)!
            : abstract;

        // Return existing instance if already resolved
        if (this.instances.has(resolved)) {
            return this.instances.get(resolved) as T;
        }

        // Look up binding
        const binding = this.bindings.get(resolved);

        if (binding) {
            const instance = binding.factory(this);
            if (binding.singleton) {
                this.instances.set(resolved, instance);
            }
            return instance as T;
        }

        // Auto-resolution for classes
        if (typeof resolved === 'function') {
            return this.resolveConstructor(resolved as Constructor<T>);
        }

        throw new Error(`[HyperZ] No binding registered for "${String(resolved)}".`);
    }

    /**
     * Resolve a class constructor by injecting its dependencies.
     */
    private resolveConstructor<T>(ctor: Constructor<T>): T {
        if (typeof ctor !== 'function') {
            console.log("INVALID_CONSTRUCTOR_IN_RESOLVE:", ctor);
            throw new TypeError(`${String(ctor)} is not a constructor`);
        }
        // Check if class is injectable
        const isInjectable = Reflect.getMetadata(INJECTABLE_METADATA_KEY, ctor);
        const paramTypes: any[] = Reflect.getMetadata(PARAM_TYPES_METADATA_KEY, ctor) || [];

        const instances = paramTypes.map(type => {
            // Recursively resolve dependency
            // If the type is ServiceContainer itself, inject this
            if (type === ServiceContainer) return this;
            return this.make(type);
        });

        const instance = new ctor(...instances);

        // Resolve property injections
        this.resolveProperties(instance);

        // If it's a singleton, cache it
        const scope = Reflect.getMetadata(SCOPE_METADATA_KEY, ctor);
        if (scope === 'singleton') {
            this.instances.set(ctor, instance);
        }

        return instance;
    }

    /**
     * Resolve property injections for an instance.
     */
    private resolveProperties(instance: any): void {
        const target = instance.constructor;
        const properties: Map<string | symbol, any> = Reflect.getMetadata(PROPERTIES_METADATA_KEY, target) || new Map();

        for (const [key, type] of properties.entries()) {
            instance[key] = this.make(type);
        }
    }

    /**
     * Check if a binding exists.
     */
    has(abstract: string | symbol | Function): boolean {
        const resolved = this.aliases.has(abstract)
            ? this.aliases.get(abstract)!
            : abstract;
        return this.bindings.has(resolved) || this.instances.has(resolved);
    }

    /**
     * Remove a binding and its cached instance.
     */
    forget(abstract: string | symbol | Function): void {
        this.bindings.delete(abstract);
        this.instances.delete(abstract);
    }

    /**
     * Flush all bindings and instances.
     */
    flush(): void {
        this.bindings.clear();
        this.instances.clear();
        this.aliases.clear();
        this.tags.clear();
    }

    /**
     * Call a function with auto-resolved dependencies from the container.
     */
    call<T>(fn: (...args: any[]) => T, additionalArgs: Record<string, any> = {}): T {
        // Simple implementation: pass container as first arg, or just call
        return fn(this, additionalArgs);
    }
}

