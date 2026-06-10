import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';

const LISTEN_PORT = parseInt(process.env.PORT || '8080', 10);
const PB_HOST = process.env.PB_HOST || '127.0.0.1';
const PB_PORT = parseInt(process.env.PB_INTERNAL_PORT || '8090', 10);

const START_TIME = Date.now();

// ── HTML Templates ──────────────────────────────────────────

function htmlPage(title, body, status = '') {
  const statusBadge = status
    ? `<div class="badge ${status}">${status === 'healthy' ? 'Healthy' : status === 'warning' ? 'Warning' : 'Error'}</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0c0c0d;color:#e4e4e7;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{max-width:600px;width:100%;padding:48px 24px}
h1{font-size:28px;font-weight:700;margin-bottom:8px;color:#fff}
.subtitle{font-size:16px;color:#a1a1aa;margin-bottom:32px}
.badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600}
.badge.healthy{background:#064e3b;color:#6ee7b7}
.badge.warning{background:#78350f;color:#fcd34d}
.badge.error{background:#7f1d1d;color:#fca5a5}
.badge::before{content:'';width:8px;height:8px;border-radius:50%}
.badge.healthy::before{background:#34d399}
.badge.warning::before{background:#fbbf24}
.badge.error::before{background:#f87171}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border:1px solid #27272a;border-radius:8px;font-size:14px;font-weight:500;color:#e4e4e7;background:#18181b;text-decoration:none;transition:background .15s,border-color .15s}
.btn:hover{background:#27272a;border-color:#3f3f46}
.btn.primary{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
.btn.primary:hover{background:#2563eb;border-color:#2563eb}
.status-grid{display:grid;gap:12px;margin-top:24px}
.status-row{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#18181b;border:1px solid #27272a;border-radius:8px}
.status-row .label{font-size:14px;color:#a1a1aa}
.status-row .value{font-size:14px;font-weight:600}
.value.ok{color:#6ee7b7}
.value.warn{color:#fcd34d}
.value.err{color:#fca5a5}
.info{font-size:13px;color:#71717a;margin-top:8px}
.warn-box{margin-top:24px;padding:16px;background:#422006;border:1px solid #78350f;border-radius:8px;font-size:14px;color:#fcd34d;line-height:1.6}
.footer{margin-top:40px;font-size:12px;color:#52525b;text-align:center}
</style>
</head>
<body>
<div class="container">
${statusBadge}
${body}
<div class="footer">PocketBase Instant Backend &middot; Railway</div>
</div>
</body>
</html>`;
}

function landingPage(pbOk) {
  const status = pbOk ? 'healthy' : 'error';
  return htmlPage('PocketBase Instant Backend', `
<h1>PocketBase Instant Backend</h1>
<p class="subtitle">The easiest way to run PocketBase on Railway.</p>
<div class="actions">
  <a href="/_/" class="btn primary">Open Admin Panel</a>
  <a href="/api/" class="btn">API Endpoint</a>
  <a href="/system" class="btn">System Status</a>
</div>
`, status);
}

function systemPage(pbOk, info) {
  return htmlPage('System Status', `
<h1>System Status</h1>
<p class="subtitle">PocketBase runtime diagnostics</p>
<div class="status-grid">
  <div class="status-row"><span class="label">PocketBase</span><span class="value ${pbOk ? 'ok' : 'err'}">${pbOk ? 'Running' : 'Unreachable'}</span></div>
  <div class="status-row"><span class="label">Uptime</span><span class="value ok">${fmtUptime()}</span></div>
  <div class="status-row"><span class="label">Admin Account</span><span class="value ${info.admin ? 'ok' : 'warn'}">${info.admin ? 'Configured' : 'Not Set'}</span></div>
  <div class="status-row"><span class="label">Storage</span><span class="value ${info.storage ? 'ok' : 'warn'}">${info.storage ? 'Connected' : 'Missing'}</span></div>
  <div class="status-row"><span class="label">Environment</span><span class="value ok">${info.railway ? 'Railway' : 'Local'}</span></div>
  <div class="status-row"><span class="label">Port</span><span class="value ok">${LISTEN_PORT}</span></div>
</div>
${!info.storage ? renderStorageWarning() : ''}
${!info.admin ? renderAdminWarning() : ''}
<div class="actions" style="margin-top:24px">
  <a href="/" class="btn">Back Home</a>
  <a href="/_/" class="btn primary">Admin Panel</a>
  <a href="/health" class="btn">Health Check</a>
</div>
`, pbOk ? 'healthy' : 'error');
}

