# 🔐 Secrets Status & Configuration Guide
import 'dotenv/config';
**Last Updated:** October 8, 2025  
**Project:** Productify AI

---

## 📊 Quick Status Overview

| Secret | Status | Critical | Used In |
|--------|--------|----------|---------|
| `DATABASE_URL` | ✅ EXISTS | YES | Database connection |
| `OPENAI_API_KEY` | ✅ EXISTS | YES | AI features |
| `SESSION_SECRET` | ✅ EXISTS | YES | Session encryption |
| `ISSUER_URL` | ❌ **MISSING** | YES | Replit Auth |
| `STRIPE_SECRET_KEY` | ✅ EXISTS | YES | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | ❌ **MISSING** | YES | Webhook validation |
| `VITE_STRIPE_PUBLIC_KEY` | ❌ **MISSING** | YES | Frontend checkout |
| `PEXELS_API_KEY` | ✅ EXISTS | NO | Stock photos |
| `PIXABAY_API_KEY` | ✅ EXISTS | NO | Stock photos |
| `GOOGLE_FONTS_API_KEY` | ❌ MISSING | NO | Google Fonts (has fallback) |

**Critical Missing:** 3 secrets (ISSUER_URL, STRIPE_WEBHOOK_SECRET, VITE_STRIPE_PUBLIC_KEY)

---

## 🔴 CRITICAL - Required Immediately

### 1. ISSUER_URL
**Status:** ❌ **MISSING**  
**Value:** `https://replit.com/oidc`  
**Purpose:** Replit Auth OpenID Connect issuer URL

**Where Used:**
```typescript
server/replitAuth.ts:19
  new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc")
```

**Impact if Missing:** Falls back to default but may fail on custom domains. Authentication will not work properly.

**How to Add:**
```bash
# In Replit Secrets panel:
Name: ISSUER_URL
Value: https://replit.com/oidc
```

---

### 2. STRIPE_WEBHOOK_SECRET
**Status:** ❌ **MISSING**  
**Value:** `whsec_...` (Get from Stripe Dashboard)  
**Purpose:** Validates Stripe webhook signatures for security

**Where Used:**
```typescript
server/routes.ts:3758
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

server/stripe-routes.ts:247
  process.env.STRIPE_WEBHOOK_SECRET || ''
```

**Impact if Missing:** Webhook validation will fail. Subscription updates won't work. Security vulnerability.

**How to Get:**
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. Reveal and copy the "Signing secret" (starts with `whsec_`)
4. Add to Replit Secrets:
   ```bash
   Name: STRIPE_WEBHOOK_SECRET
   Value: whsec_xxxxxxxxxxxxx
   ```

---

### 3. VITE_STRIPE_PUBLIC_KEY
**Status:** ❌ **MISSING**  
**Value:** `pk_live_...` or `pk_test_...` (Get from Stripe Dashboard)  
**Purpose:** Frontend Stripe.js initialization for checkout

**Where Used:**
```typescript
client/src/pages/Pricing.tsx:10
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
```

**Impact if Missing:** Pricing page Stripe checkout will fail with "undefined" error.

