# 🚀 Render Deployment Guide

## Overview

This guide provides complete instructions for deploying the ProductifyAI backend to Render.

---

## 📋 Prerequisites

- GitHub repository connected to Render
- Environment variables ready (see below)
- `main` branch with latest code

---

## 🔧 Render Service Configuration

### Step 1: Create Web Service

1. Go to Render Dashboard: https://dashboard.render.com
2. Click **New → Web Service**
3. Connect your GitHub repository: `DemetrisNeophytou/ProductifyAI`
4. Configure as follows:

### Step 2: Basic Settings

| Setting | Value |
|---------|-------|
| **Name** | `productifyai-api` |
| **Region** | Oregon (US West) or closest to you |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm ci --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (dev) or Starter ($7/mo production) |

### Step 3: Environment Variables

Click **Advanced → Add Environment Variable** and add these:

#### Required Variables

```bash
NODE_ENV=production
PORT=10000

# Supabase (Backend uses service role key)
SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
GOOGLE_CLIENT_ID=85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Security Secrets (GENERATE NEW ONES!)
JWT_SECRET=<generate-32-char-random-string>
SESSION_SECRET=<generate-32-char-random-string>

# CORS & Frontend
CORS_ORIGIN=http://localhost:5173,https://productifyai.vercel.app
FRONTEND_URL=https://productifyai.vercel.app

# OpenAI (for AI features)
OPENAI_API_KEY=sk-proj-...
```

#### Generate Secure Secrets

```bash
# On Linux/Mac:
openssl rand -base64 32

# Or Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or online:
# https://generate-random.org/api-key-generator
```

#### Optional Variables

```bash
# Email Service
RESEND_API_KEY=re_...
EMAIL_FROM=ProductifyAI <noreply@productifyai.com>

# Stripe (if payments enabled)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MOCK_STRIPE=false

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
BACKEND_HEALTH_URL=https://productifyai-api.onrender.com/healthz
```

### Step 4: Health Check Configuration

| Setting | Value |
|---------|-------|
| **Health Check Path** | `/healthz` |
| **Health Check Interval** | 60 seconds |

### Step 5: Auto-Deploy

| Setting | Value |
|---------|-------|
| **Auto-Deploy** | ✅ Yes (deploy on push to `main`) |

---

## ✅ Post-Deployment Verification

### 1. Check Build Logs

In Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. Verify build succeeded:
   ```
   ==> Building...
   ==> Installing dependencies...
   ==> Running build command: npm run build
   ==> Build succeeded!
   ```

### 2. Check Deployment Logs

Look for these startup messages:
```
🚀 Starting ProductifyAI secure server...
🌐 Server running on port 10000
🔒 CORS enabled for origins: http://localhost:5173,https://productifyai.vercel.app
🔗 Supabase URL: https://dfqssnvqsxjjtyhylzen.supabase.co
✅ Database connected
```

### 3. Test Health Endpoints

```bash
# Test liveness probe
curl https://productifyai-api.onrender.com/healthz

# Expected Response:
{
  "status": "ok"
}

# Test detailed health check
curl https://productifyai-api.onrender.com/api/health

# Expected Response:
{
  "ok": true,
  "timestamp": "2025-11-04T...",
  "uptime": 123.45,
  "environment": "production",
  "services": {
    "database": { "status": "connected", "type": "supabase" },
    "stripe": { "status": "mock" },
    "supabase": { "status": "configured" },
    "openai": { "status": "configured" },
    "email": { "status": "configured" }
  },
  "responseTime": 45
}
```

### 4. Test CORS

From your browser console at `https://productifyai.vercel.app`:

```javascript
fetch('https://productifyai-api.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ CORS works!', d))
  .catch(e => console.error('❌ CORS failed:', e));
```

---

## 🔄 Build Process Explained

### What Happens During Build

```bash
# 1. Install ALL dependencies (including devDependencies)
npm ci --include=dev

# 2. Run build script
npm run build

# Which runs:
# - vite build (compiles frontend to dist/)
# - esbuild server/server.ts (compiles backend to dist/server.js)
```

### Build Output Structure

```
dist/
├── server.js          # Backend bundle (from server/server.ts)
├── index.html         # Frontend (from client/)
└── assets/            # Frontend static assets
    ├── index-abc123.js
    └── index-abc123.css
```

### Start Command

```bash
npm start
# Runs: node dist/server.js
```

The server:
1. Listens on `process.env.PORT` (Render provides this automatically)
2. Serves static frontend files from `dist/`
3. Handles API requests on `/api/*` and `/products/*`

---

## 🐛 Troubleshooting

### Build Fails: "Cannot find module"

**Problem:** Missing dependencies

**Solution:**
```bash
# Verify all deps are in package.json
npm install --save <missing-package>

# Push to GitHub
git add package.json package-lock.json
git commit -m "fix: add missing dependency"
git push
```

### Build Fails: "TypeScript errors"

