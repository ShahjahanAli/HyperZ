// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Service Container (IoC / Dependency Injection)
// ──────────────────────────────────────────────────────────────

export type Constructor<T = any> = new (...args: any[]) => T;
export type Factory<T = any> = (container: ServiceContainer) => T;

interface Binding<T = any> {
    factory: Factory<T>;
    singleton: boolean;
    instance?: T;
}

export class ServiceContainer {
    private bindings = new Map<string | symbol, Binding>();
    private instances = new Map<string | symbol, any>();
    private aliases = new Map<string | symbol, string | symbol>();

    /**
     * Register a binding in the container.
     */
    bind<T>(abstract: string | symbol, factory: Factory<T>, singleton = false): this {
        this.bindings.set(abstract, { factory, singleton });
        return this;
    }

    /**
     * Register a shared (singleton) binding.
     */
    singleton<T>(abstract: string | symbol, factory: Factory<T>): this {
        return this.bind(abstract, factory, true);
    }

    /**
     * Register an existing instance as a singleton.
     */
    instance<T>(abstract: string | symbol, value: T): this {
        this.instances.set(abstract, value);
        return this;
    }

    /**
     * Register an alias for an abstract binding.
     */
    alias(alias: string | symbol, abstract: string | symbol): this {
        this.aliases.set(alias, abstract);
        return this;
    }

    /**
     * Resolve a binding from the container.
     */
    make<T = any>(abstract: string | symbol): T {
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
        if (!binding) {
            throw new Error(`[HyperZ] No binding registered for "${String(resolved)}".`);
        }

        const instance = binding.factory(this);

        // Cache if singleton
        if (binding.singleton) {
            this.instances.set(resolved, instance);
        }

        return instance as T;
    }

    /**
     * Check if a binding exists.
     */
    has(abstract: string | symbol): boolean {
        const resolved = this.aliases.has(abstract)
            ? this.aliases.get(abstract)!
            : abstract;
        return this.bindings.has(resolved) || this.instances.has(resolved);
    }

    /**
     * Remove a binding and its cached instance.
     */
    forget(abstract: string | symbol): void {
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
    }

    /**
     * Call a function with auto-resolved dependencies from the container.
     */
    call<T>(fn: (...args: any[]) => T, additionalArgs: Record<string, any> = {}): T {
        return fn(this, additionalArgs);
    }
}
