// ──────────────────────────────────────────────────────────────
// HyperZ Framework — RBAC Gate (Authorization)
// ──────────────────────────────────────────────────────────────

import type { AuthUser } from '../AuthManager.js';

type GateCallback = (user: AuthUser, ...args: any[]) => boolean | Promise<boolean>;

export class Gate {
    private static abilities = new Map<string, GateCallback>();

    /**
     * Define an ability.
     * @example
     * Gate.define('edit-post', (user, post) => user.id === post.authorId);
     */
    static define(ability: string, callback: GateCallback): void {
        this.abilities.set(ability, callback);
    }

    /**
     * Check if a user has an ability.
     */
    static async allows(ability: string, user: AuthUser, ...args: any[]): Promise<boolean> {
        const callback = this.abilities.get(ability);
        if (!callback) return false;
        return callback(user, ...args);
    }

    /**
     * Check if a user does NOT have an ability.
     */
    static async denies(ability: string, user: AuthUser, ...args: any[]): Promise<boolean> {
        return !(await this.allows(ability, user, ...args));
    }

    /**
     * Authorize — throws if denied.
     */
    static async authorize(ability: string, user: AuthUser, ...args: any[]): Promise<void> {
        const allowed = await this.allows(ability, user, ...args);
        if (!allowed) {
            throw new Error(`Unauthorized: "${ability}" ability denied`);
        }
    }

    /**
     * Check if an ability is defined.
     */
    static has(ability: string): boolean {
        return this.abilities.has(ability);
    }
}
