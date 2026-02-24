import { Request, Response } from 'express';
import { Database } from '../../database/Database.js';

export class HealthController {
    /**
     * Perform a system health check.
     */
    static async check(req: Request, res: Response) {
        const checks: Record<string, any> = {
            uptime: Math.floor(process.uptime()),
            timestamp: Date.now(),
            status: 'UP'
        };

        let overallStatus = 200;

        // Check TypeORM
        try {
            const ds = Database.getDataSource();
            if (ds.isInitialized) {
                await ds.query('SELECT 1');
                checks.typeorm = 'UP';
            } else {
                checks.typeorm = 'NOT_INITIALIZED';
            }
        } catch (err: any) {
            checks.typeorm = 'DOWN';
            checks.typeorm_error = err.message;
            overallStatus = 503;
            checks.status = 'DEGRADED';
        }

        // Memory Usage
        const memory = process.memoryUsage();
        checks.memory = {
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
        };

        return res.status(overallStatus).json(checks);
    }
}
