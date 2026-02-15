// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Seeder Runner
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logging/Logger.js';

export interface SeederFile {
    run(): Promise<void>;
}

export class Seeder {
    private seedersDir: string;

    constructor(seedersDir: string) {
        this.seedersDir = seedersDir;
    }

    /**
     * Run all seeders.
     */
    async seed(): Promise<string[]> {
        const files = this.getSeederFiles();

        if (files.length === 0) {
            Logger.info('No seeders found.');
            return [];
        }

        const seeded: string[] = [];

        for (const file of files) {
            const filePath = path.join(this.seedersDir, file);
            const seeder: SeederFile = await import(`file://${filePath.replace(/\\/g, '/')}`);

            await seeder.run();
            Logger.info(`  ✓ Seeded: ${file}`);
            seeded.push(file);
        }

        Logger.info(`✦ Ran ${seeded.length} seeder(s)`);
        return seeded;
    }

    /**
     * Run a specific seeder.
     */
    async seedOne(fileName: string): Promise<void> {
        const filePath = path.join(this.seedersDir, fileName);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Seeder file not found: ${fileName}`);
        }

        const seeder: SeederFile = await import(`file://${filePath.replace(/\\/g, '/')}`);
        await seeder.run();
        Logger.info(`✓ Seeded: ${fileName}`);
    }

    /**
     * Get all seeder files.
     */
    private getSeederFiles(): string[] {
        if (!fs.existsSync(this.seedersDir)) return [];
        return fs
            .readdirSync(this.seedersDir)
            .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
            .sort();
    }
}
