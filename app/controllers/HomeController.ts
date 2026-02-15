import { Controller } from '../../src/http/Controller.js';
import type { Request, Response } from 'express';

export class HomeController extends Controller {
    /**
     * Welcome endpoint.
     * GET /api
     */
    async index(req: Request, res: Response): Promise<void> {
        this.success(res, {
            framework: 'HyperZ',
            version: '1.0.0',
            description: 'A Modern, Laravel-inspired, Enterprise-grade Framework built on ExpressJS',
            timestamp: new Date().toISOString(),
        }, 'Welcome to HyperZ! ⚡');
    }

    /**
     * Health check endpoint.
     * GET /api/health
     */
    async health(req: Request, res: Response): Promise<void> {
        this.success(res, {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
        }, 'System is healthy');
    }
}