function renderStorageWarning() {
  return `<div class="warn-box"><strong>Persistent storage is not configured.</strong><br>Your data will be lost after redeployment.<br>Add a Railway Volume mounted at <code>/pb_data</code>.</div>`;
}

function renderAdminWarning() {
  return `<div class="warn-box"><strong>No admin account detected.</strong><br>Open the <a href="/_/" style="color:#fcd34d">PocketBase Admin UI</a> to create one on first visit.</div>`;
}

function fmtUptime() {
  const s = Math.floor((Date.now() - START_TIME) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// ── Health Check ────────────────────────────────────────────

function checkPocketBase() {
  return new Promise((resolve) => {
    const req = http.get(`http://${PB_HOST}:${PB_PORT}/api/health`, { timeout: 3000 }, (r) => {
      let body = '';
      r.on('data', (c) => (body += c));
      r.on('end', () => resolve(r.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// ── Status File Readers ─────────────────────────────────────

function readStatusFile(path) {
  try { return fs.readFileSync(path, 'utf8').trim(); } catch { return ''; }
}

function getSystemInfo() {
  return {
    admin: readStatusFile('/tmp/pb_admin_status') === 'configured',
    storage: readStatusFile('/tmp/pb_storage_status') === 'connected',
    railway: !!(process.env.RAILWAY_SERVICE_ID || process.env.RAILWAY_ENV),
  };
}

// ── JSON Helpers ────────────────────────────────────────────

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function html(res, code, content) {
  res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(content);
}

// ── Reverse Proxy ───────────────────────────────────────────

function proxyRequest(req, res) {
  const options = {
    hostname: PB_HOST,
    port: PB_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${PB_HOST}:${PB_PORT}` },
  };
  delete options.headers['if-none-match'];

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlPage('Service Unavailable', '<h1>Backend Unreachable</h1><p class="subtitle">PocketBase is starting or has crashed. Retrying automatically.</p>', 'error'));
    }
  });

  req.pipe(proxyReq);
}

// ── Server ──────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = req.url;

  // Landing page
  if (url === '/' || url === '/index.html') {
    const ok = await checkPocketBase();
    return html(res, ok ? 200 : 503, landingPage(ok));
  }

  // System status page
  if (url === '/system') {
    const ok = await checkPocketBase();
    return html(res, 200, systemPage(ok, getSystemInfo()));
  }

  // Health endpoints
  if (url === '/health' || url === '/healthcheck') {
    const ok = await checkPocketBase();
    return json(res, ok ? 200 : 503, { status: ok ? 'ok' : 'error' });
  }

  // Readiness
  if (url === '/ready') {
    const ok = await checkPocketBase();
    return json(res, ok ? 200 : 503, { status: ok ? 'ready' : 'not_ready' });
  }

  // Metrics (kept for observability)
  if (url === '/metrics') {
    const mem = process.memoryUsage();
    return json(res, 200, {
      uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
      memory: {
        rss_mb: Math.round(mem.rss / 1048576),
        heap_used_mb: Math.round(mem.heapUsed / 1048576),
      },
      system: {
        cpus: os.cpus().length,
        free_mem_mb: Math.round(os.freemem() / 1048576),
        total_mem_mb: Math.round(os.totalmem() / 1048576),
        loadavg: os.loadavg(),
      },
      node_version: process.version,
      storage: readStatusFile('/tmp/pb_storage_status'),
      admin: readStatusFile('/tmp/pb_admin_status'),
    });
  }

  // Everything else → PocketBase
  proxyRequest(req, res);
});

server.listen(LISTEN_PORT, () => {
  console.log(`[proxy] listening on port ${LISTEN_PORT}`);
  console.log(`[proxy] forwarding to pocketbase at ${PB_HOST}:${PB_PORT}`);
});
