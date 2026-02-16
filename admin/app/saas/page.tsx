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
                <h1>🏢 SAAS_CORE_SUBSYSTEM</h1>
                <span className="topbar-meta">MULTI_TENANCY_MANAGEMENT • BILLING_HEALTH: OPTIMAL</span>
            </div>

            <div className="page-content">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">ACTIVE_TENANTS</div>
                        <div className="stat-value">{metrics?.tenants.active || 0}</div>
                        <div className="stat-sub text-emerald-700">↑ 12% FROM_LAST_MONTH</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">MONTHLY_REVENUE</div>
                        <div className="stat-value">${metrics?.billing.mrr.toLocaleString() || '0'}</div>
                        <div className="stat-sub">STRIPE_LIVE_MODE</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">AVG_USAGE_TENANT</div>
                        <div className="stat-value">24.5K_REQ</div>
                        <div className="stat-sub">ROLLING_30D_WINDOW</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                    {/* Tenants Table */}
                    <div className="card">
                        <div className="card-header">// EXISTING_TENANTS_REGISTRY</div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ORGANIZATION</th>
                                        <th>PLAN_SPEC</th>
                                        <th>STATUS</th>
                                        <th>JOINED</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics?.recentTenants.map((t, i) => (
                                        <tr key={i}>
                                            <td className="font-bold text-[var(--accent-secondary)] italic">{t.name}</td>
                                            <td><span className={`badge ${t.plan === 'Enterprise' ? 'badge-info' : 'badge-primary'}`}>{t.plan.toUpperCase()}</span></td>
                                            <td><span className="badge badge-success">ACTIVE</span></td>
                                            <td className="italic">{t.joined}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm">MANAGE</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Config */}
                    <div className="card">
                        <div className="card-header">// SAAS_HYPER_RULES</div>
                        <div className="space-y-6 mt-4">
                            <div className="form-group">
                                <label className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest italic">Default Trial Period (Days)</label>
                                <input className="form-input" defaultValue="14" />
                            </div>
                            <div className="form-group">
                                <label className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest italic">Isolation Strategy</label>
                                <select className="form-input">
                                    <option>Pool (Schema-based)</option>
                                    <option>Silo (Separate DB)</option>
                                </select>
                            </div>
                            <button className="btn btn-primary w-full justify-center">COMMIT_SAAS_CONFIG</button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
