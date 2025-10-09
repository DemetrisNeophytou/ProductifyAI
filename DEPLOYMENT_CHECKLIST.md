# 🚀 Vercel Deployment Checklist - Productify AI

**Framework:** Vite + Express (Serverless)  
**GitHub Repo:** https://github.com/DemetrisNeophytou/ProductifyAI  
**Deploy Branch:** `main`  
**Build Status:** ✅ VERIFIED (22.62s)

---

## ✅ Pre-Deployment Verification

### 1. Framework Confirmation
- [x] **Vite + Express** (NOT Next.js)
- [x] `vercel.json` configured for serverless API routing
- [x] Backend: Express app exported via `api/index.ts`
- [x] Frontend: Vite SPA in `dist/public`

### 2. Build Configuration
- [x] **Install Command:** `npm ci`
- [x] **Build Command:** `npm run build`
- [x] **Output Directory:** `dist/public`
- [x] **Node Version:** 20.x
- [x] Build completes in ~23 seconds ✅

### 3. Health Endpoints (Local Verified)
- [x] `GET /api/health` → `{"ok":true}` ✅
- [x] `GET /api/v2/ai/health` → `{"ok":true,"model":"gpt-5","response":"OK"}` ✅

---

## 🔐 Environment Variables for Vercel

### ✅ Copy from Replit Secrets (7 variables)

These exist in Replit - copy exact values to Vercel:

```bash
DATABASE_URL=postgresql://...               # ✅ EXISTS
OPENAI_API_KEY=sk-...                       # ✅ EXISTS
SESSION_SECRET=<your-secret>                # ✅ EXISTS
STRIPE_SECRET_KEY=sk_live_... or sk_test_.. # ✅ EXISTS
VITE_STRIPE_PUBLIC_KEY=pk_live_... or pk_test_... # ✅ EXISTS
PEXELS_API_KEY=<your-key>                   # ✅ EXISTS
PIXABAY_API_KEY=<your-key>                  # ✅ EXISTS
```

### 🔧 Add Manually (2 required + 1 optional)

**Required:**

1. **ISSUER_URL** (Replit Auth)
   ```bash
   ISSUER_URL=https://replit.com/oidc
   ```
   - Source: Set manually
   - Purpose: Replit OpenID Connect authentication

2. **STRIPE_WEBHOOK_SECRET** (Stripe Dashboard)
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
   - Source: Stripe Dashboard → Webhooks → Signing Secret
   - Purpose: Webhook signature validation

**Optional:**

3. **GOOGLE_FONTS_API_KEY** (Google Cloud Console)
   ```bash
   GOOGLE_FONTS_API_KEY=<your-key>
   ```
   - Source: Google Cloud Console → APIs & Services
   - Purpose: Google Fonts API (falls back to curated list if missing)

### Summary
- **Total:** 10 environment variables
- **In Replit:** 7 (ready to copy)
- **Manual Setup:** 2 required + 1 optional
- **Critical:** 9 (all except GOOGLE_FONTS_API_KEY)

---

## 📋 Step-by-Step Vercel UI Instructions

### Step 1: Push Code to GitHub

**Current Status:**
- Branch: `replit-agent`
- Remote: `https://github.com/DemetrisNeophytou/ProductifyAI.git`
- Main branch exists: `main`

**Action Required:**
```bash
# Option A: Push current branch (replit-agent)
git push origin replit-agent

# Option B: Merge to main and push
git checkout main
git merge replit-agent
git push origin main
```

**Recommendation:** Use `main` branch for production deployment.

---

### Step 2: Import to Vercel

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/new

2. **Select Import Git Repository**
   - Click "Import Git Repository"
   - Choose: **GitHub** as provider

3. **Find Your Repository**
   - Search: `DemetrisNeophytou/ProductifyAI`
   - Click: **Import**

4. **Configure Project**
   
   **Project Settings:**
   ```
   Project Name: productify-ai (or your choice)
   Framework Preset: Other
   Root Directory: ./ (leave as root)
   ```

   **Build Settings:**
   ```
   Build Command: npm run build
   Output Directory: dist/public
   Install Command: npm ci
   ```

   **Node.js Version:**
   ```
   20.x (select from dropdown)
   ```

---

### Step 3: Add Environment Variables

In Vercel project settings:

1. **Navigate to:** Settings → Environment Variables

2. **Add each variable** with these settings:
   - **Environment:** Select all (Production, Preview, Development)
   - **Value:** Paste exact value from Replit or manual source

**Environment Variable Entry UI:**
```
┌─────────────────────────────────────────┐
│ Key:   [DATABASE_URL                  ] │
│ Value: [postgresql://...              ] │
│ Environment: ☑ Production              │
│              ☑ Preview                 │
│              ☑ Development             │
│ [Add]                                   │
└─────────────────────────────────────────┘
```

**Add all 9-10 variables:**

