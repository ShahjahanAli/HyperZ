'use client';

import AdminLayout from '@/components/AdminLayout';

export default function DocsPage() {
    return (
        <AdminLayout>
            <div className="topbar">
                <h1>📖 SERVICE_DOCUMENTATION_OPENAPI</h1>
                <span className="topbar-meta">HYPERZ v2 • API EXPLORER</span>
            </div>

            <div className="page-content">
                {/* Header Info */}
                <div className="stat-card" style={{ marginBottom: 32, borderLeft: '4px solid var(--accent)' }}>
                    <div className="stat-label">Description</div>
                    <div style={{ fontSize: '14px', marginTop: 8, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                        AUTO-GENERATED SWAGGER/OPENAPI SPECIFICATION DISCOVERED AT:
                        <span style={{ color: 'var(--accent-secondary)', marginLeft: 8 }}>/api/_admin/docs</span>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
                    {[
                        { title: 'SWAGGER UI', desc: 'Interactive API explorer and documentation.', href: '/api/_admin/docs', icon: '🌐', color: 'var(--green)' },
                        { title: 'OPENAPI JSON', desc: 'Raw specification for external tool integration.', href: '/api/_admin/docs/json', icon: '📄', color: 'var(--blue)' },
                    ].map(item => (
                        <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className="card" style={{
                            textDecoration: 'none',
                        }}>
                            <div className="card-header" style={{ color: item.color }}>{item.icon} {item.title}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginTop: 8 }}>{item.desc}</div>
                            <div style={{ marginTop: 16, fontSize: '11px', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--tactical)' }}>
                                OPEN_EXTERNAL_UPLINK ↗
                            </div>
                        </a>
                    ))}
                </div>

                {/* Embedded Viewer */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '16px 24px', margin: 0 }}>// EMBEDDED_SWAGGER_INTERFACE_PREVIEW</div>
                    <iframe src="/api/_admin/docs" style={{ width: '100%', height: 800, border: 'none', background: '#fff', borderRadius: '0 0 var(--radius) var(--radius)' }} title="Swagger UI" />
                </div>
            </div>
        </AdminLayout>
    );
}
