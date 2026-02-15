'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/api';

interface SaaSMetrics {
    tenants: { total: number; active: number; trial: number };
    billing: { mrr: number; activeSubscriptions: number; pendingInvoices: number };
    usage: { totalRequests: number; storageUsed: string };
    recentTenants: Array<{ name: string; plan: string; joined: string }>;
}

export default function SaaSPage() {
    const [metrics, setMetrics] = useState<SaaSMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminFetch('/api/_admin/saas/metrics')
            .then(res => res.json())
            .then(data => {
                setMetrics(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <AdminLayout>
            <div className="topbar">
                <h1>🏢 SaaS Core</h1>
                <span className="topbar-meta">Multi-tenancy management & billing health</span>
            </div>

            <div className="page-content">
                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <div className="card">
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Tenants</div>
                        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{metrics?.tenants.active || 0}</div>
                        <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 4 }}>↑ 12% from last month</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Revenue</div>
                        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>${metrics?.billing.mrr.toLocaleString() || '0'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Stripe Live Mode</div>
                    </div>
                    <div className="card">
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Usage/Tenant</div>
                        <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>24.5k req</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Rolling 30-day window</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                    {/* Tenants Table */}
                    <div className="card">
                        <div className="card-header">Existing Tenants</div>
                        <table style={{ marginTop: 12 }}>
                            <thead>
                                <tr>
                                    <th>Organization</th>
                                    <th>Plan</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics?.recentTenants.map((t, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                                        <td><span className={`badge ${t.plan === 'Enterprise' ? 'badge-info' : 'badge-primary'}`}>{t.plan}</span></td>
                                        <td><span className="badge badge-success">Active</span></td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.joined}</td>
                                        <td>
                                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 10 }}>Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Quick Config */}
                    <div className="card">
                        <div className="card-header">SaaS Rules</div>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="form-group">
                                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Default Trial Period (Days)</label>
                                <input className="form-input" defaultValue="14" style={{ marginTop: 4 }} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Isolation Strategy</label>
                                <select className="form-input" style={{ marginTop: 4 }}>
                                    <option>Pool (Schema-based)</option>
                                    <option>Silo (Separate DB)</option>
                                </select>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }}>Save Configuration</button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
