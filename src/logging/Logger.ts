// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Logger (Pino Wrapper)
// ──────────────────────────────────────────────────────────────

import pino from 'pino';
import { env } from '../support/helpers.js';
import { getRequestId } from '../core/Context.js';

const isProduction = env('APP_ENV', 'development') === 'production';

const logger = pino({
    level: env('LOG_LEVEL', 'debug'),
    transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        },
});

export class Logger {
    static info(msg: string, data?: Record<string, any>): void {
        const requestId = getRequestId();
        const payload = requestId ? { requestId, ...data } : data;
        payload ? logger.info(payload, msg) : logger.info(msg);
    }

    static error(msg: string, data?: Record<string, any>): void {
        const requestId = getRequestId();
        const payload = requestId ? { requestId, ...data } : data;
        payload ? logger.error(payload, msg) : logger.error(msg);
    }

    static warn(msg: string, data?: Record<string, any>): void {
        const requestId = getRequestId();
        const payload = requestId ? { requestId, ...data } : data;
        payload ? logger.warn(payload, msg) : logger.warn(msg);
    }

    static debug(msg: string, data?: Record<string, any>): void {
        const requestId = getRequestId();
        const payload = requestId ? { requestId, ...data } : data;
        payload ? logger.debug(payload, msg) : logger.debug(msg);
    }

    static fatal(msg: string, data?: Record<string, any>): void {
        data ? logger.fatal(data, msg) : logger.fatal(msg);
    }

    static child(bindings: Record<string, any>): pino.Logger {
        return logger.child(bindings);
    }

    /** Access raw pino instance */
    static get raw(): pino.Logger {
        return logger;
    }
}
