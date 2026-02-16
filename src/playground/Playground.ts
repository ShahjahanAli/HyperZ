// ──────────────────────────────────────────────────────────────
// HyperZ Framework — API Playground (Route Introspection + Inline UI)
// ──────────────────────────────────────────────────────────────

import type { Express, Request, Response } from 'express';
import { Logger } from '../logging/Logger.js';

interface RouteInfo {
  method: string;
  path: string;
  name?: string;
  middleware?: string[];
  source?: string;
  controller?: string;
}

/**
 * Extract all registered routes from the Express app.
 */
function extractRoutes(app: Express): RouteInfo[] {
  const routes: RouteInfo[] = [];

  function walkStack(stack: any[], prefix = '') {
    if (!stack || !Array.isArray(stack)) return;

    for (const layer of stack) {
      try {
        if (layer.route) {
          // Direct route details
          const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
          const path = (prefix + (layer.route.path || '')).replace(/\/+/g, '/');
          const metadata = (layer.route as any)._hyperz || {};

          for (const method of methods) {
            routes.push({
              method,
              path: path === '' ? '/' : path,
              source: metadata.source,
              controller: metadata.controller,
            });
          }
        } else if (layer.name === 'router' || layer.handle?.stack || (layer.handle && typeof layer.handle === 'function' && (layer.handle as any).stack)) {
          // Sub-router or middleware that acts as a router
          let routerPrefix = '';

          // Check for explicit HyperZ mount prefix first
          if ((layer.handle as any)?._hyperzPrefix !== undefined) {
            routerPrefix = (layer.handle as any)._hyperzPrefix;
          } else if (layer.regexp) {
            routerPrefix = layer.regexp.source
              .replace('\\/?(?=\\/|$)', '')
              .replace(/\\\//g, '/')
              .replace(/^\^/, '')
              .replace(/\$.*$/, '') || '';
          }

          const subStack = layer.handle?.stack || (layer.handle as any)?.stack;
          if (subStack) {
            walkStack(subStack, prefix + routerPrefix);
          }
        }
      } catch (err) {
        Logger.error('[Playground] Error walking route stack layer', { error: (err as any).message });
      }
    }
  }

  // Try multiple ways to find the router stack
  const router = (app as any)._router || (app as any).router;
  const stack = router?.stack || (app as any).stack;

  if (stack) {
    walkStack(stack);
  } else {
    Logger.warn('[Playground] Could not find Express router stack');
  }

  // Filter duplicates and sort
  return routes
    .filter((v, i, a) => a.findIndex(t => t.method === v.method && t.path === v.path) === i)
    .sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Register the HyperZ Playground routes on an Express app.
 */
export function registerPlayground(app: Express): void {
  // JSON API for route list
  app.get('/api/playground/routes', (_req: Request, res: Response) => {
    const routes = extractRoutes(app);

    // Filter by allowed sources
    const allowed = ['api', 'web', 'auth'];
    const filtered = routes.filter(r => r.source && allowed.includes(r.source));

    res.json({ routes: filtered });
  });

  // Serve the Playground UI
  app.get('/api/playground', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(getPlaygroundHTML());
  });

  Logger.info('  [+] API Playground available at /api/playground');
}


function getPlaygroundHTML(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>⚡ HyperZ Playground</title>
<style>
/* ══════════════════════════════════════════════════════════════ */
/* HyperZ Playground — Premium Dark/Light Theme                 */
/* ══════════════════════════════════════════════════════════════ */

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  --bg: #0a0a0f;
  --bg-card: #12121a;
  --bg-input: #1a1a28;
  --bg-hover: #1e1e30;
  --border: #2a2a3e;
  --text: #e4e4ef;
  --text-muted: #8888a4;
  --accent: #8b5cf6;
  --accent-hover: #a78bfa;
  --accent-glow: rgba(139,92,246,0.15);
  --green: #22c55e;
  --red: #ef4444;
  --yellow: #eab308;
  --blue: #3b82f6;
  --orange: #f97316;
  --cyan: #06b6d4;
  --font: 'Inter',system-ui,-apple-system,sans-serif;
  --mono: 'JetBrains Mono','Fira Code','SF Mono','Cascadia Code',monospace;
  --radius: 10px;
  --shadow: 0 4px 30px rgba(0,0,0,0.4);
  --glass: rgba(255,255,255,0.03);
}

[data-theme="light"]{
  --bg: #f5f5f7;
  --bg-card: #ffffff;
  --bg-input: #f0f0f5;
  --bg-hover: #e8e8f0;
  --border: #d4d4dd;
  --text: #1a1a2e;
  --text-muted: #666688;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  --accent-glow: rgba(124,58,237,0.1);
  --shadow: 0 4px 20px rgba(0,0,0,0.08);
  --glass: rgba(0,0,0,0.02);
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

body{
  font-family:var(--font);
  background:var(--bg);
  color:var(--text);
  line-height:1.5;
  min-height:100vh;
  overflow-x:hidden;
}

/* ── Top Bar ─────────────────────────────────────────── */
.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 24px;
  background:var(--bg-card);
  border-bottom:1px solid var(--border);
  position:sticky;
  top:0;
  z-index:100;
  backdrop-filter:blur(20px);
}
.topbar-brand{
  display:flex;
  align-items:center;
  gap:10px;
  font-weight:700;
  font-size:18px;
}
.topbar-brand span{color:var(--accent)}
.topbar-actions{display:flex;gap:8px;align-items:center}

.theme-toggle{
  background:var(--bg-input);
  border:1px solid var(--border);
  color:var(--text);
  border-radius:8px;
  padding:6px 12px;
  cursor:pointer;
  font-size:14px;
  transition:all .2s;
}
.theme-toggle:hover{border-color:var(--accent)}

/* ── Layout ──────────────────────────────────────────── */
.layout{
  display:grid;
  grid-template-columns:300px 1fr;
  height:calc(100vh - 49px);
}

/* ── Sidebar ─────────────────────────────────────────── */
.sidebar{
  background:var(--bg-card);
  border-right:1px solid var(--border);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.sidebar-header{
  padding:16px;
  border-bottom:1px solid var(--border);
}
.sidebar-header h3{
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:1.5px;
  color:var(--text-muted);
  margin-bottom:8px;
}
.sidebar-search{
  width:100%;
  background:var(--bg-input);
  border:1px solid var(--border);
  border-radius:var(--radius);
  color:var(--text);
  padding:8px 12px;
  font-size:13px;
  font-family:var(--font);
  outline:none;
  transition:border-color .2s;
}
.sidebar-search:focus{border-color:var(--accent)}

.route-list{
  flex:1;
  overflow-y:auto;
  padding:8px;
}

.group-header {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 12px 8px 4px;
    margin-top: 4px;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.group-header:first-child { margin-top: 0; }
.group-header::after { content: ''; flex: 1; height: 1px; background: var(--border); opacity: 0.5; }

.route-group {
    margin-bottom: 8px;
}

.route-item{
  display:flex;
  align-items:center;
  gap:8px;
  padding:6px 10px;
  border-radius:6px;
  cursor:pointer;
  font-size:13px;
  font-family:var(--mono);
  transition:all .15s;
  margin-bottom:2px;
  border: 1px solid transparent;
}
.route-item:hover{background:var(--bg-hover)}
.route-item.active{background:var(--accent-glow);border-color:var(--accent)}

.method-badge{
  font-size:9px;
  font-weight:700;
  padding:2px 5px;
  border-radius:4px;
  min-width:38px;
  text-align:center;
  letter-spacing:.5px;
}
.method-GET{background:rgba(34,197,94,.15);color:var(--green)}
.method-POST{background:rgba(59,130,246,.15);color:var(--blue)}
.method-PUT{background:rgba(234,179,8,.15);color:var(--yellow)}
.method-PATCH{background:rgba(249,115,22,.15);color:var(--orange)}
.method-DELETE{background:rgba(239,68,68,.15);color:var(--red)}

.route-path{
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    flex:1;
    font-size: 12px;
}

/* ── Main Content ────────────────────────────────────── */
.main{
  display:flex;
  flex-direction:column;
  overflow:hidden;
}

/* ── Request Bar ─────────────────────────────────────── */
.request-bar{
  display:flex;
  gap:8px;
  padding:16px 24px;
  background:var(--bg-card);
  border-bottom:1px solid var(--border);
  align-items:center;
}
.method-select{
  background:var(--accent);
  color:#fff;
  border:none;
  border-radius:var(--radius);
  padding:10px 14px;
  font-weight:700;
  font-size:13px;
  cursor:pointer;
  font-family:var(--font);
  min-width:90px;
}
.method-select option{background:var(--bg-card);color:var(--text)}

.url-input{
  flex:1;
  background:var(--bg-input);
  border:1px solid var(--border);
  border-radius:var(--radius);
  color:var(--text);
  padding:10px 14px;
  font-size:14px;
  font-family:var(--mono);
  outline:none;
  transition:border-color .2s;
}
.url-input:focus{border-color:var(--accent)}

.send-btn{
  background:linear-gradient(135deg, var(--accent), #6d28d9);
  color:#fff;
  border:none;
  border-radius:var(--radius);
  padding:10px 24px;
  font-weight:600;
  font-size:14px;
  cursor:pointer;
  transition:all .2s;
  white-space:nowrap;
}
.send-btn:hover{transform:translateY(-1px);box-shadow:0 4px 15px var(--accent-glow)}
.send-btn:active{transform:translateY(0)}
.send-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}

/* ── Tabs ────────────────────────────────────────────── */
.tabs{
  display:flex;
  gap:0;
  background:var(--bg-card);
  border-bottom:1px solid var(--border);
  padding:0 24px;
}
.tab{
  padding:10px 18px;
  font-size:13px;
  font-weight:500;
  color:var(--text-muted);
  cursor:pointer;
  border-bottom:2px solid transparent;
  transition:all .2s;
}
.tab:hover{color:var(--text)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}

/* ── Tab content ─────────────────────────────────────── */
.tab-content{
  flex:1;
  display:grid;
  grid-template-rows:1fr 1fr;
  overflow:hidden;
}

.pane{
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.pane-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:8px 24px;
  background:var(--bg-card);
  border-bottom:1px solid var(--border);
  font-size:12px;
  text-transform:uppercase;
  letter-spacing:1px;
  color:var(--text-muted);
  font-weight:600;
}

.pane-body{
  flex:1;
  overflow-y:auto;
  padding:16px 24px;
}

/* ── Key-Value Editor ────────────────────────────────── */
.kv-table{width:100%}
.kv-row{
  display:grid;
  grid-template-columns:1fr 1fr 32px;
  gap:6px;
  margin-bottom:6px;
}
.kv-input{
  background:var(--bg-input);
  border:1px solid var(--border);
  border-radius:6px;
  color:var(--text);
  padding:7px 10px;
  font-size:12px;
  font-family:var(--mono);
  outline:none;
}
.kv-input:focus{border-color:var(--accent)}
.kv-remove{
  background:none;
  border:none;
  color:var(--text-muted);
  cursor:pointer;
  font-size:16px;
  padding:0;
  display:flex;
  align-items:center;
  justify-content:center;
}
.kv-remove:hover{color:var(--red)}
.kv-add{
  background:none;
  border:1px dashed var(--border);
  border-radius:6px;
  color:var(--text-muted);
  padding:6px;
  cursor:pointer;
  font-size:12px;
  width:100%;
  transition:all .2s;
}
.kv-add:hover{border-color:var(--accent);color:var(--accent)}

/* ── Body Editor ─────────────────────────────────────── */
.body-editor{
  width:100%;
  min-height:120px;
  background:var(--bg-input);
  border:1px solid var(--border);
  border-radius:var(--radius);
  color:var(--text);
  padding:12px;
  font-family:var(--mono);
  font-size:13px;
  line-height:1.6;
  resize:vertical;
  outline:none;
  tab-size:2;
}
.body-editor:focus{border-color:var(--accent)}

/* ── Response Pane ───────────────────────────────────── */
.response-pane{
  border-top:2px solid var(--border);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.response-meta{
  display:flex;
  gap:16px;
  align-items:center;
}
.status-badge{
  padding:3px 10px;
  border-radius:6px;
  font-weight:700;
  font-size:12px;
  font-family:var(--mono);
}
.status-2xx{background:rgba(34,197,94,.15);color:var(--green)}
.status-3xx{background:rgba(6,182,212,.15);color:var(--cyan)}
.status-4xx{background:rgba(234,179,8,.15);color:var(--yellow)}
.status-5xx{background:rgba(239,68,68,.15);color:var(--red)}

.response-body{
  flex:1;
  overflow-y:auto;
  padding:16px 24px;
}
.response-body pre{
  background:var(--bg-input);
  border:1px solid var(--border);
  border-radius:var(--radius);
  padding:16px;
  font-family:var(--mono);
  font-size:13px;
  line-height:1.6;
  overflow-x:auto;
  white-space:pre-wrap;
  word-break:break-word;
}

/* ── History Panel ───────────────────────────────────── */
.history-item{
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 12px;
  border-radius:8px;
  cursor:pointer;
  font-size:12px;
  font-family:var(--mono);
  transition:background .15s;
  margin-bottom:4px;
  border:1px solid transparent;
}
.history-item:hover{background:var(--bg-hover)}
.history-time{color:var(--text-muted);font-size:11px;margin-left:auto}

/* ── Error Log ───────────────────────────────────────── */
.error-log{
  background:rgba(239,68,68,.05);
  border:1px solid rgba(239,68,68,.2);
  border-radius:var(--radius);
  padding:12px;
  font-family:var(--mono);
  font-size:12px;
  color:var(--red);
  white-space:pre-wrap;
  margin-top:8px;
}

/* ── Empty State ─────────────────────────────────────── */
.empty-state{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  height:100%;
  color:var(--text-muted);
  text-align:center;
  gap:12px;
}
.empty-state .icon{font-size:48px;opacity:.3}
.empty-state p{font-size:14px;max-width:300px}

/* ── Auth section ────────────────────────────────────── */
.auth-section{padding:12px 0}
.auth-row{
  display:flex;
  align-items:center;
  gap:8px;
  margin-bottom:8px;
}
.auth-label{
  font-size:12px;
  color:var(--text-muted);
  min-width:80px;
}

/* ── Loading ─────────────────────────────────────────── */
@keyframes pulse{
  0%,100%{opacity:1}
  50%{opacity:.4}
}
.loading{animation:pulse 1.2s ease-in-out infinite}

/* ── Scrollbar ───────────────────────────────────────── */
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--text-muted)}

/* ── JSON Syntax Highlighting ────────────────────────── */
.json-key{color:var(--accent)}
.json-string{color:var(--green)}
.json-number{color:var(--orange)}
.json-boolean{color:var(--cyan)}
.json-null{color:var(--text-muted)}

/* ── Responsive ──────────────────────────────────────── */
@media(max-width:768px){
  .layout{grid-template-columns:1fr}
  .sidebar{display:none}
}
</style>
</head>
<body>

<!-- ── Top Bar ──────────────────────────────────────── -->
<div class="topbar">
  <div class="topbar-brand">
    ⚡ <span>HyperZ</span> Playground
  </div>
  <div class="topbar-actions">
    <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
  </div>
</div>

<!-- ── Layout ───────────────────────────────────────── -->
<div class="layout">

  <!-- Sidebar -->
  <div class="sidebar">
    <div class="sidebar-header">
      <h3>API Routes</h3>
      <input type="text" class="sidebar-search" placeholder="Search routes..." id="routeSearch" oninput="filterRoutes()">
    </div>
    <div class="route-list" id="routeList">
      <div class="empty-state" style="padding:40px 0">
        <div class="loading">Loading routes...</div>
      </div>
    </div>

    <div class="sidebar-header" style="border-top:1px solid var(--border);border-bottom:none">
      <h3>History</h3>
    </div>
    <div class="route-list" id="historyList" style="max-height:200px">
      <div style="padding:12px;color:var(--text-muted);font-size:12px;text-align:center">No requests yet</div>
    </div>
  </div>

  <!-- Main -->
  <div class="main">

    <!-- Request Bar -->
    <div class="request-bar">
      <select class="method-select" id="methodSelect">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
        <option value="HEAD">HEAD</option>
        <option value="OPTIONS">OPTIONS</option>
      </select>
      <input type="text" class="url-input" id="urlInput" placeholder="Enter request URL..." value="/api">
      <button class="send-btn" id="sendBtn" onclick="sendRequest()">
        Send ⚡
      </button>
    </div>

    <!-- Request Tabs -->
    <div class="tabs">
      <div class="tab active" onclick="switchRequestTab('headers')">Headers</div>
      <div class="tab" onclick="switchRequestTab('body')">Body</div>
      <div class="tab" onclick="switchRequestTab('auth')">Auth</div>
      <div class="tab" onclick="switchRequestTab('params')">Params</div>
    </div>

    <div class="tab-content">
      <!-- Request Editor Pane -->
      <div class="pane">
        <div class="pane-header">
          <span>Request</span>
          <span id="requestInfo" style="font-size:11px;text-transform:none;letter-spacing:0"></span>
        </div>
        <div class="pane-body" id="requestPane">
          <!-- Headers tab (default) -->
          <div id="headersTab">
            <div class="kv-table" id="headersTable">
              <div class="kv-row">
                <input class="kv-input" placeholder="Key" value="Content-Type">
                <input class="kv-input" placeholder="Value" value="application/json">
                <button class="kv-remove" onclick="this.parentElement.remove()">×</button>
              </div>
              <div class="kv-row">
                <input class="kv-input" placeholder="Key" value="Accept">
                <input class="kv-input" placeholder="Value" value="application/json">
                <button class="kv-remove" onclick="this.parentElement.remove()">×</button>
              </div>
            </div>
            <button class="kv-add" onclick="addKVRow('headersTable')">+ Add Header</button>
          </div>
          <div id="bodyTab" style="display:none">
            <textarea class="body-editor" id="bodyEditor" placeholder='{ "key": "value" }'></textarea>
          </div>
          <div id="authTab" style="display:none">
            <div class="auth-section">
              <div class="auth-row">
                <span class="auth-label">Type</span>
                <select class="kv-input" id="authType" style="flex:1" onchange="updateAuthUI()">
                  <option value="none">None</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apikey">API Key</option>
                </select>
              </div>
              <div id="authFields"></div>
            </div>
          </div>
          <div id="paramsTab" style="display:none">
            <div class="kv-table" id="paramsTable">
            </div>
            <button class="kv-add" onclick="addKVRow('paramsTable')">+ Add Parameter</button>
          </div>
        </div>
      </div>

      <!-- Response Pane -->
      <div class="response-pane">
        <div class="pane-header">
          <span>Response</span>
          <div class="response-meta" id="responseMeta" style="display:none">
            <span class="status-badge" id="statusBadge"></span>
            <span id="responseTime" style="font-size:11px;text-transform:none;letter-spacing:0"></span>
            <span id="responseSize" style="font-size:11px;text-transform:none;letter-spacing:0"></span>
          </div>
        </div>

        <div class="tabs" id="responseTabs" style="display:none">
          <div class="tab active" onclick="switchResponseTab('body')">Body</div>
          <div class="tab" onclick="switchResponseTab('headers')">Headers</div>
          <div class="tab" onclick="switchResponseTab('errors')">Errors</div>
        </div>

        <div class="response-body" id="responsePane">
          <div class="empty-state">
            <div class="icon">📡</div>
            <p>Send a request to see the response here</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

<script>
// ══════════════════════════════════════════════════════════════
// HyperZ Playground — Client-Side Logic
// ══════════════════════════════════════════════════════════════

let allRoutes = [];
let history = [];
let currentResponseHeaders = {};
let errors = [];

// ── Theme Toggle ────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.querySelector('.theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('hyperz-theme', next);
}

// Restore theme
const saved = localStorage.getItem('hyperz-theme');
if (saved) {
  document.documentElement.setAttribute('data-theme', saved);
  if (saved === 'light') document.querySelector('.theme-toggle').textContent = '☀️';
}

// ── Load Routes ─────────────────────────────────────────────
async function loadRoutes() {
  try {
    const res = await fetch('/api/playground/routes');
    const data = await res.json();
    allRoutes = data.routes || [];
    renderRoutes(allRoutes);
  } catch {
    document.getElementById('routeList').innerHTML =
      '<div style="padding:12px;color:var(--red);font-size:12px">Failed to load routes</div>';
  }
}

function renderRoutes(routes) {
  const el = document.getElementById('routeList');
  if (routes.length === 0) {
    el.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:12px;text-align:center">No routes found</div>';
    return;
  }

  // Group by Source -> Controller
  const groups = {};
  
  routes.forEach(r => {
      // Group by Controller Name if available, check implicit resource patterns
      let groupName = r.controller || 'Other';
      
      // If implicit pattern (e.g. /api/users, /api/users/:id) and no controller, 
      // try to infer from path if it matches conventions, but we prefer explicit metadata.
      if (groupName === 'Other') {
          // Fallback inference: First segment after /api/
          const parts = r.path.split('/').filter(p => p !== '' && p !== 'api');
          if (parts.length > 0) {
              groupName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          }
      }
      
      const source = r.source ? \`[\${r.source.toUpperCase()}] \` : '';
      const key = source + groupName;
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
  });

  // Render Groups
  const html = Object.keys(groups).sort().map(group => {
      const items = groups[group].map(r => \`
        <div class="route-item" onclick="selectRoute('\${r.method}', '\${r.path}')">
          <span class="method-badge method-\${r.method}">\${r.method}</span>
          <span class="route-path">\${r.path}</span>
        </div>
      \`).join('');
      
      return \`
        <div class="route-group">
            <div class="group-header">\${group}</div>
            \${items}
        </div>
      \`;
  }).join('');

  el.innerHTML = html;
}

function filterRoutes() {
  const q = document.getElementById('routeSearch').value.toLowerCase();
  const filtered = allRoutes.filter(r =>
    r.path.toLowerCase().includes(q) || 
    r.method.toLowerCase().includes(q) ||
    (r.controller && r.controller.toLowerCase().includes(q))
  );
  renderRoutes(filtered);
}

function selectRoute(method, path) {
  document.getElementById('methodSelect').value = method;
  document.getElementById('urlInput').value = path;

  // Highlight active
  document.querySelectorAll('.route-item').forEach(el => el.classList.remove('active'));
  event.currentTarget?.classList.add('active');
}

// ── Request Tabs ────────────────────────────────────────────
function switchRequestTab(tab) {
  const tabs = ['headers', 'body', 'auth', 'params'];
  tabs.forEach(t => {
    document.getElementById(t + 'Tab').style.display = t === tab ? 'block' : 'none';
  });
  // Update local tabs in request pane
  document.querySelectorAll('.tabs:not(#responseTabs) .tab').forEach((el, i) => {
    el.classList.toggle('active', tabs[i] === tab);
  });
}

// ── Response Tabs ───────────────────────────────────────────
function switchResponseTab(tab) {
  document.querySelectorAll('#responseTabs .tab').forEach((el, i) => {
    el.classList.toggle('active', ['body', 'headers', 'errors'][i] === tab);
  });

  const pane = document.getElementById('responsePane');
  if (tab === 'body') {
    pane.innerHTML = pane.dataset.bodyHtml || '';
  } else if (tab === 'headers') {
    const headerHtml = Object.entries(currentResponseHeaders)
      .map(([k,v]) => \`<div class="kv-row" style="grid-template-columns:1fr 2fr;cursor:default"><span style="color:var(--accent);font-family:var(--mono);font-size:12px">\${k}</span><span style="font-family:var(--mono);font-size:12px;word-break:break-all">\${v}</span></div>\`)
      .join('');
    pane.innerHTML = '<div style="padding:4px 0">' + (headerHtml || '<span style="color:var(--text-muted);font-size:12px">No headers</span>') + '</div>';
  } else if (tab === 'errors') {
    if (errors.length === 0) {
      pane.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:12px 0">✅ No errors captured</div>';
    } else {
      pane.innerHTML = errors.map(e => '<div class="error-log">' + escapeHtml(e) + '</div>').join('');
    }
  }
}

// ── KV Row Management ───────────────────────────────────────
function addKVRow(tableId) {
  const row = document.createElement('div');
  row.className = 'kv-row';
  row.innerHTML = \`
    <input class="kv-input" placeholder="Key">
    <input class="kv-input" placeholder="Value">
    <button class="kv-remove" onclick="this.parentElement.remove()">×</button>
  \`;
  document.getElementById(tableId).appendChild(row);
}

function getKVPairs(tableId) {
  const pairs = {};
  document.querySelectorAll('#' + tableId + ' .kv-row').forEach(row => {
    const inputs = row.querySelectorAll('.kv-input');
    if (inputs[0]?.value && inputs[1]?.value) {
      pairs[inputs[0].value] = inputs[1].value;
    }
  });
  return pairs;
}

// ── Auth UI ─────────────────────────────────────────────────
function updateAuthUI() {
  const type = document.getElementById('authType').value;
  const fields = document.getElementById('authFields');

  const templates = {
    none: '',
    bearer: '<div class="auth-row"><span class="auth-label">Token</span><input class="kv-input" id="authToken" style="flex:1" placeholder="Enter JWT or Bearer token"></div>',
    basic: '<div class="auth-row"><span class="auth-label">Username</span><input class="kv-input" id="authUser" style="flex:1" placeholder="Username"></div><div class="auth-row"><span class="auth-label">Password</span><input class="kv-input" id="authPass" type="password" style="flex:1" placeholder="Password"></div>',
    apikey: '<div class="auth-row"><span class="auth-label">Key Name</span><input class="kv-input" id="authKeyName" style="flex:1" placeholder="X-API-Key" value="X-API-Key"></div><div class="auth-row"><span class="auth-label">Value</span><input class="kv-input" id="authKeyValue" style="flex:1" placeholder="your-api-key"></div>',
  };

  fields.innerHTML = templates[type] || '';
}

function getAuthHeaders() {
  const type = document.getElementById('authType').value;
  if (type === 'bearer') {
    const token = document.getElementById('authToken')?.value;
    return token ? { Authorization: 'Bearer ' + token } : {};
  }
  if (type === 'basic') {
    const u = document.getElementById('authUser')?.value || '';
    const p = document.getElementById('authPass')?.value || '';
    return { Authorization: 'Basic ' + btoa(u + ':' + p) };
  }
  if (type === 'apikey') {
    const name = document.getElementById('authKeyName')?.value;
    const val = document.getElementById('authKeyValue')?.value;
    return name && val ? { [name]: val } : {};
  }
  return {};
}

// ── Send Request ────────────────────────────────────────────
async function sendRequest() {
  const method = document.getElementById('methodSelect').value;
  let url = document.getElementById('urlInput').value;

  if (!url) { url = '/'; document.getElementById('urlInput').value = url; }

  // Add query params
  const params = getKVPairs('paramsTable');
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }

  const headers = { ...getKVPairs('headersTable'), ...getAuthHeaders() };
  const body = document.getElementById('bodyEditor').value;
  const sendBtn = document.getElementById('sendBtn');

  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending...';
  errors = [];

  const start = performance.now();

  try {
    const fetchOpts = { method, headers };
    if (['POST','PUT','PATCH'].includes(method) && body) {
      fetchOpts.body = body;
    }

    const res = await fetch(url, fetchOpts);
    const elapsed = Math.round(performance.now() - start);
    const text = await res.text();
    const size = new Blob([text]).size;

    // Store response headers
    currentResponseHeaders = {};
    res.headers.forEach((v, k) => currentResponseHeaders[k] = v);

    // Status badge
    const meta = document.getElementById('responseMeta');
    meta.style.display = 'flex';
    const badge = document.getElementById('statusBadge');
    badge.textContent = res.status + ' ' + res.statusText;
    badge.className = 'status-badge status-' + (
      res.status < 300 ? '2xx' : res.status < 400 ? '3xx' : res.status < 500 ? '4xx' : '5xx'
    );

    document.getElementById('responseTime').textContent = elapsed + 'ms';
    document.getElementById('responseSize').textContent = formatBytes(size);

    // Response body
    let formatted;
    try {
      const json = JSON.parse(text);
      formatted = '<pre>' + syntaxHighlight(JSON.stringify(json, null, 2)) + '</pre>';
    } catch {
      formatted = '<pre>' + escapeHtml(text) + '</pre>';
    }

    const pane = document.getElementById('responsePane');
    pane.innerHTML = formatted;
    pane.dataset.bodyHtml = formatted;

    // Show response tabs
    document.getElementById('responseTabs').style.display = 'flex';

    // Track errors
    if (res.status >= 400) {
      errors.push(\`[\${new Date().toLocaleTimeString()}] \${method} \${url}\\nStatus: \${res.status} \${res.statusText}\\n\\n\${text}\`);
    }

    // History
    addHistory(method, url, res.status, elapsed);

  } catch (err) {
    const elapsed = Math.round(performance.now() - start);
    errors.push(\`[\${new Date().toLocaleTimeString()}] \${method} \${url}\\nError: \${err.message}\`);

    const pane = document.getElementById('responsePane');
    pane.innerHTML = '<div class="error-log">Network Error: ' + escapeHtml(err.message) + '</div>';
    pane.dataset.bodyHtml = pane.innerHTML;

    document.getElementById('responseTabs').style.display = 'flex';
    addHistory(method, url, 'ERR', elapsed);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send ⚡';
  }
}

// ── History ─────────────────────────────────────────────────
function addHistory(method, url, status, time) {
  history.unshift({ method, url, status, time, ts: new Date() });
  if (history.length > 50) history.pop();
  renderHistory();
}

function renderHistory() {
  const el = document.getElementById('historyList');
  el.innerHTML = history.map(h => \`
    <div class="history-item" onclick="selectRoute('\${h.method}', '\${h.url}')">
      <span class="method-badge method-\${h.method}" style="font-size:9px;padding:1px 4px">\${h.method}</span>
      <span style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">\${h.url}</span>
      <span class="status-badge \${typeof h.status === 'number' ? 'status-' + (h.status < 300 ? '2xx' : h.status < 400 ? '3xx' : h.status < 500 ? '4xx' : '5xx') : 'status-5xx'}" style="font-size:10px;padding:1px 5px">\${h.status}</span>
      <span class="history-time">\${h.time}ms</span>
    </div>
  \`).join('');
}

// ── Helpers ─────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function syntaxHighlight(json) {
  return escapeHtml(json).replace(
    /("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,
    function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    }
  );
}

// ── Keyboard Shortcuts ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    sendRequest();
  }
});

// ── Init ────────────────────────────────────────────────────
loadRoutes();
</script>
</body>
</html>`;
}
