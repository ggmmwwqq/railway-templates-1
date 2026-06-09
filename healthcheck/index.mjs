import http from 'node:http';
import os from 'node:os';

const PORT = parseInt(process.env.SIDECAR_PORT || '8090', 10);
const PB_HOST = process.env.PB_HOST || '127.0.0.1';
const PB_PORT = parseInt(process.env.PORT || '8080', 10);

const START_TIME = Date.now();

function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function checkPocketBase() {
  return new Promise((resolve) => {
    const req = http.get(
      `http://${PB_HOST}:${PB_PORT}/api/health`,
      { timeout: 3000 },
      (r) => {
        let body = '';
        r.on('data', (c) => (body += c));
        r.on('end', () => resolve(r.statusCode === 200));
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/healthcheck' || req.url === '/health') {
    const ok = await checkPocketBase();
    json(res, ok ? 200 : 503, {
      status: ok ? 'healthy' : 'unhealthy',
      pocketbase: ok ? 'running' : 'unreachable',
    });
    return;
  }

  if (req.url === '/ready') {
    const ok = await checkPocketBase();
    json(res, ok ? 200 : 503, {
      status: ok ? 'ready' : 'not_ready',
    });
    return;
  }

  if (req.url === '/metrics') {
    const mem = process.memoryUsage();
    json(res, 200, {
      uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
      process_uptime_seconds: Math.floor(process.uptime()),
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        total_mem_mb: Math.round(os.totalmem() / 1024 / 1024),
        free_mem_mb: Math.round(os.freemem() / 1024 / 1024),
        loadavg: os.loadavg(),
      },
      node_version: process.version,
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  console.log(`[health-sidecar] listening on port ${PORT}`);
});
