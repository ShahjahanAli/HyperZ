// ──────────────────────────────────────────────────────────────
// Tests — ZodToOpenAPI (Zod → JSON Schema Converter)
// ──────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodToJsonSchema } from '../docs/ZodToOpenAPI.js';

describe('zodToJsonSchema', () => {
    it('should convert string schemas', () => {
        const schema = z.string().min(1).max(255);
        const result = zodToJsonSchema(schema);
        expect(result.type).toBe('string');
        expect(result.minLength).toBe(1);
        expect(result.maxLength).toBe(255);
    });

    it('should convert number schemas', () => {
        const schema = z.number().min(0).max(100);
        const result = zodToJsonSchema(schema);
        expect(result.type).toBe('number');
        expect(result.minimum).toBe(0);
        expect(result.maximum).toBe(100);
    });

    it('should convert boolean schemas', () => {
        expect(zodToJsonSchema(z.boolean())).toEqual({ type: 'boolean' });
    });

    it('should convert enum schemas', () => {
        const schema = z.enum(['active', 'inactive', 'pending']);
        const result = zodToJsonSchema(schema);
        expect(result.type).toBe('string');
        expect(result.enum).toEqual(['active', 'inactive', 'pending']);
    });

    it('should convert array schemas', () => {
        const schema = z.array(z.string());
        const result = zodToJsonSchema(schema);
        expect(result.type).toBe('array');
        expect(result.items).toEqual({ type: 'string' });
    });

    it('should convert object schemas with required fields', () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
            email: z.string().optional(),
        });
        const result = zodToJsonSchema(schema);

        expect(result.type).toBe('object');
        expect(result.properties).toBeDefined();
        expect(result.properties!['name']).toEqual({ type: 'string' });
        expect(result.required).toContain('name');
        expect(result.required).toContain('age');
        expect(result.required).not.toContain('email');
    });

    it('should convert optional schemas', () => {
        const schema = z.string().optional();
        const result = zodToJsonSchema(schema);
        expect(result.type).toBe('string');
    });

    it('should convert nullable schemas', () => {
        const schema = z.string().nullable();
        const result = zodToJsonSchema(schema);
        expect(result.nullable).toBe(true);
    });

    it('should convert union schemas to oneOf', () => {
        const schema = z.union([z.string(), z.number()]);
        const result = zodToJsonSchema(schema);
        expect(result.oneOf).toEqual([{ type: 'string' }, { type: 'number' }]);
    });

    it('should convert record schemas', () => {
        const schema = z.record(z.string());
        const result = zodToJsonSchema(schema);
        expect(result.type).toBe('object');
        expect(result.additionalProperties).toEqual({ type: 'string' });
    });

    it('should handle default values', () => {
        const schema = z.string().default('hello');
        const result = zodToJsonSchema(schema);
        expect(result.type).toBe('string');
        expect(result.default).toBe('hello');
    });

    it('should convert date schemas to string format date-time', () => {
        const schema = z.date();
        const result = zodToJsonSchema(schema);
        expect(result.type).toBe('string');
        expect(result.format).toBe('date-time');
    });

    it('should handle nested objects', () => {
        const schema = z.object({
            user: z.object({
                name: z.string(),
                address: z.object({
                    city: z.string(),
                }),
            }),
        });
        const result = zodToJsonSchema(schema);

        expect(result.type).toBe('object');
        expect(result.properties!['user'].type).toBe('object');
        expect(result.properties!['user'].properties!['address'].type).toBe('object');
        expect(result.properties!['user'].properties!['address'].properties!['city'].type).toBe('string');
    });
});
