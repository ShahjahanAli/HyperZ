import 'reflect-metadata';

export const DOCS_METADATA_KEY = Symbol('docs');

interface RouteDocs {
    summary?: string;
    description?: string;
    tags?: string[];
    responses?: Record<number, { description: string; schema?: any }>;
}

/**
 * Adds documentation metadata to a route handler method.
 */
export function Summary(text: string): MethodDecorator {
    return (target, propertyKey) => {
        const metadata: RouteDocs = Reflect.getMetadata(DOCS_METADATA_KEY, target, propertyKey) || {};
        metadata.summary = text;
        Reflect.defineMetadata(DOCS_METADATA_KEY, metadata, target, propertyKey);
    };
}

export function Tags(...tags: string[]): MethodDecorator {
    return (target, propertyKey) => {
        const metadata: RouteDocs = Reflect.getMetadata(DOCS_METADATA_KEY, target, propertyKey) || {};
        metadata.tags = tags;
        Reflect.defineMetadata(DOCS_METADATA_KEY, metadata, target, propertyKey);
    };
}

export function Response(status: number, description: string, schema?: any): MethodDecorator {
    return (target, propertyKey) => {
        const metadata: RouteDocs = Reflect.getMetadata(DOCS_METADATA_KEY, target, propertyKey) || {};
        metadata.responses = metadata.responses || {};
        metadata.responses[status] = { description, schema };
        Reflect.defineMetadata(DOCS_METADATA_KEY, metadata, target, propertyKey);
    };
}
