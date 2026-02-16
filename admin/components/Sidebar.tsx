'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
    LayoutDashboard,
    Hammer,
    Database,
    Route,
    Settings,
    Zap,
    ScrollText,
    Bot,
    Building2,
    PlugZap,
    BookOpen,
    Activity,
    Box,
    Network,
    LogOut
} from 'lucide-react';

const navItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', href: '/' },
    { icon: <Hammer size={18} />, label: 'Scaffolding', href: '/scaffold' },
    { icon: <Database size={18} />, label: 'Database', href: '/database' },
    { icon: <Route size={18} />, label: 'Routes', href: '/routes' },
    { icon: <Settings size={18} />, label: 'Config & Env', href: '/config' },
    { icon: <Zap size={18} />, label: 'Cache & Queue', href: '/services' },
    { icon: <ScrollText size={18} />, label: 'Logs', href: '/logs' },
    { icon: <Bot size={18} />, label: 'AI Gateway', href: '/ai' },
    { icon: <Building2 size={18} />, label: 'SaaS Core', href: '/saas' },
    { icon: <PlugZap size={18} />, label: 'MCP Server', href: '/mcp' },
    { icon: <BookOpen size={18} />, label: 'API Docs', href: '/docs' },
    { icon: <Activity size={18} />, label: 'Monitoring', href: '/monitoring' },
    { icon: <Network size={18} />, label: 'GraphQL', href: '/graphql' },
    { icon: <Box size={18} />, label: 'Packages', href: '/packages' },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { admin, logout } = useAuth();

    return (
        <aside className={`
            fixed top-0 left-0 bottom-0 w-[260px] bg-[var(--bg-sidebar)] border-r border-[var(--border)] 
            z-[100] backdrop-blur-2xl flex flex-col transition-transform duration-300 lg:translate-x-0
            ${isOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.1)]' : '-translate-x-full lg:translate-x-0'}
        `}>
            <div className="p-6 font-tactical italic font-black text-xl tracking-[0.2em] border-b border-[var(--border)] flex items-center gap-3">
                ⚡ <span className="text-[var(--accent)] drop-shadow-[0_0_10px_rgba(124,58,237,0.3)]">HyperZ</span>
                <span className="text-xs opacity-70 font-sans tracking-normal not-italic font-medium ml-1">ADMIN</span>
            </div>

            <nav className="py-5 overflow-y-auto flex-1">
                <div className="px-6 pb-3 font-tactical text-[9px] uppercase tracking-[3px] text-[var(--text-muted)] font-bold opacity-70">
                    Management
                </div>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`
                            flex items-center gap-3.5 px-6 py-3 text-[13px] font-medium transition-all duration-200
                            border-r-2 border-transparent group
                            ${pathname === item.href
                                ? 'text-[var(--accent)] bg-gradient-to-r from-[var(--accent-glow)] to-transparent border-r-[var(--accent)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-slate-500/5'}
                        `}
                        onClick={onClose}
                    >
                        <span className={`transition-transform duration-200 group-hover:scale-110 ${pathname === item.href ? 'text-[var(--accent)]' : ''}`}>
                            {item.icon}
                        </span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Quick Links */}
            <div className="py-5 border-t border-[var(--border)]">
                <div className="px-6 pb-3 font-tactical text-[9px] uppercase tracking-[3px] text-[var(--text-muted)] font-bold opacity-70">
                    Links
                </div>
                <a href="http://localhost:7700/api" target="_blank" rel="noreferrer"
                    className="flex items-center gap-3.5 px-6 py-3 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-slate-500/5 transition-colors">
                    <span className="text-lg">🌐</span> API
                </a>
                <a href="http://localhost:7700/api/playground" target="_blank" rel="noreferrer"
                    className="flex items-center gap-3.5 px-6 py-3 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-slate-500/5 transition-colors">
                    <span className="text-lg">🎮</span> Playground
                </a>
            </div>

            {/* Admin info + logout */}
            {admin && (
                <div className="p-4 border-t border-[var(--border)] flex items-center gap-3 bg-slate-500/5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#6d28d9] flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg shadow-violet-500/20">
                        {admin.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[var(--text)] truncate">
                            {admin.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">
                            {admin.email}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        title="Sign out"
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            )}
        </aside>
    );
}
