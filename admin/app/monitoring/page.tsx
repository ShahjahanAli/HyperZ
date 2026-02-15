'use client';

import { useState, useEffect, useCallback } from 'react';
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
                <circle cx="55" cy="55" r={r} stroke="#1e293b" strokeWidth="8" fill="none" />
                <circle cx="55" cy="55" r={r} stroke={color} strokeWidth="8" fill="none"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                    transform="rotate(-90 55 55)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                <text x="55" y="50" textAnchor="middle" fill="#f1f5f9" fontSize="18" fontWeight="700">{Math.round(pct)}%</text>
                <text x="55" y="68" textAnchor="middle" fill="#94a3b8" fontSize="10">{value}{unit}</text>
            </svg>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 }}>{label}</div>
        </div>
    );
}

function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
    const max = Math.max(...data, 1);
    const w = 200;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - (v / max) * (height - 4)}`).join(' ');
    return (
        <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{ display: 'block' }}>
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
    );
}

function BarChart({ data, colors }: { data: Record<string, number>; colors: Record<string, string> }) {
    const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
    return (
        <div style={{ display: 'flex', gap: 4, height: 18, borderRadius: 9, overflow: 'hidden', background: '#1e293b' }}>
            {Object.entries(data).map(([k, v]) => (
                <div key={k} title={`${k}: ${v}`} style={{
                    width: `${(v / total) * 100}%`, background: colors[k] || '#6366f1',
                    minWidth: v > 0 ? 3 : 0, transition: 'width 0.5s ease',
                }} />
            ))}
        </div>
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

    if (loading || !data) {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                    <div>Loading monitoring data…</div>
                </div>
            </div>
        );
    }

    const { metrics, system, timeSeries } = data;
    const statusColors: Record<string, string> = { '2xx': '#22c55e', '3xx': '#3b82f6', '4xx': '#f59e0b', '5xx': '#ef4444' };
    const methodColors: Record<string, string> = { GET: '#3b82f6', POST: '#22c55e', PUT: '#f97316', PATCH: '#a855f7', DELETE: '#ef4444' };

    return (
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0, marginBottom: 4 }}>
                        📊 Real-time Monitoring
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                        Live server metrics · Auto-refresh {autoRefresh ? 'ON' : 'OFF'} · Uptime: {formatUptime(system.uptime)}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setAutoRefresh(!autoRefresh)} style={{
                        padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                        background: autoRefresh ? '#22c55e' : '#475569', color: '#fff',
                    }}>
                        {autoRefresh ? '⏸ Pause' : '▶ Resume'}
                    </button>
                    <button onClick={fetchData} style={{
                        padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', cursor: 'pointer',
                        background: 'transparent', color: '#94a3b8', fontSize: '0.8rem',
                    }}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Total Requests', value: metrics.totalRequests.toLocaleString(), icon: '📈', color: '#6366f1' },
                    { label: 'Req/sec', value: metrics.requestsPerSecond.toString(), icon: '⚡', color: '#3b82f6' },
                    { label: 'Avg Response', value: `${metrics.avgResponseTimeMs}ms`, icon: '⏱️', color: '#22c55e' },
                    { label: 'P95 Latency', value: `${metrics.p95ResponseTimeMs}ms`, icon: '📊', color: '#f59e0b' },
                    { label: 'Error Rate', value: `${metrics.errorRate}%`, icon: '⚠️', color: metrics.errorRate > 5 ? '#ef4444' : '#22c55e' },
                    { label: 'Node.js', value: system.nodeVersion, icon: '🟢', color: '#10b981' },
                ].map(item => (
                    <div key={item.label} style={{
                        background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 16px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</span>
                            <span>{item.icon}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                ))}
            </div>

            {/* Gauges + Time Series */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 16, marginBottom: 20 }}>
                {/* System Gauges */}
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>System Health</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <GaugeRing value={system.cpu.usage} max={100} label="CPU" color="#6366f1" unit="%" />
                        <GaugeRing value={system.memory.usagePercent} max={100} label="Memory" color="#3b82f6" unit="%" />
                        <GaugeRing value={system.memory.heapUsedMB} max={system.memory.heapTotalMB} label="V8 Heap" color="#22c55e" unit="MB" />
                        <GaugeRing value={system.eventLoopLagMs} max={100} label="Event Loop Lag" color={system.eventLoopLagMs > 50 ? '#ef4444' : '#10b981'} unit="ms" />
                    </div>
                </div>

                {/* Time Series Charts */}
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>Request Throughput (60s)</h3>
                    <Sparkline data={timeSeries.map(t => t.reqCount)} color="#6366f1" height={60} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: '0.65rem', color: '#475569' }}>60s ago</span>
                        <span style={{ fontSize: '0.65rem', color: '#475569' }}>Now</span>
                    </div>

                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8, marginTop: 16, fontWeight: 600 }}>Avg Response Time (60s)</h3>
                    <Sparkline data={timeSeries.map(t => t.avgMs)} color="#22c55e" height={60} />

                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8, marginTop: 16, fontWeight: 600 }}>Errors (60s)</h3>
                    <Sparkline data={timeSeries.map(t => t.errorCount)} color="#ef4444" height={40} />
                </div>
            </div>

            {/* Status Codes + Methods + Top Endpoints */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: 16 }}>
                {/* Status Codes */}
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>Status Code Distribution</h3>
                    <BarChart data={metrics.statusCodes} colors={statusColors} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                        {Object.entries(metrics.statusCodes).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[k] || '#6366f1' }} />
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{k}: {v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* HTTP Methods */}
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>HTTP Methods</h3>
                    {Object.entries(metrics.methodCounts).map(([method, count]) => (
                        <div key={method} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{
                                fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                background: `${methodColors[method] || '#6366f1'}22`, color: methodColors[method] || '#6366f1',
                            }}>{method}</span>
                            <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{count}</span>
                        </div>
                    ))}
                </div>

                {/* Top Endpoints */}
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>Top Endpoints (Last 60s)</h3>
                    {metrics.topEndpoints.length === 0 ? (
                        <p style={{ color: '#475569', fontSize: '0.8rem' }}>No requests yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {metrics.topEndpoints.map((ep, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '6px 10px', background: '#1e293b', borderRadius: 6, fontSize: '0.78rem',
                                }}>
                                    <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{ep.path}</span>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <span style={{ color: '#6366f1' }}>{ep.count} req</span>
                                        <span style={{ color: '#f59e0b' }}>{ep.avgMs}ms</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* System Info Footer */}
            <div style={{
                marginTop: 20, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16,
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12,
            }}>
                {[
                    { label: 'Platform', value: system.platform },
                    { label: 'CPU', value: `${system.cpu.model} (${system.cpu.cores} cores)` },
                    { label: 'RSS Memory', value: `${system.memory.rssMB} MB` },
                    { label: 'Heap', value: `${system.memory.heapUsedMB}/${system.memory.heapTotalMB} MB` },
                    { label: 'Active Handles', value: system.activeHandles.toString() },
                    { label: 'V8 Heap Limit', value: `${system.v8HeapStats.heapSizeLimit} MB` },
                ].map(item => (
                    <div key={item.label}>
                        <span style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase' }}>{item.label}</span>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
