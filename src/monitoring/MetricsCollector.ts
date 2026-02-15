// ──────────────────────────────────────────────────────────────
// HyperZ — Metrics Collector
//
// Express middleware that records per-request metrics:
// response time, status codes, method, path.
// ──────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction, RequestHandler } from 'express';

interface RequestMetric {
    method: string;
    path: string;
    statusCode: number;
    responseTimeMs: number;
    timestamp: number;
}

interface MetricsSnapshot {
    totalRequests: number;
    requestsPerSecond: number;
    avgResponseTimeMs: number;
    p95ResponseTimeMs: number;
    p99ResponseTimeMs: number;
    statusCodes: Record<string, number>;
    methodCounts: Record<string, number>;
    topEndpoints: Array<{ path: string; count: number; avgMs: number }>;
    errorRate: number;
}

// Circular buffer for last N metrics (1 hour of data at ~500 req/s = capped)
const MAX_HISTORY = 50_000;
const metrics: RequestMetric[] = [];
let totalRequests = 0;

/**
 * Express middleware — records response time and status code.
 */
export function metricsMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        // Skip internal paths
        if (req.path.startsWith('/api/_admin') || req.path.startsWith('/api/docs') || req.path.startsWith('/api/playground')) {
            return next();
        }

        const start = process.hrtime.bigint();

        res.on('finish', () => {
            const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000; // ms
            const metric: RequestMetric = {
                method: req.method,
                path: req.route?.path || req.path,
                statusCode: res.statusCode,
                responseTimeMs: Math.round(elapsed * 100) / 100,
                timestamp: Date.now(),
            };
            metrics.push(metric);
            totalRequests++;
            if (metrics.length > MAX_HISTORY) metrics.shift();
        });

        next();
    };
}

/**
 * Get a snapshot of current metrics for the dashboard.
 */
export function getMetricsSnapshot(): MetricsSnapshot {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    const recentMetrics = metrics.filter((m) => m.timestamp >= oneMinuteAgo);
    const responseTimes = recentMetrics.map((m) => m.responseTimeMs).sort((a, b) => a - b);

    // Status code distribution
    const statusCodes: Record<string, number> = {};
    for (const m of recentMetrics) {
        const bucket = `${Math.floor(m.statusCode / 100)}xx`;
        statusCodes[bucket] = (statusCodes[bucket] || 0) + 1;
    }

    // Method counts
    const methodCounts: Record<string, number> = {};
    for (const m of recentMetrics) {
        methodCounts[m.method] = (methodCounts[m.method] || 0) + 1;
    }

    // Top endpoints
    const endpointMap = new Map<string, { count: number; totalMs: number }>();
    for (const m of recentMetrics) {
        const key = `${m.method} ${m.path}`;
        const existing = endpointMap.get(key) || { count: 0, totalMs: 0 };
        existing.count++;
        existing.totalMs += m.responseTimeMs;
        endpointMap.set(key, existing);
    }
    const topEndpoints = Array.from(endpointMap.entries())
        .map(([path, data]) => ({ path, count: data.count, avgMs: Math.round((data.totalMs / data.count) * 100) / 100 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Calculate percentiles
    const p = (arr: number[], pct: number) => arr[Math.ceil((pct / 100) * arr.length) - 1] || 0;

    const errorCount = recentMetrics.filter((m) => m.statusCode >= 400).length;

    return {
        totalRequests,
        requestsPerSecond: Math.round((recentMetrics.length / 60) * 100) / 100,
        avgResponseTimeMs: responseTimes.length ? Math.round((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) * 100) / 100 : 0,
        p95ResponseTimeMs: Math.round(p(responseTimes, 95) * 100) / 100,
        p99ResponseTimeMs: Math.round(p(responseTimes, 99) * 100) / 100,
        statusCodes,
        methodCounts,
        topEndpoints,
        errorRate: recentMetrics.length ? Math.round((errorCount / recentMetrics.length) * 10000) / 100 : 0,
    };
}

/**
 * Get raw time-series data for charts (last 60 data points, 1 per second).
 */
export function getTimeSeries(): Array<{ timestamp: number; reqCount: number; avgMs: number; errorCount: number }> {
    const now = Date.now();
    const series: Array<{ timestamp: number; reqCount: number; avgMs: number; errorCount: number }> = [];

    for (let i = 59; i >= 0; i--) {
        const start = now - (i + 1) * 1000;
        const end = now - i * 1000;
        const bucket = metrics.filter((m) => m.timestamp >= start && m.timestamp < end);
        const reqCount = bucket.length;
        const avgMs = reqCount ? Math.round((bucket.reduce((a, b) => a + b.responseTimeMs, 0) / reqCount) * 100) / 100 : 0;
        const errorCount = bucket.filter((m) => m.statusCode >= 400).length;
        series.push({ timestamp: Math.round(start / 1000), reqCount, avgMs, errorCount });
    }

    return series;
}
