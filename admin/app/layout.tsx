import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'HyperZ Admin Panel',
    description: 'Administrative dashboard for HyperZ Framework',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
