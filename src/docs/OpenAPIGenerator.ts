import { Express } from 'express';
import { DOCS_METADATA_KEY } from './Decorators.js';
import 'reflect-metadata';

/**
 * Generates an OpenAPI specification from registered routes and Zod schemas.
 */
export class OpenAPIGenerator {
    static generate(app: Express): any {
        const spec: any = {
            openapi: '3.0.0',
            info: {
                title: 'HyperZ API Documentation',
                version: '1.0.0',
                description: 'Auto-generated documentation from HyperZ Zod schemas and route decorators.',
            },
            paths: {},
            components: {
                schemas: {},
            },
        };

        const routes = this.extractRoutes(app);

        for (const route of routes) {
            if (!spec.paths[route.path]) spec.paths[route.path] = {};

            const method = route.method.toLowerCase();
            const metadata = this.getMetadata(route.handler);

            spec.paths[route.path][method] = {
                summary: metadata?.summary || `${route.method} ${route.path}`,
                description: metadata?.description,
                tags: metadata?.tags || ['Default'],
                responses: metadata?.responses || {
                    200: { description: 'Success' }
                },
                parameters: this.extractParameters(route),
                requestBody: this.extractRequestBody(route),
            };
        }

        return spec;
    }

    private static extractRoutes(app: Express): any[] {
        const routes: any[] = [];
        const stack = app._router.stack;

        const processLayer = (layer: any, prefix = '') => {
            if (layer.route) {
                const path = prefix + layer.route.path;
                for (const method of Object.keys(layer.route.methods)) {
                    if (method === '_all') continue;
                    routes.push({
                        method: method.toUpperCase(),
                        path,
                        stack: layer.route.stack,
                        handler: layer.route.stack[layer.route.stack.length - 1].handle
                    });
                }
            } else if (layer.name === 'router' && layer.handle.stack) {
                const newPrefix = prefix + (layer.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^\\/', '').replace('\\/', '/') || '');
                for (const subLayer of layer.handle.stack) {
                    processLayer(subLayer, newPrefix);
                }
            }
        };

        for (const layer of stack) {
            processLayer(layer);
        }

        return routes;
    }

    private static getMetadata(handler: any): any {
        // Since handlers are often (req, res, next) => handler.method(req, res, next),
        // we might need to find the actual controller method.
        // For now, assume it's directly attached if using class-based routes or decorated.
        return Reflect.getMetadata(DOCS_METADATA_KEY, handler);
    }

    private static extractParameters(route: any): any[] {
        const params: any[] = [];
        for (const layer of route.stack) {
            if (layer.handle.validationType === 'query' || layer.handle.validationType === 'params') {
                const schema = layer.handle.zodSchema;
                // Basic conversion of Zod to OpenAPI Params (Conceptual)
                // This would be much more complex in a real implementation
            }
        }
        return params;
    }

    private static extractRequestBody(route: any): any {
        for (const layer of route.stack) {
            if (layer.handle.validationType === 'body') {
                const schema = layer.handle.zodSchema;
                // Convert Zod to OpenAPI Schema (Conceptual)
                return {
                    content: {
                        'application/json': {
                            schema: { type: 'object' } // Placeholder
                        }
                    }
                };
            }
        }
    }
}
