# Operations & Uptime Monitoring

This directory contains scripts and data for monitoring the health and uptime of ProductifyAI services.

## Overview

The uptime monitoring system tracks:
- **Backend Health**: API health endpoint availability and latency
- **Frontend Availability**: Frontend application accessibility and response time
- **Daily Reports**: Aggregated uptime statistics and incident summaries

## Directory Structure

```
ops/
├── README.md              # This file
└── uptime/               # Uptime logs (git-ignored, auto-committed by workflow)
    ├── YYYY/
    │   └── MM/
    │       └── DD/
    │           └── *.json  # Individual health check results
    └── REPORTS/
        └── YYYY-MM-DD.md  # Daily summary reports
```

## Setup

### Prerequisites

- Node.js 22+
- GitHub Actions secrets configured (see Secrets section)

### Required GitHub Secrets

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

**Required:**
- `BACKEND_HEALTH_URL` - Backend health check endpoint (e.g., `https://api.productifyai.com/api/health`)
- `FRONTEND_URL` - Frontend URL (e.g., `https://productifyai.com`)
- `ALERT_EMAIL_TO` - Comma-separated email addresses for alerts
- `RESEND_API_KEY` - Resend API key for email notifications

**Optional:**
- `SLACK_WEBHOOK_URL` - Slack webhook URL for alerts (alternative to email)
- `RENDER_API_KEY` - Render API key for auto-restart (if using Render)
- `RENDER_SERVICE_ID` - Render service ID for auto-restart
- `ENABLE_AUTO_RESTART` - Set to `true` to enable auto-restart on failure

## Scripts

### `scripts/healthcheck.mjs`

Performs health checks on backend and frontend endpoints.

**Usage:**
```bash
node scripts/healthcheck.mjs
```

**What it does:**
1. Checks `BACKEND_HEALTH_URL` availability and latency
2. Checks `FRONTEND_URL` availability and latency
3. Writes results to `ops/uptime/YYYY/MM/DD/timestamp.json`
4. Returns exit code 0 if both services are healthy, 1 otherwise

**Output format:**
```json
{
  "timestamp": "2025-11-02T14:30:00.000Z",
  "backend": {
    "url": "https://api.productifyai.com/api/health",
    "status": "ok",
    "latency_ms": 45,
    "statusCode": 200
  },
  "frontend": {
    "url": "https://productifyai.com",
    "status": "ok",
    "latency_ms": 120,
    "statusCode": 200
  },
  "overall": "healthy"
}
```

### `scripts/daily-summary.mjs`

Aggregates daily health check logs into a markdown report.

**Usage:**
```bash
node scripts/daily-summary.mjs
```

**What it does:**
1. Reads all health check logs from `ops/uptime/YYYY/MM/DD/*.json`
2. Calculates uptime percentage, average latency, incident count
3. Generates markdown report in `ops/uptime/REPORTS/YYYY-MM-DD.md`
4. Includes summary statistics and incident timeline

**Output location:**
- `ops/uptime/REPORTS/YYYY-MM-DD.md`

### `scripts/alert.mjs`

Sends alerts when services are down or unhealthy.

**Usage:**
```bash
node scripts/alert.mjs <incident_type> <message>
```

**What it does:**
1. Sends email alerts via Resend (if `RESEND_API_KEY` is set)
2. Sends Slack notifications (if `SLACK_WEBHOOK_URL` is set)
3. Prints alert details to console

**Required secrets:**
- `ALERT_EMAIL_TO` - Recipient email addresses
- `RESEND_API_KEY` - Resend API key (for email)
- `SLACK_WEBHOOK_URL` - Slack webhook (optional, for Slack notifications)

## GitHub Actions Workflow

The `.github/workflows/uptime.yml` workflow runs:

1. **Every 5 minutes**: Health checks via `healthcheck.mjs`
2. **Daily at 23:55 UTC**: Daily summary generation via `daily-summary.mjs`
3. **On manual trigger**: Via `workflow_dispatch`

### Workflow Steps

1. Checkout repository
2. Setup Node.js 22
3. Install dependencies (`npm ci --omit=dev`)
4. Run health check script
5. Commit logs to repository (if changes exist)
6. Generate daily summary (if scheduled)

## Local Development

### Run health check manually:
```bash
export BACKEND_HEALTH_URL="http://localhost:5050/api/health"
export FRONTEND_URL="http://localhost:5173"
node scripts/healthcheck.mjs
```

### Generate daily summary manually:
```bash
node scripts/daily-summary.mjs
```

### Test alert system:
```bash
export RESEND_API_KEY="your-key"
export ALERT_EMAIL_TO="test@example.com"
node scripts/alert.mjs "test" "This is a test alert"
```

## Monitoring Dashboard

View uptime statistics by checking the daily reports:
```bash
cat ops/uptime/REPORTS/$(date +%Y-%m-%d).md
```

## Troubleshooting

### Health checks failing

1. Verify URLs are correct in GitHub Secrets
2. Check if services are accessible from GitHub Actions runners
3. Review logs in `ops/uptime/` directory

### Alerts not sending

1. Verify secrets are set correctly in GitHub
2. Check Resend API key is valid
3. Verify email addresses in `ALERT_EMAIL_TO` are correct

### Daily summary not generating

1. Ensure health check logs exist for the day
2. Check workflow schedule is correct
3. Review workflow run logs in GitHub Actions

## Maintenance

- Logs are automatically committed by the workflow
- Old logs can be archived periodically (git history preserves them)
- Daily reports are kept indefinitely for historical reference

## Support

For issues or questions:
1. Check GitHub Actions workflow runs
2. Review logs in `ops/uptime/` directory
3. Verify secrets are configured correctly

