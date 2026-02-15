// ──────────────────────────────────────────────────────────────
// HyperZ — System Monitor
//
// Collects OS/process-level metrics: CPU usage, memory, uptime,
// event loop lag, and active handles.
// ──────────────────────────────────────────────────────────────

import * as os from 'node:os';
import * as v8 from 'node:v8';

interface SystemMetrics {
    uptime: number;
    nodeVersion: string;
    platform: string;
    cpu: {
        usage: number;          // 0-100
        cores: number;
        model: string;
    };
    memory: {
        totalMB: number;
        usedMB: number;
        freeMB: number;
        usagePercent: number;
        heapUsedMB: number;
        heapTotalMB: number;
        rssMB: number;
        externalMB: number;
    };
    eventLoopLagMs: number;
    activeHandles: number;
    activeRequests: number;
    v8HeapStats: {
        totalHeapSize: number;
        usedHeapSize: number;
        heapSizeLimit: number;
    };
}

let lastCpuUsage = process.cpuUsage();
let lastCpuTime = Date.now();

/**
 * Calculate CPU usage percentage since last call.
 */
function getCPUUsage(): number {
    const now = Date.now();
    const elapsed = (now - lastCpuTime) * 1000; // microseconds
    const usage = process.cpuUsage(lastCpuUsage);
    lastCpuUsage = process.cpuUsage();
    lastCpuTime = now;

    const totalUsage = usage.user + usage.system;
    return Math.min(100, Math.round((totalUsage / elapsed) * 100 * 100) / 100);
}

let eventLoopLag = 0;
// Measure event loop lag every second
setInterval(() => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
        eventLoopLag = Number(process.hrtime.bigint() - start) / 1_000_000; // ms
    });
}, 1000);

/**
 * Get current system metrics snapshot.
 */
export function getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();
    const heapStats = v8.getHeapStatistics();

    return {
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
        platform: `${os.type()} ${os.release()}`,
        cpu: {
            usage: getCPUUsage(),
            cores: cpus.length,
            model: cpus[0]?.model || 'Unknown',
        },
        memory: {
            totalMB: Math.round(totalMem / 1024 / 1024),
            usedMB: Math.round((totalMem - freeMem) / 1024 / 1024),
            freeMB: Math.round(freeMem / 1024 / 1024),
            usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 10000) / 100,
            heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(memUsage.rss / 1024 / 1024),
            externalMB: Math.round(memUsage.external / 1024 / 1024),
        },
        eventLoopLagMs: Math.round(eventLoopLag * 100) / 100,
        activeHandles: (process as any)._getActiveHandles?.()?.length || 0,
        activeRequests: (process as any)._getActiveRequests?.()?.length || 0,
        v8HeapStats: {
            totalHeapSize: Math.round(heapStats.total_heap_size / 1024 / 1024),
            usedHeapSize: Math.round(heapStats.used_heap_size / 1024 / 1024),
            heapSizeLimit: Math.round(heapStats.heap_size_limit / 1024 / 1024),
        },
    };
}
