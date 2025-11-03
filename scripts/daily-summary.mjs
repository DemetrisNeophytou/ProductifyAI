#!/usr/bin/env node
/**
 * Daily Summary Script
 * 
 * Aggregates health check logs from a day into a markdown report.
 * Reads from ops/uptime/YYYY/MM/DD/*.json and writes to ops/uptime/REPORTS/YYYY-MM-DD.md
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..');

/**
 * Get today's date components
 */
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return { year, month, day };
}

/**
 * Get log directory for a specific date
 */
function getLogDirectory(year, month, day) {
  return join(repoRoot, 'ops', 'uptime', String(year), month, day);
}

/**
 * Get reports directory
 */
function getReportsDirectory() {
  return join(repoRoot, 'ops', 'uptime', 'REPORTS');
}

/**
 * Get report file path
 */
function getReportPath(year, month, day) {
  const reportsDir = getReportsDirectory();
  return join(reportsDir, `${year}-${month}-${day}.md`);
}

/**
 * Read all log files from a directory
 */
async function readLogFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  try {
    const files = await readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const logs = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const content = await readFile(join(dir, file), 'utf-8');
          return JSON.parse(content);
        } catch (error) {
          console.warn(`Warning: Failed to parse ${file}: ${error.message}`);
          return null;
        }
      })
    );

    return logs.filter(log => log !== null).sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  } catch (error) {
    console.error(`Error reading log directory: ${error.message}`);
    return [];
  }
}

/**
 * Calculate statistics from logs
 */
function calculateStats(logs) {
  if (logs.length === 0) {
    return {
      totalChecks: 0,
      healthyChecks: 0,
      unhealthyChecks: 0,
      uptimePercentage: 0,
      avgBackendLatency: 0,
      avgFrontendLatency: 0,
      maxBackendLatency: 0,
      maxFrontendLatency: 0,
      incidents: [],
    };
  }

  let healthyCount = 0;
  let backendLatencies = [];
  let frontendLatencies = [];
  const incidents = [];

  for (const log of logs) {
    const isHealthy = log.overall === 'healthy';
    if (isHealthy) {
      healthyCount++;
    } else {
      incidents.push({
        timestamp: log.timestamp,
        backend: log.backend.status,
        frontend: log.frontend.status,
        backendLatency: log.backend.latency_ms,
        frontendLatency: log.frontend.latency_ms,
      });
    }

    if (log.backend.latency_ms !== undefined) {
      backendLatencies.push(log.backend.latency_ms);
    }
    if (log.frontend.latency_ms !== undefined) {
      frontendLatencies.push(log.frontend.latency_ms);
    }
  }

  const avgLatency = (arr) => arr.length > 0 
    ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    : 0;

  const maxLatency = (arr) => arr.length > 0 ? Math.max(...arr) : 0;

  return {
    totalChecks: logs.length,
    healthyChecks: healthyCount,
    unhealthyChecks: logs.length - healthyCount,
    uptimePercentage: logs.length > 0 
      ? Math.round((healthyCount / logs.length) * 100 * 100) / 100
      : 0,
    avgBackendLatency: avgLatency(backendLatencies),
    avgFrontendLatency: avgLatency(frontendLatencies),
    maxBackendLatency: maxLatency(backendLatencies),
    maxFrontendLatency: maxLatency(frontendLatencies),
    incidents,
  };
}

/**
 * Generate markdown report
 */