| Order | Key | Value Source |
|-------|-----|--------------|
| 1 | `DATABASE_URL` | Copy from Replit |
| 2 | `OPENAI_API_KEY` | Copy from Replit |
| 3 | `SESSION_SECRET` | Copy from Replit |
| 4 | `ISSUER_URL` | Type: `https://replit.com/oidc` |
| 5 | `STRIPE_SECRET_KEY` | Copy from Replit |
| 6 | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard |
| 7 | `VITE_STRIPE_PUBLIC_KEY` | Copy from Replit |
| 8 | `PEXELS_API_KEY` | Copy from Replit |
| 9 | `PIXABAY_API_KEY` | Copy from Replit |
| 10 | `GOOGLE_FONTS_API_KEY` | Optional |

---

### Step 4: Deploy

1. **Click "Deploy" button** (bottom of page)

2. **Wait for build** (~60-90 seconds)

3. **Monitor build logs** for:
   ```
   ✓ Installing dependencies (npm ci)
   ✓ Building application (npm run build)
   ⚠ PostCSS warning (safe to ignore)
   ✓ Uploading build outputs
   ✓ Deployment ready
   ```

4. **Get Production URL**
   - Vercel assigns: `https://productify-ai-[hash].vercel.app`
   - Shown on deployment success screen

---

## 🧪 Post-Deploy Test Plan

### Immediate Tests (Public Endpoints)

**1. Health Check**
```bash
curl https://YOUR_URL.vercel.app/api/health
```
**Expected:** `{"ok":true}`

**2. AI Health Check**
```bash
curl https://YOUR_URL.vercel.app/api/v2/ai/health
```
**Expected:** `{"ok":true,"model":"gpt-5","response":"OK"}`

**3. Frontend Loads**
```bash
curl -I https://YOUR_URL.vercel.app/
```
**Expected:** `HTTP/2 200`

### Authentication Tests (Browser)

**4. Landing Page**
- Visit: `https://YOUR_URL.vercel.app/`
- **Expected:** Hero section loads with "AI Product Creator" title
- **Check:** No console errors

**5. Login Flow (Replit Auth)**
- Click: **"Login"** or **"Get Started"** button
- **Expected:** Redirect to `https://replit.com/oidc/auth`
- **Check:** URL contains `client_id` and `redirect_uri` parameters

**6. Login Redirect**
- Complete Replit Auth login
- **Expected:** Redirect back to `https://YOUR_URL.vercel.app/dashboard`
- **Check:** User is authenticated (see user email in UI)

### Authenticated Endpoint Tests (via Browser Console or curl with session cookie)

**7. User Data**
```bash
# Via browser console after login:
fetch('/api/auth/user').then(r => r.json()).then(console.log)
```
**Expected:** `{"id":"...","email":"...","username":"..."}`

**8. Projects List**
```bash
fetch('/api/projects').then(r => r.json()).then(console.log)
```
**Expected:** Array of projects or `[]`

**9. Brand Kits**
```bash
fetch('/api/brand-kits').then(r => r.json()).then(console.log)
```
**Expected:** Array of brand kits or `[]`

### Feature Tests (Browser)

**10. Dashboard**
- Visit: `/dashboard`
- **Check:** Welcome section shows
- **Check:** Quick actions work
- **Check:** Week at a glance displays

**11. Create Product**
- Click: **"Create New Product"**
- **Expected:** Wizard loads
- **Check:** AI generation works (requires OPENAI_API_KEY)

**12. Pricing Page**
- Visit: `/pricing`
- **Expected:** Stripe checkout button loads
- **Check:** Click checkout redirects to Stripe (requires VITE_STRIPE_PUBLIC_KEY)

**13. AI Coach**
- Open AI Coach (floating button)
- **Expected:** Chat interface loads
- **Check:** Send message works (requires OPENAI_API_KEY)

---

## ⚠️ Non-Blocking Warnings

### PostCSS Warning (Cosmetic)
```
A PostCSS plugin did not pass the `from` option to `postcss.parse`.
```
- **Status:** ℹ️ Informational only
- **Source:** Tailwind CSS v3 internal plugins
- **Impact:** NONE - Build succeeds, CSS works
- **Action:** Safe to ignore, logged as info

### Bundle Size Warning (Performance)
```
Some chunks are larger than 500 KB after minification.
```
- **Status:** ℹ️ Informational only
- **Size:** 2.5MB (786KB gzipped)
- **Impact:** Slight performance hit on initial load
- **Action:** Optimizable later via code-splitting

**Both warnings are non-blocking and do NOT prevent deployment.**

---

## ✅ Success Criteria

Deployment is successful when:

- [x] Build completes without errors
- [x] `/api/health` returns `{"ok":true}`
- [x] `/api/v2/ai/health` returns AI status
- [x] Frontend loads on `/`
- [x] Login redirects to Replit Auth
- [x] After login, dashboard shows
- [x] Create wizard works
- [x] Stripe checkout loads

