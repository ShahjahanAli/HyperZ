import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://starlight.astro.build/reference/configuration/
export default defineConfig({
    integrations: [
        starlight({
            title: 'HyperZ Framework',
            description: 'Laravel-inspired, AI-native, Enterprise-grade API Framework for Node.js',
            logo: {
                light: './src/assets/logo-light.svg',
                dark: './src/assets/logo-dark.svg',
                replacesTitle: false,
            },
            social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/hyperz-framework/hyperz' },
            ],
            customCss: ['./src/styles/custom.css'],
            defaultLocale: 'en',
            editLink: {
                baseUrl: 'https://github.com/hyperz-framework/hyperz/edit/main/docs-site/',
            },
            sidebar: [
                {
                    label: 'Getting Started',
                    items: [
                        { label: 'Introduction', slug: 'getting-started/introduction' },
                        { label: 'Installation', slug: 'getting-started/installation' },
                        { label: 'Quick Start', slug: 'getting-started/quick-start' },
                        { label: 'Configuration', slug: 'getting-started/configuration' },
                        { label: 'Directory Structure', slug: 'getting-started/directory-structure' },
                    ],
                },
                {
                    label: 'Core Concepts',
                    items: [
                        { label: 'Architecture', slug: 'core/architecture' },
                        { label: 'Service Container', slug: 'core/service-container' },
                        { label: 'Service Providers', slug: 'core/service-providers' },
                        { label: 'Lifecycle & Hooks', slug: 'core/lifecycle' },
                    ],
                },
                {
                    label: 'HTTP Layer',
                    items: [
                        { label: 'Routing', slug: 'http/routing' },
                        { label: 'Controllers', slug: 'http/controllers' },
                        { label: 'Middleware', slug: 'http/middleware' },
                        { label: 'Validation', slug: 'http/validation' },
                        { label: 'HTTP Adapters', slug: 'http/adapters' },
                    ],
                },
                {
                    label: 'Database',
                    items: [
                        { label: 'Models', slug: 'database/models' },
                        { label: 'Migrations', slug: 'database/migrations' },
                        { label: 'Query Builder', slug: 'database/query-builder' },
                        { label: 'Drizzle ORM', slug: 'database/drizzle' },
                        { label: 'Seeders & Factories', slug: 'database/seeders-factories' },
                    ],
                },
                {
                    label: 'Security',
                    items: [
                        { label: 'Authentication', slug: 'security/authentication' },
                        { label: 'Authorization (RBAC)', slug: 'security/authorization' },
                        { label: 'Encryption & Hashing', slug: 'security/encryption' },
                        { label: 'CSRF & XSS Protection', slug: 'security/csrf-xss' },
                    ],
                },
                {
                    label: 'AI & ML',
                    items: [
                        { label: 'AI Gateway', slug: 'ai/gateway' },
                        { label: 'AI Agents', slug: 'ai/agents' },
                        { label: 'Prompt Manager', slug: 'ai/prompts' },
                        { label: 'Vector Database', slug: 'ai/vector-db' },
                        { label: 'Streaming (SSE)', slug: 'ai/streaming' },
                    ],
                },
                {
                    label: 'Features',
                    items: [
                        { label: 'Caching', slug: 'features/caching' },
                        { label: 'Queues & Jobs', slug: 'features/queues' },
                        { label: 'Events', slug: 'features/events' },
                        { label: 'Mail', slug: 'features/mail' },
                        { label: 'Storage', slug: 'features/storage' },
                        { label: 'WebSockets', slug: 'features/websockets' },
                        { label: 'Scheduling', slug: 'features/scheduling' },
                        { label: 'Feature Flags', slug: 'features/feature-flags' },
                        { label: 'Webhooks', slug: 'features/webhooks' },
                        { label: 'Audit Logging', slug: 'features/audit-log' },
                    ],
                },
                {
                    label: 'API Docs & OpenAPI',
                    items: [
                        { label: 'Swagger UI', slug: 'api-docs/swagger' },
                        { label: 'Scalar Reference', slug: 'api-docs/scalar' },
                        { label: 'OpenAPI Generation', slug: 'api-docs/openapi' },
                    ],
                },
                {
                    label: 'Plugins',
                    items: [
                        { label: 'Using Plugins', slug: 'plugins/using-plugins' },
                        { label: 'Creating Plugins', slug: 'plugins/creating-plugins' },
                        { label: 'Plugin API', slug: 'plugins/plugin-api' },
                    ],
                },
                {
                    label: 'CLI',
                    items: [
                        { label: 'Commands', slug: 'cli/commands' },
                        { label: 'Scaffolding', slug: 'cli/scaffolding' },
                    ],
                },
                {
                    label: 'Testing',
                    slug: 'testing',
                },
                {
                    label: 'Deployment',
                    slug: 'deployment',
                },
                {
                    label: 'Comparison',
                    slug: 'comparison',
                },
            ],
            head: [
                {
                    tag: 'meta',
                    attrs: { property: 'og:image', content: '/og-image.png' },
                },
            ],
        }),
    ],
});
