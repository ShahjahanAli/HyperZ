// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Webhook System
// ──────────────────────────────────────────────────────────────
//
// Dispatch webhook events to registered endpoints with:
//   - HMAC-SHA256 signature verification
//   - Automatic retry with exponential backoff
//   - Delivery logging
//
// Usage:
//   import { WebhookManager } from '../../src/webhooks/WebhookManager.js';
//
//   // Register a webhook endpoint
//   WebhookManager.register({
//     url: 'https://example.com/webhooks',
//     events: ['user.created', 'order.completed'],
//     secret: 'whsec_...',
//   });
//
//   // Dispatch an event
//   await WebhookManager.dispatch('user.created', { id: 1, email: '...' });
//
//   // Verify incoming webhook (for receiving)
//   const valid = WebhookManager.verifySignature(payload, signature, secret);
// ──────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { Logger } from '../logging/Logger.js';

// ── Types ───────────────────────────────────────────────────

export interface WebhookEndpoint {
    /** Unique identifier */
    id: string;
    /** Target URL */
    url: string;
    /** Events this endpoint subscribes to (e.g., 'user.created'). Use '*' for all. */
    events: string[];
    /** Secret used for HMAC signature */
    secret: string;
    /** Whether the endpoint is active */
    active: boolean;
    /** Custom headers to include in the delivery */
    headers?: Record<string, string>;
    /** Max retry attempts (default: 3) */
    maxRetries?: number;
}

export interface WebhookDelivery {
    id: string;
    endpointId: string;
    event: string;
    payload: unknown;
    url: string;
    status: 'pending' | 'success' | 'failed';
    statusCode?: number;
    attempts: number;
    lastAttemptAt?: Date;
    error?: string;
    createdAt: Date;
}

export interface WebhookDispatchResult {
    event: string;
    deliveries: WebhookDelivery[];
}

// ── Manager ─────────────────────────────────────────────────

export class WebhookManager {
    private static endpoints: Map<string, WebhookEndpoint> = new Map();
    private static deliveries: WebhookDelivery[] = [];
    private static maxDeliveryLog = 1000;

    // ── Registration ────────────────────────────────────────

    /**
     * Register a webhook endpoint.
     */
    static register(endpoint: Omit<WebhookEndpoint, 'id' | 'active'> & { id?: string; active?: boolean }): WebhookEndpoint {
        const full: WebhookEndpoint = {
            id: endpoint.id ?? randomUUID(),
            active: endpoint.active ?? true,
            maxRetries: endpoint.maxRetries ?? 3,
            ...endpoint,
        };
        this.endpoints.set(full.id, full);
        return full;
    }

    /**
     * Remove a webhook endpoint.
     */
    static unregister(id: string): boolean {
        return this.endpoints.delete(id);
    }

    /**
     * Get all registered endpoints.
     */
    static getEndpoints(): WebhookEndpoint[] {
        return [...this.endpoints.values()];
    }

    /**
     * Get a specific endpoint by ID.
     */
    static getEndpoint(id: string): WebhookEndpoint | undefined {
        return this.endpoints.get(id);
    }

    // ── Dispatch ────────────────────────────────────────────

    /**
     * Dispatch a webhook event to all matching endpoints.
     *
     * @param event — Event name (e.g., 'user.created').
     * @param payload — JSON-serializable data.
     * @returns Dispatch result with delivery statuses.
     */
    static async dispatch(event: string, payload: unknown): Promise<WebhookDispatchResult> {
        const matching = [...this.endpoints.values()].filter(
            (ep) => ep.active && (ep.events.includes('*') || ep.events.includes(event)),
        );

        const deliveries: WebhookDelivery[] = [];

        for (const endpoint of matching) {
            const delivery = await this.deliver(endpoint, event, payload);
            deliveries.push(delivery);
        }

        return { event, deliveries };
    }

    // ── Delivery ────────────────────────────────────────────

