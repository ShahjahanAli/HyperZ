import { describe, it, expect } from 'vitest';
import * as helpers from '../support/helpers.js';

describe('Helpers', () => {
    it('generates uuids', () => {
        const id = helpers.uuid();
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('can retry operations', async () => {
        let attempts = 0;
        const fn = async () => {
            attempts++;
            if (attempts < 3) throw new Error('fail');
            return 'success';
        };

        const result = await helpers.retry(fn, 3, 1);
        expect(result).toBe('success');
        expect(attempts).toBe(3);
    });

    it('ensures once execution', () => {
        let count = 0;
        const fn = helpers.once(() => ++count);
        expect(fn()).toBe(1);
        expect(fn()).toBe(1);
        expect(count).toBe(1);
    });

    it('can pick and omit keys', () => {
        const obj = { a: 1, b: 2, c: 3 };
        expect(helpers.pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
        expect(helpers.omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });

    it('chunks arrays', () => {
        const arr = [1, 2, 3, 4, 5];
        expect(helpers.chunk(arr, 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('detects empty values', () => {
        expect(helpers.isEmpty(null)).toBe(true);
        expect(helpers.isEmpty('')).toBe(true);
        expect(helpers.isEmpty([])).toBe(true);
        expect(helpers.isEmpty({})).toBe(true);
        expect(helpers.isEmpty(0)).toBe(false);
    });
});
