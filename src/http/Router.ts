// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Router
// Laravel-style route groups, named routes, resource routing
// ──────────────────────────────────────────────────────────────

import { Router as ExpressRouter, type RequestHandler, type Express, type Request, type Response, type NextFunction } from 'express';
import { Logger } from '../logging/Logger.js';

/**
 * Wrap an async route handler so rejected promises are forwarded
 * to Express error middleware automatically.
 */
function asyncHandler(fn: RequestHandler): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = fn(req, res, next);
        if (result && typeof (result as any).catch === 'function') {
            (result as any).catch(next);
        }
    };
}

export interface RouteDefinition {
    method: string;
    path: string;
    fullPath: string;
    name?: string;
    handler: RequestHandler | RequestHandler[];
    middleware: RequestHandler[];
}

interface GroupOptions {
    prefix?: string;
    middleware?: RequestHandler[];
}

export class HyperZRouter {
    private expressRouter: ExpressRouter;
    private routes: RouteDefinition[] = [];
    private namedRoutes = new Map<string, RouteDefinition>();
    private currentPrefix = '';
    private currentMiddleware: RequestHandler[] = [];
    private paramConstraints = new Map<string, RegExp>();

    constructor() {
        this.expressRouter = ExpressRouter();
    }

    // ── HTTP Methods ──────────────────────────────────────────

    get(path: string, ...handlers: RequestHandler[]): this {
        return this.addRoute('GET', path, handlers);
    }

    post(path: string, ...handlers: RequestHandler[]): this {
        return this.addRoute('POST', path, handlers);
    }

    put(path: string, ...handlers: RequestHandler[]): this {
        return this.addRoute('PUT', path, handlers);
    }

    patch(path: string, ...handlers: RequestHandler[]): this {
        return this.addRoute('PATCH', path, handlers);
    }

    delete(path: string, ...handlers: RequestHandler[]): this {
        return this.addRoute('DELETE', path, handlers);
    }

    /**
     * Define an AI-aware route.
     * Automatically applies AI usage tracking and RAG context if applicable.
     */
    ai(path: string, ...handlers: RequestHandler[]): this {
        // In v2, this would automatically inject AI metering and RAG middleware
        // For now, we simulate by adding an internal AI middleware
        return this.addRoute('POST', path, [
            (req: any, res, next) => {
                Logger.info(`[AI-Route] Handling AI request at ${path}`);
                next();
            },
            ...handlers
        ]);
    }

    options(path: string, ...handlers: RequestHandler[]): this {
        return this.addRoute('OPTIONS', path, handlers);
    }

    // ── Route Groups ──────────────────────────────────────────

    group(options: GroupOptions, callback: (router: HyperZRouter) => void): this {
        const prevPrefix = this.currentPrefix;
        const prevMiddleware = [...this.currentMiddleware];

        this.currentPrefix = this.currentPrefix + (options.prefix ?? '');
        if (options.middleware) {
            this.currentMiddleware.push(...options.middleware);
        }

        callback(this);

        this.currentPrefix = prevPrefix;
        this.currentMiddleware = prevMiddleware;

        return this;
    }

    // ── Named Routes ──────────────────────────────────────────

    name(routeName: string): this {
        const lastRoute = this.routes[this.routes.length - 1];
        if (lastRoute) {
            lastRoute.name = routeName;
            this.namedRoutes.set(routeName, lastRoute);
        }
        return this;
    }

    /**
     * Generate URL for a named route.
     */
    route(name: string, params: Record<string, string | number> = {}): string {
        const def = this.namedRoutes.get(name);
        if (!def) throw new Error(`[HyperZ] Route "${name}" not found.`);

        let url = def.fullPath;
        for (const [key, value] of Object.entries(params)) {
            url = url.replace(`:${key}`, String(value));
        }
        return url;
    }

    // ── Resource Routes (CRUD) ────────────────────────────────

    resource(path: string, controller: any): this {
        const basePath = this.currentPrefix + path;

        if (controller.index) this.addRoute('GET', path, [controller.index.bind(controller)]);
        if (controller.show) this.addRoute('GET', `${path}/:id`, [controller.show.bind(controller)]);
        if (controller.store) this.addRoute('POST', path, [controller.store.bind(controller)]);
        if (controller.update) this.addRoute('PUT', `${path}/:id`, [controller.update.bind(controller)]);
        if (controller.destroy) this.addRoute('DELETE', `${path}/:id`, [controller.destroy.bind(controller)]);

        return this;
    }

    // ── API Resource Routes (without create/edit forms) ───────

    apiResource(path: string, controller: any): this {
        return this.resource(path, controller);
    }

    // ── Middleware helper ─────────────────────────────────────

    middleware(...handlers: RequestHandler[]): this {
        this.currentMiddleware.push(...handlers);
        return this;
    }

    // ── Route Parameter Constraints ──────────────────────────

    /**
     * Add a regex constraint on a route parameter.
     * @example router.get('/users/:id', handler).where('id', /^\d+$/);
     */
    where(param: string, pattern: RegExp): this {
        this.paramConstraints.set(param, pattern);

        // Apply to the Express router param validation
        this.expressRouter.param(param, (req: Request, res: Response, next: NextFunction, value: string) => {
            if (pattern.test(value)) {
                next();
            } else {
                res.status(404).json({
                    success: false,
                    status: 404,
                    message: `Route parameter "${param}" does not match constraint`,
                });
            }
        });

        return this;
    }

    // ── Redirect Route ────────────────────────────────────────

    /**
     * Register a redirect route.
     * @example router.redirect('/old-path', '/new-path', 301);
     */
    redirect(from: string, to: string, statusCode = 302): this {
        const fullFrom = this.currentPrefix + from;
        this.expressRouter.all(fullFrom, (_req: Request, res: Response) => {
            res.redirect(statusCode, to);
        });
        return this;
    }

    // ── Fallback Route ────────────────────────────────────────

    /**
     * Register a fallback handler for unmatched routes within this router.
     * @example router.fallback((req, res) => res.status(404).json({ message: 'Not found' }));
     */
    fallback(handler: RequestHandler): this {
        this.expressRouter.use(asyncHandler(handler));
        return this;
    }

    // ── Internals ─────────────────────────────────────────────

    private addRoute(method: string, path: string, handlers: RequestHandler[]): this {
        const fullPath = this.currentPrefix + path;
        const allMiddleware = [...this.currentMiddleware];

        // Wrap all handlers with asyncHandler for automatic error forwarding
        const wrappedHandlers = handlers.map(h => asyncHandler(h));

        const def: RouteDefinition = {
            method,
            path,
            fullPath,
            handler: wrappedHandlers,
            middleware: allMiddleware,
        };

        this.routes.push(def);

        // Register on the Express router
        const expressMethod = method.toLowerCase() as keyof ExpressRouter;
        (this.expressRouter as any)[expressMethod](fullPath, ...allMiddleware, ...wrappedHandlers);

        return this;
    }

    /**
     * Get all registered route definitions (for route:list command).
     */
    getRoutes(): RouteDefinition[] {
        return [...this.routes];
    }

    /**
     * Mount onto an Express app.
     */
    mount(app: Express, prefix = ''): void {
        app.use(prefix, this.expressRouter);
    }

    /**
     * Get the underlying Express router.
     */
    getExpressRouter(): ExpressRouter {
        return this.expressRouter;
    }
}

export { asyncHandler };
