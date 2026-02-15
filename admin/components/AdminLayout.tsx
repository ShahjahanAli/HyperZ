'use client';

import Sidebar from '@/components/Sidebar';
import LandingPage from '@/components/LandingPage';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh', background: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }} className="loading">⚡</div>
                    <div style={{ fontSize: 14 }}>Loading HyperZ Admin…</div>
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
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
