# Stripe Integration Guide

## 🎯 Overview

ProductifyAI uses Stripe for subscription billing (Plus/Pro plans) and Stripe Connect for marketplace payouts with plan-based commission rates.

---

## 📋 Subscription Flow

### Plan Structure

| Plan | Price | Trial | Features |
|------|-------|-------|----------|
| **Free** | €0 | 3 days (Plus trial) | Marketplace only, 7% commission |
| **Plus** | €24/month | 3 days | Full AI, 4% commission, Creators Hub |
| **Pro** | €49/month | No trial | Unlimited AI, 1% commission, Pro Lounge |

### Trial Logic

**New User Flow:**
1. User signs up → Starts as Free plan
2. User can activate 3-day Plus trial (automatic)
3. After 3 days:
   - If user added payment → Converts to paid Plus
   - If no payment → Downgrades to Free

**Implementation:**
```typescript
// Stripe checkout session with trial
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  line_items: [{ price: STRIPE_PRICE_ID_PLUS, quantity: 1 }],
  mode: 'subscription',
  subscription_data: {
    trial_period_days: 3, // 3-day trial
  },
  success_url: '/dashboard?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: '/pricing',
});
```

---

## 🔗 Webhook Events

### Configured Events

ProductifyAI listens to the following Stripe webhooks:

1. **`checkout.session.completed`**
   - Triggered: When user completes checkout
   - Action: Log checkout, prepare for subscription creation

2. **`customer.subscription.created`**
   - Triggered: New subscription started
   - Action: Update user plan, set limits, commission rate

3. **`customer.subscription.updated`**
   - Triggered: Subscription changed (upgrade/downgrade, renewal)
   - Action: Update plan, status, period end

4. **`customer.subscription.deleted`**
   - Triggered: Subscription cancelled/expired
   - Action: Downgrade to Free, reset limits

5. **`invoice.paid`**
   - Triggered: Successful payment
   - Action: Extend subscription period, log payment

6. **`invoice.payment_failed`**
   - Triggered: Payment declined
   - Action: Mark subscription as `past_due`, notify user

### Webhook Endpoint

**URL:** `https://api.productifyai.com/api/stripe/webhook`

**Setup in Stripe Dashboard:**
1. Go to Developers → Webhooks
2. Add endpoint: `https://api.productifyai.com/api/stripe/webhook`
3. Select events (all `customer.subscription.*` and `invoice.*`)
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET` in .env

**Security:**
- Webhook signature verified using `stripe.webhooks.constructEvent()`
- Only processes events with valid signatures
- Logs all webhook attempts

---

## 💳 Price IDs

### Creating Prices in Stripe

**Plus Plan (€24/month):**
1. Stripe Dashboard → Products → Create product
2. Name: "ProductifyAI Plus"
3. Pricing: €24.00 EUR, Recurring monthly
4. Copy Price ID → `STRIPE_PRICE_ID_PLUS`

**Pro Plan (€49/month):**
1. Create product: "ProductifyAI Pro"
2. Pricing: €49.00 EUR, Recurring monthly
3. Copy Price ID → `STRIPE_PRICE_ID_PRO`

**Environment Setup:**
```bash
STRIPE_PRICE_ID_PLUS=price_1PlusMonthly...
STRIPE_PRICE_ID_PRO=price_1ProMonthly...
```

---

## 🔄 Subscription Lifecycle

### State Machine

```
[Sign Up] → Free (with 3-day Plus trial available)
                ↓ (activate trial)
           Trialing (Plus features unlocked)
                ↓ (3 days expire)
           ┌─────────┴─────────┐
    (no payment)         (payment added)
           ↓                    ↓
       Free              Active Plus
                              ↓
                      (upgrade/cancel)
                              ↓
                     Active Pro / Canceled
