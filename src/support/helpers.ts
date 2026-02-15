// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Global Helpers
// ──────────────────────────────────────────────────────────────

import { randomUUID } from 'node:crypto';

/**
 * Get environment variable with optional default.
 */
export function env(key: string, defaultValue?: string): string {
    return process.env[key] ?? defaultValue ?? '';
}

/**
 * Get environment variable as a number.
 */
export function envNumber(key: string, defaultValue?: number): number {
    const val = process.env[key];
    if (val === undefined) return defaultValue ?? 0;
    const num = Number(val);
    return Number.isNaN(num) ? (defaultValue ?? 0) : num;
}

/**
 * Get environment variable as a boolean.
 */
export function envBool(key: string, defaultValue = false): boolean {
    const val = process.env[key];
    if (val === undefined) return defaultValue;
    return ['true', '1', 'yes'].includes(val.toLowerCase());
}

/**
 * Sleep for given milliseconds (async).
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random string of given length.
 */
export function randomString(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Tap a value — execute a callback then return the original value.
 */
export function tap<T>(value: T, callback: (value: T) => void): T {
    callback(value);
    return value;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object).
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Deep merge objects.
 */
export function deepMerge<T extends Record<string, any>>(...objects: Partial<T>[]): T {
    const result: any = {};
    for (const obj of objects) {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (
                    typeof obj[key] === 'object' &&
                    obj[key] !== null &&
                    !Array.isArray(obj[key])
                ) {
                    result[key] = deepMerge(result[key] || {}, obj[key] as any);
                } else {
                    result[key] = obj[key];
                }
            }
        }
    }
    return result;
}

// ── New Helpers ───────────────────────────────────────────────

/**
 * Generate a UUID v4.
 */
export function uuid(): string {
    return randomUUID();
}

/**
 * Get the current ISO timestamp.
 */
export function now(): string {
    return new Date().toISOString();
}

/**
 * Retry an async operation with exponential backoff.
 *
 * @example
 * const result = await retry(() => fetchFromAPI(), 3, 1000);
 */
export async function retry<T>(
    fn: () => Promise<T>,
    attempts = 3,
    delayMs = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            if (i < attempts - 1) {
                await sleep(delayMs * Math.pow(2, i));
            }
        }
    }

    throw lastError;
}

/**
 * Ensure a function only executes once.
 * Subsequent calls return the first result.
 */
export function once<T extends (...args: any[]) => any>(fn: T): T {
    let called = false;
    let result: any;

    return ((...args: any[]) => {
        if (!called) {
            called = true;
            result = fn(...args);
        }
        return result;
    }) as T;
}

/**
 * Debounce a function — delays execution until after the wait period
 * has elapsed since the last invocation.
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, waitMs: number): T {
    let timer: ReturnType<typeof setTimeout>;

    return ((...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), waitMs);
    }) as T;
}

/**
 * Throttle a function — ensures it runs at most once per interval.
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, intervalMs: number): T {
    let lastRun = 0;

    return ((...args: any[]) => {
        const now = Date.now();
        if (now - lastRun >= intervalMs) {
            lastRun = now;
            return fn(...args);
        }
    }) as T;
}

/**
 * Pick specific keys from an object.
 */
export function pick<T extends Record<string, any>>(obj: T, keys: (keyof T)[]): Partial<T> {
    const result: Partial<T> = {};
    for (const key of keys) {
        if (key in obj) result[key] = obj[key];
    }
    return result;
}

/**
 * Omit specific keys from an object.
 */
export function omit<T extends Record<string, any>>(obj: T, keys: (keyof T)[]): Partial<T> {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}

/**
 * Chunk an array into smaller arrays of a specified size.
 */
export function chunk<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}
