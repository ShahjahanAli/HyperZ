import { Controller } from '../../src/http/Controller.js';
import type { Request, Response } from 'express';

export class HomeController extends Controller {
    /**
     * Welcome endpoint.
     * GET /api
     */
    /**
     * Welcome endpoint.
     * GET /api
     */
    async index(req: Request, res: Response): Promise<void> {
        this.success(res, {
            framework: 'HyperZ',
            version: '2.0.0',
            status: 'AI-Native Enterprise SaaS Framework',
            timestamp: new Date().toISOString(),
        }, 'Welcome to HyperZ API! ⚡');
    }

    /**
     * Framework Landing Page
     * GET /
     */
    async welcome(req: Request, res: Response): Promise<void> {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HyperZ v2 — AI-Native Enterprise SaaS Framework</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #050505;
            --accent: #8b5cf6;
            --secondary: #3b82f6;
            --text: #f8fafc;
            --text-dim: #94a3b8;
            --glass: rgba(255, 255, 255, 0.03);
            --border: rgba(255, 255, 255, 0.08);
            --card-bg: rgba(255, 255, 255, 0.02);
            --nav-h: 80px;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Plus Jakarta Sans', sans-serif;
            overflow-x: hidden;
            line-height: 1.5;
            min-height: 100vh;
        }

        /* Ambient Blobs */
        .blob {
            position: fixed;
            width: 50vw;
            height: 50vw;
            border-radius: 50%;
            filter: blur(120px);
            z-index: -1;
            opacity: 0.15;
            pointer-events: none;
        }
        .blob-1 { top: -10%; left: -10%; background: var(--accent); }
        .blob-2 { bottom: -10%; right: -10%; background: var(--secondary); }

        /* Navbar */
        nav {
            position: fixed;
            top: 0;
            width: 100%;
            height: var(--nav-h);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 0 2rem;
            border-bottom: 1px solid var(--border);
            background: rgba(5, 5, 5, 0.7);
            backdrop-filter: blur(20px);
        }

        .nav-content {
            width: 100%;
            max-width: 1200px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .logo span { color: var(--accent); }

        .nav-links {
            display: flex;
            gap: 2rem;
            align-items: center;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--text-dim);
            font-size: 0.9rem;
            font-weight: 500;
            transition: color 0.3s ease;
        }
        .nav-links a:hover { color: var(--text); }

        /* Hero */
        .hero {
            padding: calc(var(--nav-h) + 6rem) 2rem 6rem;
            text-align: center;
            max-width: 1200px;
            margin: 0 auto;
        }

        .badge-container {
            display: flex;
            justify-content: center;
            margin-bottom: 2rem;
        }

