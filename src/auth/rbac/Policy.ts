// ──────────────────────────────────────────────────────────────
// HyperZ Framework — RBAC Policy (Resource Authorization)
// ──────────────────────────────────────────────────────────────

import type { AuthUser } from '../AuthManager.js';

/**
 * Base Policy class — override methods for each resource action.
 *
 * @example
 * class PostPolicy extends Policy {
 *   viewAny(user: AuthUser) { return true; }
 *   view(user: AuthUser, post: any) { return true; }
 *   create(user: AuthUser) { return user.role === 'admin'; }
 *   update(user: AuthUser, post: any) { return user.id === post.authorId; }
 *   delete(user: AuthUser, post: any) { return user.id === post.authorId; }
 * }
 */
export abstract class Policy {
    viewAny?(user: AuthUser): boolean | Promise<boolean>;
    view?(user: AuthUser, resource: any): boolean | Promise<boolean>;
    create?(user: AuthUser): boolean | Promise<boolean>;
    update?(user: AuthUser, resource: any): boolean | Promise<boolean>;
    delete?(user: AuthUser, resource: any): boolean | Promise<boolean>;
    restore?(user: AuthUser, resource: any): boolean | Promise<boolean>;
    forceDelete?(user: AuthUser, resource: any): boolean | Promise<boolean>;

    /**
     * Check a policy action.
     */
    async can(action: string, user: AuthUser, resource?: any): Promise<boolean> {
        const method = (this as any)[action];
        if (typeof method !== 'function') return false;
        return method.call(this, user, resource);
    }
}
