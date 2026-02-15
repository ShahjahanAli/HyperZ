// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Task Scheduler (Cron-like)
// ──────────────────────────────────────────────────────────────

import cron from 'node-cron';
import { Logger } from '../logging/Logger.js';

interface ScheduledTask {
    name: string;
    schedule: string;
    handler: () => void | Promise<void>;
    task?: cron.ScheduledTask;
}

export class Scheduler {
    private tasks: ScheduledTask[] = [];

    /**
     * Register a task with a cron expression.
     */
    cron(name: string, expression: string, handler: () => void | Promise<void>): this {
        this.tasks.push({ name, schedule: expression, handler });
        return this;
    }

    // ── Fluent helpers ────────────────────────────────────────

    everyMinute(name: string, handler: () => void | Promise<void>): this {
        return this.cron(name, '* * * * *', handler);
    }

    everyFiveMinutes(name: string, handler: () => void | Promise<void>): this {
        return this.cron(name, '*/5 * * * *', handler);
    }

    hourly(name: string, handler: () => void | Promise<void>): this {
        return this.cron(name, '0 * * * *', handler);
    }

    daily(name: string, handler: () => void | Promise<void>): this {
        return this.cron(name, '0 0 * * *', handler);
    }

    weekly(name: string, handler: () => void | Promise<void>): this {
        return this.cron(name, '0 0 * * 0', handler);
    }

    monthly(name: string, handler: () => void | Promise<void>): this {
        return this.cron(name, '0 0 1 * *', handler);
    }

    /**
     * Start all scheduled tasks.
     */
    start(): void {
        for (const task of this.tasks) {
            task.task = cron.schedule(task.schedule, async () => {
                try {
                    Logger.debug(`[Scheduler] Running: ${task.name}`);
                    await task.handler();
                } catch (err: any) {
                    Logger.error(`[Scheduler] Error in "${task.name}"`, { error: err.message });
                }
            });
            Logger.info(`  ⏰ Scheduled: ${task.name} (${task.schedule})`);
        }
    }

    /**
     * Stop all scheduled tasks.
     */
    stop(): void {
        for (const task of this.tasks) {
            task.task?.stop();
        }
    }

    /**
     * List all registered tasks.
     */
    list(): { name: string; schedule: string }[] {
        return this.tasks.map(t => ({ name: t.name, schedule: t.schedule }));
    }
}
