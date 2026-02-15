// ──────────────────────────────────────────────────────────────
// HyperZ — Swagger/OpenAPI Spec Generator
//
// Auto-scans Express routes to build an OpenAPI 3.1 specification.
// No decorators required — reads registered routes at runtime.
// ──────────────────────────────────────────────────────────────

import type { Express } from 'express';

interface RouteInfo {
    method: string;
    path: string;
}

interface OpenAPISpec {
    openapi: string;
    info: { title: string; version: string; description: string; contact?: any };
    servers: { url: string; description: string }[];
    paths: Record<string, any>;
    components: { securitySchemes?: Record<string, any> };
    tags: { name: string; description: string }[];
}

/**
 * Extract all registered routes from an Express app.
 */
function extractRoutes(app: Express): RouteInfo[] {
    const routes: RouteInfo[] = [];

    function walkStack(stack: any[], prefix = '') {
        for (const layer of stack) {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
                for (const method of methods) {
                    const path = prefix + (layer.route.path || '');
                    // Skip internal/admin/playground routes
                    if (path.startsWith('/api/_admin') || path.includes('playground')) continue;
                    routes.push({ method, path });
                }
            } else if (layer.name === 'router' && layer.handle?.stack) {
                const rp =
                    layer.regexp?.source
                        ?.replace('\\/?(?=\\/|$)', '')
                        ?.replace(/\\\//g, '/')
                        ?.replace(/^\^/, '')
                        ?.replace(/\$.*$/, '') || '';
                walkStack(layer.handle.stack, prefix + rp);
            }
        }
    }

    if ((app as any)._router?.stack) walkStack((app as any)._router.stack);
    return routes.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Derive a tag name from an API path.
 * e.g. /api/users/123 → "Users", /api/products → "Products"
 */
function deriveTag(path: string): string {
    const segments = path.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const first = segments[0] || 'General';
    // Skip param-only segments
    if (first.startsWith(':')) return 'General';
    return first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * Detect path parameters and build OpenAPI parameter objects.
 */
function buildParameters(path: string): any[] {
    const params: any[] = [];
    const matches = path.match(/:(\w+)/g);
    if (matches) {
        for (const m of matches) {
            params.push({
                name: m.slice(1),
                in: 'path',
                required: true,
                schema: { type: 'string' },
            });
        }
    }
    return params;
}

/**
 * Convert Express-style path (/users/:id) to OpenAPI-style (/users/{id}).
 */
function toOpenAPIPath(path: string): string {
    return path.replace(/:(\w+)/g, '{$1}');
}

/**
 * Build a complete response object based on HTTP method.
 */
function buildResponses(method: string): Record<string, any> {
    const responses: Record<string, any> = {};

    switch (method) {
        case 'GET':
            responses['200'] = { description: 'Successful response', content: { 'application/json': { schema: { type: 'object' } } } };
            break;
        case 'POST':
            responses['201'] = { description: 'Resource created', content: { 'application/json': { schema: { type: 'object' } } } };
            responses['400'] = { description: 'Validation error' };
            break;
        case 'PUT':
        case 'PATCH':
            responses['200'] = { description: 'Resource updated', content: { 'application/json': { schema: { type: 'object' } } } };
            responses['404'] = { description: 'Resource not found' };
            break;
        case 'DELETE':
            responses['200'] = { description: 'Resource deleted' };
            responses['404'] = { description: 'Resource not found' };
            break;
        default:
            responses['200'] = { description: 'Success' };
    }

    responses['401'] = { description: 'Unauthorized' };
    responses['500'] = { description: 'Internal server error' };

    return responses;
}

/**
 * Generate a full OpenAPI 3.1 specification from the running Express app.
 */
export function generateOpenAPISpec(app: Express, config: any): OpenAPISpec {
    const routes = extractRoutes(app);
    const paths: Record<string, any> = {};
    const tagSet = new Set<string>();

    for (const route of routes) {
        const openAPIPath = toOpenAPIPath(route.path);
        const method = route.method.toLowerCase();
        const tag = deriveTag(route.path);
        const params = buildParameters(route.path);

        tagSet.add(tag);

        if (!paths[openAPIPath]) paths[openAPIPath] = {};

        const operation: any = {
            tags: [tag],
            summary: `${route.method} ${route.path}`,
            operationId: `${method}_${route.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            parameters: params.length > 0 ? params : undefined,
            responses: buildResponses(route.method),
        };

        // Add request body for POST/PUT/PATCH
        if (['post', 'put', 'patch'].includes(method)) {
            operation.requestBody = {
                content: {
                    'application/json': {
                        schema: { type: 'object', additionalProperties: true },
                    },
                },
            };
        }

        paths[openAPIPath] = { ...paths[openAPIPath], [method]: operation };
    }

    const tags = Array.from(tagSet)
        .sort()
        .map((name) => ({ name, description: `${name} endpoints` }));

    return {
        openapi: '3.1.0',
        info: {
            title: config.title || 'HyperZ API',
            version: config.version || '1.0.0',
            description: config.description || '',
            contact: config.contact,
        },
        servers: config.servers || [],
        paths,
        components: {
            securitySchemes: config.securitySchemes || {},
        },
        tags,
    };
}