```

### Status Values

- `trialing`: In trial period
- `active`: Paid subscription active
- `past_due`: Payment failed, grace period
- `canceled`: Subscription ended
- `expired`: Trial expired without payment

### Database Sync

**On webhook event:**
```typescript
await db.update(users).set({
  plan: 'plus',
  subscriptionStatus: 'active',
  subscriptionTier: 'plus',
  stripeSubscriptionId: subscription.id,
  stripePriceId: priceId,
  subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
  commissionRate: 4, // Plus: 4%
  aiTokensLimit: 20000,
  projectsLimit: 10,
  credits: 500,
}).where(eq(users.stripeCustomerId, customerId));
```

---

## 🧪 Testing

### Test Cards (Stripe Test Mode)

**Successful Payment:**
- `4242 4242 4242 4242` (Visa)
- Any future expiry (e.g., 12/34)
- Any CVC (e.g., 123)

**Payment Failures:**
- `4000 0000 0000 0002` (Card declined)
- `4000 0000 0000 9995` (Insufficient funds)

### Test Scenarios

**Scenario 1: Plus Trial → Paid**
1. Create checkout with `trial_period_days: 3`
2. Complete checkout with test card
3. Verify user plan = 'plus', status = 'trialing'
4. Wait 3 days (or manually trigger webhook)
5. Verify status = 'active', subscription continues

**Scenario 2: Plan Upgrade**
1. User on Plus plan
2. Create checkout for Pro
3. Complete payment
4. Verify plan upgraded, commission rate = 1%

**Scenario 3: Cancellation**
1. User cancels subscription
2. Webhook: `customer.subscription.deleted`
3. Verify plan downgrades to Free
4. Verify commission rate = 7%

### Webhook Testing

**Using Stripe CLI:**
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:5050/api/stripe/webhook

# Trigger test event
stripe trigger customer.subscription.created
```

---

## 💰 Revenue Tracking

### MRR Calculation

**Formula:**
```
MRR = Sum of all active recurring subscriptions per month

Example:
- 198 Plus users × €24 = €4,752
- 70 Pro users × €49 = €3,430
- Total MRR = €8,182
```

**ARR (Annual Run Rate):**
```
ARR = MRR × 12 = €98,184
```

### Revenue Dashboard

**Data Sources:**
1. **Stripe API** (preferred):
   - `stripe.subscriptions.list({ status: 'active' })`
   - Sum `unit_amount` from active subscriptions

2. **Database Fallback**:
   - Query `subscriptions` table
   - Count by plan × plan price

**Cache:** 60 seconds to avoid API rate limits

---

## 🔧 Troubleshooting

### Webhook Not Triggering

**Symptoms:**
- Subscription created in Stripe
- User plan not updated in database

**Solutions:**
1. Check webhook endpoint is publicly accessible
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check server logs for webhook errors
4. Test webhook signature verification
5. Use Stripe CLI to test locally

**Debug:**
```bash
# Check webhook deliveries in Stripe Dashboard
# Developers → Webhooks → [Your endpoint] → Deliveries
```

### Subscription Not Updating

**Symptoms:**
- Webhook received
- Database not updated

**Solutions:**
1. Check `stripeCustomerId` matches between Stripe and DB
2. Verify webhook handler logic
3. Review database transaction logs
4. Check for SQL errors in logs

---

## 📊 Monitoring

### Key Metrics to Track

**Health Metrics:**
- Webhook delivery success rate (target: >99%)
- Subscription creation time (target: <2s)
- Payment success rate (target: >95%)

**Business Metrics:**
- MRR growth rate
- Churn rate by plan
- Trial→Paid conversion (target: >30%)
- Upgrade rate (Free→Plus, Plus→Pro)

**Available in:** `/admin/revenue`

---

## 🚀 Production Checklist

- [ ] Switch from test keys to live keys
- [ ] Update `STRIPE_SECRET_KEY=sk_live_...`
- [ ] Update `STRIPE_WEBHOOK_SECRET=whsec_...` (live endpoint)
- [ ] Verify live prices created
- [ ] Test checkout flow in incognito
- [ ] Verify webhook endpoint is HTTPS
- [ ] Monitor webhook deliveries first 24h
- [ ] Set up Stripe email notifications
- [ ] Configure tax settings (if EU)
- [ ] Enable SCA (Strong Customer Authentication)

---

**Version:** 1.0  
**Last Updated:** October 20, 2025  
**Status:** Production Ready 🚀

