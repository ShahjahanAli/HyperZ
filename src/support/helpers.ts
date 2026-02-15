// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Global Helpers
// ──────────────────────────────────────────────────────────────

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
