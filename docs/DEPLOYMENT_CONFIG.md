# 🚀 Deployment Configuration Guide

## Overview

This document provides the exact configuration needed for Vercel (frontend) and Render (backend) deployments.

---

## 📦 Vercel Configuration (Frontend)

### Project Settings

**Framework Preset:** Vite  
**Root Directory:** `./`  
**Build Command:** `pnpm run build`  
**Output Directory:** `dist`  
**Install Command:** `pnpm install`  
**Node Version:** 22.x

### Branch Configuration

- **Production Branch:** `main`
- **Deploy on Push:** ✅ Enabled
- **Preview Deployments:** ✅ Enabled for PRs

### Environment Variables

Add these in: **Vercel Dashboard → Project → Settings → Environment Variables**

#### Production + Preview + Development

```bash
VITE_SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXNzbnZxc3hqanR5aHlsemVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MDE3MTIsImV4cCI6MjA3NDk3NzcxMn0.Oamj_iqJwm8nqqMQnJfYT4w9x4nU0BMkU5gF1a_UYlo
VITE_API_URL=https://productifyai-api.onrender.com
VITE_APP_NAME=ProductifyAI
VITE_APP_VERSION=1.0.0
```

### Build & Deploy Settings

- **Automatically expose System Environment Variables:** ✅ Yes
- **Framework Detection:** Vite
- **Build Output:** `dist/`

### Post-Merge Steps for Vercel

1. **Import Project** from GitHub: `DemetrisNeophytou/ProductifyAI`
2. **Set Branch** to `main`
3. **Configure Build:**
   - Framework: Vite
   - Build Command: `pnpm run build`  
   - Output Directory: `dist`
   - Install Command: `pnpm install`
4. **Add Environment Variables** (see above)
5. **Deploy**

### Testing Vercel Deployment

```bash
# Frontend loads
curl https://productifyai.vercel.app
# Expected: 200 OK with HTML

# Check API URL is set
# In browser console at productifyai.vercel.app:
console.log(import.meta.env.VITE_API_URL);
# Expected: https://productifyai-api.onrender.com
```

---

## 🔧 Render Configuration (Backend)

### Service Settings

**Service Type:** Web Service  
**Name:** `productifyai-api`  
**Region:** Oregon (US West) or closest to you  
**Branch:** `main`  
**Runtime:** Node  
**Build Command:** `npm ci --include=dev && npm run build`  
**Start Command:** `npm start`  
**Node Version:** 22

### Post-Merge Steps for Render

1. **Create New Web Service**
2. **Connect GitHub Repository:** `DemetrisNeophytou/ProductifyAI`
3. **Configure Settings:**
   - Name: `productifyai-api`
   - Branch: `main`
   - Build Command: `npm ci --include=dev && npm run build`
   - Start Command: `npm start`
4. **Add Environment Variables** (see above)
5. **Set Health Check Path:** `/healthz`
6. **Deploy**

### Testing Render Deployment

```bash
# Test liveness probe
curl https://productifyai-api.onrender.com/healthz
# Expected: {"status":"ok"}

# Test detailed health
curl https://productifyai-api.onrender.com/api/health
# Expected: JSON with all service statuses

# Test CORS from browser console at productifyai.vercel.app:
fetch('https://productifyai-api.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ CORS works!', d))
  .catch(e => console.error('❌ CORS failed:', e));
```

### Instance Type

- **Development:** Free tier (spins down after inactivity)
- **Production:** Starter ($7/mo) or higher

### Environment Variables

Add these in: **Render Dashboard → Service → Environment**

