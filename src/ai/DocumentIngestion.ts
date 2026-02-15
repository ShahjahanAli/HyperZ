import { Logger } from '../logging/Logger.js';
import { AIGateway } from './AIGateway.js';
import { VectorDB } from './VectorDB.js';

export interface DocumentChunk {
    id: string;
    text: string;
    metadata: Record<string, any>;
    embedding?: number[];
}

export class DocumentIngestion {
    private ai: AIGateway;
    private vector: VectorDB;

    constructor(ai: AIGateway, vector: VectorDB) {
        this.ai = ai;
        this.vector = vector;
    }

    /**
     * Process a raw document string into chunks and index them.
     */
    async ingest(collection: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
        Logger.info(`[RAG] Ingesting document into collection "${collection}"...`);

        // 1. Chunking (Simple sliding window for now)
        const chunks = this.chunkText(content, 1000, 200);

        // 2. Embedding generation
        const documentChunks: DocumentChunk[] = [];
        for (let i = 0; i < chunks.length; i++) {
            const embeddingResponse = await this.ai.embed(chunks[i]);
            documentChunks.push({
                id: `${metadata.source || 'doc'}-${i}`,
                text: chunks[i],
                metadata: { ...metadata, chunk_index: i },
                embedding: embeddingResponse.embeddings[0]
            });
        }

        // 3. Upsert to Vector DB
        const adapter = this.vector.adapter();
        await adapter.upsert(collection, documentChunks.map(c => ({
            id: c.id,
            text: c.text,
            vector: c.embedding!,
            metadata: { ...c.metadata, content: c.text }
        })));

        Logger.info(`[RAG] Successfully indexed ${chunks.length} chunks.`);
    }

    /**
     * Split text into overlapping chunks.
     */
    private chunkText(text: string, size: number, overlap: number): string[] {
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            const end = Math.min(start + size, text.length);
            chunks.push(text.slice(start, end));
            if (end === text.length) break;
            start += size - overlap;
        }

        return chunks;
    }
}