    private static async deliver(
        endpoint: WebhookEndpoint,
        event: string,
        payload: unknown,
    ): Promise<WebhookDelivery> {
        const delivery: WebhookDelivery = {
            id: randomUUID(),
            endpointId: endpoint.id,
            event,
            payload,
            url: endpoint.url,
            status: 'pending',
            attempts: 0,
            createdAt: new Date(),
        };

        const maxRetries = endpoint.maxRetries ?? 3;
        const body = JSON.stringify({
            event,
            payload,
            timestamp: new Date().toISOString(),
            id: delivery.id,
        });

        const signature = this.sign(body, endpoint.secret);

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            delivery.attempts = attempt + 1;
            delivery.lastAttemptAt = new Date();

            try {
                const response = await fetch(endpoint.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': signature,
                        'X-Webhook-Event': event,
                        'X-Webhook-ID': delivery.id,
                        'X-Webhook-Timestamp': delivery.createdAt.toISOString(),
                        'User-Agent': 'HyperZ-Webhooks/1.0',
                        ...(endpoint.headers ?? {}),
                    },
                    body,
                    signal: AbortSignal.timeout(10_000), // 10s timeout per attempt
                });

                delivery.statusCode = response.status;

                if (response.ok) {
                    delivery.status = 'success';
                    break;
                }

                // Non-2xx — retry
                delivery.error = `HTTP ${response.status}: ${response.statusText}`;
                Logger.warn(`[Webhook] Delivery ${delivery.id} attempt ${attempt + 1} failed: ${delivery.error}`);
            } catch (err: unknown) {
                delivery.error = err instanceof Error ? err.message : 'Unknown error';
                Logger.warn(`[Webhook] Delivery ${delivery.id} attempt ${attempt + 1} error: ${delivery.error}`);
            }

            // Exponential backoff before retry: 1s, 2s, 4s, ...
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
            }
        }

        if (delivery.status !== 'success') {
            delivery.status = 'failed';
            Logger.error(`[Webhook] Delivery ${delivery.id} failed after ${delivery.attempts} attempts`);
        }

        // Store delivery log
        this.deliveries.push(delivery);
        if (this.deliveries.length > this.maxDeliveryLog) {
            this.deliveries = this.deliveries.slice(-this.maxDeliveryLog);
        }

        return delivery;
    }

    // ── Signature ───────────────────────────────────────────

    /**
     * Create an HMAC-SHA256 signature for a payload.
     */
    static sign(payload: string, secret: string): string {
        return createHmac('sha256', secret).update(payload).digest('hex');
    }

    /**
     * Verify an incoming webhook signature.
     * Use this in your webhook-receiving endpoints.
     *
     * @example
     * app.post('/webhooks/stripe', (req, res) => {
     *   const valid = WebhookManager.verifySignature(
     *     JSON.stringify(req.body),
     *     req.headers['x-webhook-signature'] as string,
     *     'whsec_...',
     *   );
     *   if (!valid) return res.status(401).json({ error: 'Invalid signature' });
     *   // Process webhook...
     * });
     */
    static verifySignature(payload: string, signature: string, secret: string): boolean {
        const expected = this.sign(payload, secret);
        const sigBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expected, 'hex');
        if (sigBuffer.length !== expectedBuffer.length) return false;
        return timingSafeEqual(sigBuffer, expectedBuffer);
    }

    // ── Admin / Query ───────────────────────────────────────

    /**
     * Get delivery logs (newest first).
     */
    static getDeliveries(options?: {
        endpointId?: string;
        event?: string;
        status?: 'pending' | 'success' | 'failed';
        limit?: number;
    }): WebhookDelivery[] {
        let results = [...this.deliveries];

        if (options?.endpointId) results = results.filter((d) => d.endpointId === options.endpointId);
        if (options?.event) results = results.filter((d) => d.event === options.event);
        if (options?.status) results = results.filter((d) => d.status === options.status);

        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return results.slice(0, options?.limit ?? 50);
    }

    /**
     * Get delivery stats for admin dashboard.
     */
    static stats(): { total: number; success: number; failed: number; endpoints: number } {
        return {
            total: this.deliveries.length,
            success: this.deliveries.filter((d) => d.status === 'success').length,
            failed: this.deliveries.filter((d) => d.status === 'failed').length,
            endpoints: this.endpoints.size,
        };
    }

    /**
     * Clear all endpoints and delivery logs (for testing).
     */
    static clear(): void {
        this.endpoints.clear();
        this.deliveries = [];
    }
}
