/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: '/api/_admin/:path*',
                destination: 'http://localhost:7700/api/_admin/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
