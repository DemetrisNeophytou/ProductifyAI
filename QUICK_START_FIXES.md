# 🚀 Quick Start - Critical Fixes Checklist

**Status:** 2/5 fixes complete ✅

---

## ✅ COMPLETED

### 1. Fixed TypeScript Error ✅
- **File:** `server/openai.ts:1278`  
- **Fix:** Changed `response.data[0]?.url` → `response.data?.[0]?.url`
- **Status:** Fixed and verified via LSP

### 2. Updated Documentation ✅
- **File:** `VERCEL_ENV_VARS.md`
- **Added:** `VITE_STRIPE_PUBLIC_KEY` to required variables
- **Fixed:** `ISSUER_URL` example to include `/oidc` path

---

## 🔴 CRITICAL - ACTION REQUIRED (3 Missing Environment Variables)

### Step 1: Add Missing Replit Secrets

Open Replit Secrets panel and add these **3 critical variables**:

#### 1. ISSUER_URL
```
Name: ISSUER_URL
Value: https://replit.com/oidc
```

#### 2. STRIPE_WEBHOOK_SECRET
```
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxx
```
**👉 Get this from:** [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
- Click on your webhook endpoint
- Copy the "Signing secret" value

#### 3. VITE_STRIPE_PUBLIC_KEY  
```
Name: VITE_STRIPE_PUBLIC_KEY
Value: pk_live_xxxxxxxxxxxxx (or pk_test_xxx for testing)
```
**👉 Get this from:** [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
- Copy your "Publishable key"

---

## 🧪 Verification Steps

After adding the secrets, verify everything works:

### 1. Restart the Server
```bash
# Server will auto-restart when you add secrets
# Or manually restart the "Start application" workflow
```

### 2. Test Auth Flow
1. Open your Replit app
2. Click "Login" 
3. Should redirect to Replit OAuth ✅
4. After login, should see dashboard ✅

### 3. Test Stripe Integration
1. Go to `/pricing` page
2. Click "Subscribe" button
3. Stripe checkout should load ✅
4. Should not see "undefined" or console errors ✅

### 4. Test Webhooks (Optional)
```bash
# If using Stripe CLI for local testing:
stripe listen --forward-to https://your-replit-url.repl.co/api/webhook/stripe
```

---

## 📋 Vercel Deployment Checklist

Before deploying to Vercel, add **ALL** environment variables:

### Required on Vercel:
- ✅ `DATABASE_URL` - Your PostgreSQL connection string
- ✅ `OPENAI_API_KEY` - OpenAI API key
- ✅ `SESSION_SECRET` - Random secret (generate: `openssl rand -base64 32`)
- 🔴 `ISSUER_URL` - `https://replit.com/oidc`
- ✅ `STRIPE_SECRET_KEY` - Your Stripe secret key
- 🔴 `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- 🔴 `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key
- ✅ `PEXELS_API_KEY` - Pexels API key
- ✅ `PIXABAY_API_KEY` - Pixabay API key

### Optional on Vercel:
- `GOOGLE_FONTS_API_KEY` - Google Fonts (has fallback)

---

## ⚡ Quick Commands

### Build & Test Locally
```bash
# Full build (frontend + backend)
npm run build

# Check TypeScript
npm run check

# Run production build locally
npm run start
```

### Database Sync
```bash
# Push schema changes to database
npm run db:push

# If data loss warning, force push:
npm run db:push --force
```

---

## 🎯 Next Steps After Fixing

Once the 3 secrets are added:

1. **Test locally** - Verify auth, Stripe, and AI features work
2. **Commit changes** - Push to GitHub (AUDIT_REPORT.md, fixed code)
3. **Deploy to Vercel** - Add env vars and deploy
4. **Smoke test** - Test production deployment end-to-end

---

## 📚 Reference Documents

- **Full Audit Report:** `AUDIT_REPORT.md`
- **Vercel Environment Variables:** `VERCEL_ENV_VARS.md`
- **Deployment Guide:** `VERCEL_DEPLOYMENT.md`
- **Stripe Setup:** `STRIPE_SETUP_INSTRUCTIONS.md`

---

## 🆘 Troubleshooting

### Issue: "Unauthorized" on all API endpoints
**Solution:** Make sure you're logged in via `/api/login`

### Issue: Stripe checkout shows "undefined"
**Solution:** Add `VITE_STRIPE_PUBLIC_KEY` to Replit Secrets

### Issue: Webhooks fail with "Invalid signature"
**Solution:** Add correct `STRIPE_WEBHOOK_SECRET` from Stripe Dashboard

### Issue: Auth redirect loop
**Solution:** Verify `ISSUER_URL=https://replit.com/oidc` (include `/oidc`)

---

**🎉 After these fixes, your app is production-ready!**
