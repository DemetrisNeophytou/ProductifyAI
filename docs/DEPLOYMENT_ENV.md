# Environment Variables Matrix

## Overview

This document explains where each environment variable should be configured across different platforms.

---

## 🎯 Quick Reference

| Environment Variable | Vercel (Frontend) | Render (Backend) | GitHub Actions | Local .env |
|---------------------|-------------------|------------------|----------------|------------|
| `VITE_SUPABASE_URL` | ✅ | ❌ | ✅ | ✅ |
| `VITE_SUPABASE_ANON_KEY` | ✅ | ❌ | ✅ | ✅ |
| `VITE_API_URL` | ✅ | ❌ | ❌ | ✅ |
| `SUPABASE_URL` | ❌ | ✅ | ❌ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ✅ | ❌ | ✅ |
| `GOOGLE_CLIENT_ID` | ❌ | ✅ | ❌ | ✅ |
| `GOOGLE_CLIENT_SECRET` | ❌ | ✅ | ❌ | ✅ |
| `JWT_SECRET` | ❌ | ✅ | ❌ | ✅ |
| `SESSION_SECRET` | ❌ | ✅ | ❌ | ✅ |
| `CORS_ORIGIN` | ❌ | ✅ | ❌ | ✅ |
| `FRONTEND_URL` | ❌ | ✅ | ❌ | ✅ |
| `OPENAI_API_KEY` | ❌ | ✅ | ❌ | ✅ |
| `NODE_ENV` | ❌ | ✅ | ❌ | ✅ |
| `PORT` | ❌ | ✅ | ❌ | ✅ |

---

## 🖥️ Vercel (Frontend)

**Where to configure:** Vercel Dashboard → Project → Settings → Environment Variables

### Required Variables

```bash
# Supabase (Public - safe to expose)
VITE_SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Endpoint
VITE_API_URL=https://productifyai-api.onrender.com

# App Metadata
VITE_APP_NAME=ProductifyAI
VITE_APP_VERSION=1.0.0
```

### Optional Variables

```bash
# Feature Flags
VITE_EVAL_MODE=false
VITE_SHOW_DEV_BANNER=false
```

### ⚠️ Important Notes

- **ALL Vite variables are exposed to the browser**
- **NEVER** put secrets in `VITE_*` variables
- Only use `VITE_SUPABASE_ANON_KEY` (not service role key)
- Set for all environments: Production, Preview, Development

---

## 🔧 Render (Backend)

**Where to configure:** Render Dashboard → Service → Environment

### Required Variables

```bash
# Node Configuration
NODE_ENV=production
PORT=10000

# Supabase (Server-side - KEEP SECRET)
SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication Secrets (Generate secure random strings)
JWT_SECRET=<32+ character random string>
SESSION_SECRET=<32+ character random string>

# Google OAuth
GOOGLE_CLIENT_ID=85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# CORS & Frontend
CORS_ORIGIN=http://localhost:5173,https://productifyai.vercel.app
FRONTEND_URL=https://productifyai.vercel.app

# OpenAI (for AI features)
OPENAI_API_KEY=sk-proj-...
```

### Optional Variables

```bash
# Email Service
RESEND_API_KEY=re_...
EMAIL_FROM=ProductifyAI <noreply@productifyai.com>

# Stripe (if payments enabled)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS=price_...
STRIPE_PRICE_ID_PRO=price_...
MOCK_STRIPE=false

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
BACKEND_HEALTH_URL=https://productifyai-api.onrender.com/healthz

# Feature Flags
FEATURE_PAYMENTS=false
```

### 🔒 Security Best Practices

1. **Generate Secure Secrets:**
   ```bash
   # On Linux/Mac:
   openssl rand -base64 32
   
   # Or use Node.js:
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Use Service Role Key (not anon key) on backend**
3. **Keep secrets out of git**
4. **Rotate secrets regularly**

---

## 🔄 GitHub Actions (CI/CD)

**Where to configure:** GitHub → Settings → Secrets and variables → Actions

### Required Secrets

```bash
VITE_SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Why These Are Needed