```bash
# Node Environment
NODE_ENV=production
PORT=10000

# Supabase (Backend uses service role key)
SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXNzbnZxc3hqanR5aHlsemVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQwMTcxMiwiZXhwIjoyMDc0OTc3NzEyfQ.-aGf_2TuAO5H6YHqSkfNypJrRhJodyurpG08G1EkxVw

# Google OAuth
GOOGLE_CLIENT_ID=85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Security Secrets (Generate 32+ character random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters-long

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,https://productifyai.vercel.app
FRONTEND_URL=https://productifyai.vercel.app

# API Configuration
BACKEND_HEALTH_URL=https://productifyai-api.onrender.com/api/health

# Optional: Email (if using Resend)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=ProductifyAI <noreply@productifyai.com>

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

### Health Check Path

- **Health Check Path:** `/healthz`
- **Health Check Interval:** 60 seconds

### Auto-Deploy

- **Auto-Deploy:** ✅ Yes (on push to `main`)

---

## 🔐 GitHub Secrets (for CI/CD)

Add these in: **GitHub → Settings → Secrets and variables → Actions**

```bash
# Supabase
VITE_SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXNzbnZxc3hqanR5aHlsemVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MDE3MTIsImV4cCI6MjA3NDk3NzcxMn0.Oamj_iqJwm8nqqMQnJfYT4w9x4nU0BMkU5gF1a_UYlo
```

---

## 🔗 OAuth Redirect URIs

### Configure in Google Cloud Console

**Go to:** https://console.cloud.google.com/apis/credentials

**Select your OAuth 2.0 Client ID:** `85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq.apps.googleusercontent.com`

**Add these Authorized Redirect URIs:**

```
http://localhost:5173/auth/callback
https://productifyai.vercel.app/auth/callback
https://dfqssnvqsxjjtyhylzen.supabase.co/auth/v1/callback
```

**Authorized JavaScript Origins:**

```
http://localhost:5173
https://productifyai.vercel.app
https://dfqssnvqsxjjtyhylzen.supabase.co
```

### Configure in Supabase

**Go to:** https://supabase.com/dashboard/project/dfqssnvqsxjjtyhylzen/auth/providers

**Enable Google Provider:**
1. Click "Google" provider
2. Enable the provider
3. Add Client ID: `85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq.apps.googleusercontent.com`
4. Add Client Secret: `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`
5. Save

**Redirect URLs (Supabase handles these automatically):**
- Development: `http://localhost:5173/auth/callback`
- Production: `https://productifyai.vercel.app/auth/callback`

---

## 📍 Important URLs

### Production

- **Frontend:** https://productifyai.vercel.app
- **Backend API:** https://productifyai-api.onrender.com
- **Health Check:** https://productifyai-api.onrender.com/healthz
- **API Health:** https://productifyai-api.onrender.com/api/health

### Development

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5050
- **Health Check:** http://localhost:5050/healthz

### Supabase

- **URL:** https://dfqssnvqsxjjtyhylzen.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/dfqssnvqsxjjtyhylzen

---

## ✅ Deployment Checklist

### Before First Deploy

- [ ] All environment variables set in Vercel
- [ ] All environment variables set in Render
- [ ] GitHub Secrets configured
- [ ] OAuth redirect URIs added to Google Cloud Console
- [ ] Google OAuth enabled in Supabase
- [ ] Branch protection enabled on `main`
- [ ] CI workflow passing

### After Deploy

- [ ] Frontend accessible at https://productifyai.vercel.app
- [ ] Backend health check: `curl https://productifyai-api.onrender.com/healthz`
- [ ] Test login with email/password
- [ ] Test login with Google OAuth
- [ ] Verify CORS working
- [ ] Check Render logs for errors
- [ ] Check Vercel logs for errors

---

## 🔧 Troubleshooting

### CORS Errors

If you see CORS errors in browser console:

1. Verify `CORS_ORIGIN` in Render includes your Vercel URL
2. Check that both URLs use HTTPS (not HTTP/HTTPS mix)
3. Ensure no trailing slashes in URLs

### OAuth Not Working

1. Verify redirect URIs exactly match (no typos)
2. Check Google OAuth credentials are correct
3. Verify Supabase Google provider is enabled
4. Check browser console for specific error messages

### Backend Not Starting on Render

1. Check Render logs for startup errors
2. Verify build command succeeded
3. Ensure all required environment variables are set
4. Check Node version matches (22.x)

### Build Failures

1. Check GitHub Actions logs
2. Verify pnpm lockfile is committed
3. Ensure all dependencies are in package.json
4. Check for TypeScript errors: `pnpm run check`

---

## 📞 Support

- **Documentation:** `./docs/`
- **Issues:** GitHub Issues
- **Security:** security@productifyai.com

---

**Last Updated:** 2025-11-04  
**Version:** 1.0.0

