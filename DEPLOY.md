# ProductifyAI Deployment Guide

## 🚀 Production Deployment

### Prerequisites

- [ ] Supabase project created
- [ ] Stripe account configured
- [ ] Resend API key obtained
- [ ] OpenAI API key
- [ ] Domain name ready

---

## 📋 Environment Setup

### Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=5050
FRONTEND_URL=https://productifyai.com
VITE_API_URL=https://api.productifyai.com

# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres?sslmode=require
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID_PLUS=price_xxxxx
STRIPE_PRICE_ID_PRO=price_xxxxx

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=ProductifyAI <noreply@productifyai.com>

# Security
JWT_SECRET=your-secret-min-32-chars
SESSION_SECRET=your-secret-min-32-chars

# Disable Mocks
MOCK_DB=false
MOCK_STRIPE=false
VITE_SHOW_DEV_BANNER=false
EVAL_MODE=false
```

---

## 🟢 Option A: Vercel Deployment

### Step 1: Prepare Repository

```bash
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Import Git Repository
3. Select ProductifyAI repo

### Step 3: Configure Build Settings

**Framework Preset:** Vite  
**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Install Command:** `npm install`

### Step 4: Environment Variables

Add all variables from production .env:
- DATABASE_URL
- STRIPE_SECRET_KEY
- OPENAI_API_KEY
- etc.

### Step 5: Deploy

Click "Deploy" - Vercel builds and deploys automatically

### Step 6: Configure Stripe Webhook

**Webhook URL:** `https://your-domain.vercel.app/api/stripe/webhook`  
**Events:** All `customer.subscription.*` and `invoice.*`  
**Copy signing secret → STRIPE_WEBHOOK_SECRET**

### Step 7: Run Migrations

```bash
# Via Vercel CLI or run locally pointing to production DB
npm run migrate:admin
npm run ingest:kb
```

### Step 8: Test

- Visit https://your-domain.vercel.app
- Test signup flow
- Test Stripe checkout (use test card first)
- Verify webhook delivery in Stripe Dashboard

---

## ⚙️ Option B: Render Deployment

### Step 1: Create Web Service

1. Go to https://render.com
2. New → Web Service
3. Connect Git repository

### Step 2: Configure Service

**Name:** productifyai-api  
**Environment:** Node  
**Build Command:** `npm install && npm run build`  
**Start Command:** `npm start`  
**Plan:** Free or Starter

### Step 3: Add Environment Variables

Copy all production env vars from .env.production.example

### Step 4: Deploy

Render auto-deploys on git push

### Step 5: Setup Webhook

Configure Stripe webhook to: `https://productifyai-api.onrender.com/api/stripe/webhook`

---

## 🐳 Option C: Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 5050

# Start
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5050:5050"
    env_file:
      - .env.production
    restart: unless-stopped
```

### Deploy

```bash
docker-compose up -d
```

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Project

1. Go to https://supabase.com
2. Create new project
3. Choose region (EU for GDPR compliance)
4. Copy connection string

### Step 2: Run Migrations

```bash
# Set DATABASE_URL in .env
DATABASE_URL=postgresql://...

# Push schema
npm run db:push

# Run admin migration
npm run migrate:admin

# Ingest knowledge base
npm run ingest:kb
```

### Step 3: Enable pgvector (for RAG)

```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

-- Convert embedding column
ALTER TABLE kb_embeddings 
  ALTER COLUMN embedding TYPE vector(1536);

-- Create vector index
CREATE INDEX kb_embeddings_vector_idx 
  ON kb_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
```

### Step 4: Initialize Channels

```bash
curl -X POST https://api.productifyai.com/api/community/init
```

---

## 💳 Stripe Setup

### Step 1: Create Products

**Plus Plan:**
- Name: ProductifyAI Plus
- Price: €24/month
- Billing: Recurring monthly
- Trial: 3 days
- Copy Price ID → `STRIPE_PRICE_ID_PLUS`

**Pro Plan:**
- Name: ProductifyAI Pro
- Price: €49/month  
- Billing: Recurring monthly
- Copy Price ID → `STRIPE_PRICE_ID_PRO`

### Step 2: Configure Webhook

**Endpoint:** `https://api.productifyai.com/api/stripe/webhook`

**Events to Listen:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

**Copy Signing Secret → STRIPE_WEBHOOK_SECRET**

### Step 3: Enable Customer Portal

Stripe Dashboard → Settings → Customer Portal  
Enable portal and configure allowed actions

### Step 4: Test with Test Mode

```bash
# Use test API keys first
STRIPE_SECRET_KEY=sk_test_...

# Test card: 4242 4242 4242 4242
```

---

## 📧 Resend Setup

