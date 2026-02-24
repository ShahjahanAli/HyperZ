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
    private additionalDirs: string[] = [];

    constructor(seedersDir: string) {
        this.seedersDir = seedersDir;
    }

    /**
     * Add additional seeder directories (e.g., from plugins).
     */
    addSeederPaths(dirs: string[]): void {
        this.additionalDirs.push(...dirs);
    }

    /**
     * Run all seeders from the primary directory and all additional directories.
     */
    async seed(): Promise<string[]> {
        const seeded: string[] = [];

        // Run primary seeders
        const primaryFiles = this.getSeederFilesFromDir(this.seedersDir);
        for (const file of primaryFiles) {
            const filePath = path.join(this.seedersDir, file);
            await this.runSeeder(filePath, file);
            seeded.push(file);
        }

        // Run plugin seeders
        for (const dir of this.additionalDirs) {
            const files = this.getSeederFilesFromDir(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const label = `[plugin] ${path.basename(dir)}/${file}`;
                await this.runSeeder(filePath, label);
                seeded.push(label);
            }
        }

        if (seeded.length === 0) {
            Logger.info('No seeders found.');
        } else {
            Logger.info(`✦ Ran ${seeded.length} seeder(s)`);
        }

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

        await this.runSeeder(filePath, fileName);
    }

    /**
     * Run a single seeder file.
     */
    private async runSeeder(filePath: string, label: string): Promise<void> {
        const seeder: SeederFile = await import(`file://${filePath.replace(/\\/g, '/')}`);
        await seeder.run();
        Logger.info(`  ✓ Seeded: ${label}`);
    }

    /**
     * Get all seeder files from a directory.
     */
    private getSeederFilesFromDir(dir: string): string[] {
        if (!fs.existsSync(dir)) return [];
        return fs
            .readdirSync(dir)
            .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
            .sort();
    }

    /**
     * @deprecated Use getSeederFilesFromDir instead
     */
    private getSeederFiles(): string[] {
        return this.getSeederFilesFromDir(this.seedersDir);
    }
}
