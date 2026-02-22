// ──────────────────────────────────────────────────────────────
// Tests — HashService
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { HashService } from '../auth/HashService.js';

describe('HashService', () => {
    beforeEach(() => {
        // Reset to defaults
        HashService.configure({ rounds: 10 });
    });

    it('hashes a password and produces a bcrypt string', async () => {
        const hash = await HashService.make('SuperSecret123!');
        expect(hash).toMatch(/^\$2[aby]?\$/);
        expect(hash.length).toBeGreaterThan(50);
    });

    it('verifies a correct password', async () => {
        const hash = await HashService.make('CorrectPassword');
        expect(await HashService.check('CorrectPassword', hash)).toBe(true);
    });

    it('rejects an incorrect password', async () => {
        const hash = await HashService.make('CorrectPassword');
        expect(await HashService.check('WrongPassword', hash)).toBe(false);
    });

    it('returns false for empty inputs', async () => {
        expect(await HashService.check('', 'somehash')).toBe(false);
        expect(await HashService.check('password', '')).toBe(false);
    });

    it('returns false for malformed hash', async () => {
        expect(await HashService.check('password', 'not-a-bcrypt-hash')).toBe(false);
    });

    it('detects when rehash is needed (rounds changed)', async () => {
        HashService.configure({ rounds: 10 });
        const hash = await HashService.make('test');
        expect(HashService.needsRehash(hash)).toBe(false);

        // Increase rounds
        HashService.configure({ rounds: 12 });
        expect(HashService.needsRehash(hash)).toBe(true);
    });

    it('detects malformed strings need rehashing', () => {
        expect(HashService.needsRehash('')).toBe(true);
        expect(HashService.needsRehash('random-string')).toBe(true);
    });

    it('returns configured rounds', () => {
        HashService.configure({ rounds: 14 });
        expect(HashService.getRounds()).toBe(14);
    });
});
