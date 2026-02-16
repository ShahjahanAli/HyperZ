'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import LandingPage from '@/components/LandingPage';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setCollapsed] = useState(false);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
                <div className="text-center text-[var(--text-muted)]">
                    <div className="text-4xl mb-3 animate-pulse">⚡</div>
                    <div className="text-sm font-mono tracking-widest uppercase italic">SYSTEM_CHECK_IN_PROGRESS…</div>
                </div>
            </div>
        );
    }

    // Show landing page when not authenticated
    if (!isAuthenticated) {
        return <LandingPage />;
    }

    // Authenticated — show full admin panel
    return (
        <div className="flex min-h-screen relative z-10 bg-[var(--bg)]">
            {/* Mobile Sidebar Toggle */}
            <button
                className="lg:hidden fixed top-4 right-4 z-[1001] p-2.5 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] rounded-sm shadow-xl active:scale-95 transition-all"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle Menu"
            >
                {isSidebarOpen ? (
                    <span className="block w-5 h-5 flex items-center justify-center font-bold text-lg">✕</span>
                ) : (
                    <span className="block w-5 h-5 flex items-center justify-center font-bold text-lg">☰</span>
                )}
            </button>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setCollapsed(!isCollapsed)}
            />

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 bg-slate-900/60 z-[99] backdrop-blur-sm animate-in fade-in duration-300"
                />
            )}

            <main className={`flex-1 min-h-screen transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]'
                }`}>
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
