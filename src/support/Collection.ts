// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Collection (Fluent Array Wrapper)
// ──────────────────────────────────────────────────────────────

export class Collection<T = any> {
    constructor(private items: T[]) { }

    static from<T>(items: T[]): Collection<T> {
        return new Collection(items);
    }

    all(): T[] {
        return [...this.items];
    }

    first(): T | undefined {
        return this.items[0];
    }

    last(): T | undefined {
        return this.items[this.items.length - 1];
    }

    count(): number {
        return this.items.length;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    isNotEmpty(): boolean {
        return this.items.length > 0;
    }

    map<U>(fn: (item: T, index: number) => U): Collection<U> {
        return new Collection(this.items.map(fn));
    }

    filter(fn: (item: T, index: number) => boolean): Collection<T> {
        return new Collection(this.items.filter(fn));
    }

    find(fn: (item: T) => boolean): T | undefined {
        return this.items.find(fn);
    }

    where(key: keyof T, value: any): Collection<T> {
        return this.filter(item => (item as any)[key] === value);
    }

    pluck<K extends keyof T>(key: K): Collection<T[K]> {
        return new Collection(this.items.map(item => item[key]));
    }

    sortBy(key: keyof T): Collection<T> {
        const sorted = [...this.items].sort((a, b) => {
            if ((a as any)[key] < (b as any)[key]) return -1;
            if ((a as any)[key] > (b as any)[key]) return 1;
            return 0;
        });
        return new Collection(sorted);
    }

    unique(key?: keyof T): Collection<T> {
        if (!key) {
            return new Collection([...new Set(this.items)]);
        }
        const seen = new Set();
        return this.filter(item => {
            const val = (item as any)[key];
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    }

    take(count: number): Collection<T> {
        return new Collection(this.items.slice(0, count));
    }

    skip(count: number): Collection<T> {
        return new Collection(this.items.slice(count));
    }

    chunk(size: number): Collection<T[]> {
        const chunks: T[][] = [];
        for (let i = 0; i < this.items.length; i += size) {
            chunks.push(this.items.slice(i, i + size));
        }
        return new Collection(chunks);
    }

    reduce<U>(fn: (acc: U, item: T) => U, initial: U): U {
        return this.items.reduce(fn, initial);
    }

    sum(key?: keyof T): number {
        if (key) {
            return this.items.reduce((sum, item) => sum + Number((item as any)[key]), 0);
        }
        return this.items.reduce((sum, item) => sum + Number(item), 0);
    }

    avg(key?: keyof T): number {
        if (this.isEmpty()) return 0;
        return this.sum(key) / this.count();
    }

    min(key?: keyof T): number {
        if (key) return Math.min(...this.items.map(i => Number((i as any)[key])));
        return Math.min(...this.items.map(i => Number(i)));
    }

    max(key?: keyof T): number {
        if (key) return Math.max(...this.items.map(i => Number((i as any)[key])));
        return Math.max(...this.items.map(i => Number(i)));
    }

    groupBy(key: keyof T): Record<string, T[]> {
        return this.items.reduce((groups: Record<string, T[]>, item) => {
            const val = String((item as any)[key]);
            if (!groups[val]) groups[val] = [];
            groups[val].push(item);
            return groups;
        }, {});
    }

    toJSON(): T[] {
        return this.all();
    }

    forEach(fn: (item: T, index: number) => void): void {
        this.items.forEach(fn);
    }

    [Symbol.iterator](): Iterator<T> {
        return this.items[Symbol.iterator]();
    }
}
