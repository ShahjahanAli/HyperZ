import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Inter, JetBrains_Mono, Orbitron } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--mono' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--tactical' });

export const metadata: Metadata = {
    title: 'HyperZ Admin Panel',
    description: 'Administrative dashboard for HyperZ Framework',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body
                suppressHydrationWarning
                className={`${inter.variable} ${jetbrains.variable} ${orbitron.variable}`}
            >
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
