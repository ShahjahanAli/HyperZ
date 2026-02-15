// ──────────────────────────────────────────────────────────────
// HyperZ Framework — S3 Storage Driver (AWS SDK v3)
// ──────────────────────────────────────────────────────────────

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Logger } from '../logging/Logger.js';

interface StorageDriver {
    put(filePath: string, content: Buffer | string): Promise<string>;
    get(filePath: string): Promise<Buffer | null>;
    delete(filePath: string): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    url(filePath: string): string;
}

interface S3Config {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    cdnUrl?: string;
}

export class S3Driver implements StorageDriver {
    private client: S3Client;
    private bucket: string;
    private cdnUrl?: string;
    private region: string;

    constructor(config: S3Config) {
        this.bucket = config.bucket;
        this.region = config.region;
        this.cdnUrl = config.cdnUrl;

        this.client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            ...(config.endpoint ? { endpoint: config.endpoint } : {}),
        });
    }

    async put(filePath: string, content: Buffer | string): Promise<string> {
        const body = typeof content === 'string' ? Buffer.from(content) : content;

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
                Body: body,
            })
        );

        Logger.debug(`[Storage:S3] Uploaded: ${filePath}`);
        return filePath;
    }

    async get(filePath: string): Promise<Buffer | null> {
        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: filePath,
                })
            );

            if (!response.Body) return null;

            // Convert stream to buffer
            const chunks: Uint8Array[] = [];
            for await (const chunk of response.Body as any) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (err: any) {
            if (err.name === 'NoSuchKey') return null;
            throw err;
        }
    }

    async delete(filePath: string): Promise<void> {
        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
            })
        );
        Logger.debug(`[Storage:S3] Deleted: ${filePath}`);
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: filePath,
                })
            );
            return true;
        } catch {
            return false;
        }
    }

    url(filePath: string): string {
        if (this.cdnUrl) {
            return `${this.cdnUrl}/${filePath}`;
        }
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filePath}`;
    }
}
