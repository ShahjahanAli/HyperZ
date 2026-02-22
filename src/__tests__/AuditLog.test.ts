// ──────────────────────────────────────────────────────────────
// Tests — AuditLog
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLog } from '../logging/AuditLog.js';
import type { AuditStore, AuditEntry, AuditQueryOptions } from '../logging/AuditLog.js';

// ── Custom in-memory store for testing ──────────────────────

class TestStore implements AuditStore {
    entries: AuditEntry[] = [];

    async save(entry: AuditEntry): Promise<void> {
        this.entries.push(entry);
    }

    async query(options: AuditQueryOptions): Promise<AuditEntry[]> {
        let results = this.entries;

        if (options.userId !== undefined) {
            results = results.filter((e) => e.userId === options.userId);
        }
        if (options.action) {
            results = results.filter((e) => e.action === options.action);
        }

        return results.slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50));
    }

    async count(options: AuditQueryOptions): Promise<number> {
        return (await this.query(options)).length;
    }
}

// ── Tests ───────────────────────────────────────────────────

describe('AuditLog', () => {
    let store: TestStore;

    beforeEach(() => {
        store = new TestStore();
        AuditLog.useStore(store);
    });

    it('should record an audit entry', async () => {
        const entry = await AuditLog.record({
            action: 'user.login',
            userId: '42',
            ip: '127.0.0.1',
        });

        expect(entry.id).toBeDefined();
        expect(entry.action).toBe('user.login');
        expect(entry.userId).toBe('42');
        expect(entry.timestamp).toBeInstanceOf(Date);
        expect(store.entries).toHaveLength(1);
    });

    it('should record model changes', async () => {
        const entry = await AuditLog.recordChange({
            model: 'User',
            modelId: '42',
            action: 'update',
            userId: '1',
            before: { name: 'Old' },
            after: { name: 'New' },
        });

        expect(entry.action).toBe('user.update');
        expect(entry.model).toBe('User');
        expect(entry.before).toEqual({ name: 'Old' });
        expect(entry.after).toEqual({ name: 'New' });
    });

    it('should query entries by userId', async () => {
        await AuditLog.record({ action: 'login', userId: '1' });
        await AuditLog.record({ action: 'login', userId: '2' });
        await AuditLog.record({ action: 'logout', userId: '1' });

        const results = await AuditLog.query({ userId: '1' });
        expect(results).toHaveLength(2);
        expect(results.every((r) => r.userId === '1')).toBe(true);
    });

    it('should query entries by action', async () => {
        await AuditLog.record({ action: 'user.login', userId: '1' });
        await AuditLog.record({ action: 'user.logout', userId: '1' });

        const results = await AuditLog.query({ action: 'user.login' });
        expect(results).toHaveLength(1);
        expect(results[0]!.action).toBe('user.login');
    });

    it('should count entries', async () => {
        await AuditLog.record({ action: 'a' });
        await AuditLog.record({ action: 'b' });
        await AuditLog.record({ action: 'a' });

        expect(await AuditLog.count({ action: 'a' })).toBe(2);
        expect(await AuditLog.count({})).toBe(3);
    });

    it('should support custom stores', async () => {
        // Already using TestStore — verify it works
        await AuditLog.record({ action: 'test' });
        expect(store.entries).toHaveLength(1);
        expect(AuditLog.getStore()).toBe(store);
    });

    it('should generate unique IDs', async () => {
        const e1 = await AuditLog.record({ action: 'a' });
        const e2 = await AuditLog.record({ action: 'b' });
        expect(e1.id).not.toBe(e2.id);
    });
});
