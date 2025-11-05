#!/usr/bin/env node
/**
 * Health Check Script
 * 
 * Performs health checks on backend and frontend endpoints.
 * Writes timestamped results to ops/uptime/YYYY/MM/DD/*.json
 */

import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BACKEND = process.env.BACKEND_HEALTH_URL;
const FRONTEND = process.env.FRONTEND_URL;

if (!BACKEND || !FRONTEND) {
  console.error('❌ Missing BACKEND_HEALTH_URL or FRONTEND_URL');
  console.error('\nRequired environment variables:');
  console.error('  - BACKEND_HEALTH_URL (e.g., https://api.productifyai.com/api/health)');
  console.error('  - FRONTEND_URL (e.g., https://productifyai.com)');
  process.exit(1);
}

/**
 * Ping a URL and measure response time
 */
async function ping(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { 
      method: 'GET',
      headers: { 'User-Agent': 'ProductifyAI-HealthCheck/1.0' }
    });
    const latency = Date.now() - start;
    
    return {
      url,
      status: res.ok ? 'ok' : 'error',
      statusCode: res.status,
      latency_ms: latency,
      ok: res.ok,
    };
  } catch (e) {
    const latency = Date.now() - start;
    return {
      url,
      status: 'error',
      statusCode: 0,
      latency_ms: latency,
      ok: false,
      error: String(e),
    };
  }
}

/**
 * Get dated output directory (YYYY/MM/DD)
 */
function getDatedOutputDir() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return join(__dirname, '..', 'ops', 'uptime', String(year), month, day);
}

/**
 * Main execution
 */
async function main() {
  const timestamp = new Date().toISOString();
  console.log(`🔍 Health check started at ${timestamp}`);
  console.log(`   Backend: ${BACKEND}`);
  console.log(`   Frontend: ${FRONTEND}\n`);

  // Perform health checks
  const [backend, frontend] = await Promise.all([
    ping(BACKEND),
    ping(FRONTEND)
  ]);

  const overall = backend.ok && frontend.ok ? 'healthy' : 'unhealthy';

  // Create report
  const report = {
    timestamp,
    backend,
    frontend,
    overall,
  };

  // Write to dated directory
  const outDir = getDatedOutputDir();
  mkdirSync(outDir, { recursive: true });

  const filename = `${timestamp.replace(/:/g, '-').replace(/\./g, '-')}.json`;
  const filepath = join(outDir, filename);
  
  writeFileSync(filepath, JSON.stringify(report, null, 2));

  // Also write to latest directory for backward compatibility
  const latestDir = join(__dirname, '..', 'ops', 'uptime', 'latest');
  mkdirSync(latestDir, { recursive: true });
  writeFileSync(join(latestDir, 'report.json'), JSON.stringify(report, null, 2));

  // Log results
  console.log('Results:');
  console.log(`  Backend:  ${backend.ok ? '✅' : '❌'} ${backend.statusCode} (${backend.latency_ms}ms)`);
  console.log(`  Frontend: ${frontend.ok ? '✅' : '❌'} ${frontend.statusCode} (${frontend.latency_ms}ms)`);
  console.log(`  Overall:  ${overall === 'healthy' ? '✅' : '❌'} ${overall}`);
  console.log(`\n📁 Report saved to: ${filepath}`);

  if (overall !== 'healthy') {
    console.error('\n❌ Health check failed!');
    if (backend.error) console.error(`   Backend error: ${backend.error}`);
    if (frontend.error) console.error(`   Frontend error: ${frontend.error}`);
    process.exit(1);
  }

  console.log('\n✅ Health check passed');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
