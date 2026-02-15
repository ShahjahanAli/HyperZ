// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Event Dispatcher
// ──────────────────────────────────────────────────────────────

import { Logger } from '../logging/Logger.js';

type Listener = (...args: any[]) => void | Promise<void>;

export class EventDispatcher {
    private static listeners = new Map<string, Listener[]>();
    private static wildcardListeners: { pattern: RegExp; handler: Listener }[] = [];

    /**
     * Register an event listener.
     * Supports wildcards like 'user.*'
     */
    static on(event: string, handler: Listener): void {
        if (event.includes('*')) {
            const pattern = new RegExp('^' + event.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
            this.wildcardListeners.push({ pattern, handler });
            return;
        }

        const handlers = this.listeners.get(event) ?? [];
        handlers.push(handler);
        this.listeners.set(event, handlers);
    }

    /**
     * Register a one-time event listener.
     */
    static once(event: string, handler: Listener): void {
        const onceWrapper = async (...args: any[]) => {
            this.off(event, onceWrapper);
            await handler(...args);
        };
        this.on(event, onceWrapper);
    }

    /**
     * Remove an event listener.
     */
    static off(event: string, handler: Listener): void {
        if (event.includes('*')) {
            this.wildcardListeners = this.wildcardListeners.filter(l => l.handler !== handler);
            return;
        }

        const handlers = this.listeners.get(event) ?? [];
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
            this.listeners.set(event, handlers);
        }
    }

    /**
     * Dispatch an event to all listeners.
     */
    static async dispatch(event: string, ...args: any[]): Promise<void> {
        const handlers = this.listeners.get(event) ?? [];

        // Find matching wildcard listeners
        const matchingWildcards = this.wildcardListeners
            .filter(l => l.pattern.test(event))
            .map(l => l.handler);

        const allHandlers = [...handlers, ...matchingWildcards];

        Logger.debug(`Event dispatched: ${event}`, { listenerCount: allHandlers.length });

        for (const handler of allHandlers) {
            try {
                await handler(...args);
            } catch (err: any) {
                Logger.error(`Event listener error on "${event}"`, { error: err.message });
            }
        }
    }

    /**
     * Dispatch an event synchronously.
     * Listeners are executed in order, stops if one fails.
     */
    static async dispatchSync(event: string, ...args: any[]): Promise<void> {
        const handlers = this.listeners.get(event) ?? [];
        const matchingWildcards = this.wildcardListeners
            .filter(l => l.pattern.test(event))
            .map(l => l.handler);

        const allHandlers = [...handlers, ...matchingWildcards];

        for (const handler of allHandlers) {
            await handler(...args);
        }
    }

    /**
     * Check if an event has listeners.
     */
    static hasListeners(event: string): boolean {
        if ((this.listeners.get(event)?.length ?? 0) > 0) return true;
        return this.wildcardListeners.some(l => l.pattern.test(event));
    }

    /**
     * Get all registered events.
     */
    static events(): string[] {
        return Array.from(this.listeners.keys());
    }

    /**
     * Clear all listeners.
     */
    static clear(): void {
        this.listeners.clear();
        this.wildcardListeners = [];
    }
}
