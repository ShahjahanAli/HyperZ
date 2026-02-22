// ──────────────────────────────────────────────────────────────
// Tests — StreamResponse (AI Streaming / SSE)
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamResponse } from '../ai/StreamResponse.js';

// ── Mock Response ───────────────────────────────────────────

function createMockRes() {
    const chunks: string[] = [];
    const headers: Record<string, unknown> = {};
    const listeners: Record<string, Array<() => void>> = {};
    let ended = false;

    return {
        writeHead: vi.fn((status: number, hdrs: Record<string, string>) => {
            Object.assign(headers, hdrs);
        }),
        write: vi.fn((data: string) => {
            chunks.push(data);
            return true;
        }),
        end: vi.fn(() => {
            ended = true;
        }),
        on: vi.fn((event: string, cb: () => void) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event]!.push(cb);
        }),
        // Helpers for testing
        _chunks: chunks,
        _headers: headers,
        _ended: () => ended,
        _emit: (event: string) => listeners[event]?.forEach((cb) => cb()),
    };
}

// ── Tests ───────────────────────────────────────────────────

describe('StreamResponse', () => {
    let mockRes: ReturnType<typeof createMockRes>;
    let stream: StreamResponse;

    beforeEach(() => {
        mockRes = createMockRes();
        stream = new StreamResponse(mockRes as never);
    });

    it('should set SSE headers on start()', () => {
        stream.start();
        expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
        }));
    });

    it('should send initial comment on start()', () => {
        stream.start();
        expect(mockRes._chunks[0]).toBe(':ok\n\n');
    });

    it('should write text chunks as JSON data', () => {
        stream.start();
        stream.write('Hello');
        expect(mockRes._chunks[1]).toBe('data: {"content":"Hello"}\n\n');
    });

    it('should send structured SSE events', () => {
        stream.start();
        stream.send({ event: 'ping', data: { msg: 'hi' }, id: '1' });

        const eventChunk = mockRes._chunks[1]!;
        expect(eventChunk).toContain('id: 1');
        expect(eventChunk).toContain('event: ping');
        expect(eventChunk).toContain('data: {"msg":"hi"}');
    });

    it('should send [DONE] on end()', () => {
        stream.start();
        stream.end();
        expect(mockRes._chunks).toContain('data: [DONE]\n\n');
        expect(mockRes.end).toHaveBeenCalled();
    });

    it('should not write after end()', () => {
        stream.start();
        stream.end();
        const countBefore = mockRes.write.mock.calls.length;
        stream.write('should not appear');
        expect(mockRes.write.mock.calls.length).toBe(countBefore);
    });

    it('should detect disconnected client', () => {
        stream.start();
        expect(stream.isConnected()).toBe(true);
        mockRes._emit('close');
        expect(stream.isConnected()).toBe(false);
    });

    it('should stream an async iterable', async () => {
        stream.start();

        async function* tokens() {
            yield 'Hello';
            yield ' World';
        }

        await stream.streamIterator(tokens());

        expect(mockRes._chunks).toContain('data: {"content":"Hello"}\n\n');
        expect(mockRes._chunks).toContain('data: {"content":" World"}\n\n');
        expect(mockRes._chunks).toContain('data: [DONE]\n\n');
    });

    it('should handle iterator errors gracefully', async () => {
        stream.start();

        async function* failingTokens() {
            yield 'ok';
            throw new Error('AI provider failed');
        }

        await stream.streamIterator(failingTokens());

        // Should contain the error event
        const joined = mockRes._chunks.join('');
        expect(joined).toContain('event: error');
        expect(joined).toContain('AI provider failed');
    });

    it('should send error event with error()', () => {
        stream.start();
        stream.error('Something broke');

        const joined = mockRes._chunks.join('');
        expect(joined).toContain('event: error');
        expect(joined).toContain('Something broke');
        expect(mockRes.end).toHaveBeenCalled();
    });
});
