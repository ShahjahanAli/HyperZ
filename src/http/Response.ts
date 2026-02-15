// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Response Helpers
// ──────────────────────────────────────────────────────────────

import type { Response } from 'express';

/**
 * Fluent response builder.
 */
export class HyperZResponse {
    private res: Response;
    private statusCode = 200;
    private headers: Record<string, string> = {};

    constructor(res: Response) {
        this.res = res;
    }

    status(code: number): this {
        this.statusCode = code;
        return this;
    }

    header(key: string, value: string): this {
        this.headers[key] = value;
        return this;
    }

    json(data: any): void {
        this.applyHeaders();
        this.res.status(this.statusCode).json(data);
    }

    success(data: any, message = 'Success'): void {
        this.json({ success: true, status: this.statusCode, message, data });
    }

    error(message: string, statusCode?: number): void {
        const code = statusCode ?? this.statusCode;
        this.applyHeaders();
        this.res.status(code).json({ success: false, status: code, message });
    }

    noContent(): void {
        this.applyHeaders();
        this.res.status(204).send();
    }

    download(filePath: string, filename?: string): void {
        this.applyHeaders();
        this.res.download(filePath, filename ?? filePath);
    }

    redirect(url: string, statusCode = 302): void {
        this.applyHeaders();
        this.res.redirect(statusCode, url);
    }

    private applyHeaders(): void {
        for (const [key, value] of Object.entries(this.headers)) {
            this.res.setHeader(key, value);
        }
    }
}

/**
 * Helper to wrap Express response with HyperZ builder.
 */
export function hyperResponse(res: Response): HyperZResponse {
    return new HyperZResponse(res);
}