**How to Get:**
1. Go to [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your "Publishable key" (starts with `pk_live_` or `pk_test_`)
3. Add to Replit Secrets (must start with `VITE_`):
   ```bash
   Name: VITE_STRIPE_PUBLIC_KEY
   Value: pk_live_xxxxxxxxxxxxx
   ```

**Note:** Must start with `VITE_` prefix to be accessible in frontend code.

---

## ✅ VERIFIED - Already Configured

### 4. DATABASE_URL
**Status:** ✅ **EXISTS**  
**Purpose:** PostgreSQL database connection string

**Where Used:**
```typescript
server/db.ts:14
import dotenv from "dotenv";
dotenv.config();

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./shared/schema.js";

neonConfig.webSocketConstructor = WebSocket;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
import dotenv from "dotenv";
dotenv.config();

console.log("DATABASE_URL:",process.env.DATABASE_URL);
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
server/replitAuth.ts:30
  conString: process.env.DATABASE_URL
```

**Format:** `postgresql://user:pass@host:5432/dbname`

---

### 5. OPENAI_API_KEY
**Status:** ✅ **EXISTS**  
**Purpose:** OpenAI GPT-5 and DALL-E API access

**Where Used:**
```typescript
server/openai.ts:7
  const apiKey = process.env.OPENAI_API_KEY || 'placeholder-key-not-configured';

server/routes.ts:269
  const apiKey = process.env.OPENAI_API_KEY || 'placeholder-key-not-configured';

server/ai-generate.ts:5
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

server/ai-agents.ts:15
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

server/agent-runner.ts:161, 244
server/brand-guard.ts:3
server/niches.ts:16
server/llm-client.ts:3
```

**Format:** `sk-...`

---

### 6. SESSION_SECRET
**Status:** ✅ **EXISTS**  
**Purpose:** Express session encryption key

**Where Used:**
```typescript
server/replitAuth.ts:36
  secret: process.env.SESSION_SECRET!
```

**Generate New:** `openssl rand -base64 32`

---

### 7. STRIPE_SECRET_KEY
**Status:** ✅ **EXISTS**  
**Purpose:** Stripe API backend authentication

**Where Used:**
```typescript
server/stripe-config.ts:7
  export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {...});
```

**Format:** `sk_live_...` or `sk_test_...`

---

### 8. PEXELS_API_KEY
**Status:** ✅ **EXISTS**  
**Purpose:** Pexels stock photos API

**Where Used:**
```typescript
server/routes.ts:2975, 3319, 3958
  const apiKey = process.env.PEXELS_API_KEY;

server/video-builder.ts:16
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
```

**Get From:** [https://www.pexels.com/api/](https://www.pexels.com/api/)

---

### 9. PIXABAY_API_KEY
**Status:** ✅ **EXISTS**  
**Purpose:** Pixabay stock photos API

**Where Used:**
```typescript
server/routes.ts:3007, 3427, 3992
  const apiKey = process.env.PIXABAY_API_KEY;
```

**Get From:** [https://pixabay.com/api/docs/](https://pixabay.com/api/docs/)

---

## 🟡 Optional - Has Fallback

### 10. GOOGLE_FONTS_API_KEY
**Status:** ❌ MISSING (OK - Has Fallback)  
**Purpose:** Google Fonts API for expanded font selection

**Where Used:**
```typescript
server/routes.ts:3527
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
```

**Impact if Missing:** Falls back to curated popular fonts list (100+ fonts). No impact on functionality.

**Get From:** [Google Cloud Console → APIs & Services](https://console.cloud.google.com/apis)

---

## 🔧 System Environment Variables (Auto-Provided by Replit)

These are automatically set by the Replit environment - **DO NOT manually configure**:

| Variable | Purpose | Used In |
|----------|---------|---------|
| `REPLIT_DOMAINS` | Available domains for auth | `server/replitAuth.ts:12` |
| `REPL_ID` | Repl identifier | `server/replitAuth.ts:20, 148` |
| `REPLIT_DEV_DOMAIN` | Development domain | `server/routes.ts:3689, 3731` |
| `NODE_ENV` | Environment mode | `server/seed-phase5.ts:14` |
| `PORT` | Server port | `server/index.ts:11` (default: 5000) |
| `VERCEL` | Vercel deployment flag | `server/app.ts:60` |

---

## 🚀 Quick Setup Commands

### Add All Missing Critical Secrets

```bash
# 1. ISSUER_URL
# Go to Replit Secrets panel and add:
Name: ISSUER_URL
Value: https://replit.com/oidc

# 2. STRIPE_WEBHOOK_SECRET
# Get from Stripe Dashboard → Webhooks → Signing Secret
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxx

# 3. VITE_STRIPE_PUBLIC_KEY
# Get from Stripe Dashboard → API Keys → Publishable Key
Name: VITE_STRIPE_PUBLIC_KEY
Value: pk_live_xxxxxxxxxxxxx
```

### Verify Secrets Are Working

```bash
# After adding secrets, restart the server
# Server auto-restarts when secrets change

# Test health endpoint
curl http://localhost:5000/api/health
# Expected: {"ok":true}

# Test auth (should redirect)
curl -L http://localhost:5000/api/login
# Expected: Redirect to Replit OAuth

# Test Stripe checkout page loads
# Open: http://localhost:5000/pricing
# Expected: Stripe elements load, no "undefined" errors
```

---

## 📋 Deployment Checklist

### For Vercel Deployment

Add **ALL** of these environment variables in Vercel project settings:

**Required:**
- ✅ `DATABASE_URL`
- ✅ `OPENAI_API_KEY`
- ✅ `SESSION_SECRET`
- ⚠️ `ISSUER_URL` → `https://replit.com/oidc`
- ✅ `STRIPE_SECRET_KEY`
- ⚠️ `STRIPE_WEBHOOK_SECRET`
- ⚠️ `VITE_STRIPE_PUBLIC_KEY`
- ✅ `PEXELS_API_KEY`
- ✅ `PIXABAY_API_KEY`

**Optional:**
- `GOOGLE_FONTS_API_KEY`
- `OPENAI_MODEL` (defaults to `gpt-5`)

### Environment-Specific Values

**Development:**
- Use Stripe test keys: `pk_test_...` and `sk_test_...`
- Use test webhook secret

**Production:**
- Use Stripe live keys: `pk_live_...` and `sk_live_...`
- Use production webhook secret
- Ensure DATABASE_URL points to production database

---

## 🔍 Troubleshooting

### Issue: "Unauthorized" on all endpoints
**Cause:** Auth not configured or ISSUER_URL missing  
**Fix:** Add `ISSUER_URL=https://replit.com/oidc` to secrets

### Issue: Stripe checkout shows "undefined"
**Cause:** `VITE_STRIPE_PUBLIC_KEY` not set  
**Fix:** Add to Replit Secrets (must start with `VITE_`)

### Issue: Webhook signature verification fails
**Cause:** Wrong or missing `STRIPE_WEBHOOK_SECRET`  
**Fix:** Copy correct signing secret from Stripe Dashboard

### Issue: OpenAI API errors
**Cause:** Invalid or missing `OPENAI_API_KEY`  
**Fix:** Verify API key is correct and has credits

---

## 📚 Related Documentation

- **Full Audit Report:** `AUDIT_REPORT.md`
- **Quick Fixes:** `QUICK_START_FIXES.md`
- **Vercel Variables:** `VERCEL_ENV_VARS.md`
- **Stripe Setup:** `STRIPE_SETUP_INSTRUCTIONS.md`

---

## ✅ Status Check Command

Run this to verify all secrets are properly configured:

```bash
# Check which secrets exist
node -e "
const required = [
  'DATABASE_URL',
  'OPENAI_API_KEY', 
  'SESSION_SECRET',
  'ISSUER_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'VITE_STRIPE_PUBLIC_KEY',
  'PEXELS_API_KEY',
  'PIXABAY_API_KEY'
];

required.forEach(key => {
  const exists = !!process.env[key];
  console.log(\`\${exists ? '✅' : '❌'} \${key}\`);
});
"
```

---

**Last Updated:** October 8, 2025  
**Status:** 3 critical secrets missing - add before deployment
