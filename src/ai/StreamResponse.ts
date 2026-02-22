// ──────────────────────────────────────────────────────────────
// HyperZ Framework — AI Streaming (SSE) Response Helpers
// ──────────────────────────────────────────────────────────────
//
// Provides Server-Sent Events (SSE) streaming for LLM responses,
// both as a standalone utility and as Controller response helpers.
//
// Usage in Controller:
//   import { StreamResponse } from '../../src/ai/StreamResponse.js';
//
//   async chat(req: Request, res: Response) {
//     const stream = new StreamResponse(res);
//     stream.start();
//
//     for await (const chunk of ai.streamChat(messages)) {
//       stream.write(chunk);
//     }
//
//     stream.end();
//   }
//
// Usage as middleware (raw SSE):
//   import { sseMiddleware } from '../../src/ai/StreamResponse.js';
//
//   router.get('/events', sseMiddleware(), handler);
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ── SSE Stream Response ─────────────────────────────────────

export interface StreamEvent {
    /** SSE event name (optional, defaults to 'message') */
    event?: string;
    /** Data payload (will be JSON.stringify'd if object) */
    data: unknown;
    /** Event ID for resumption */
    id?: string;
    /** Retry interval hint in ms */
    retry?: number;
}

export class StreamResponse {
    private res: Response;
    private closed = false;

    constructor(res: Response) {
        this.res = res;
    }

    /**
     * Initialize SSE headers and begin streaming.
     */
    start(): this {
        this.res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        });

        // Send initial comment to establish connection
        this.res.write(':ok\n\n');

        // Handle client disconnect
        this.res.on('close', () => {
            this.closed = true;
        });

        return this;
    }

    /**
     * Check if the client is still connected.
     */
    isConnected(): boolean {
        return !this.closed;
    }

    /**
     * Send a text chunk (convenience for LLM token streaming).
     */
    write(text: string): this {
        if (this.closed) return this;
        this.res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        return this;
    }

    /**
     * Send a structured SSE event.
     */
    send(event: StreamEvent): this {
        if (this.closed) return this;

        let message = '';

        if (event.id) message += `id: ${event.id}\n`;
        if (event.event) message += `event: ${event.event}\n`;
        if (event.retry) message += `retry: ${event.retry}\n`;

        const data = typeof event.data === 'string'
            ? event.data
            : JSON.stringify(event.data);

        // SSE spec: multi-line data must be split into separate `data:` lines
        for (const line of data.split('\n')) {
            message += `data: ${line}\n`;
        }

        message += '\n'; // Blank line terminates the event
        this.res.write(message);

        return this;
    }

    /**
     * Send an error event and optionally close the stream.
     */
    error(message: string, close = true): this {
        this.send({ event: 'error', data: { error: message } });
        if (close) this.end();
        return this;
    }

    /**
     * Send the [DONE] sentinel and close the stream.
     * Follows the OpenAI streaming convention.
     */
    end(): void {
        if (this.closed) return;
        this.res.write('data: [DONE]\n\n');
        this.res.end();
        this.closed = true;
    }

    /**
     * Stream an async iterable (e.g., from an AI provider).
     * Automatically sends [DONE] when the iterable completes.
     *
     * @example
     * const stream = new StreamResponse(res);
     * await stream.start().streamIterator(ai.streamChat(messages));
     */
    async streamIterator(iterable: AsyncIterable<string>): Promise<void> {
        try {
            for await (const chunk of iterable) {
                if (this.closed) break;
                this.write(chunk);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Stream error';
            this.error(message);
            return;
        }

        this.end();
    }
}

// ── SSE Middleware ───────────────────────────────────────────

/**
 * Express middleware that sets up SSE headers and attaches a
 * `stream` object to the request for use in handlers.
 *
 * @example
 * router.get('/events', sseMiddleware(), (req, res) => {
 *   const stream = (req as any).stream as StreamResponse;
 *   stream.send({ event: 'ping', data: 'hello' });
 * });
 */
export function sseMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const stream = new StreamResponse(res);
        stream.start();
        (req as unknown as Record<string, unknown>)['stream'] = stream;
        next();
    };
}

// ── Type augmentation ───────────────────────────────────────

declare global {
    namespace Express {
        interface Request {
            stream?: StreamResponse;
        }
    }
}
