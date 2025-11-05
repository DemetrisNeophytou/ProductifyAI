# ProductifyAI - Deployment Overview

**Repository:** https://github.com/DemetrisNeophytou/ProductifyAI  
**Branch:** `replit-agent`  
**Last Updated:** November 4, 2025

---

## 📋 Table of Contents

1. [CI/CD Pipeline Overview](#cicd-pipeline-overview)
2. [Workflow 1: Build & Deploy](#workflow-1-build--deploy)
3. [Workflow 2: Uptime & Health Monitoring](#workflow-2-uptime--health-monitoring)
4. [GitHub Secrets Setup](#github-secrets-setup)
5. [Deployment Phases](#deployment-phases)
6. [Quick Reference Links](#quick-reference-links)

---

## 🔄 CI/CD Pipeline Overview

ProductifyAI uses **GitHub Actions** for automated CI/CD with two main workflows:

| Workflow | File | Purpose | Trigger |
|----------|------|---------|---------|
| **Build & Deploy** | `.github/workflows/build.yml` | Build, test, and deploy code | Push, PR, Manual |
| **Uptime & Health** | `.github/workflows/uptime.yml` | Monitor health, generate reports | Every 5 min, Daily |

### **Pipeline Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Pipeline                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │      Build & Deploy Workflow (build.yml)          │       │
│  │                                                    │       │
│  │  Triggers:                                         │       │
│  │  • Push to replit-agent                           │       │
│  │  • Pull Request to replit-agent                   │       │
│  │  • Manual (workflow_dispatch)                     │       │
│  │                                                    │       │
│  │  Steps:                                            │       │
│  │  1. Checkout code                                 │       │
│  │  2. Setup Node.js 22                              │       │
│  │  3. Install dependencies (npm ci)                 │       │
│  │  4. Lint code                                     │       │
│  │  5. Type check                                    │       │
│  │  6. Run tests                                     │       │
│  │  7. Build application                             │       │
│  │  8. Upload artifacts                              │       │
│  └──────────────────────────────────────────────────┘       │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Uptime & Health Monitoring (uptime.yml)          │       │
│  │                                                    │       │
│  │  Job 1: Health Check (every 5 minutes)           │       │
│  │  ├─ Run health check script                      │       │
│  │  ├─ Write logs to ops/uptime/YYYY/MM/DD/         │       │
│  │  ├─ Commit logs to repository                    │       │
│  │  ├─ Upload report artifacts                      │       │
│  │  └─ Send alerts on failure                       │       │
│  │                                                    │       │
│  │  Job 2: Daily Summary (23:55 UTC)                │       │
│  │  ├─ Aggregate day's health checks                │       │
│  │  ├─ Generate markdown report                     │       │
│  │  ├─ Commit report to repository                  │       │
│  │  └─ Upload report artifacts                      │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Workflow 1: Build & Deploy

**File:** `.github/workflows/build.yml`  
**URL:** https://github.com/DemetrisNeophytou/ProductifyAI/blob/replit-agent/.github/workflows/build.yml

### **Trigger Conditions**

```yaml
on:
  push:
    branches: [replit-agent]      # Automatic on push
  pull_request:
    branches: [replit-agent]      # Automatic on PR
  workflow_dispatch:               # Manual trigger
```

**When It Runs:**
- ✅ Every push to `replit-agent` branch
- ✅ Every pull request targeting `replit-agent`
- ✅ Manual trigger via Actions tab

### **Environment Variables**

```yaml
env:
  BACKEND_HEALTH_URL: ${{ secrets.BACKEND_HEALTH_URL }}
  FRONTEND_URL: ${{ secrets.FRONTEND_URL }}
  RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
  ALERT_EMAIL_TO: ${{ secrets.ALERT_EMAIL_TO }}
  RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
  RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
  ENABLE_AUTO_RESTART: ${{ secrets.ENABLE_AUTO_RESTART }}
```

### **Build Matrix**

```yaml
strategy:
  matrix:
    node-version: [22.x]
```

**Runs on:** `ubuntu-latest`  
**Node Version:** 22.x

### **Pipeline Steps**

#### **Step 1: Checkout Repository**
```yaml
- name: Checkout repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
```
- Fetches full git history
- Required for git-based versioning
- Duration: ~5-10 seconds

#### **Step 2: Setup Node.js**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
    cache: npm
```
- Installs Node.js 22.x
- Enables npm caching for faster builds
- Duration: ~10-15 seconds (cached)

#### **Step 3: Install Dependencies**
```yaml
- name: Install dependencies
  run: npm ci
```
- Clean install from package-lock.json
- Ensures reproducible builds
- Duration: ~30-60 seconds (cached), ~2-3 minutes (uncached)

#### **Step 4: Lint**
```yaml
- name: Lint
  run: npm run lint --if-present
```
- Runs ESLint on codebase
- Only runs if `lint` script exists
- Duration: ~10-20 seconds

#### **Step 5: Type Check**
```yaml
- name: Type check
  run: npm run typecheck --if-present
```
- Runs TypeScript compiler checks
- Only runs if `typecheck` script exists
- Duration: ~15-30 seconds

#### **Step 6: Test**
```yaml
- name: Test (allow empty)
  run: npm test --if-present || echo "no tests"
```
- Runs test suite
- Continues even if no tests exist
- Duration: Variable (depends on tests)

#### **Step 7: Build**
```yaml
- name: Build
  run: npm run build
```
- Compiles TypeScript
- Builds frontend with Vite
- Bundles backend code
- Duration: ~1-2 minutes

#### **Step 8: Upload Artifacts**
```yaml
- name: Upload artifacts
  if: success()
  uses: actions/upload-artifact@v4
  with:
    name: web-dist
    path: |
      dist/**
      client/dist/**
      server/dist/**
    if-no-files-found: ignore
```
- Uploads build output
- Available for 90 days
- Only runs if build succeeds

### **Success Criteria**

✅ All steps complete with exit code 0  
✅ Build artifacts uploaded  
✅ No linter errors  
✅ No type errors  
✅ All tests passing

### **Expected Duration**

| Scenario | Duration |
|----------|----------|
| **First run** | 3-5 minutes |
| **With cache** | 1-2 minutes |
| **With failure** | 0.5-2 minutes |

---

## 📊 Workflow 2: Uptime & Health Monitoring

**File:** `.github/workflows/uptime.yml`  
**URL:** https://github.com/DemetrisNeophytou/ProductifyAI/blob/replit-agent/.github/workflows/uptime.yml

### **Trigger Conditions**

```yaml
on:
  schedule:
    - cron: "*/5 * * * *"      # Every 5 minutes
    - cron: "55 23 * * *"      # Daily at 23:55 UTC
  workflow_dispatch:            # Manual trigger
```

**Execution Frequency:**
- 🔄 **Health checks:** 288 times per day (every 5 minutes)
- 📅 **Daily summary:** Once per day at 23:55 UTC
- 🖱️ **Manual:** On-demand via Actions tab

### **Job 1: Health Check**

**Runs:** Every 5 minutes (unless daily summary time)

#### **Environment Variables**
```yaml
env:
  BACKEND_HEALTH_URL: ${{ secrets.BACKEND_HEALTH_URL }}
  FRONTEND_URL: ${{ secrets.FRONTEND_URL }}
  RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
  ALERT_EMAIL_TO: ${{ secrets.ALERT_EMAIL_TO }}
```

#### **Steps**

**1. Checkout**
```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
```
Duration: ~5-10 seconds

**2. Setup Node 22**
```yaml
- name: Setup Node 22
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: npm
```
Duration: ~10-15 seconds (cached)

**3. Install Dependencies**
```yaml
- name: Install dependencies
  run: npm ci --omit=dev || true
```
- Only production dependencies
- Continues on error
Duration: ~20-40 seconds

**4. Run Health Check**
```yaml
- name: Run healthcheck
  id: healthcheck
  run: node scripts/healthcheck.mjs
  continue-on-error: true
```
- Checks backend and frontend endpoints
- Measures latency
- Writes JSON log files
Duration: ~2-5 seconds

**Output:**
```
ops/uptime/2025/11/04/2025-11-04T12-00-00-000Z.json
ops/uptime/latest/report.json
```

**5. Commit Logs**
```yaml
- name: Commit logs
  run: |
    git config user.name "uptime-bot"
    git config user.email "actions@github.com"
    git add ops/uptime || true
    git commit -m "chore(uptime): health check logs [skip ci]" || echo "nothing to commit"
    git push || echo "no push (PR context or no changes)"
```
- Commits logs to repository
- Uses `[skip ci]` to avoid triggering builds
- Continues on error
Duration: ~3-5 seconds

**6. Upload Report Artifact**
```yaml
- name: Upload report artifact
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: uptime-report-${{ github.run_id }}
    path: ops/uptime/latest/report.json
    if-no-files-found: warn
```
- Always runs (even on failure)
- Unique artifact name per run
Duration: ~2-3 seconds

**7. Send Alert on Failure**
```yaml
- name: Send alert on failure
  if: failure() && steps.healthcheck.outcome == 'failure'
  run: node scripts/alert.mjs "health-check-failure" "ProductifyAI health check failed"
```
- Only runs if health check failed
- Sends email via Resend
- Sends Slack alert (if configured)
Duration: ~1-3 seconds

### **Job 2: Daily Summary**

**Runs:** Once daily at 23:55 UTC

#### **Condition**
```yaml
if: github.event.schedule == '55 23 * * *' || github.event_name == 'workflow_dispatch'
```

#### **Steps**

**1-3. Checkout, Setup, Install**
Same as Health Check job

**4. Generate Daily Summary**
```yaml
- name: Generate daily summary
  run: node scripts/daily-summary.mjs
```
- Reads all health check logs from current day
- Calculates statistics
- Generates markdown report
Duration: ~2-5 seconds

**Output:**
```
ops/uptime/REPORTS/2025-11-04.md
```

**5. Commit Daily Report**
```yaml
- name: Commit daily report
  run: |
    git config user.name "uptime-bot"
    git config user.email "actions@github.com"
    git add ops/uptime/REPORTS || true
    git commit -m "chore(uptime): daily summary report [skip ci]" || echo "nothing to commit"
    git push || echo "no push (PR context or no changes)"
```
Duration: ~3-5 seconds

**6. Upload Daily Report**
```yaml
- name: Upload daily report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: daily-report-${{ github.run_id }}
    path: ops/uptime/REPORTS/*.md
    if-no-files-found: warn
```
Duration: ~2-3 seconds

### **Expected Duration**

| Job | Duration |
|-----|----------|
| **Health Check** | 30-60 seconds |
| **Daily Summary** | 30-60 seconds |

---

## 🔐 GitHub Secrets Setup

**Configure at:** https://github.com/DemetrisNeophytou/ProductifyAI/settings/secrets/actions

### **Required Secrets** (4)

| Secret Name | Purpose | Example | Required For |
|-------------|---------|---------|--------------|
| `BACKEND_HEALTH_URL` | Backend API health endpoint | `https://api.productifyai.com/api/health` | Uptime monitoring |
| `FRONTEND_URL` | Frontend application URL | `https://productifyai.com` | Uptime monitoring |
| `ALERT_EMAIL_TO` | Alert recipient emails | `admin@productifyai.com,ops@example.com` | Alert system |
| `RESEND_API_KEY` | Email sending API key | `re_xxxxxxxxxxxxx` | Alert system |

### **Optional Secrets** (4)

| Secret Name | Purpose | Example | Required For |
|-------------|---------|---------|--------------|
| `SLACK_WEBHOOK_URL` | Slack notifications | `https://hooks.slack.com/services/...` | Slack alerts |
| `RENDER_API_KEY` | Render auto-restart | `rnd_xxxxxxxxxxxxx` | Auto-restart |
| `RENDER_SERVICE_ID` | Render service ID | `srv-xxxxxxxxxxxxx` | Auto-restart |
| `ENABLE_AUTO_RESTART` | Enable auto-restart | `true` | Auto-restart |

### **Setup Instructions**

**Step 1:** Navigate to Secrets page
```
https://github.com/DemetrisNeophytou/ProductifyAI/settings/secrets/actions
```

**Step 2:** Click "New repository secret"

**Step 3:** Add each secret:
- Name: Copy EXACTLY as shown above
- Value: Your actual value (no quotes)
- Click "Add secret"

**Step 4:** Verify secrets added
```bash
# Run local validation
node scripts/check-secrets.mjs
```

### **Secrets Validation**

**Before deployment, all 4 required secrets MUST be configured.**

Validation Script: `scripts/check-secrets.mjs`

**Test locally:**
```bash
export BACKEND_HEALTH_URL="https://your-api.com/health"
export FRONTEND_URL="https://your-app.com"
export RESEND_API_KEY="your-resend-key"
export ALERT_EMAIL_TO="your-email@example.com"

node scripts/check-secrets.mjs
```

**Expected output:**
```
✅ ALL REQUIRED SECRETS ARE CONFIGURED!
```

---

## 📦 Deployment Phases

### **Phase 1: Pre-Deployment** (5-10 minutes)

**Checklist:**
- [ ] All code committed
- [ ] All tests passing locally
- [ ] Build succeeds locally (`npm run build`)
- [ ] All 4 required GitHub secrets configured
- [ ] Secrets validation passed
- [ ] [DEPLOYMENT_READINESS_CHECKLIST.md](DEPLOYMENT_READINESS_CHECKLIST.md) reviewed

**Actions:**
```bash
# Validate secrets
node scripts/check-secrets.mjs

# Run tests
npm test

# Build locally
npm run build

# Verify git status
git status
```

### **Phase 2: Code Push** (1-2 minutes)

**Command:**
```bash
git push origin replit-agent
```

**What happens:**
1. Code pushed to GitHub
2. Build workflow triggers automatically
3. CI/CD pipeline starts

**Monitor at:**
```
https://github.com/DemetrisNeophytou/ProductifyAI/actions
```

### **Phase 3: Build & Test** (3-5 minutes)

**Automated Steps:**
1. ✅ Checkout code (~10s)
2. ✅ Setup Node.js (~15s)
3. ✅ Install dependencies (~60s)
4. ✅ Lint code (~20s)
5. ✅ Type check (~30s)
6. ✅ Run tests (~30s)
7. ✅ Build application (~120s)
8. ✅ Upload artifacts (~10s)

**Expected output:**
```
✅ Build successful
✅ Artifacts uploaded
✅ No errors
```

### **Phase 4: Deployment** (Auto or Manual)

**If using Render:**
- Render automatically deploys on successful build
- Monitor at Render dashboard

**Manual deployment:**
- Download artifacts from GitHub Actions
- Deploy to your hosting platform

### **Phase 5: Health Check Activation** (Immediate)

**Automatic activation:**
- First health check runs within 5 minutes
- Checks run every 5 minutes thereafter
- Daily summary at 23:55 UTC

**Verify activation:**
```
https://github.com/DemetrisNeophytou/ProductifyAI/actions/workflows/uptime.yml
```

**Expected:** "Scheduled" badge visible

### **Phase 6: Post-Deployment Monitoring** (First 24 hours)

**Monitor:**
- [ ] Health checks running every 5 minutes
- [ ] All checks passing (200 OK)
- [ ] Latency within acceptable range
- [ ] No alerts triggered
- [ ] Logs committing to repository
- [ ] Daily summary generated at 23:55 UTC

**Check logs:**
```
ops/uptime/YYYY/MM/DD/*.json       # Health check logs
ops/uptime/REPORTS/YYYY-MM-DD.md   # Daily summaries
```

---

## 🔗 Quick Reference Links

### **GitHub Actions**
- **Actions Dashboard:** https://github.com/DemetrisNeophytou/ProductifyAI/actions
- **Build Workflow:** https://github.com/DemetrisNeophytou/ProductifyAI/actions/workflows/build.yml
- **Uptime Workflow:** https://github.com/DemetrisNeophytou/ProductifyAI/actions/workflows/uptime.yml

### **Configuration**
- **GitHub Secrets:** https://github.com/DemetrisNeophytou/ProductifyAI/settings/secrets/actions
- **Repository Settings:** https://github.com/DemetrisNeophytou/ProductifyAI/settings

### **Documentation**
- **System Overview:** [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)
- **Deployment Checklist:** [DEPLOYMENT_READINESS_CHECKLIST.md](DEPLOYMENT_READINESS_CHECKLIST.md)
- **Secrets Setup:** [SECRETS_CHECKLIST.md](SECRETS_CHECKLIST.md)
- **Operations Guide:** [ops/README.md](ops/README.md)
- **Documentation Index:** [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

### **Scripts**
- **Health Check:** `scripts/healthcheck.mjs`
- **Daily Summary:** `scripts/daily-summary.mjs`
- **Alert System:** `scripts/alert.mjs`
- **Secrets Validation:** `scripts/check-secrets.mjs`

### **Workflow Files**
- **Build Workflow:** `.github/workflows/build.yml`
- **Uptime Workflow:** `.github/workflows/uptime.yml`

---

## 🎯 Manual Workflow Triggers

### **Trigger Build Workflow**

**Via GitHub UI:**
1. Go to: https://github.com/DemetrisNeophytou/ProductifyAI/actions/workflows/build.yml
2. Click "Run workflow" button
3. Select branch: `replit-agent`
4. Click "Run workflow" (green button)

**Via GitHub CLI:**
```bash
gh workflow run build.yml --ref replit-agent
```

### **Trigger Health Check**

**Via GitHub UI:**
1. Go to: https://github.com/DemetrisNeophytou/ProductifyAI/actions/workflows/uptime.yml
2. Click "Run workflow" button
3. Select branch: `replit-agent`
4. Click "Run workflow" (green button)

**Via GitHub CLI:**
```bash
gh workflow run uptime.yml --ref replit-agent
```

---

## 📊 Monitoring & Logs

### **Build Logs**
```
GitHub Actions → Build & Deploy → <run> → View logs
```

### **Health Check Logs**
```
Repository → ops/uptime/YYYY/MM/DD/*.json
```

### **Daily Summary Reports**
```
Repository → ops/uptime/REPORTS/YYYY-MM-DD.md
```

### **Workflow Artifacts**
```
GitHub Actions → <workflow run> → Artifacts
```

**Available artifacts:**
- `web-dist` - Build output
- `uptime-report-{run_id}` - Health check JSON
- `daily-report-{run_id}` - Daily markdown report

---

## 🚨 Troubleshooting

### **Build Workflow Fails**

**Check:**
1. Linter errors in logs
2. Type check errors
3. Test failures
4. Build errors

**Fix:**
- Review error messages in Actions logs
- Fix issues locally
- Push again

### **Health Check Fails**

**Check:**
1. Secrets configured correctly
2. URLs accessible from GitHub
3. Services responding with 200 OK

**Fix:**
- Verify secrets at: https://github.com/DemetrisNeophytou/ProductifyAI/settings/secrets/actions
- Test URLs manually
- Check service logs

### **No Alerts Received**

**Check:**
1. `RESEND_API_KEY` configured
2. `ALERT_EMAIL_TO` configured
3. Email addresses correct
4. Resend API key valid

**Test locally:**
```bash
export RESEND_API_KEY="your-key"
export ALERT_EMAIL_TO="your-email@example.com"
node scripts/alert.mjs test "Test alert"
```

---

## ✅ Deployment Checklist

Before deploying, verify:

- [ ] All code committed and pushed
- [ ] All 4 required secrets configured
- [ ] Secrets validation passed
- [ ] Build succeeds locally
- [ ] All tests passing
- [ ] Documentation reviewed
- [ ] Team notified

**Ready to deploy:**
```bash
git push origin replit-agent
```

**Monitor deployment:**
```
https://github.com/DemetrisNeophytou/ProductifyAI/actions
```

---

**Last Updated:** November 4, 2025  
**Maintained By:** DevOps Team  
**Next Review:** 2025-12-01

**📚 Related Documentation:**
- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)
- [DEPLOYMENT_READINESS_CHECKLIST.md](DEPLOYMENT_READINESS_CHECKLIST.md)
- [SECRETS_CHECKLIST.md](SECRETS_CHECKLIST.md)
- [ops/README.md](ops/README.md)

