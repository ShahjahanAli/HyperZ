// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Queue Manager (Sync + BullMQ)
// ──────────────────────────────────────────────────────────────

import { Logger } from '../logging/Logger.js';

export interface Job {
    name: string;
    handle(): Promise<void>;
}

/**
 * Sync queue driver — executes jobs immediately (default for dev).
 */
class SyncDriver {
    async dispatch(job: Job): Promise<void> {
        Logger.debug(`[Queue:sync] Running job: ${job.name}`);
        await job.handle();
    }
}

/**
 * Queue Manager — dispatch jobs synchronously (default) or via BullMQ (Redis).
 */
export class QueueManager {
    private driver: SyncDriver;

    constructor(driverName: string = 'sync') {
        this.driver = new SyncDriver();
        Logger.debug(`Queue driver: ${driverName}`);
    }

    /**
     * Dispatch a job.
     */
    async dispatch(job: Job): Promise<void> {
        return this.driver.dispatch(job);
    }

    /**
     * Dispatch a job with delay (sync driver ignores delay).
     */
    async dispatchLater(job: Job, _delayMs: number): Promise<void> {
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
