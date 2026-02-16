// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Request Context (AsyncLocalStorage)
// ──────────────────────────────────────────────────────────────

import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
    requestId: string;
    [key: string]: any;
}

/**
 * Global storage for request-specific context.
 * Allows retrieving request data (like IDs) anywhere in the async flow.
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Access the current request context.
 */
export function getContext(): RequestContext | undefined {
    return requestContext.getStore();
}

/**
 * Access the current request ID.
 */
export function getRequestId(): string | undefined {
    return getContext()?.requestId;
}
