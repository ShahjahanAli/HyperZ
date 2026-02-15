import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import { HyperZRouter } from '../http/Router.js';

describe('Router', () => {
    let router: HyperZRouter;

    beforeEach(() => {
        router = new HyperZRouter();
    });

    it('can register GET routes', () => {
        router.get('/test', (req, res) => res.send('ok'));
        const routes = router.getRoutes();
        expect(routes.length).toBe(1);
        expect(routes[0].method).toBe('GET');
        expect(routes[0].path).toBe('/test');
    });

    it('supports route groups and prefixes', () => {
        router.group({ prefix: '/api' }, (r) => {
            r.get('/users', (req, res) => res.send('users'));
        });

        const routes = router.getRoutes();
        expect(routes[0].fullPath).toBe('/api/users');
    });

    it('can name routes', () => {
        router.get('/named', () => { }).name('my-route');
        expect(router.route('my-route')).toBe('/named');
    });

    it('supports parameter constraints with "where"', () => {
        // This is hard to test without a full request, but we can check if it registers the param
        const spy = vi.spyOn((router as any).expressRouter, 'param');
        router.get('/user/:id', () => { }).where('id', /^\d+$/);
        expect(spy).toHaveBeenCalledWith('id', expect.any(Function));
    });

    it('supports redirects', () => {
        const spy = vi.spyOn((router as any).expressRouter, 'all');
        router.redirect('/old', '/new');
        expect(spy).toHaveBeenCalledWith('/old', expect.any(Function));
    });

    it('wraps handlers with asyncHandler', async () => {
        const routes = router.get('/async-fail', async () => {
            throw new Error('async error');
        }).getRoutes();

        const handler = (routes[0].handler as any[])[0];
        const next = vi.fn();

        // Call the wrapped handler
        await handler({}, {}, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
