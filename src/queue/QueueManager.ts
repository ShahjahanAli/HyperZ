// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Queue Manager (Sync + BullMQ)
// ──────────────────────────────────────────────────────────────

import { Logger } from '../logging/Logger.js';

export interface Job {
    name: string;
    handle(): Promise<void>;
}

interface QueueDriver {
    dispatch(job: Job): Promise<void>;
    dispatchLater?(job: Job, delayMs: number): Promise<void>;
}

/**
 * Sync queue driver — executes jobs immediately (default for dev).
 */
class SyncDriver implements QueueDriver {
    async dispatch(job: Job): Promise<void> {
        Logger.debug(`[Queue:sync] Running job: ${job.name}`);
        await job.handle();
    }
}

/**
 * Queue Manager — dispatch jobs synchronously (default) or via BullMQ (Redis).
 */
export class QueueManager {
    private driver: QueueDriver;
    private driverName: string;

    constructor(driverName: string = 'sync') {
        this.driverName = driverName;

        if (driverName === 'redis') {
            // Lazy-load BullMQ driver to avoid requiring Redis when not used
            import('./BullMQDriver.js').then(({ BullMQDriver }) => {
                this.driver = new BullMQDriver();
            }).catch(() => {
                Logger.warn('[Queue] BullMQ not available, falling back to sync driver');
                this.driver = new SyncDriver();
            });
            this.driver = new SyncDriver(); // Temporary until async import resolves
        } else {
            this.driver = new SyncDriver();
        }

        Logger.debug(`Queue driver: ${driverName}`);
    }

    /**
     * Dispatch a job.
     */
    async dispatch(job: Job): Promise<void> {
        return this.driver.dispatch(job);
    }

    /**
     * Dispatch a job with delay.
     */
    async dispatchLater(job: Job, delayMs: number): Promise<void> {
        if (this.driver.dispatchLater) {
            return this.driver.dispatchLater(job, delayMs);
        }
        return this.driver.dispatch(job);
    }
}

/**
 * Base job class — extend this for your jobs.
 */
export abstract class BaseJob implements Job {
    abstract name: string;
    abstract handle(): Promise<void>;
}
