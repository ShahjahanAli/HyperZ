'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

const API = '/api/_admin';

export default function ServicesPage() {
    const [flushResult, setFlushResult] = useState('');

    const flushCache = async () => {
        try {
            const res = await adminFetch(`${API}/cache/flush`, { method: 'POST' });
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
                <h1>💾 CACHE_QUEUE_CENTRAL</h1>
                <span className="topbar-meta">SERVICE_INFRASTRUCTURE • UPLINK: STABLE</span>
            </div>

            <div className="page-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cache */}
                    <div className="card">
                        <div className="card-header">// CACHE_LAYER_MANAGER</div>
                        <div className="table-container mb-6">
                            <table>
                                <tbody>
                                    <tr><th className="w-1/3">DRIVER</th><td><span className="badge badge-info">{process.env.CACHE_DRIVER || 'FILE'}</span></td></tr>
                                    <tr><th>REDIS_HOST</th><td className="italic">127.0.0.1</td></tr>
                                    <tr><th>STATUS</th><td><span className="badge badge-success">ACTIVE</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-danger" onClick={flushCache}>🗑️ FLUSH_TOTAL_CACHE</button>
                        </div>
                        {flushResult && <div className="mt-4 text-[11px] font-mono text-[var(--accent)] animate-pulse">{flushResult}</div>}
                    </div>

                    {/* Queue */}
                    <div className="card">
                        <div className="card-header">// ASYNC_QUEUE_WORKER</div>
                        <div className="table-container">
                            <table>
                                <tbody>
                                    <tr><th className="w-1/3">DRIVER</th><td><span className="badge badge-info">{process.env.QUEUE_DRIVER || 'SYNC'}</span></td></tr>
                                    <tr><th>BULLMQ_ENGINE</th><td className="italic">AVAILABLE</td></tr>
                                    <tr><th>STATUS</th><td><span className="badge badge-success">ACTIVE</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Storage */}
                    <div className="card">
                        <div className="card-header">// VIRTUAL_STORAGE_ASSETS</div>
                        <div className="table-container">
                            <table>
                                <tbody>
                                    <tr><th className="w-1/3">DEFAULT_DISK</th><td><span className="badge badge-info">LOCAL</span></td></tr>
                                    <tr><th>S3_UPLINK</th><td className="italic">CONFIGURED</td></tr>
                                    <tr><th>ROOT_PATH</th><td className="italic font-bold">STORAGE/</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* WebSocket */}
                    <div className="card">
                        <div className="card-header">// REALTIME_WEBSOCKET_UPLINK</div>
                        <div className="table-container">
                            <table>
                                <tbody>
                                    <tr><th className="w-1/3">PROVIDER</th><td><span className="badge badge-info">SOCKET.IO</span></td></tr>
                                    <tr><th>STATUS</th><td><span className="badge badge-success">READY</span></td></tr>
                                    <tr><th>CONNECTIONS</th><td className="italic font-bold text-emerald-700">ACTIVE</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
