// ──────────────────────────────────────────────────────────────
// HyperZ Framework — i18n / Localization
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logging/Logger.js';

export class I18n {
    private static translations = new Map<string, Record<string, any>>();
    private static currentLocale = 'en';
    private static fallbackLocale = 'en';

    /**
     * Load all translations from `lang/` directory.
     */
    static async load(langDir: string): Promise<void> {
        if (!fs.existsSync(langDir)) {
            Logger.debug('[i18n] No lang/ directory found, skipping');
            return;
        }

        const locales = fs.readdirSync(langDir).filter(f =>
            fs.statSync(path.join(langDir, f)).isDirectory()
        );

        for (const locale of locales) {
            const localeDir = path.join(langDir, locale);
            const files = fs.readdirSync(localeDir).filter(f => f.endsWith('.json'));
            const localeData: Record<string, any> = {};

            for (const file of files) {
                const namespace = file.replace('.json', '');
                const content = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf-8'));
                localeData[namespace] = content;
            }

            this.translations.set(locale, localeData);
        }

        Logger.debug(`[i18n] Loaded locales: ${locales.join(', ')}`);
    }

    /**
     * Set the current locale.
     */
    static setLocale(locale: string): void {
        this.currentLocale = locale;
    }

    /**
     * Get the current locale.
     */
    static getLocale(): string {
        return this.currentLocale;
    }

    /**
     * Translate a key.
     * @param key Dot-notation key: "namespace.key" or "namespace.nested.key"
     * @param replacements Placeholder replacements: { name: 'John' }
     * @example
     * I18n.t('messages.welcome', { name: 'John' })
     * // => "Welcome, John!"
     */
    static t(key: string, replacements?: Record<string, string | number>, locale?: string): string {
        const lang = locale ?? this.currentLocale;
        const parts = key.split('.');
        const namespace = parts[0];
        const path = parts.slice(1);

        // Try current locale
        let value = this.resolve(lang, namespace, path);

        // Fallback
        if (value === null && lang !== this.fallbackLocale) {
            value = this.resolve(this.fallbackLocale, namespace, path);
        }

        // Not found
        if (value === null) return key;

        // Replace placeholders :name or {{name}}
        if (replacements) {
            for (const [k, v] of Object.entries(replacements)) {
                value = value.replace(new RegExp(`:${k}|\\{\\{${k}\\}\\}`, 'g'), String(v));
            }
        }

        return value;
    }

    /**
     * Detect locale from Accept-Language header.
     */
    static detectFromHeader(header?: string): string {
        if (!header) return this.fallbackLocale;
        const preferred = header.split(',')[0].split(';')[0].trim().split('-')[0];
        return this.translations.has(preferred) ? preferred : this.fallbackLocale;
    }

    private static resolve(locale: string, namespace: string, path: string[]): string | null {
        const data = this.translations.get(locale);
        if (!data || !data[namespace]) return null;

        let value: any = data[namespace];
        for (const p of path) {
            if (value === undefined || value === null) return null;
            value = value[p];
        }

        return typeof value === 'string' ? value : null;
    }

    /**
     * Get all available locales.
     */
    static locales(): string[] {
        return [...this.translations.keys()];
    }
}