function generateReport(date, stats, logs) {
  const { year, month, day } = date;
  const dateStr = `${year}-${month}-${day}`;
  const dateFormatted = new Date(year, parseInt(month) - 1, parseInt(day)).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let report = `# Uptime Report: ${dateStr}\n\n`;
  report += `**Date:** ${dateFormatted}\n\n`;
  report += `---\n\n`;

  // Summary Statistics
  report += `## 📊 Summary Statistics\n\n`;
  report += `- **Total Health Checks:** ${stats.totalChecks}\n`;
  report += `- **Healthy Checks:** ${stats.healthyChecks}\n`;
  report += `- **Unhealthy Checks:** ${stats.unhealthyChecks}\n`;
  report += `- **Uptime Percentage:** ${stats.uptimePercentage}%\n`;
  report += `- **Average Backend Latency:** ${stats.avgBackendLatency}ms\n`;
  report += `- **Average Frontend Latency:** ${stats.avgFrontendLatency}ms\n`;
  report += `- **Max Backend Latency:** ${stats.maxBackendLatency}ms\n`;
  report += `- **Max Frontend Latency:** ${stats.maxFrontendLatency}ms\n\n`;

  // Status Indicator
  if (stats.uptimePercentage >= 99.9) {
    report += `✅ **Status:** Excellent (99.9%+ uptime)\n\n`;
  } else if (stats.uptimePercentage >= 99.0) {
    report += `✅ **Status:** Good (99%+ uptime)\n\n`;
  } else if (stats.uptimePercentage >= 95.0) {
    report += `⚠️ **Status:** Acceptable (95%+ uptime)\n\n`;
  } else {
    report += `❌ **Status:** Needs Attention (<95% uptime)\n\n`;
  }

  // Incidents
  if (stats.incidents.length > 0) {
    report += `## 🚨 Incidents (${stats.incidents.length})\n\n`;
    report += `| Time | Backend | Frontend | Backend Latency | Frontend Latency |\n`;
    report += `|------|---------|----------|-----------------|------------------|\n`;
    
    for (const incident of stats.incidents) {
      const time = new Date(incident.timestamp).toLocaleTimeString('en-US', { hour12: false });
      const backendStatus = incident.backend === 'ok' ? '✅' : '❌';
      const frontendStatus = incident.frontend === 'ok' ? '✅' : '❌';
      report += `| ${time} | ${backendStatus} ${incident.backend} | ${frontendStatus} ${incident.frontend} | ${incident.backendLatency}ms | ${incident.frontendLatency}ms |\n`;
    }
    report += `\n`;
  } else {
    report += `## ✅ No Incidents\n\n`;
    report += `All health checks passed successfully throughout the day.\n\n`;
  }

  // Timeline (first and last check)
  if (logs.length > 0) {
    report += `## ⏰ Timeline\n\n`;
    report += `- **First Check:** ${new Date(logs[0].timestamp).toLocaleString()}\n`;
    report += `- **Last Check:** ${new Date(logs[logs.length - 1].timestamp).toLocaleString()}\n`;
    report += `- **Checks Interval:** ~5 minutes\n\n`;
  }

  report += `---\n\n`;
  report += `*Generated automatically by daily-summary.mjs*\n`;

  return report;
}

/**
 * Main execution
 */
async function main() {
  const { year, month, day } = getTodayDate();
  const logDir = getLogDirectory(year, month, day);
  const reportsDir = getReportsDirectory();
  const reportPath = getReportPath(year, month, day);

  console.log(`📅 Generating daily summary for ${year}-${month}-${day}...`);

  // Read logs
  const logs = await readLogFiles(logDir);
  
  if (logs.length === 0) {
    console.warn(`⚠️  No log files found in ${logDir}`);
    console.log('Creating empty report...');
  } else {
    console.log(`📊 Found ${logs.length} health check logs`);
  }

  // Calculate statistics
  const stats = calculateStats(logs);

  // Generate report
  const report = generateReport({ year, month, day }, stats, logs);

  // Ensure reports directory exists
  if (!existsSync(reportsDir)) {
    await mkdir(reportsDir, { recursive: true });
  }

  // Write report
  await writeFile(reportPath, report);
  console.log(`✅ Report saved to: ${reportPath}`);

  // Print summary
  console.log(`\n📈 Summary:`);
  console.log(`  Total Checks: ${stats.totalChecks}`);
  console.log(`  Uptime: ${stats.uptimePercentage}%`);
  console.log(`  Incidents: ${stats.incidents.length}`);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

