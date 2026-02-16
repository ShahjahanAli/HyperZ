// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Input Sanitizer
// ──────────────────────────────────────────────────────────────

/**
 * Utility class for sanitizing user input to prevent XSS and injection attacks.
 */
export class Sanitizer {
    /**
     * Strip HTML tags from a string.
     */
    static stripHtml(input: string): string {
        if (!input) return input;
        return input.replace(/<[^>]*>?/gm, '');
    }

    /**
     * Sanitize an object recursively.
     */
    static sanitize<T>(input: T): T {
        if (typeof input === 'string') {
            return this.stripHtml(input) as any;
        }

        if (Array.isArray(input)) {
            return input.map(item => this.sanitize(item)) as any;
        }

        if (input !== null && typeof input === 'object') {
            const sanitized: any = {};
            for (const key in input) {
                sanitized[key] = this.sanitize((input as any)[key]);
            }
            return sanitized;
        }

        return input;
    }
}
