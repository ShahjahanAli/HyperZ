---
title: "Vector Database"
description: "Add RAG capabilities to HyperZ with the VectorDB abstraction — PGVector and Weaviate adapters for embedding storage and similarity search."
---

The **VectorDB** module provides a unified interface for storing and querying vector embeddings — enabling Retrieval-Augmented Generation (RAG) workflows in your HyperZ application.

## Supported Adapters

HyperZ ships with adapters for:

- **PGVector** — PostgreSQL extension for vector similarity search
- **Weaviate** — Dedicated vector database

## Registering an Adapter

Register your adapter in a service provider:

```typescript
import { VectorDB } from '../../src/ai/VectorDB.js';
import { PGVectorAdapter } from '../../src/ai/adapters/PGVectorAdapter.js';

export class AppServiceProvider {
  register(app: Application): void {
    app.singleton('vectordb', () => {
      return new VectorDB(new PGVectorAdapter({
        connectionString: env('DATABASE_URL', ''),
        tableName: 'embeddings',
        dimensions: 1536,
      }));
    });
  }
}
```

## Storing Embeddings

Insert documents with their vector embeddings:

```typescript
const vectordb = app.make<VectorDB>('vectordb');

await vectordb.insert({
  id: 'doc-1',
  content: 'HyperZ is a Laravel-inspired framework built on Express.js 5.',
  embedding: await ai.embed('HyperZ is a Laravel-inspired framework built on Express.js 5.'),
  metadata: { source: 'docs', category: 'overview' },
});
```

## Similarity Search

Query for documents similar to a given embedding:

```typescript
const queryEmbedding = await ai.embed('How do I create a controller?');

const results = await vectordb.search(queryEmbedding, {
  limit: 5,
  threshold: 0.8,
  filter: { source: 'docs' },
});

// results: Array of { id, content, metadata, score }
```

## RAG Workflow

Combine vector search with the AI Gateway for context-aware responses:

```typescript
const context = await vectordb.search(await ai.embed(question), { limit: 3 });

const response = await ai.chat([
  { role: 'system', content: `Answer based on this context:\n${context.map(r => r.content).join('\n')}` },
  { role: 'user', content: question },
]);
```
