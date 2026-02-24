// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Zod-to-OpenAPI Schema Converter
// ──────────────────────────────────────────────────────────────
//
// Converts Zod schemas into OpenAPI 3.1-compatible JSON Schema
// objects for automatic request/response documentation.
//
// This enables the Swagger UI to display accurate field types,
// validation rules, and examples — derived directly from
// the Zod schemas used in validate() middleware.
// ──────────────────────────────────────────────────────────────

import { z } from 'zod';

export type JsonSchema = Record<string, any>;

/**
 * Convert a Zod schema to an OpenAPI 3.1 JSON Schema object.
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchema {
    return processZodType(schema);
}

function processZodType(type: z.ZodTypeAny): JsonSchema {
    // Unwrap ZodEffects (refine, transform, preprocess)
    if (type instanceof z.ZodEffects) {
        return processZodType(type.innerType());
    }

    // Unwrap optional / nullable
    if (type instanceof z.ZodOptional) {
        return processZodType(type.unwrap());
    }

    if (type instanceof z.ZodNullable) {
        const inner = processZodType(type.unwrap());
        return { ...inner, nullable: true };
    }

    // ZodDefault
    if (type instanceof z.ZodDefault) {
        const inner = processZodType(type.removeDefault());
        return { ...inner, default: type._def.defaultValue() };
    }

    // String
    if (type instanceof z.ZodString) {
        const result: Record<string, unknown> = { type: 'string' };
        for (const check of type._def.checks) {
            if (check.kind === 'min') result['minLength'] = check.value;
            if (check.kind === 'max') result['maxLength'] = check.value;
            if (check.kind === 'email') result['format'] = 'email';
            if (check.kind === 'url') result['format'] = 'uri';
            if (check.kind === 'uuid') result['format'] = 'uuid';
            if (check.kind === 'datetime') result['format'] = 'date-time';
            if (check.kind === 'regex') result['pattern'] = (check as unknown as { regex: RegExp }).regex?.source;
        }
        return result;
    }

    // Number / Int
    if (type instanceof z.ZodNumber) {
        const result: Record<string, unknown> = { type: 'number' };
        for (const check of type._def.checks) {
            if (check.kind === 'int') result['type'] = 'integer';
            if (check.kind === 'min') result['minimum'] = check.value;
            if (check.kind === 'max') result['maximum'] = check.value;
        }
        return result;
    }

    // Boolean
    if (type instanceof z.ZodBoolean) {
        return { type: 'boolean' };
    }

    // Date
    if (type instanceof z.ZodDate) {
        return { type: 'string', format: 'date-time' };
    }

    // Enum
    if (type instanceof z.ZodEnum) {
        return { type: 'string', enum: type._def.values };
    }

    // NativeEnum
    if (type instanceof z.ZodNativeEnum) {
        return { type: 'string', enum: Object.values(type._def.values) };
    }

    // Literal
    if (type instanceof z.ZodLiteral) {
        const val = type._def.value;
        return { type: typeof val as string, enum: [val] };
    }

    // Array
    if (type instanceof z.ZodArray) {
        const result: Record<string, unknown> = {
            type: 'array',
            items: processZodType(type.element),
        };
        if (type._def.minLength !== null) result['minItems'] = type._def.minLength?.value;
        if (type._def.maxLength !== null) result['maxItems'] = type._def.maxLength?.value;
        return result;
    }

    // Object
    if (type instanceof z.ZodObject) {
        const shape = type.shape as Record<string, z.ZodTypeAny>;
        const properties: Record<string, unknown> = {};
        const required: string[] = [];

        for (const [key, value] of Object.entries(shape)) {
            properties[key] = processZodType(value);

            // A field is required unless it's optional or has a default
            if (!(value instanceof z.ZodOptional) && !(value instanceof z.ZodDefault)) {
                required.push(key);
            }
        }

        const result: Record<string, unknown> = { type: 'object', properties };
        if (required.length > 0) result['required'] = required;
        return result;
    }

    // Union (oneOf)
    if (type instanceof z.ZodUnion) {
        const options = (type._def.options as z.ZodTypeAny[]).map(processZodType);
        return { oneOf: options };
    }

    // Discriminated union
    if (type instanceof z.ZodDiscriminatedUnion) {
        const options = [...type._def.options.values()].map((opt: z.ZodTypeAny) => processZodType(opt));
        return { oneOf: options };
    }

    // Record (additionalProperties)
    if (type instanceof z.ZodRecord) {
        return {
            type: 'object',
            additionalProperties: processZodType(type._def.valueType),
        };
    }

    // Tuple
    if (type instanceof z.ZodTuple) {
        return {
            type: 'array',
            items: (type._def.items as z.ZodTypeAny[]).map(processZodType),
        };
    }

    // Any / Unknown
    if (type instanceof z.ZodAny || type instanceof z.ZodUnknown) {
        return {};
    }

    // Fallback
    return { type: 'object' };
}

/**
 * Extract field descriptions from a Zod object schema.
 * Returns a map of field name → description string.
 */
export function extractZodDescriptions(schema: z.ZodTypeAny): Record<string, string> {
    const descriptions: Record<string, string> = {};

    if (schema instanceof z.ZodObject) {
        const shape = schema.shape as Record<string, z.ZodTypeAny>;
        for (const [key, value] of Object.entries(shape)) {
            if (value._def.description) {
                descriptions[key] = value._def.description;
            }
        }
    }

    return descriptions;
}
