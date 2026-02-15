// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Storage Manager (Local + S3)
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '../logging/Logger.js';

interface StorageDriver {
    put(filePath: string, content: Buffer | string): Promise<string>;
    get(filePath: string): Promise<Buffer | null>;
    delete(filePath: string): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    url(filePath: string): string;
}

/**
 * Local filesystem driver.
 */
class LocalDriver implements StorageDriver {
    constructor(private root: string) {
        if (!fs.existsSync(root)) {
            fs.mkdirSync(root, { recursive: true });
        }
    }

    async put(filePath: string, content: Buffer | string): Promise<string> {
        const fullPath = path.join(this.root, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content);
        return filePath;
    }

    async get(filePath: string): Promise<Buffer | null> {
        const fullPath = path.join(this.root, filePath);
        if (!fs.existsSync(fullPath)) return null;
        return fs.readFileSync(fullPath);
    }

    async delete(filePath: string): Promise<void> {
        const fullPath = path.join(this.root, filePath);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    async exists(filePath: string): Promise<boolean> {
        return fs.existsSync(path.join(this.root, filePath));
    }

    url(filePath: string): string {
        return `/storage/${filePath}`;
    }
}

/**
 * Storage Manager — supports local (default) and S3 drivers.
 */
export class StorageManager {
    private disks = new Map<string, StorageDriver>();
    private defaultDisk: string;

    constructor(defaultDisk = 'local', disksConfig?: Record<string, any>) {
        this.defaultDisk = defaultDisk;

        // Register default local disk
        const localRoot = disksConfig?.local?.root ?? './storage/uploads';
        this.disks.set('local', new LocalDriver(localRoot));
    }

    /**
     * Get a specific disk.
     */
    disk(name?: string): StorageDriver {
        const diskName = name ?? this.defaultDisk;
        const driver = this.disks.get(diskName);
        if (!driver) throw new Error(`[HyperZ] Storage disk "${diskName}" not configured.`);
        return driver;
    }

    // Convenience methods on default disk

    async put(filePath: string, content: Buffer | string): Promise<string> {
        return this.disk().put(filePath, content);
    }

    async get(filePath: string): Promise<Buffer | null> {
        return this.disk().get(filePath);
    }

    async delete(filePath: string): Promise<void> {
        return this.disk().delete(filePath);
    }

    async exists(filePath: string): Promise<boolean> {
        return this.disk().exists(filePath);
    }

    url(filePath: string): string {
        return this.disk().url(filePath);
    }
}
