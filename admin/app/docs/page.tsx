'use client';

export default function DocsPage() {
    return (
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0, marginBottom: 4 }}>
                    📖 API Documentation
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                    Auto-generated Swagger/OpenAPI docs from your HyperZ routes
                </p>
            </div>

            {/* Quick Links */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                    { title: 'Swagger UI', desc: 'Interactive API explorer', href: '/api/docs', icon: '🌐', color: '#22c55e' },
                    { title: 'OpenAPI JSON', desc: 'Raw specification', href: '/api/docs/json', icon: '📄', color: '#3b82f6' },
                    { title: 'Playground', desc: 'Custom API tester', href: '/api/playground', icon: '🎮', color: '#a855f7' },
                ].map(item => (
                    <a key={item.title} href={item.href} target="_blank" rel="noreferrer" style={{
                        background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20,
                        textDecoration: 'none', transition: 'border-color 0.2s',
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.desc}</div>
                    </a>
                ))}
            </div>

            {/* Embedded Swagger UI */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>Swagger UI Preview</h3>
                    <a href="/api/docs" target="_blank" rel="noreferrer" style={{
                        fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none',
                    }}>↗ Open in new tab</a>
                </div>
                <iframe src="/api/docs" style={{ width: '100%', height: 700, border: 'none' }} title="Swagger UI" />
            </div>
        </div>
    );
}
