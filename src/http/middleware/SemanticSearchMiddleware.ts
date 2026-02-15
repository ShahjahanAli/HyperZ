import type { Request, Response, NextFunction } from 'express';
import { VectorDB } from '../../ai/VectorDB.js';
import { Logger } from '../../logging/Logger.js';

/**
 * Middleware to perform semantic search and attach results to the request.
 */
export function semanticSearch(collection: string, queryParam: string = 'q') {
    return async (req: any, res: Response, next: NextFunction) => {
        const query = req.query[queryParam] || req.body[queryParam];

        if (!query) {
            return next();
        }

        try {
            const vectorDb = req.app.make(VectorDB);
            const results = await vectorDb.adapter().search(collection, query, { limit: 5 });

            // Attach to request for use in controllers or AI actions
            req.semanticContext = results.map((r: any) => r.metadata.content || r.text).join('\n\n');

            Logger.debug(`[RAG] Attached semantic context from "${collection}" for query: "${query}"`);
            next();
        } catch (error: any) {
            Logger.error(`[RAG] Semantic search failed: ${error.message}`);
            next(); // Proceed regardless of RAG failure to maintain API availability
        }
    };
}
