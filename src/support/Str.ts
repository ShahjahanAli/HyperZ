// ──────────────────────────────────────────────────────────────
// HyperZ Framework — String Utilities
// ──────────────────────────────────────────────────────────────

export class Str {
    /**
     * Convert to camelCase.
     */
    static camel(value: string): string {
        return value
            .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
            .replace(/^(.)/, (m) => m.toLowerCase());
    }

    /**
     * Convert to PascalCase.
     */
    static pascal(value: string): string {
        const camel = Str.camel(value);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }

    /**
     * Convert to snake_case.
     */
    static snake(value: string): string {
        return value
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/[-\s]+/g, '_');
    }

    /**
     * Convert to kebab-case.
     */
    static kebab(value: string): string {
        return Str.snake(value).replace(/_/g, '-');
    }

    /**
     * Convert to Title Case.
     */
    static title(value: string): string {
        return value.replace(/\b\w/g, (char) => char.toUpperCase());
    }

    /**
     * Generate a slug.
     */
    static slug(value: string, separator = '-'): string {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s]+/g, separator)
            .replace(new RegExp(`${separator}+`, 'g'), separator)
            .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');
    }

    /**
     * Truncate a string.
     */
    static limit(value: string, length: number, end = '...'): string {
        if (value.length <= length) return value;
        return value.slice(0, length) + end;
    }

    /**
     * Check if string contains a substring.
     */
    static contains(haystack: string, needle: string): boolean {
        return haystack.includes(needle);
    }

    /**
     * Check if string starts with a prefix.
     */
    static startsWith(value: string, prefix: string): boolean {
        return value.startsWith(prefix);
    }

    /**
     * Check if string ends with a suffix.
     */
    static endsWith(value: string, suffix: string): boolean {
        return value.endsWith(suffix);
    }

    /**
     * Generate a random alphanumeric string.
     */
    static random(length = 16): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Check if a string is a valid UUID.
     */
    static isUuid(value: string): boolean {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    }

    /**
     * Check if a string is a valid email.
     */
    static isEmail(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
}
