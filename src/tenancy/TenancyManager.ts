import type { Request, Response, NextFunction } from 'express';
import { Logger } from '../logging/Logger.js';

export interface Tenant {
    id: string;
    domain: string;
    name: string;
    config: Record<string, any>;
}

export class TenancyManager {
    private tenants = new Map<string, Tenant>();

    /**
     * Middleware to identify tenant from subdomain.
     */
    middleware() {
        return async (req: any, res: Response, next: NextFunction) => {
            const host = req.headers.host || '';
            const subdomain = host.split('.')[0];

            // In a real app, this would query a central DB
            const tenant = await this.resolveTenant(subdomain);

            if (!tenant && subdomain !== 'www' && subdomain !== 'app') {
                return res.status(404).json({
                    success: false,
                    message: `Tenant "${subdomain}" not found.`
                });
            }

            req.tenant = tenant;
            Logger.debug(`[Tenancy] Resolved tenant: ${tenant?.name || 'Central'}`);
            next();
        };
    }

    /**
     * Resolve tenant by subdomain.
     */
    async resolveTenant(subdomain: string): Promise<Tenant | null> {
        // Mock resolution for now
        if (subdomain === 'acme' || subdomain === 'test') {
            return {
                id: `id_${subdomain}`,
                domain: `${subdomain}.hyperz.io`,
                name: subdomain.toUpperCase(),
                config: {
                    ai_model: 'gpt-4',
                    quota: 1000
                }
            };
        }
        return null;
    }
}
