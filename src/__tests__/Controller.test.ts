// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Controller Base Class Tests
// ──────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Controller } from '../http/Controller.js';

// Concrete subclass for testing the abstract Controller
class TestController extends Controller {
    testSuccess(res: any, data: any, message?: string) {
        this.success(res, data, message);
    }
    testCreated(res: any, data: any, message?: string) {
        this.created(res, data, message);
    }
    testNoContent(res: any) {
        this.noContent(res);
    }
    testPaginate(res: any, data: any[], total: number, page: number, perPage: number) {
        this.paginate(res, data, total, page, perPage);
    }
    testError(res: any, message: string, status?: number) {
        this.error(res, message, status);
    }
}

function mockResponse() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res;
}

describe('Controller', () => {
    let ctrl: TestController;

    beforeEach(() => {
        ctrl = new TestController();
    });

    it('success() sends 200 JSON response', () => {
        const res = mockResponse();
        ctrl.testSuccess(res, { id: 1 }, 'Done');

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            status: 200,
            message: 'Done',
            data: { id: 1 },
        });
    });

    it('success() defaults message to "Success"', () => {
        const res = mockResponse();
        ctrl.testSuccess(res, []);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Success' }));
    });

    it('created() sends 201 response', () => {
        const res = mockResponse();
        ctrl.testCreated(res, { name: 'New' });

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            status: 201,
            message: 'Resource created',
        }));
    });

    it('noContent() sends 204 with empty body', () => {
        const res = mockResponse();
        ctrl.testNoContent(res);

        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('paginate() sends pagination metadata', () => {
        const res = mockResponse();
        ctrl.testPaginate(res, [1, 2, 3], 10, 1, 3);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: [1, 2, 3],
            pagination: {
                total: 10,
                page: 1,
                perPage: 3,
                totalPages: 4,
                hasNextPage: true,
                hasPrevPage: false,
            },
        }));
    });

    it('paginate() hasPrevPage is true on page > 1', () => {
        const res = mockResponse();
        ctrl.testPaginate(res, [], 10, 2, 5);

        const callArg = res.json.mock.calls[0][0];
        expect(callArg.pagination.hasPrevPage).toBe(true);
    });

    it('paginate() hasNextPage is false on last page', () => {
        const res = mockResponse();
        ctrl.testPaginate(res, [], 10, 2, 5);

        const callArg = res.json.mock.calls[0][0];
        expect(callArg.pagination.hasNextPage).toBe(false);
    });

    it('error() sends error JSON with custom status', () => {
        const res = mockResponse();
        ctrl.testError(res, 'Not found', 404);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            status: 404,
            message: 'Not found',
        });
    });

    it('error() defaults to 400', () => {
        const res = mockResponse();
        ctrl.testError(res, 'Bad request');
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
