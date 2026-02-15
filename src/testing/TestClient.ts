// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Test Client & Helpers (Vitest)
// ──────────────────────────────────────────────────────────────

import { createServer, type Server } from 'node:http';
import type { Express } from 'express';

interface TestResponse {
    status: number;
    headers: Record<string, string>;
    body: any;
    text: string;
    latencyMs: number;
}

/**
 * Lightweight HTTP test client — zero dependencies.
 * Boots the Express app on a random port and makes real HTTP requests.
 */
export class TestClient {
    private server: Server | null = null;
    private baseUrl = '';

    constructor(private app: Express) { }

    /**
     * Start the test server.
     */
    async start(): Promise<this> {
        return new Promise((resolve) => {
            this.server = createServer(this.app);
            this.server.listen(0, () => {
                const addr = this.server!.address() as any;
                this.baseUrl = `http://127.0.0.1:${addr.port}`;
                resolve(this);
            });
        });
    }

    /**
     * Stop the test server.
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => resolve());
            } else {
                resolve();
            }
        });
    }

    /**
     * Make an HTTP request.
     */
    async request(
        method: string,
        path: string,
        options?: {
            body?: any;
            headers?: Record<string, string>;
        }
    ): Promise<TestResponse> {
        const start = Date.now();

        const res = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        const text = await res.text();
        let body: any;
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }

        const headers: Record<string, string> = {};
        res.headers.forEach((value, key) => {
            headers[key] = value;
        });

        return {
            status: res.status,
            headers,
            body,
            text,
            latencyMs: Date.now() - start,
        };
    }

    // ── Convenience methods ─────────────────────────────────

    async get(path: string, headers?: Record<string, string>): Promise<TestResponse> {
        return this.request('GET', path, { headers });
    }

    async post(path: string, body?: any, headers?: Record<string, string>): Promise<TestResponse> {
        return this.request('POST', path, { body, headers });
    }

    async put(path: string, body?: any, headers?: Record<string, string>): Promise<TestResponse> {
        return this.request('PUT', path, { body, headers });
    }

    async patch(path: string, body?: any, headers?: Record<string, string>): Promise<TestResponse> {
        return this.request('PATCH', path, { body, headers });
    }

    async delete(path: string, headers?: Record<string, string>): Promise<TestResponse> {
        return this.request('DELETE', path, { headers });
    }

    /**
     * Set a bearer token for subsequent requests.
     */
    withToken(token: string): AuthedTestClient {
        return new AuthedTestClient(this, token);
    }
}

/**
 * Test client with pre-set auth token.
 */
class AuthedTestClient {
    constructor(private client: TestClient, private token: string) { }

    private headers(): Record<string, string> {
        return { Authorization: `Bearer ${this.token}` };
    }

    get(path: string) { return this.client.get(path, this.headers()); }
    post(path: string, body?: any) { return this.client.post(path, body, this.headers()); }
    put(path: string, body?: any) { return this.client.put(path, body, this.headers()); }
    patch(path: string, body?: any) { return this.client.patch(path, body, this.headers()); }
    delete(path: string) { return this.client.delete(path, this.headers()); }
}
