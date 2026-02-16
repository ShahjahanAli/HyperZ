// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Application Kernel
// ──────────────────────────────────────────────────────────────

import express, { type Express } from 'express';
import * as path from 'node:path';
import { ServiceContainer } from './ServiceContainer.js';
import { ServiceProvider } from './ServiceProvider.js';
import { ConfigManager } from '../config/index.js';
import { Logger } from '../logging/Logger.js';

export class Application {
    /** IoC Service Container */
    public readonly container: ServiceContainer;

    /** Express instance */
    public readonly express: Express;

    /** Config manager */
    public readonly config: ConfigManager;

    /** Root path of the application */
    public readonly basePath: string;

    /** Shutdown callback hooks */
    private terminatingCallbacks: (() => Promise<void> | void)[] = [];

    /** Shutdown timeout (ms) */
    private shutdownTimeout = 10000;

    /**
     * Register a callback to run during graceful shutdown.
     * @example
     * app.terminating(async () => {
     *     await Database.disconnect();
     * });
     */
    terminating(callback: () => Promise<void> | void): this {
        this.terminatingCallbacks.push(callback);
        return this;
    }

    /**
     * Set the maximum time (ms) to wait for shutdown callbacks.
     */
    setShutdownTimeout(ms: number): this {
        this.shutdownTimeout = ms;
        return this;
    }

    /**
     * Run all terminating callbacks and exit.
     */
    async shutdown(code = 0): Promise<void> {
        Logger.info('🛑 Graceful shutdown initiated...');

        const timeout = setTimeout(() => {
            Logger.warn('Shutdown timed out, forcing exit...');
            process.exit(1);
        }, this.shutdownTimeout);

        try {
            for (const callback of this.terminatingCallbacks) {
                await callback();
            }
        } catch (err: any) {
            Logger.error('Error during shutdown', { error: err.message });
        } finally {
            clearTimeout(timeout);
            Logger.info('[+] Shutdown complete');
            process.exit(code);
        }
    }


    /** Registered providers */
    private providers: ServiceProvider[] = [];

    /** Track whether the app has booted */
    private booted = false;

    constructor(basePath?: string) {
        this.basePath = basePath ?? process.cwd();
        this.container = new ServiceContainer();
        this.express = express();
        this.config = new ConfigManager(this.basePath);

        // Register core instances
        this.container.instance('app', this);
        this.container.instance('express', this.express);
        this.container.instance('config', this.config);

        // Bind path helpers
        this.container.instance('path.base', this.basePath);
        this.container.instance('path.app', path.join(this.basePath, 'app'));
        this.container.instance('path.config', path.join(this.basePath, 'config'));
        this.container.instance('path.database', path.join(this.basePath, 'database'));
        this.container.instance('path.storage', path.join(this.basePath, 'storage'));
        this.container.instance('path.src', path.join(this.basePath, 'src'));
    }

    /**
     * Register a service provider.
     */
    register(provider: ServiceProvider | (new (app: Application) => ServiceProvider)): this {
        const instance =
            provider instanceof ServiceProvider ? provider : new provider(this);

        instance.register();
        this.providers.push(instance);
        return this;
    }

    /**
     * Boot all registered service providers.
     */
    async boot(): Promise<void> {
        if (this.booted) return;

        // Load environment + config files
        this.config.loadEnv();
        await this.config.loadConfigFiles();

        // Boot all providers
        for (const provider of this.providers) {
            try {
                if (typeof provider.boot !== 'function') {
                    Logger.error(`Provider ${provider.constructor.name} does not have a boot method`);
                }
                await provider.boot();
            } catch (err: any) {
                Logger.error(`Error booting provider ${provider.constructor.name}`, { error: err.message, stack: err.stack });
                throw err;
            }
        }

        this.booted = true;
        Logger.info('[+] HyperZ application booted successfully');
    }

    /**
     * Start listening on the configured port.
     */
    async listen(port?: number): Promise<void> {
        if (!this.booted) {
            await this.boot();
        }

        const listenPort = port ?? this.config.get<number>('app.port', 3000);

        this.express.listen(listenPort, () => {
            const appName = this.config.get<string>('app.name', 'HyperZ');
            const appEnv = this.config.get<string>('app.env', 'development');

            Logger.info(`[+] ${appName} server running on port ${listenPort} [${appEnv}]`);
            Logger.info(`   -> http://localhost:${listenPort}`);
        });

        // Graceful shutdown
        const shutdown = () => this.shutdown();

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }

    /**
     * Resolve a binding from the container.
     */
    make<T = any>(abstract: string | symbol): T {
        return this.container.make<T>(abstract);
    }

    /**
     * Get the application path.
     */
    appPath(...segments: string[]): string {
        return path.join(this.basePath, 'app', ...segments);
    }

    /**
     * Get the database path.
     */
    databasePath(...segments: string[]): string {
        return path.join(this.basePath, 'database', ...segments);
    }

    /**
     * Get the storage path.
     */
    storagePath(...segments: string[]): string {
        return path.join(this.basePath, 'storage', ...segments);
    }

    /**
     * Get the config path.
     */
    configPath(...segments: string[]): string {
        return path.join(this.basePath, 'config', ...segments);
    }
}