### Step 1: Create Account

1. Go to https://resend.com
2. Sign up and verify email

### Step 2: Get API Key

Dashboard → API Keys → Create  
Copy key → `RESEND_API_KEY`

### Step 3: Verify Domain (Optional)

For production `noreply@productifyai.com`:
- Add DNS records
- Verify domain in Resend

For testing, use: `onboarding@resend.dev`

---

## 🔒 Security Checklist

### Before Go-Live

- [ ] Change all JWT/SESSION secrets (min 32 chars)
- [ ] Use Stripe live keys (not test)
- [ ] Enable HTTPS only
- [ ] Set CORS to production domain only
- [ ] Disable EVAL_MODE (use role-based admin)
- [ ] Hide dev banner (VITE_SHOW_DEV_BANNER=false)
- [ ] Enable rate limiting
- [ ] Review all API endpoints for auth
- [ ] Test plan gating on all routes
- [ ] Verify webhook signatures

---

## 🧪 Production Testing

### Health Check

```bash
curl https://api.productifyai.com/api/health

# Expected:
{
  "ok": true,
  "services": {
    "database": { "status": "connected" },
    "stripe": { "status": "connected" },
    "openai": { "status": "configured" },
    "email": { "status": "configured" }
  }
}
```

### Stripe Test Flow

1. **Test Checkout:**
   - Visit /pricing
   - Click "Start Free Trial"
   - Use test card: 4242 4242 4242 4242
   - Complete checkout

2. **Verify Webhook:**
   - Check Stripe Dashboard → Webhooks → Delivery
   - Should show "Signed" status
   - User plan updated in database

3. **Test Portal:**
   - Visit /profile
   - Click "Manage Subscription"
   - Should open Stripe Customer Portal

### Database Verification

```sql
-- Check users exist
SELECT COUNT(*) FROM users;

-- Check subscriptions
SELECT plan, status, COUNT(*) 
FROM users 
GROUP BY plan, status;

-- Check orders
SELECT COUNT(*), SUM(commission) 
FROM orders;

-- Check admin role
SELECT email, role FROM users WHERE role = 'admin';
```

---

## 📊 Monitoring Setup

### Application Monitoring

**Health Endpoint:**
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor: https://api.productifyai.com/api/health
- Alert if down for > 2 minutes

**Error Tracking:**
```bash
# Optional: Add Sentry
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Stripe Monitoring

- Dashboard → Webhooks → Monitor delivery rate
- Alert on failed webhook deliveries
- Review payment failures daily

### Database Monitoring

- Supabase Dashboard → Database → Performance
- Monitor query performance
- Set up backups (daily recommended)

---

## 🔄 Post-Deployment

### Day 1

- [ ] Test complete user flow (signup → trial → paid)
- [ ] Verify all emails send
- [ ] Check webhook deliveries (100% success rate)
- [ ] Monitor error logs
- [ ] Test admin panel access

### Week 1

- [ ] Review /admin/analytics daily
- [ ] Monitor trial → paid conversion
- [ ] Check marketplace commission calculations
- [ ] Respond to any support emails
- [ ] Fix any production bugs

### Month 1

- [ ] Analyze churn rate
- [ ] Review most-used features
- [ ] Optimize slow endpoints
- [ ] Add more KB documents
- [ ] Run `npm run eval` to check AI quality

---

## 🛠️ Rollback Plan

### If Issues Arise

**Option 1: Revert to Previous Deploy**
```bash
# Vercel
vercel rollback

# Render
# Use dashboard to rollback
```

**Option 2: Disable Problematic Feature**
```bash
# Temporarily disable via env var
FEATURE_XYZ_ENABLED=false
```

**Option 3: Database Rollback**
```bash
# Restore from Supabase backup
# Dashboard → Database → Backups → Restore
```

---

## 📝 Launch Checklist

### Pre-Launch

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Stripe products created
- [ ] Webhook configured and tested
- [ ] Email domain verified
- [ ] Admin account created
- [ ] Knowledge base ingested
- [ ] Health check passes
- [ ] Test signup flow works
- [ ] Test payment flow works
- [ ] All pages load without errors

### Launch Day

- [ ] Deploy to production
- [ ] Verify health endpoint
- [ ] Test one real signup
- [ ] Monitor logs for errors
- [ ] Check Stripe webhooks deliver
- [ ] Verify emails send

### Post-Launch

- [ ] Monitor uptime (target: 99.9%)
- [ ] Track user signups
- [ ] Watch trial conversions
- [ ] Review error rates
- [ ] Respond to support

---

**Version:** 1.0  
**Last Updated:** October 20, 2025  
**Status:** Ready for Production 🚀

