'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { icon: '📊', label: 'Dashboard', href: '/' },
    { icon: '🏗️', label: 'Scaffolding', href: '/scaffold' },
    { icon: '🗄️', label: 'Database', href: '/database' },
    { icon: '🛤️', label: 'Routes', href: '/routes' },
    { icon: '⚙️', label: 'Config & Env', href: '/config' },
    { icon: '💾', label: 'Cache & Queue', href: '/services' },
    { icon: '📋', label: 'Logs', href: '/logs' },
    { icon: '🤖', label: 'AI Gateway', href: '/ai' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                ⚡ <span className="accent">HyperZ</span> Admin
            </div>

            <nav className="nav-section">
                <div className="nav-section-title">Management</div>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${pathname === item.href ? 'active' : ''}`}
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
        </aside>
    );
}
