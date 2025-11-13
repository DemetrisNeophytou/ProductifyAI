# 🚀 Production Deployment Playbook

**Date:** 2025-11-08  
**Goal:** Complete production rollout on Render + Vercel

---

## Phase 1: Merge Pull Requests

### Order of Merging (CRITICAL)

Merge in this exact order using **"Merge commit"** (NOT squash):

1. **PR #5** - `chore/scrub-oauth-secrets` (Security first)
2. **PR #2** - `docs/vercel-render-env-matrix` (Configuration)
3. **PR #1** - `fix/render-build-start-healthz` (Infrastructure)
4. **PR #3** - `chore/cors-whitelist-localhost-vercel` (CORS)
5. **PR #4** - `ci/robust-secrets-scan` (CI/CD)
6. **PR #6** - `chore/bug-bash-post-deploy-checklist` (Documentation)

### How to Merge Each PR

For each PR:
1. Go to: https://github.com/DemetrisNeophytou/ProductifyAI/pulls
2. Click on the PR
3. Scroll to bottom
4. If conflicts: Click "Resolve conflicts"
   - For `docs/DEPLOYMENT_ENV.md`: **Keep placeholder version** (replace real secrets with `<your-*>`)
   - For `.env.example`: **Keep placeholders only**
5. Click **"Merge pull request"**
6. Select **"Create a merge commit"** (dropdown if needed)
7. Confirm merge
8. Wait for GitHub Actions to pass

### ⚠️ Conflict Resolution

If `docs/DEPLOYMENT_ENV.md` has conflicts:
- **KEEP:** `<your-supabase-url>`, `<your-google-client-id>`, etc.
- **REMOVE:** Any real credentials like `85711301559-...` or `GOCSPX-...`

---

## Phase 2: Configure Render

### Step 1: Access Render Dashboard

1. Go to: https://dashboard.render.com
2. Select service: **`productifyai-api`**
3. Go to **"Settings"** tab

### Step 2: Update Build & Start Commands

**Service Settings:**
- **Build Command:** `npm ci --include=dev && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/healthz`

Click **"Save Changes"**

### Step 3: Set Environment Variables

Go to **"Environment"** tab → Click **"Add Environment Variable"**

Add these (replace `...` with your actual values):

```bash
# Node Configuration
NODE_ENV=production
PORT=10000

# Supabase (Backend uses service role key)
SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Google OAuth
GOOGLE_CLIENT_ID=85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Security Secrets (GENERATE NEW ONES!)
JWT_SECRET=<GENERATE_32_CHAR_SECRET>
SESSION_SECRET=<GENERATE_32_CHAR_SECRET>

# CORS & Frontend
CORS_ORIGIN=http://localhost:5173,https://productivity-ai-gamma.vercel.app
FRONTEND_URL=https://productivity-ai-gamma.vercel.app

# OpenAI (if using AI features)
OPENAI_API_KEY=<your_openai_key>
```

**Generate Secrets (PowerShell on Windows):**
```powershell
# JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# SESSION_SECRET (run again for different value)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Step 4: Trigger Deploy

After saving all env vars, Render will auto-deploy.

Monitor in **"Events"** tab until you see:
```
✅ Deploy live
```

---

## Phase 3: Configure Vercel

### Step 1: Access Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select project: **`ProductifyAI`**
3. Go to **"Settings"** → **"Environment Variables"**

### Step 2: Add Environment Variables

For **Production**, **Preview**, and **Development** environments:

```bash
VITE_SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_URL=https://productifyai-api.onrender.com
VITE_APP_NAME=ProductifyAI
VITE_APP_VERSION=1.0.0
```

**How to add each:**
1. Click **"Add New"**
2. Name: `VITE_SUPABASE_URL`
3. Value: `https://dfqssnvqsxjjtyhylzen.supabase.co`
4. Select all 3 checkboxes: ☑ Production ☑ Preview ☑ Development
5. Click **"Save"**
6. Repeat for each variable

### Step 3: Redeploy

Go to **"Deployments"** tab:
1. Find latest deployment
2. Click **"..."** → **"Redeploy"**
3. Wait for success ✅

If any preview deployments failed, retry them individually.

---

## Phase 4: Configure Google OAuth

### Step 1: Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID: `85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq`

### Step 2: Add Authorized Redirect URIs

Add these exact URIs:

```
http://localhost:5173/auth/callback
https://productivity-ai-gamma.vercel.app/auth/callback
https://dfqssnvqsxjjtyhylzen.supabase.co/auth/v1/callback
```

### Step 3: Add Authorized JavaScript Origins

```
http://localhost:5173
https://productivity-ai-gamma.vercel.app
https://dfqssnvqsxjjtyhylzen.supabase.co
```

Click **"Save"**

### Step 4: Enable in Supabase

1. Go to: https://supabase.com/dashboard/project/dfqssnvqsxjjtyhylzen/auth/providers
2. Find **"Google"** provider
3. Enable it
4. Client ID: `85711301559-2oebtf7o2fk6vlcb6kvdqre2lrb647hq`
5. Client Secret: `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`
6. Click **"Save"**

---

## Phase 5: Post-Deploy Verification

Run these 14 tests and record results:

### Test 1: Backend Liveness Probe

```bash
curl https://productifyai-api.onrender.com/healthz
```

**Expected:** `{"status":"ok"}`  
**Status Code:** 200

**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 2: Backend Detailed Health

```bash
curl https://productifyai-api.onrender.com/api/health
```

**Expected:** JSON with `"ok": true` and service statuses  
**Status Code:** 200

