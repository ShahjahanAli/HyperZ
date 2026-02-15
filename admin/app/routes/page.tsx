'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

const API = '/api/_admin';

export default function RoutesPage() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [filter, setFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('ALL');

    useEffect(() => {
        fetch(`${API}/routes`).then(r => r.json()).then(d => setRoutes(d.routes || [])).catch(() => { });
    }, []);

    const methods = ['ALL', ...Array.from(new Set(routes.map((r: any) => r.method)))];
    const filtered = routes.filter(r => {
        if (methodFilter !== 'ALL' && r.method !== methodFilter) return false;
        if (filter && !r.path.toLowerCase().includes(filter.toLowerCase())) return false;
        return true;
    });

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>🛤️ Routes</h1>
                <span className="topbar-meta">{routes.length} registered endpoints</span>
            </div>

            <div className="page-content">
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input
                        className="form-input"
                        style={{ maxWidth: 300 }}
                        placeholder="Search routes..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                    <select className="form-select" style={{ maxWidth: 130 }} value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
                        {methods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: 80 }}>Method</th>
                                    <th>Path</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, i) => (
                                    <tr key={i}>
                                        <td><span className={`method-badge method-${r.method}`}>{r.method}</span></td>
                                        <td>{r.path || '/'}</td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No routes found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
