'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

const API = '/api/_admin';

interface Overview {
    framework: string;
    version: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    uptimeFormatted: string;
    memory: { rss: string; heapUsed: string; heapTotal: string };
    cpu: string;
    pid: number;
    env: string;
    port: string;
}

export default function DashboardPage() {
    const [overview, setOverview] = useState<Overview | null>(null);
    const [routes, setRoutes] = useState<any[]>([]);
    const [tables, setTables] = useState<string[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        adminFetch(`${API}/overview`).then(r => r.json()).then(setOverview).catch(() => setError('Cannot reach HyperZ API'));
        adminFetch(`${API}/routes`).then(r => r.json()).then(d => setRoutes(d.routes || [])).catch(() => { });
        adminFetch(`${API}/database/tables`).then(r => r.json()).then(d => setTables(d.tables || [])).catch(() => { });
    }, []);

    return (
        <AdminLayout>
            <div className="topbar">
                <h1 style={{ fontFamily: 'var(--tactical)', fontSize: '14px', letterSpacing: '2px' }}>📊 SYSTEM_DASHBOARD_LIVE</h1>
                <span className="topbar-meta">
                    {overview ? `${overview.framework} v${overview.version} • ${overview.env}` : 'Connecting...'}
                </span>
            </div>

            <div className="page-content">
                {error && (
                    <div className="card" style={{ borderColor: 'var(--red)', marginBottom: 24 }}>
                        <p style={{ color: 'var(--red)' }}>⚠️ {error} — Make sure HyperZ is running on port 7700</p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Uptime</div>
                        <div className="stat-value">{overview?.uptimeFormatted || '—'}</div>
                        <div className="stat-sub">PID: {overview?.pid || '—'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Memory (Heap)</div>
                        <div className="stat-value">{overview?.memory?.heapUsed || '—'}</div>
                        <div className="stat-sub">of {overview?.memory?.heapTotal || '—'} total</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Routes</div>
                        <div className="stat-value">{routes.length}</div>
                        <div className="stat-sub">registered endpoints</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Database Tables</div>
                        <div className="stat-value">{tables.length}</div>
                        <div className="stat-sub">active tables</div>
                    </div>
                </div>

                {/* System Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="card">
                        <div className="card-header">// SYSTEM_ENVIRONMENT_INFO</div>
                        <table>
                            <tbody>
                                <tr><td style={{ color: 'var(--text-muted)' }}>Node.js</td><td>{overview?.nodeVersion || '—'}</td></tr>
                                <tr><td style={{ color: 'var(--text-muted)' }}>Platform</td><td>{overview?.platform || '—'}</td></tr>
                                <tr><td style={{ color: 'var(--text-muted)' }}>Architecture</td><td>{overview?.arch || '—'}</td></tr>
                                <tr><td style={{ color: 'var(--text-muted)' }}>CPU</td><td>{overview?.cpu || '—'}</td></tr>
                                <tr><td style={{ color: 'var(--text-muted)' }}>Port</td><td>{overview?.port || '—'}</td></tr>
                                <tr><td style={{ color: 'var(--text-muted)' }}>Environment</td><td><span className="badge badge-info">{overview?.env || '—'}</span></td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="card">
                        <div className="card-header">// OPERATIONAL_QUICK_ACTIONS</div>
                        <div className="btn-group" style={{ flexDirection: 'column' }}>
                            <a href="/scaffold" className="btn btn-secondary">🏗️ Create Controller / Model</a>
                            <a href="/database" className="btn btn-secondary">🗄️ Manage Database</a>
                            <a href="/routes" className="btn btn-secondary">🛤️ View Routes</a>
                            <a href="/config" className="btn btn-secondary">⚙️ Edit Configuration</a>
                            <a href="http://localhost:7700/api/playground" target="_blank" rel="noreferrer" className="btn btn-primary">🎮 Open API Playground</a>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
