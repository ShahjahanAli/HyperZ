// ──────────────────────────────────────────────────────────────
// HyperZ Framework — BullMQ Queue Driver
// ──────────────────────────────────────────────────────────────

import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { Logger } from '../logging/Logger.js';
import { env, envNumber } from '../support/helpers.js';
import type { Job } from './QueueManager.js';

interface QueueDriver {
    dispatch(job: Job): Promise<void>;
    dispatchLater(job: Job, delayMs: number): Promise<void>;
}

export class BullMQDriver implements QueueDriver {
    private queue: Queue;
    private worker: Worker | null = null;
    private handlers = new Map<string, (data: any) => Promise<void>>();
    private connection: Redis;

    constructor(queueName = 'hyperz') {
        this.connection = new Redis({
            host: env('REDIS_HOST', '127.0.0.1'),
            port: envNumber('REDIS_PORT', 6379),
            password: env('REDIS_PASSWORD', '') || undefined,
            maxRetriesPerRequest: null,
        });

        this.queue = new Queue(queueName, { connection: this.connection });
        Logger.info('[Queue:BullMQ] Queue initialized');
    }

    /**
     * Dispatch a job immediately.
     */
    async dispatch(job: Job): Promise<void> {
        await this.queue.add(job.name, { jobName: job.name });
        this.registerHandler(job);
        Logger.debug(`[Queue:BullMQ] Job dispatched: ${job.name}`);
    }

    /**
     * Dispatch a job with a delay.
     */
    async dispatchLater(job: Job, delayMs: number): Promise<void> {
        await this.queue.add(job.name, { jobName: job.name }, { delay: delayMs });
        this.registerHandler(job);
        Logger.debug(`[Queue:BullMQ] Job dispatched with ${delayMs}ms delay: ${job.name}`);
    }

    /**
     * Start the worker to process jobs.
     */
    startWorker(queueName = 'hyperz'): void {
        this.worker = new Worker(
            queueName,
            async (bullJob) => {
                const handler = this.handlers.get(bullJob.name);
                if (handler) {
                    Logger.debug(`[Queue:BullMQ] Processing job: ${bullJob.name}`);
                    await handler(bullJob.data);
                } else {
                    Logger.warn(`[Queue:BullMQ] No handler for job: ${bullJob.name}`);
                }
            },
            { connection: this.connection }
        );

        this.worker.on('completed', (job) => {
            Logger.debug(`[Queue:BullMQ] Job completed: ${job.name}`);
        });

        this.worker.on('failed', (job, err) => {
            Logger.error(`[Queue:BullMQ] Job failed: ${job?.name}`, { error: err.message });
        });
    }

    private registerHandler(job: Job): void {
        if (!this.handlers.has(job.name)) {
            this.handlers.set(job.name, async () => await job.handle());

            // Auto-start worker on first dispatch
            if (!this.worker) {
                this.startWorker();
            }
        }
    }

    async disconnect(): Promise<void> {
        await this.worker?.close();
        await this.queue.close();
        this.connection.disconnect();
    }
}
