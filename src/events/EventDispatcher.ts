// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Event Dispatcher (Pub/Sub)
// ──────────────────────────────────────────────────────────────

import { Logger } from '../logging/Logger.js';

type EventHandler = (...args: any[]) => void | Promise<void>;

export class EventDispatcher {
    private static listeners = new Map<string, EventHandler[]>();

    /**
     * Register an event listener.
     */
    static on(event: string, handler: EventHandler): void {
        const handlers = this.listeners.get(event) ?? [];
        handlers.push(handler);
        this.listeners.set(event, handlers);
    }

    /**
     * Register a one-time event listener.
     */
    static once(event: string, handler: EventHandler): void {
        const wrapper: EventHandler = async (...args) => {
            await handler(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    /**
     * Remove a specific handler from an event.
     */
    static off(event: string, handler: EventHandler): void {
        const handlers = this.listeners.get(event) ?? [];
        this.listeners.set(event, handlers.filter(h => h !== handler));
    }

    /**
     * Dispatch an event — all listeners are called.
     */
    static async dispatch(event: string, ...args: any[]): Promise<void> {
        const handlers = this.listeners.get(event) ?? [];

        Logger.debug(`Event dispatched: ${event}`, { listenerCount: handlers.length });

        for (const handler of handlers) {
            try {
                await handler(...args);
            } catch (err: any) {
                Logger.error(`Event listener error on "${event}"`, { error: err.message });
            }
        }
    }

    /**
     * Check if an event has listeners.
     */
    static hasListeners(event: string): boolean {
        return (this.listeners.get(event)?.length ?? 0) > 0;
    }

    /**
     * Get all registered event names.
     */
    static events(): string[] {
        return Array.from(this.listeners.keys());
    }

    /**
     * Clear all listeners (or for a specific event).
     */
    static clear(event?: string): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}