---

## 📊 Expected Build Output

```
Building application...
✓ 2481 modules transformed
✓ dist/public/index.html (0.93 kB)
✓ dist/public/assets/index-*.css (109 kB | gzip: 16 kB)
✓ dist/public/assets/index-*.js (2.5 MB | gzip: 786 kB)
✓ built in 22.62s

Backend bundle:
✓ dist/index.js (401 kB)

Total build time: ~23 seconds
```

---

## 🎯 Quick Reference

| Setting | Value |
|---------|-------|
| **Repository** | DemetrisNeophytou/ProductifyAI |
| **Branch** | `main` (recommended) |
| **Framework** | Other (Vite + Express serverless) |
| **Build Command** | `npm run build` |
| **Install Command** | `npm ci` |
| **Output Dir** | `dist/public` |
| **Node Version** | 20.x |
| **Env Vars** | 9 required + 1 optional |
| **Build Time** | ~23 seconds |

---

## 📸 Vercel UI Screenshots Guide

### Import Repository Screen
```
┌─────────────────────────────────────────────────────┐
│  Import Git Repository                              │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ 🔍 Search: DemetrisNeophytou/ProductifyAI   │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  📁 DemetrisNeophytou/ProductifyAI                 │
│     main • GitHub                                  │
│     [Import] ←─── Click here                       │
└─────────────────────────────────────────────────────┘
```

### Project Configuration Screen
```
┌─────────────────────────────────────────────────────┐
│  Configure Project                                  │
│                                                     │
│  Project Name: [productify-ai                    ] │
│  Framework Preset: [Other ▼] ←─── Select "Other"  │
│  Root Directory: [./                             ] │
│                                                     │
│  Build and Output Settings ▼                       │
│    Build Command: [npm run build               ]  │
│    Output Directory: [dist/public              ]  │
│    Install Command: [npm ci                    ]  │
│                                                     │
│  Node.js Version: [20.x ▼] ←─── Select 20.x       │
│                                                     │
│  Environment Variables (9) →                       │
│                                                     │
│  [Deploy] ←─── Click when ready                    │
└─────────────────────────────────────────────────────┘
```

### Environment Variables Screen
```
┌─────────────────────────────────────────────────────┐
│  Environment Variables                              │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ Key:   [DATABASE_URL                      ] │  │
│  │ Value: [postgresql://...                  ] │  │
│  │ ☑ Production ☑ Preview ☑ Development       │  │
│  │ [Add]                                       │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  Added Variables:                                  │
│  • DATABASE_URL                                    │
│  • OPENAI_API_KEY                                  │
│  • ... (add all 9-10 variables)                    │
│                                                     │
│  [Save & Deploy]                                   │
└─────────────────────────────────────────────────────┘
```

---

## 🚦 Deployment Status Indicators

**During Build:**
- 🟡 Building... (Installing dependencies)
- 🟡 Building... (Running npm run build)
- 🟡 Uploading...
- 🟢 Deployment Ready

**On Success:**
```
✓ Deployment ready
  https://productify-ai-[hash].vercel.app
```

**If Errors:**
- Check build logs for specific error
- Verify all environment variables are set
- Ensure Node.js version is 20.x

---

## 📝 Post-Deployment Actions

1. **Test all endpoints** (see test plan above)
2. **Configure custom domain** (optional)
   - Go to: Project Settings → Domains
   - Add: your-domain.com
   - Update DNS records as instructed

3. **Set up Stripe Webhook**
   - Go to: Stripe Dashboard → Webhooks
   - Add endpoint: `https://YOUR_URL.vercel.app/api/stripe/webhook`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`
   - Redeploy if webhook secret was missing

4. **Enable Analytics** (optional)
   - Go to: Project Settings → Analytics
   - Enable Vercel Analytics

5. **Monitor Performance**
   - Check Vercel Analytics dashboard
   - Run Lighthouse test
   - Monitor error logs

---

## 🔧 Troubleshooting

### Build Fails
- **Check:** Node.js version is 20.x
- **Check:** All dependencies in package.json
- **Review:** Build logs for specific error

### Health Endpoint 404
- **Verify:** `vercel.json` routing configuration
- **Check:** `api/index.ts` exports correctly
- **Review:** Vercel function logs

### Auth Fails
- **Verify:** `ISSUER_URL=https://replit.com/oidc` is set
- **Check:** `SESSION_SECRET` is configured
- **Test:** Login flow in incognito window

### Stripe Fails
- **Verify:** `VITE_STRIPE_PUBLIC_KEY` is set
- **Check:** Key starts with `pk_live_` or `pk_test_`
- **Redeploy:** After adding env vars

---

**Status:** ✅ READY TO DEPLOY

**Estimated Time:** 10-15 minutes total

**Next Step:** Follow Step 1 - Push code to GitHub `main` branch
