// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Kernel Tests
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { Kernel } from '../core/Kernel.js';
import { Application } from '../core/Application.js';

describe('Kernel', () => {
    let app: Application;
    let kernel: Kernel;

    beforeEach(() => {
        app = new Application('/tmp/test-kernel');
        kernel = new Kernel(app);
    });

    it('bootstraps JSON and URL-encoded body parsers', () => {
        const useSpy = vi.spyOn(app.express, 'use');
        kernel.bootstrap();
        // express.json and urlencoded are registered
        expect(useSpy).toHaveBeenCalled();
    });

    it('registers route middleware in the container', () => {
        kernel.bootstrap();
        expect(app.container.has('middleware.route')).toBe(true);
    });

    it('pushMiddleware adds to global stack', () => {
        kernel.bootstrap();
        const useSpy = vi.spyOn(app.express, 'use');
        const handler = vi.fn();
        kernel.pushMiddleware(handler);
        expect(useSpy).toHaveBeenCalledWith(handler);
    });

    it('getRouteMiddleware returns undefined for unknown name', () => {
        kernel.bootstrap();
        expect(kernel.getRouteMiddleware('nonexistent')).toBeUndefined();
    });
});
