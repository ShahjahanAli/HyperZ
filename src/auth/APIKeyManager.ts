import { Logger } from '../logging/Logger.js';
import { randomBytes } from 'node:crypto';

export interface APIKey {
    id: string;
    key: string;
    tenantId: string;
    name: string;
}

export class APIKeyManager {
    /**
     * Generate a new API key for a tenant.
     */
    async generateKey(tenantId: string, name: string): Promise<string> {
        const key = `hz_${randomBytes(24).toString('hex')}`;
        Logger.info(`[APIKey] Generated new key "${name}" for tenant ${tenantId}`);
        // Store in DB in real app
        return key;
    }

    /**
     * Validate an API key and return the associated tenant.
     */
    async validate(key: string): Promise<string | null> {
        // Mock validation
        if (key.startsWith('hz_')) {
            return 'acme'; // Return tenantId
        }
        return null;
    }
}
