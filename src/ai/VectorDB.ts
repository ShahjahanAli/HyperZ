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
}
