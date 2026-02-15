// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Configuration Manager
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';

export class ConfigManager {
    private items: Record<string, any> = {};
    private envLoaded = false;

    constructor(private basePath: string) { }

    /**
     * Load environment variables from .env file.
     */
    loadEnv(): void {
        if (this.envLoaded) return;

        const envPath = path.join(this.basePath, '.env');
        if (fs.existsSync(envPath)) {
            loadEnv({ path: envPath });
        }
        this.envLoaded = true;
    }

    /**
     * Load all config files from the config/ directory.
     */
    async loadConfigFiles(): Promise<void> {
        const configDir = path.join(this.basePath, 'config');
        if (!fs.existsSync(configDir)) return;

        const files = fs.readdirSync(configDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

        for (const file of files) {
            const key = path.basename(file, path.extname(file));
            try {
                const filePath = path.join(configDir, file);
                const mod = await import(`file://${filePath.replace(/\\/g, '/')}`);
                this.items[key] = mod.default ?? mod;
            } catch {
                // Skip files that can't be imported
            }
        }
    }

    /**
     * Get a config value using dot notation.
     * @example config.get('app.name') → 'HyperZ'
     * @example config.get('database.host', 'localhost')
     */
    get<T = any>(key: string, defaultValue?: T): T {
        const parts = key.split('.');
        let current: any = this.items;

        for (const part of parts) {
            if (current === undefined || current === null) {
                return defaultValue as T;
            }
            current = current[part];
        }

        return (current !== undefined ? current : defaultValue) as T;
    }

    /**
     * Set a config value using dot notation.
     */
    set(key: string, value: any): void {
        const parts = key.split('.');
        let current: any = this.items;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Check if a config key exists.
     */
    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    /**
     * Get all config items.
     */
    all(): Record<string, any> {
        return { ...this.items };
    }
}
