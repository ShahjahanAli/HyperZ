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
        <div style={{ textAlign: 'center' }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={r} stroke="var(--border)" strokeWidth="8" fill="none" />
                <circle cx="55" cy="55" r={r} stroke={color} strokeWidth="8" fill="none"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    transform="rotate(-90 55 55)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                <text x="55" y="50" textAnchor="middle" fill="var(--text)" fontSize="18" fontWeight="700" fontFamily="var(--mono)">{Math.round(pct)}%</text>
                <text x="55" y="68" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--mono)">{value}{unit}</text>
            </svg>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 4, fontFamily: 'var(--tactical)' }}>{label}</div>
        </div>
    );
}

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
    const max = Math.max(...data, 1);
    const w = 400; // Increased width for better responsiveness
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - (v / max) * (height - 4)}`).join(' ');
    return (
        <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
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
                <h1 style={{ fontFamily: 'var(--tactical)', fontSize: '14px', letterSpacing: '2px' }}>📊 LIVE_SYSTEM_METRICS</h1>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.50fr', gap: 24, marginBottom: 24 }} className="responsive-grid">
                            <div className="card">
                                <div className="card-header">// RESOURCE_UTILIZATION</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 12 }}>
                                    <GaugeRing value={data.system.cpu.usage} max={100} label="CPU_USAGE" color="var(--accent)" unit="%" />
                                    <GaugeRing value={data.system.memory.usagePercent} max={100} label="RAM_USAGE" color="var(--accent-secondary)" unit="%" />
                                    <GaugeRing value={data.system.memory.heapUsedMB} max={data.system.memory.heapTotalMB} label="V8_HEAP" color="var(--green)" unit="MB" />
                                    <GaugeRing value={data.system.eventLoopLagMs} max={100} label="LOOP_LAG" color={data.system.eventLoopLagMs > 50 ? 'var(--red)' : 'var(--blue)'} unit="ms" />
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">// TELEMETRY_TIME_SERIES</div>
                                <div style={{ padding: '0 12px' }}>
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--tactical)' }}>THROUGHPUT_60S</div>
                                        <Sparkline data={data.timeSeries.map(t => t.reqCount)} color="var(--accent)" height={60} />
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--tactical)' }}>LATENCY_60S</div>
                                        <Sparkline data={data.timeSeries.map(t => t.avgMs)} color="var(--green)" height={60} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--tactical)' }}>ERRORS_60S</div>
                                        <Sparkline data={data.timeSeries.map(t => t.errorCount)} color="var(--red)" height={40} />
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
                        <div className="card" style={{ marginTop: 24 }}>
                            <div className="card-header">// NODE_SYSTEM_MANIFEST</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                {[
                                    { k: 'PLATFORM', v: data.system.platform },
                                    { k: 'CPU_MODEL', v: data.system.cpu.model },
                                    { k: 'NODE_VERSION', v: data.system.nodeVersion },
                                    { k: 'V8_HEAP_LIMIT', v: `${data.system.v8HeapStats.heapSizeLimit} MB` },
                                    { k: 'ACTIVE_HANDLES', v: data.system.activeHandles },
                                    { k: 'RSS_MEMORY', v: `${data.system.memory.rssMB} MB` },
                                ].map(item => (
                                    <div key={item.k} style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4 }}>
                                        <div style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'var(--tactical)' }}>{item.k}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text)', fontFamily: 'var(--mono)', marginTop: 4 }}>{item.v}</div>
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