**Problem:** Type checking fails

**Solution:**
```bash
# Fix types locally
npm run check

# Fix the errors shown
# Then commit and push
```

### Server Crashes: "PORT already in use"

**Problem:** Port conflict (shouldn't happen on Render)

**Solution:**
- Render automatically assigns a port via `process.env.PORT`
- Check server code uses: `const PORT = process.env.PORT || 5050`

### CORS Errors in Production

**Problem:** Frontend can't reach backend

**Solution:**
1. Verify `CORS_ORIGIN` in Render includes your Vercel URL
2. Check format: `https://productifyai.vercel.app` (no trailing slash)
3. Check Render logs for "CORS blocked" messages
4. Restart service if you changed `CORS_ORIGIN`

### Health Check Failing

**Problem:** Render shows service as unhealthy

**Solution:**
1. Verify `/healthz` endpoint returns 200 OK
   ```bash
   curl https://productifyai-api.onrender.com/healthz
   ```
2. Check health check path is `/healthz` (not `/health`)
3. Check response time < 30 seconds
4. Check Render logs for errors

### Environment Variables Not Working

**Problem:** Server can't read env vars

**Solution:**
1. Verify variables are set in Render dashboard
2. Variable names are case-sensitive
3. Restart service after changing env vars
4. Check startup logs for "Not configured" warnings

---

## 🔐 Security Best Practices

### 1. Use Strong Secrets

```bash
# JWT_SECRET and SESSION_SECRET should be:
# - At least 32 characters long
# - Completely random
# - Different from each other
# - Never committed to git

# Generate with:
openssl rand -base64 32
```

### 2. Keep Service Role Key Secret

- **NEVER** use `SUPABASE_SERVICE_ROLE_KEY` in frontend
- **NEVER** expose in logs or error messages
- Only use on backend
- Frontend uses `VITE_SUPABASE_ANON_KEY` (different key)

### 3. Rotate Secrets Regularly

- Change `JWT_SECRET` and `SESSION_SECRET` every 90 days
- Keep old keys for 7 days to allow session migration
- Document rotation in team calendar

### 4. Whitelist CORS Origins

- Only add trusted domains to `CORS_ORIGIN`
- Separate with commas, no spaces
- Include protocol (`https://` or `http://`)
- No trailing slashes

---

## 🔄 Updating the Deployment

### Push New Code

```bash
# Make changes
git add .
git commit -m "feat: add new feature"

# Push to main (triggers auto-deploy)
git push origin main
```

### Monitor Deployment

1. Go to Render dashboard
2. Click your service
3. Watch "Events" tab for deployment status
4. Check "Logs" for any errors

### Rollback if Needed

1. Go to "Events" tab
2. Find previous successful deployment
3. Click "Rollback to this deploy"

---

## 📊 Monitoring

### Render Dashboard

- **Metrics:** CPU, Memory, Request count
- **Logs:** Real-time server logs
- **Events:** Deployment history
- **Health:** Current health status

### External Monitoring

Add uptime monitoring:
- **UptimeRobot:** https://uptimerobot.com (free)
- **Healthchecks.io:** https://healthchecks.io (free)
- **Pingdom:** https://www.pingdom.com (paid)

Configure to ping: `https://productifyai-api.onrender.com/healthz`

### Alerts

Set up alerts in Render:
1. Go to service settings
2. Click "Notifications"
3. Add email/Slack webhook
4. Get notified on:
   - Build failures
   - Deploy failures
   - Service unhealthy
   - High CPU/memory

---

## 💰 Cost Optimization

### Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- **First request after spin-down takes 30+ seconds**
- **750 hours/month free compute**

### Upgrade to Starter ($7/mo) for:

- ✅ Always on (no spin-down)
- ✅ Faster startup
- ✅ Custom domains
- ✅ Better performance
- ✅ More CPU/memory

### When to Upgrade

Upgrade when you have:
- Regular traffic
- Need fast response times
- Want custom domain
- Production users

---

## 📋 Post-Deployment Checklist

After first deploy:

- [ ] `/healthz` returns 200 OK
- [ ] `/api/health` shows all services configured
- [ ] CORS allows requests from Vercel
- [ ] Can log in with email/password
- [ ] Can log in with Google OAuth
- [ ] Database queries work
- [ ] OpenAI API calls work (if configured)
- [ ] Email sending works (if configured)
- [ ] Logs show no errors
- [ ] Uptime monitoring configured

---

## 🔗 Quick Links

- **Render Dashboard:** https://dashboard.render.com
- **Service Logs:** https://dashboard.render.com/web/<service-id>/logs
- **Service Settings:** https://dashboard.render.com/web/<service-id>/settings
- **Health Check:** https://productifyai-api.onrender.com/healthz
- **API Health:** https://productifyai-api.onrender.com/api/health

---

**Last Updated:** 2025-11-04  
**Maintained By:** DevOps Team

