'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────
interface MonitoringData {
    metrics: {
        totalRequests: number;
        requestsPerSecond: number;
        avgResponseTimeMs: number;
        p95ResponseTimeMs: number;
        p99ResponseTimeMs: number;
        statusCodes: Record<string, number>;
        methodCounts: Record<string, number>;
        topEndpoints: Array<{ path: string; count: number; avgMs: number }>;
        errorRate: number;
    };
    system: {
        uptime: number;
        nodeVersion: string;
        platform: string;
        cpu: { usage: number; cores: number; model: string };
        memory: {
            totalMB: number; usedMB: number; freeMB: number; usagePercent: number;
            heapUsedMB: number; heapTotalMB: number; rssMB: number; externalMB: number;
        };
        eventLoopLagMs: number;
        activeHandles: number;
        activeRequests: number;
        v8HeapStats: { totalHeapSize: number; usedHeapSize: number; heapSizeLimit: number };
    };
    timeSeries: Array<{ timestamp: number; reqCount: number; avgMs: number; errorCount: number }>;
}

// ── Helpers ────────────────────────────────────────────────────
function formatUptime(s: number): string {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s % 60}s`;
}

function GaugeRing({ value, max, label, color, unit }: { value: number; max: number; label: string; color: string; unit: string }) {
    const pct = Math.min(100, (value / max) * 100);
    const r = 42;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <div className="flex flex-col items-center">
            <svg width="100" height="100" viewBox="0 0 110 110" className="drop-shadow-sm">
                <circle cx="55" cy="55" r={r} stroke="var(--border)" strokeWidth="6" fill="none" opacity="0.3" />
                <circle cx="55" cy="55" r={r} stroke={color} strokeWidth="6" fill="none"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    transform="rotate(-90 55 55)" className="transition-all duration-1000 ease-out" />
                <text x="55" y="52" textAnchor="middle" fill="var(--text)" fontSize="20" fontWeight="900" className="font-mono italic">{Math.round(pct)}%</text>
                <text x="55" y="70" textAnchor="middle" fill="var(--text-muted)" fontSize="9" className="font-mono uppercase font-black opacity-60 tracking-tighter">{value}{unit}</text>
            </svg>
            <div className="text-[9px] text-[var(--text-muted)] mt-3 font-tactical uppercase tracking-widest font-black italic">{label}</div>
        </div>
    );
}

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
    const max = Math.max(...data, 1);
    const w = 400;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - (v / max) * (height - 8)}`).join(' ');
    return (
        <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="block drop-shadow-sm">
            <defs>
                <linearGradient id={`grad-${color.replace(/[^a-z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M ${points} L ${w},${height} L 0,${height} Z`} fill={`url(#grad-${color.replace(/[^a-z]/g, '')})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
}

// ── Main Component ─────────────────────────────────────────────
export default function MonitoringPage() {
    const [data, setData] = useState<MonitoringData | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await adminFetch('/api/_admin/monitoring');
            const json = await res.json();
            setData(json);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        if (!autoRefresh) return;
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [fetchData, autoRefresh]);

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>📊 LIVE_SYSTEM_METRICS</h1>
                <span className="topbar-meta">STATUS: {autoRefresh ? 'STREAMING' : 'PAUSED'} • UPTIME: {data ? formatUptime(data.system.uptime) : '…'}</span>
            </div>

            <div className="page-content">
                {!data && loading ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <div className="loading" style={{ fontSize: '40px' }}>⚡</div>
                        <p style={{ fontFamily: 'var(--mono)', marginTop: 16, color: 'var(--text-muted)' }}>INITIALIZING_METRICS_PIPELINE…</p>
                    </div>
                ) : data && (
                    <div className="page-transition">
                        {/* Summary Stats */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">TOTAL_REQUESTS</div>
                                <div className="stat-value">{data.metrics.totalRequests.toLocaleString()}</div>
                                <div className="stat-sub">AGGREGATE_FLOW</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">REQ_PER_SECOND</div>
                                <div className="stat-value">{data.metrics.requestsPerSecond}</div>
                                <div className="stat-sub">CURRENT_THROUGHPUT</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">AVG_LATENCY</div>
                                <div className="stat-value">{data.metrics.avgResponseTimeMs}ms</div>
                                <div className="stat-sub">P95: {data.metrics.p95ResponseTimeMs}ms</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">ERROR_RATE</div>
                                <div className="stat-value" style={{ color: data.metrics.errorRate > 5 ? 'var(--red)' : 'var(--green)' }}>
                                    {data.metrics.errorRate}%
                                </div>
                                <div className="stat-sub">STABILITY_INDEX</div>
                            </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            <div className="card lg:col-span-2">
                                <div className="card-header">// RESOURCE_UTILIZATION</div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-10 py-4">
                                    <GaugeRing value={data.system.cpu.usage} max={100} label="CPU_LOAD" color="var(--accent)" unit="%" />
                                    <GaugeRing value={data.system.memory.usagePercent} max={100} label="RAM_PHYSICAL" color="var(--accent-secondary)" unit="%" />
                                    <GaugeRing value={data.system.memory.heapUsedMB} max={data.system.memory.heapTotalMB} label="V8_HEAP_ALLOC" color="var(--green)" unit="MB" />
                                    <GaugeRing value={data.system.eventLoopLagMs} max={100} label="LOOP_LAG_LATENCY" color={data.system.eventLoopLagMs > 50 ? 'var(--red)' : 'var(--blue)'} unit="ms" />
                                </div>
                            </div>

                            <div className="card lg:col-span-3">
                                <div className="card-header">// TELEMETRY_TIME_SERIES</div>
                                <div className="space-y-10">
                                    <div>
                                        <div className="text-[9px] text-[var(--accent)] mb-3 font-tactical uppercase tracking-widest font-black italic">THROUGHPUT_SIGNAL_60S</div>
                                        <Sparkline data={data.timeSeries.map(t => t.reqCount)} color="var(--accent)" height={70} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] text-[var(--green)] mb-3 font-tactical uppercase tracking-widest font-black italic">LATENCY_STABILITY_60S</div>
                                        <Sparkline data={data.timeSeries.map(t => t.avgMs)} color="var(--green)" height={70} />
                                    </div>
                                    <div>
                                        <div className="text-[9px] text-[var(--red)] mb-3 font-tactical uppercase tracking-widest font-black italic">ERROR_DETECTION_PULSE</div>
                                        <Sparkline data={data.timeSeries.map(t => t.errorCount)} color="var(--red)" height={50} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Endpoints Table */}
                        <div className="card">
                            <div className="card-header">// TOP_TRAFFIC_ENDPOINTS_60S</div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr><th>PATH</th><th>COUNT</th><th>AVG_LATENCY</th></tr>
                                    </thead>
                                    <tbody>
                                        {data.metrics.topEndpoints.map((ep, i) => (
                                            <tr key={i}>
                                                <td style={{ fontFamily: 'var(--mono)', color: 'var(--accent-secondary)' }}>{ep.path}</td>
                                                <td>{ep.count} req</td>
                                                <td style={{ color: 'var(--yellow)' }}>{ep.avgMs}ms</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* System Metadata */}
                        <div className="card">
                            <div className="card-header">// NODE_SYSTEM_MANIFEST</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {[
                                    { k: 'PLATFORM', v: data.system.platform },
                                    { k: 'CPU_MODEL', v: data.system.cpu.model },
                                    { k: 'NODE_VERSION', v: data.system.nodeVersion },
                                    { k: 'V8_HEAP_LIMIT', v: `${data.system.v8HeapStats.heapSizeLimit} MB` },
                                    { k: 'ACTIVE_HANDLES', v: data.system.activeHandles },
                                    { k: 'RSS_MEMORY', v: `${data.system.memory.rssMB} MB` },
                                ].map(item => (
                                    <div key={item.k} className="bg-slate-500/5 border border-[var(--border)] p-4 rounded-sm group hover:border-[var(--accent-secondary)] transition-all">
                                        <div className="text-[8px] text-[var(--accent-secondary)] font-tactical font-black uppercase tracking-widest mb-2 opacity-70 italic">{item.k}</div>
                                        <div className="text-[11px] text-[var(--text)] font-mono font-bold truncate italic" title={String(item.v)}>{item.v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
