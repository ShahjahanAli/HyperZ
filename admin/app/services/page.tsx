'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

const API = '/api/_admin';

export default function ServicesPage() {
    const [flushResult, setFlushResult] = useState('');

    const flushCache = async () => {
        try {
            const res = await fetch(`${API}/cache/flush`, { method: 'POST' });
            const data = await res.json();
            setFlushResult(data.success ? '✅ Cache flushed' : '❌ ' + data.error);
            setTimeout(() => setFlushResult(''), 3000);
        } catch {
            setFlushResult('❌ Failed to flush cache');
        }
    };

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>💾 Cache & Queue</h1>
                <span className="topbar-meta">Service management</span>
            </div>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Cache */}
                    <div className="card">
                        <div className="card-header">Cache Manager</div>
                        <div style={{ marginTop: 12, marginBottom: 16 }}>
                            <table>
                                <tbody>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Driver</td><td><span className="badge badge-info">{process.env.CACHE_DRIVER || 'file'}</span></td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Redis Host</td><td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>127.0.0.1</td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Status</td><td><span className="badge badge-success">Active</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-danger btn-sm" onClick={flushCache}>🗑️ Flush All Cache</button>
                        </div>
                        {flushResult && <div style={{ marginTop: 12, fontSize: 14 }}>{flushResult}</div>}
                    </div>

                    {/* Queue */}
                    <div className="card">
                        <div className="card-header">Queue Manager</div>
                        <div style={{ marginTop: 12 }}>
                            <table>
                                <tbody>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Driver</td><td><span className="badge badge-info">{process.env.QUEUE_DRIVER || 'sync'}</span></td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>BullMQ</td><td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>Available</td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Status</td><td><span className="badge badge-success">Active</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Storage */}
                    <div className="card">
                        <div className="card-header">Storage Manager</div>
                        <div style={{ marginTop: 12 }}>
                            <table>
                                <tbody>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Default Disk</td><td><span className="badge badge-info">local</span></td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>S3 Configured</td><td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>Available</td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Storage Path</td><td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>storage/</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* WebSocket */}
                    <div className="card">
                        <div className="card-header">WebSocket</div>
                        <div style={{ marginTop: 12 }}>
                            <table>
                                <tbody>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Provider</td><td><span className="badge badge-info">Socket.io</span></td></tr>
                                    <tr><td style={{ color: 'var(--text-muted)' }}>Status</td><td><span className="badge badge-success">Ready</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
