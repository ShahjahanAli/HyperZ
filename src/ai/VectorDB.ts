export interface VectorDocument {
    id?: string;
    text: string;
    metadata?: Record<string, any>;
    vector?: number[];
}

export interface VectorDBAdapter {
    /**
     * Upsert documents into the vector database.
     */
    upsert(collection: string, documents: VectorDocument[]): Promise<void>;

    /**
     * Perform a similarity search.
     */
    search(collection: string, query: string | number[], limit?: number): Promise<VectorDocument[]>;

    /**
     * Delete documents by ID.
     */
    delete(collection: string, ids: string[]): Promise<void>;
}

/**
 * A registry for Vector DB adapters.
 */
export class VectorDB {
    private static adapters = new Map<string, VectorDBAdapter>();
    private static defaultAdapter: string = 'pinecone';

    static register(name: string, adapter: VectorDBAdapter) {
        this.adapters.set(name, adapter);
    }

    static use(name?: string): VectorDBAdapter {
        const adapter = this.adapters.get(name || this.defaultAdapter);
        if (!adapter) throw new Error(`[HyperZ] Vector DB adapter "${name}" not found.`);
        return adapter;
    }

    /**
     * Helper to get instance-bound adapter (for DI).
     */
    adapter(name?: string): VectorDBAdapter {
        return VectorDB.use(name);
    }
}

// ── PGVector Adapter ────────────────────────────────────────

export class PGVectorAdapter implements VectorDBAdapter {
    async upsert(collection: string, documents: VectorDocument[]): Promise<void> {
        // Implementation for pgvector (PostgreSQL)
        console.log(`[VectorDB:pgvector] Upserting ${documents.length} docs to ${collection}`);
    }

    async search(collection: string, query: string | number[], limit: number = 5): Promise<VectorDocument[]> {
        console.log(`[VectorDB:pgvector] Searching ${collection} for query`);
        return [];
    }

    async delete(collection: string, ids: string[]): Promise<void> {
        console.log(`[VectorDB:pgvector] Deleting ${ids.length} docs from ${collection}`);
    }
}

// ── Weaviate Adapter ────────────────────────────────────────

export class WeaviateAdapter implements VectorDBAdapter {
    async upsert(collection: string, documents: VectorDocument[]): Promise<void> {
        // Implementation for Weaviate
        console.log(`[VectorDB:weaviate] Upserting ${documents.length} docs to ${collection}`);
    }

    async search(collection: string, query: string | number[], limit: number = 5): Promise<VectorDocument[]> {
        console.log(`[VectorDB:weaviate] Searching ${collection} for query`);
        return [];
    }

    async delete(collection: string, ids: string[]): Promise<void> {
        console.log(`[VectorDB:weaviate] Deleting ${ids.length} docs from ${collection}`);
    }
}