**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 3: Frontend Loads

```bash
curl https://productivity-ai-gamma.vercel.app
```

**Expected:** 200 OK with HTML containing `<title>`  
**Status Code:** 200

**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 4: Static Assets Load

```bash
curl -I https://productivity-ai-gamma.vercel.app/assets/
```

**Expected:** Assets directory accessible  
**Status Code:** 200 or 403 (normal for directory)

**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 5: CORS from Browser

Open browser console at `https://productivity-ai-gamma.vercel.app` and paste:

```javascript
fetch('https://productifyai-api.onrender.com/api/health', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(d => console.log('✅ CORS works!', d))
  .catch(e => console.error('❌ CORS failed:', e));
```

**Expected:** No CORS error, data returned  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 6: API URL Configured

In browser console at `https://productivity-ai-gamma.vercel.app`:

```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

**Expected:** `https://productifyai-api.onrender.com`  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 7: Email/Password Signup

1. Navigate to `https://productivity-ai-gamma.vercel.app`
2. Click "Sign Up"
3. Enter email + password
4. Submit form

**Expected:** Account created, redirected to dashboard  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 8: Email/Password Login

1. Log out
2. Click "Log In"
3. Enter credentials
4. Submit

**Expected:** Login successful  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 9: Google OAuth Login

1. Log out
2. Click "Sign in with Google"
3. Select Google account
4. Authorize

**Expected:** Redirected back to app, logged in  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 10: Database Connection (Render Logs)

Check Render logs for:
```
✅ Database connected
```

**Expected:** No connection errors  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 11: Database Queries Work

In browser console:
```javascript
fetch('https://productifyai-api.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('DB Status:', d.services?.database));
```

**Expected:** `{"status":"connected","type":"supabase"}`  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 12: Backend Env Vars (Render Logs)

Check Render startup logs for:
```
✅ Environment: production
✅ PORT: 10000
✅ CORS enabled for origins: http://localhost:5173,https://productivity-ai-gamma.vercel.app
✅ Supabase URL: https://dfqssnvqsxjjtyhylzen.supabase.co
```

**Expected:** All vars logged  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 13: Frontend Env Vars

In browser console at `https://productivity-ai-gamma.vercel.app`:
```javascript
console.log({
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  API_URL: import.meta.env.VITE_API_URL
});
```

**Expected:** Both defined (not undefined)  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

---

### Test 14: CI Secrets Scan Works

Create a test file with a fake OpenAI key:
```bash
echo "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz" > test-secret.txt
git add test-secret.txt
git commit -m "test: trigger secrets scan"
git push
```

**Expected:** GitHub Actions CI fails with "SECRET LEAK DETECTED"  
**Result:** [ ] ✅ Pass [ ] ❌ Fail

**Cleanup:**
```bash
git reset HEAD~1
git push --force
```

---

## Phase 6: Update Documentation

After completing all tests, update `FINAL_PR_STATUS.md`:

Mark all tasks as complete:
- ✅ All 6 PRs merged
- ✅ Render configured and deployed
- ✅ Vercel configured and deployed
- ✅ Google OAuth configured
- ✅ All 14 post-deploy tests passed

Add deployment links:
- **Backend:** https://productifyai-api.onrender.com
- **Frontend:** https://productivity-ai-gamma.vercel.app
- **Health Check:** https://productifyai-api.onrender.com/healthz

---

## 📊 Completion Checklist

Mark off as you complete:

### PRs Merged
- [ ] PR #5 (scrub-oauth-secrets)
- [ ] PR #2 (vercel-render-env-matrix)
- [ ] PR #1 (render-build-start-healthz)
- [ ] PR #3 (cors-whitelist-localhost-vercel)
- [ ] PR #4 (robust-secrets-scan)
- [ ] PR #6 (bug-bash-post-deploy-checklist)

### Render Configuration
- [ ] Build command updated
- [ ] Start command updated
- [ ] Health check path set
- [ ] All env vars added
- [ ] Deployment successful

### Vercel Configuration
- [ ] All env vars added (Production)
- [ ] All env vars added (Preview)
- [ ] All env vars added (Development)
- [ ] Deployment successful
- [ ] Preview deployments successful

### Google OAuth
- [ ] Redirect URIs added
- [ ] JavaScript origins added
- [ ] Supabase provider enabled

### Post-Deploy Tests
- [ ] Test 1: Backend healthz
- [ ] Test 2: Backend health
- [ ] Test 3: Frontend loads
- [ ] Test 4: Assets load
- [ ] Test 5: CORS works
- [ ] Test 6: API URL configured
- [ ] Test 7: Signup works
- [ ] Test 8: Login works
- [ ] Test 9: Google OAuth works
- [ ] Test 10: DB connected
- [ ] Test 11: DB queries work
- [ ] Test 12: Backend env vars
- [ ] Test 13: Frontend env vars
- [ ] Test 14: CI secrets scan

### Documentation
- [ ] FINAL_PR_STATUS.md updated
- [ ] Deployment links added
- [ ] Test results recorded

---

## 🎉 Success Criteria

Deployment is successful when:
- ✅ All 6 PRs merged to main
- ✅ Render service shows "Live"
- ✅ Vercel deployment shows "Ready"
- ✅ All 14 tests pass
- ✅ No errors in Render logs
- ✅ No errors in Vercel logs
- ✅ No CORS errors in browser console
- ✅ Users can sign up and log in

---

**Last Updated:** 2025-11-08  
**Status:** Ready for execution


