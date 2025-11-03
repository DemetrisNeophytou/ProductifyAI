import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND = process.env.BACKEND_HEALTH_URL;
const FRONTEND = process.env.FRONTEND_URL;

if (!BACKEND || !FRONTEND) {
  console.error('Missing BACKEND_HEALTH_URL or FRONTEND_URL');
  process.exit(1);
}

async function ping(url) {
  const start = Date.now();
  try {
    const res = await fetch(url);
    return { ok: res.ok, status: res.status, ms: Date.now() - start, url };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - start, url, error: String(e) };
  }
}

const [b, f] = await Promise.all([ping(BACKEND), ping(FRONTEND)]);
const ok = b.ok && f.ok;

const outDir = join(__dirname, '..', 'ops', 'uptime', 'latest');
mkdirSync(outDir, { recursive: true });

const report = { timestamp: new Date().toISOString(), ok, backend: b, frontend: f };
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));

if (!ok) {
  console.error('Health check failed:', report);
  process.exit(1);
} else {
  console.log('Health OK:', report);
}