- CI workflow builds the frontend
- Build process needs to inject `VITE_*` variables
- Only public-safe variables (anon key, not service role)

### Optional Secrets

```bash
# For deployment workflows (if you add them)
VERCEL_TOKEN=...
RENDER_API_KEY=...
```

---

## 💻 Local Development (.env)

**Where to configure:** `.env` file in project root (NOT committed to git)

### Full Example

```bash
# Copy env.example to .env, then fill in:

# Supabase
SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API
VITE_API_URL=http://localhost:5050
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Auth
JWT_SECRET=local-dev-jwt-secret-32-characters-long
SESSION_SECRET=local-dev-session-secret-32-characters-long
GOOGLE_CLIENT_ID=85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Services
OPENAI_API_KEY=sk-proj-...
NODE_ENV=development
PORT=5050
```

---

## 🚨 Common Pitfalls

### ❌ **Don't Do This**

```bash
# Frontend trying to use service role key
VITE_SUPABASE_SERVICE_ROLE_KEY=...  # NEVER! Will be exposed to browser

# Hardcoded values in code
const apiUrl = "https://productifyai-api.onrender.com"  # Use env var instead

# Wrong prefix
SUPABASE_ANON_KEY=...  # Frontend won't see it (needs VITE_ prefix)
```

### ✅ **Do This Instead**

```typescript
// Frontend
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';

// Backend
const supabaseUrl = process.env.SUPABASE_URL;
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
```

---

## 🧪 Testing Your Configuration

### Frontend (Browser Console)

```javascript
// Should work (public vars):
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_SUPABASE_URL);

// Should be undefined (server-only):
console.log(import.meta.env.SUPABASE_SERVICE_ROLE_KEY); // undefined ✅
```

### Backend (Server Logs)

```bash
# Check what the server sees on startup:
curl http://localhost:5050/

# Response should show:
# - CORS origins configured
# - Supabase URL configured
# - No secrets exposed in response
```

### Health Check

```bash
# Test /healthz endpoint
curl https://productifyai-api.onrender.com/healthz

# Expected: {"status":"ok"}
```

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] All `VITE_*` variables set in Vercel
- [ ] All backend secrets set in Render
- [ ] GitHub Secrets configured for CI
- [ ] `.env` exists locally (not committed)
- [ ] No hardcoded URLs in code
- [ ] `CORS_ORIGIN` includes production domain
- [ ] JWT/Session secrets are 32+ characters
- [ ] Google OAuth redirect URIs configured
- [ ] Supabase service role key (not anon) on backend
- [ ] Tested locally with `.env`

---

## 🔄 Updating Environment Variables

### During Development

1. Update `.env` locally
2. Test changes
3. Update `env.example` (remove values!)
4. Update this doc if new variables added
5. Commit `env.example` and docs (NOT `.env`)

### For Production

1. **Vercel:** Dashboard → Environment → Edit → Save
2. **Render:** Dashboard → Environment → Save (auto-redeploys)
3. **GitHub:** Settings → Secrets → Update

---

## 🆘 Troubleshooting

### "API URL undefined" in Frontend

**Problem:** `import.meta.env.VITE_API_URL` is `undefined`

**Solution:**
- Verify `VITE_API_URL` is set in Vercel
- Restart Vercel deployment
- Check variable name has `VITE_` prefix

### "CORS Error" in Browser

**Problem:** Backend rejecting requests from frontend

**Solution:**
- Verify `CORS_ORIGIN` in Render includes your Vercel URL
- Ensure no trailing slashes: `https://productifyai.vercel.app` not `https://productifyai.vercel.app/`
- Check both domains use HTTPS (or both HTTP locally)

### "Supabase Service Role Key" Exposed

**Problem:** Service role key visible in browser

**Solution:**
- NEVER use `VITE_SUPABASE_SERVICE_ROLE_KEY`
- Backend uses `SUPABASE_SERVICE_ROLE_KEY` (no VITE prefix)
- Frontend uses `VITE_SUPABASE_ANON_KEY` only

---

**Last Updated:** 2025-11-04  
**Maintained By:** DevOps Team

