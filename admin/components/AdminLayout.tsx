'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import LandingPage from '@/components/LandingPage';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh', background: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }} className="loading">⚡</div>
                    <div style={{ fontSize: 14, fontFamily: 'var(--mono)' }}>SYSTEM_CHECK_IN_PROGRESS…</div>
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
        <div className="admin-layout">
            <button
                className="mobile-toggle"
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle Menu"
            >
                {isSidebarOpen ? '✕' : '☰'}
            </button>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)', zIndex: 99,
                        backdropFilter: 'blur(4px)'
                    }}
                />
            )}

            <main className="main-content">
                <div className="page-transition">
                    {children}
                </div>
            </main>
        </div>
    );
}
