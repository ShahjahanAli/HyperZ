import { describe, it, expect } from 'vitest';
import { z, validate, validateAll } from '../validation/Validator.js';

describe('Validator', () => {
    it('can validate body with a shape', async () => {
        const middleware = validate({
            name: z.string().min(3)
        });

        const req = { body: { name: 'Jo' } };
        expect(() => middleware(req as any, {} as any, () => { })).toThrow();
    });

    it('can validate body with a schema', async () => {
        const schema = z.object({ age: z.number().min(18) });
        const middleware = validate(schema);

        const req = { body: { age: 10 } };
        expect(() => middleware(req as any, {} as any, () => { })).toThrow();
    });

    it('can validateAll in one call', async () => {
        const middleware = validateAll({
            body: { title: z.string() },
            params: { id: z.string().regex(/^\d+$/) }
        });

        const req = {
            body: { title: 'ok' },
            params: { id: 'abc' },
            query: {}
        };

        expect(() => middleware(req as any, {} as any, () => { })).toThrow();
    });
});