        .badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--glass);
            border: 1px solid var(--border);
            border-radius: 99px;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-dim);
        }
        .badge .dot {
            width: 6px;
            height: 6px;
            background: #22c55e;
            border-radius: 50%;
            box-shadow: 0 0 10px #22c55e;
        }

        h1 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: clamp(3rem, 10vw, 5.5rem);
            font-weight: 700;
            line-height: 1;
            letter-spacing: -0.04em;
            margin-bottom: 1.5rem;
        }

        .gradient-text {
            background: linear-gradient(to right, #fff 40%, var(--accent) 70%, var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        p.hero-sub {
            font-size: clamp(1.1rem, 4vw, 1.4rem);
            color: var(--text-dim);
            max-width: 750px;
            margin: 0 auto 3rem;
        }

        .hero-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 6rem;
        }

        .btn {
            padding: 0.8rem 1.8rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.95rem;
            text-decoration: none;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-primary {
            background: var(--text);
            color: var(--bg);
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255,255,255,0.1);
        }

        .btn-secondary {
            background: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--text);
        }
        .btn-secondary:hover {
            background: var(--glass);
            border-color: var(--text-dim);
            transform: translateY(-2px);
        }

        /* Terminal Mockup */
        .terminal-container {
            max-width: 700px;
            margin: 0 auto 8rem;
            perspective: 1000px;
        }

        .terminal {
            background: #0d0d0d;
            border: 1px solid var(--border);
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 40px 80px rgba(0,0,0,0.5);
            text-align: left;
            transform: rotateX(5deg);
        }

        .terminal-header {
            background: #1a1a1a;
            padding: 0.8rem 1rem;
            display: flex;
            gap: 0.5rem;
            border-bottom: 1px solid var(--border);
        }

        .term-dot { width: 10px; height: 10px; border-radius: 50%; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }

        .terminal-body {
            padding: 1.5rem;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
            color: #d1d1d1;
        }

        .line { margin-bottom: 0.5rem; }
        .prompt { color: var(--accent); margin-right: 0.5rem; }
        .cmd { color: #fff; }
        .output { color: var(--text-dim); }

        /* Stats Section */
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-bottom: 8rem;
            padding: 0 2rem;
        }

        .stat-item h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        .stat-item p {
            color: var(--text-dim);
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.1rem;
            font-weight: 700;
        }

        /* Features */
        .features-section {
            padding: 4rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        h2.section-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 3rem;
            margin-bottom: 4rem;
            text-align: center;
        }

        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.5rem;
        }

        .feature-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            padding: 2.5rem;
            border-radius: 20px;
            transition: all 0.3s ease;
            text-align: left;
        }

        .feature-card:hover {
            border-color: var(--accent);
            transform: translateY(-5px);
            background: rgba(139, 92, 246, 0.05);
        }

        .icon {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
            width: 50px;
            height: 50px;
            background: var(--glass);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border);
        }

        .feature-card h3 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.3rem;
            margin-bottom: 1rem;
        }

        .feature-card p {
            color: var(--text-dim);
            font-size: 0.95rem;
            line-height: 1.6;
        }

        footer {
            padding: 4rem 2rem;
            border-top: 1px solid var(--border);
            text-align: center;
            color: var(--text-dim);
            font-size: 0.9rem;
        }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .animate {
            animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        @media (max-width: 768px) {
            h1 { font-size: 3.5rem; }
            .nav-links { display: none; }
        }
    </style>
</head>
<body>
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <nav>
        <div class="nav-content">
            <div class="logo">⚡ Hyper<span>Z</span></div>
            <div class="nav-links">
                <a href="/api/playground">Playground</a>
                <a href="/api/docs">Documentation</a>
                <a href="/api/_admin">Dashboard</a>
                <a href="https://github.com/ShahjahanAli/HyperZ" class="btn btn-secondary" style="padding: 0.5rem 1rem;">GitHub</a>
            </div>
        </div>
    </nav>

    <div class="hero animate">
        <div class="badge-container">
            <div class="badge">
                <span class="dot"></span>
                v2.0.0 Now Available
            </div>
        </div>
        <h1>AI-Native <span class="gradient-text">Enterprise</span> Framework</h1>
        <p class="hero-sub">Shift from "building wrappers" to "building platforms". Native multi-tenancy, RAG pipelines, and autonomous agent workforce — out of the box.</p>
        
        <div class="hero-actions">
            <a href="/api/playground" class="btn btn-primary">Try the Playground ⚡</a>
            <a href="/api/docs" class="btn btn-secondary">Read User Manual</a>
        </div>

        <div class="terminal-container">
            <div class="terminal">
                <div class="terminal-header">
                    <div class="term-dot red"></div>
                    <div class="term-dot yellow"></div>
                    <div class="term-dot green"></div>
                </div>
                <div class="terminal-body">
                    <div class="line">
                        <span class="prompt">$</span>
                        <span class="cmd">npm install -g hyperz-cli</span>
                    </div>
                    <div class="line">
                        <span class="prompt">$</span>
                        <span class="cmd">hyperz new my-saas --ai-native</span>
                    </div>
                    <div class="line output">
                        Creating enterprise foundation...
                    </div>
                    <div class="line output">
                        Initializing RAG pipeline & Tenant pooling...
                    </div>
                    <div class="line">
                        <span class="prompt">$</span>
                        <span class="cmd">cd my-saas && npm run dev</span>
                    </div>
                    <div class="line output" style="color: #27c93f;">
                        ⚡ Ready on http://localhost:7700
                    </div>
                </div>
            </div>
        </div>

        <div class="stats">
            <div class="stat-item">
                <h2 class="gradient-text">20+</h2>
                <p>Enterprise Modules</p>
            </div>
            <div class="stat-item">
                <h2 class="gradient-text">100%</h2>
                <p>AI Integrated</p>
            </div>
            <div class="stat-item">
                <h2 class="gradient-text">Multi</h2>
                <p>Tenant Support</p>
            </div>
            <div class="stat-item">
                <h2 class="gradient-text">&lt;1s</h2>
                <p>Boot Time</p>
            </div>
        </div>
    </div>

    <section class="features-section">
        <h2 class="section-title">Everything you need to ship.</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <div class="icon">🤖</div>
                <h3>AI Orchestration</h3>
                <p>Model fallbacks, cost tracking, and unified actions built into the core request lifecycle.</p>
            </div>
            <div class="feature-card">
                <div class="icon">🏢</div>
                <h3>SaaS Blueprint</h3>
                <p>Subdomain-based multi-tenancy, secure tenant isolation, and Stripe billing integration.</p>
            </div>
            <div class="feature-card">
                <div class="icon">📚</div>
                <h3>Native RAG</h3>
                <p>Automated vector ingestion and similarity search middleware for instant context-aware apps.</p>
            </div>
            <div class="feature-card">
                <div class="icon">🕵️</div>
                <h3>AI Agents</h3>
                <p>Sophisticated agent factory with skill discovery and vector-based long-term memory.</p>
            </div>
            <div class="feature-card">
                <div class="icon">🏗️</div>
                <h3>Enterprise DI</h3>
                <p>Advanced Service Provider architecture with TypeScript decorators and singleton management.</p>
            </div>
            <div class="feature-card">
                <div class="icon">📈</div>
                <h3>Observability</h3>
                <p>Real-time metrics dashboard with AI latency tracking and resource health monitoring.</p>
            </div>
        </div>
    </section>

    <footer>
        <p>&copy; 2026 HyperZ Framework. Built for the next generation of engineers.</p>
    </footer>
</body>
</html>
        `;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }

    /**
     * Health check endpoint.
     * GET /api/health
     */
    async health(req: Request, res: Response): Promise<void> {
        this.success(res, {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
        }, 'System is healthy');
    }
}
