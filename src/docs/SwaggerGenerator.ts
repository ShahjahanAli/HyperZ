import type { Express } from 'express';
import 'reflect-metadata';
import { DOCS_METADATA_KEY } from './Decorators.js';
import { zodToJsonSchema } from './ZodToOpenAPI.js';

interface RouteInfo {
    method: string;
    path: string;
    stack: any[];
    handler: any;
}

interface OpenAPISpec {
    openapi: string;
    info: { title: string; version: string; description: string; contact?: any };
    servers: { url: string; description: string }[];
    paths: Record<string, any>;
    components: { schemas?: Record<string, any>; securitySchemes?: Record<string, any> };
    tags: { name: string; description: string }[];
}

/**
 * Extract all registered routes from an Express app, with extra stack info.
 */
function extractRoutes(app: Express): RouteInfo[] {
    const routes: RouteInfo[] = [];

    function walkStack(stack: any[], prefix = '') {
        for (const layer of stack) {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
                for (const method of methods) {
                    const path = prefix + (layer.route.path || '');
                    if (path.startsWith('/api/_admin') || path.includes('playground')) continue;
                    routes.push({
                        method,
                        path,
                        stack: layer.route.stack,
                        handler: layer.route.stack[layer.route.stack.length - 1].handle
                    });
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

function toOpenAPIPath(path: string): string {
    return path.replace(/:(\w+)/g, '{$1}');
}

function deriveTag(path: string): string {
    const segments = path.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const first = segments[0] || 'General';
    if (first.startsWith(':')) return 'General';
    return first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * Generate a full OpenAPI 3.1 specification.
 */
export function generateOpenAPISpec(app: Express, config: any): OpenAPISpec {
    const routes = extractRoutes(app);
    const paths: Record<string, any> = {};
    const tagSet = new Set<string>();

    for (const route of routes) {
        const openAPIPath = toOpenAPIPath(route.path);
        const method = route.method.toLowerCase();

        // Extract metadata from decorators
        const metadata = Reflect.getMetadata(DOCS_METADATA_KEY, route.handler) || {};

        const tag = metadata.tags?.[0] || deriveTag(route.path);
        tagSet.add(tag);

        if (!paths[openAPIPath]) paths[openAPIPath] = {};

        const operation: any = {
            tags: metadata.tags || [tag],
            summary: metadata.summary || `${route.method} ${route.path}`,
            description: metadata.description,
            operationId: `${method}_${route.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            responses: metadata.responses || {
                '200': { description: 'Successful response', content: { 'application/json': { schema: { type: 'object' } } } }
            },
        };

        // Extract parameters and body from Zod schemas in middleware stack
        for (const layer of route.stack) {
            const h = layer.handle;
            if (h.zodSchema) {
                if (h.validationType === 'body') {
                    const schema = zodToJsonSchema(h.zodSchema);
                    operation.requestBody = {
                        required: true,
                        content: {
                            'application/json': { schema },
                        },
                    };
                } else if (h.validationType === 'query') {
                    const schema = zodToJsonSchema(h.zodSchema);
                    if (schema.properties && typeof schema.properties === 'object') {
                        operation.parameters = operation.parameters || [];
                        const required = (schema.required as string[]) || [];
                        for (const [name, prop] of Object.entries(schema.properties)) {
                            operation.parameters.push({
                                name,
                                in: 'query',
                                required: required.includes(name),
                                schema: prop,
                            });
                        }
                    }
                } else if (h.validationType === 'params') {
                    const schema = zodToJsonSchema(h.zodSchema);
                    if (schema.properties && typeof schema.properties === 'object') {
                        operation.parameters = operation.parameters || [];
                        for (const [name, prop] of Object.entries(schema.properties)) {
                            operation.parameters.push({
                                name,
                                in: 'path',
                                required: true,
                                schema: prop,
                            });
                        }
                    }
                }
            }
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
