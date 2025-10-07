# Stripe Subscription Setup Instructions

## ✅ What's Been Implemented

### Database Schema
- ✅ Trial tracking (3-day trial for all new users)
- ✅ Subscription tier tracking (trial, plus, pro)
- ✅ Subscription status tracking (trialing, active, cancelled, past_due, expired)
- ✅ Stripe customer & subscription ID tracking

### Backend API
- ✅ `/api/subscription/status` - Check user's subscription status and limits
- ✅ `/api/subscription/create-checkout` - Create Stripe checkout session
- ✅ `/api/subscription/portal` - Access Stripe billing portal
- ✅ `/api/webhooks/stripe` - Handle Stripe webhook events

### Frontend
- ✅ `/pricing` page with Plus and Pro plan comparison
- ✅ Trial status display
- ✅ "Upgrade" link in sidebar
- ✅ Stripe checkout integration

### Features
- ✅ Automatic 3-day trial for new users
- ✅ Trial initialization on first login
- ✅ Subscription event handling (created, updated, cancelled, payment_failed)

## 🔧 Required Setup Steps

### Step 1: Get Your Stripe Price IDs

1. Go to your Stripe Dashboard → Products
2. Find your "Productify AI Plus" and "Productify AI Pro" products
3. Copy the Price IDs for each plan (they look like `price_xxxxxxxxxxxxx`)

You'll need **4 price IDs**:
- Plus Monthly
- Plus Quarterly
- Pro Monthly
- Pro Quarterly

### Step 2: Update the Pricing Page

Edit `client/src/pages/Pricing.tsx` and replace these placeholder price IDs with your actual Stripe price IDs:

```typescript
// Line ~190 - Plus Monthly
onClick={() => handleSubscribe('price_PLUS_MONTHLY', 'plus')}

// Line ~199 - Plus Quarterly
onClick={() => handleSubscribe('price_PLUS_QUARTERLY', 'plus')}

// Line ~276 - Pro Monthly
onClick={() => handleSubscribe('price_PRO_MONTHLY', 'pro')}

// Line ~285 - Pro Quarterly
onClick={() => handleSubscribe('price_PRO_QUARTERLY', 'pro')}
```

Replace:
- `price_PLUS_MONTHLY` → Your actual Plus monthly price ID
- `price_PLUS_QUARTERLY` → Your actual Plus quarterly price ID
- `price_PRO_MONTHLY` → Your actual Pro monthly price ID
- `price_PRO_QUARTERLY` → Your actual Pro quarterly price ID

### Step 3: Set Up Stripe Webhook (Optional but Recommended)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://YOUR_REPLIT_DOMAIN/api/webhooks/stripe`
4. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add it to your Replit Secrets as `STRIPE_WEBHOOK_SECRET`

### Step 4: Test the Flow

1. **Sign up as a new user** → Should automatically get 3-day trial
2. **Visit /pricing** → Should see trial badge and plan options
3. **Click "Start with Monthly"** → Should redirect to Stripe checkout
4. **Complete checkout with test card** → Should activate subscription
5. **Check /api/subscription/status** → Should show active subscription

## 📋 Subscription Tiers

### Plus Plan ($29/mo or quarterly)
- AI-powered outlines
- Chapter writing & expansion
- PDF/DOCX export with branding
- Up to 10 projects
- 20,000 AI tokens/month

### Pro Plan ($79/mo or quarterly)
- Everything in Plus
- Pricing strategy templates (planned)
- Sales funnel builder (planned)
- Launch plan generator (planned)
- Premium templates (planned)
- Unlimited projects
- Unlimited AI tokens
- Priority support

## 🔍 How It Works

### Trial Flow
1. User signs up → Automatically gets 3-day trial
2. Trial period tracked in database (`trialStartDate`, `trialEndDate`)
3. After 3 days → Access expires, must choose Plus or Pro

### Subscription Flow
1. User clicks "Start with Monthly/Quarterly" on /pricing
2. Backend creates Stripe checkout session
3. User completes payment on Stripe
4. Webhook updates user's subscription status
5. User gains access to features based on their tier

### Access Control
- `/api/subscription/status` returns current access status
- Helper functions in `server/subscription-helpers.ts`:
  - `hasActiveAccess()` - Check if user has active trial or subscription
  - `checkSubscriptionLimits()` - Check projects/AI token limits

## 🚀 Next Steps

1. **Replace placeholder price IDs** in `client/src/pages/Pricing.tsx`
2. **Set up Stripe webhook** (optional but recommended)
3. **Test the complete flow** with Stripe test mode
4. **Implement feature gates** for Plus vs Pro features (if needed)

## 💡 Tips

- Use Stripe test mode during development
- Test card number: `4242 4242 4242 4242`
- Use any future expiry date and any CVC
- Stripe billing portal allows users to manage their subscription
- Monitor webhook events in Stripe Dashboard → Developers → Events
