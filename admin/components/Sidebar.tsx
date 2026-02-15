'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const navItems = [
    { icon: '📊', label: 'Dashboard', href: '/' },
    { icon: '🏗️', label: 'Scaffolding', href: '/scaffold' },
    { icon: '🗄️', label: 'Database', href: '/database' },
    { icon: '🛤️', label: 'Routes', href: '/routes' },
    { icon: '⚙️', label: 'Config & Env', href: '/config' },
    { icon: '💾', label: 'Cache & Queue', href: '/services' },
    { icon: '📋', label: 'Logs', href: '/logs' },
    { icon: '🤖', label: 'AI Gateway', href: '/ai' },
    { icon: '🏢', label: 'SaaS Core', href: '/saas' },
    { icon: '🔌', label: 'MCP Server', href: '/mcp' },
    { icon: '📖', label: 'API Docs', href: '/docs' },
    { icon: '📈', label: 'Monitoring', href: '/monitoring' },
    { icon: '🔮', label: 'GraphQL', href: '/graphql' },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { admin, logout } = useAuth();

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-brand">
                ⚡ <span className="accent">HyperZ</span> <span style={{ fontSize: '12px', opacity: 0.8, marginLeft: '4px' }}>ADMIN</span>
            </div>

            <nav className="nav-section">
                <div className="nav-section-title">Management</div>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                        onClick={onClose}
                    >
                        <span className="icon">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div style={{ flex: 1 }} />

            <div className="nav-section">
                <div className="nav-section-title">Links</div>
                <a href="http://localhost:7700/api" target="_blank" rel="noreferrer" className="nav-item">
                    <span className="icon">🌐</span>
                    API
                </a>
                <a href="http://localhost:7700/api/playground" target="_blank" rel="noreferrer" className="nav-item">
                    <span className="icon">🎮</span>
                    Playground
                </a>
            </div>

            {/* Admin info + logout */}
            {admin && (
                <div style={{
                    padding: '14px 20px', borderTop: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent), #6d28d9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                        {admin.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontSize: 12, fontWeight: 600, color: 'var(--text)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {admin.name}
                        </div>
                        <div style={{
                            fontSize: 10, color: 'var(--text-muted)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {admin.email}
                        </div>
                    </div>
                    <button onClick={logout} title="Sign out" style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: 16, padding: 4,
                        transition: 'color 0.2s',
                    }}>
                        🚪
                    </button>
                </div>
            )}
        </aside>
    );
}
