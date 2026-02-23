// ──────────────────────────────────────────────────────────────
// Tests — Scalar API Reference (ScalarUI)
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Logger to avoid side effects
vi.mock('../logging/Logger.js', () => ({
    Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock SwaggerGenerator to isolate Scalar tests
vi.mock('../docs/SwaggerGenerator.js', () => ({
    generateOpenAPISpec: vi.fn(() => ({
        openapi: '3.1.0',
        info: { title: 'Test API', version: '1.0.0', description: 'Test' },
        paths: { '/api/test': { get: { summary: 'Test endpoint' } } },
        components: {},
        tags: [],
        servers: [],
    })),
}));

import { registerScalarUI } from '../docs/ScalarUI.js';
import type { ScalarConfig } from '../docs/ScalarUI.js';

function createMockApp() {
    const routes: Map<string, { handler: Function }> = new Map();
    const app = {
        get: vi.fn((path: string, handler: Function) => {
            routes.set(path, { handler });
        }),
        _router: { stack: [] },
    };
    return { app, routes };
}

function createMockRes() {
    const res: Record<string, unknown> = {};
    res.setHeader = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('ScalarUI', () => {
    describe('registerScalarUI', () => {
        it('should register GET routes for reference and openapi.json', () => {
            const { app } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference' });

            expect(app.get).toHaveBeenCalledTimes(2);
            expect(app.get).toHaveBeenCalledWith('/api/reference/openapi.json', expect.any(Function));
            expect(app.get).toHaveBeenCalledWith('/api/reference', expect.any(Function));
        });

        it('should not register routes when disabled', () => {
            const { app } = createMockApp();
            registerScalarUI(app as never, { enabled: false });

            expect(app.get).not.toHaveBeenCalled();
        });

        it('should use default path /api/reference when not specified', () => {
            const { app } = createMockApp();
            registerScalarUI(app as never, {});

            expect(app.get).toHaveBeenCalledWith('/api/reference/openapi.json', expect.any(Function));
            expect(app.get).toHaveBeenCalledWith('/api/reference', expect.any(Function));
        });

        it('should use custom path when specified', () => {
            const { app } = createMockApp();
            registerScalarUI(app as never, { path: '/docs/scalar' });

            expect(app.get).toHaveBeenCalledWith('/docs/scalar/openapi.json', expect.any(Function));
            expect(app.get).toHaveBeenCalledWith('/docs/scalar', expect.any(Function));
        });
    });

    describe('OpenAPI JSON endpoint', () => {
        it('should serve the OpenAPI spec as JSON', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference' });

            const handler = routes.get('/api/reference/openapi.json')!.handler;
            const res = createMockRes();
            handler({}, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    openapi: '3.1.0',
                    info: expect.objectContaining({ title: 'Test API' }),
                })
            );
        });
    });

    describe('Scalar HTML page', () => {
        it('should serve HTML with Content-Type header', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
            expect(res.send).toHaveBeenCalled();
        });

        it('should include Scalar CDN script tag', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(html).toContain('@scalar/api-reference');
            expect(html).toContain('id="api-reference"');
        });

        it('should include the spec URL in the HTML', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(html).toContain('/api/reference/openapi.json');
        });

        it('should use custom title', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference', title: 'My Custom API' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(html).toContain('My Custom API');
        });

        it('should include theme configuration', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference', theme: 'moon' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            // Theme is HTML-escaped in the data-configuration attribute
            expect(html).toContain('moon');
        });

        it('should include HyperZ branded header', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(html).toContain('HyperZ');
            expect(html).toContain('hyperz-reference-header');
            expect(html).toContain('Scalar');
        });

        it('should include navigation links', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(html).toContain('/api/docs');
            expect(html).toContain('/api/playground');
        });

        it('should escape HTML in title to prevent XSS', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference', title: '<script>alert("xss")</script>' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(html).not.toContain('<script>alert("xss")</script>');
            expect(html).toContain('&lt;script&gt;');
        });

        it('should include custom CSS when provided', () => {
            const { app, routes } = createMockApp();
            registerScalarUI(app as never, { path: '/api/reference', customCss: '.my-class { color: red; }' });

            const handler = routes.get('/api/reference')!.handler;
            const res = createMockRes();
            handler({}, res);

            const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
            expect(html).toContain('.my-class { color: red; }');
        });
    });
});
