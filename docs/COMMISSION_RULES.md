# Marketplace Commission Rules

## 💰 Commission Structure

ProductifyAI takes a platform fee from marketplace transactions. The commission rate depends on the **seller's subscription plan**.

---

## 📊 Commission Tiers

| Seller Plan | Commission Rate | Example on €100 Sale |
|-------------|-----------------|----------------------|
| **Free** | 7.0% | Platform: €7.00, Seller: €93.00 |
| **Plus** | 4.0% | Platform: €4.00, Seller: €96.00 |
| **Pro** | 1.0% | Platform: €1.00, Seller: €99.00 |

### Why Plan-Based Commissions?

**Incentive Structure:**
- Lower commissions reward paying subscribers
- Encourages upgrades for active sellers
- Pro plan almost like "white-label" (1% is minimal)

**Revenue Balance:**
- Free users contribute more per sale (7%)
- Plus/Pro users contribute via subscriptions
- Total platform revenue = Subscriptions + Commissions

---

## 🧮 Calculation Logic

### Formula

```
Commission (cents) = round(sale_amount × commission_rate / 100)
Seller Payout (cents) = sale_amount - commission
```

### Examples

**Sale: €50 (5000 cents)**

| Plan | Calculation | Platform Fee | Seller Gets |
|------|-------------|--------------|-------------|
| Free | 5000 × 7% | €3.50 (350¢) | €46.50 (4650¢) |
| Plus | 5000 × 4% | €2.00 (200¢) | €48.00 (4800¢) |
| Pro | 5000 × 1% | €0.50 (50¢) | €49.50 (4950¢) |

**Sale: €200 (20000 cents)**

| Plan | Platform Fee | Seller Gets |
|------|--------------|-------------|
| Free | €14.00 | €186.00 |
| Plus | €8.00 | €192.00 |
| Pro | €2.00 | €198.00 |

**Sale: €1000 (100000 cents)**

| Plan | Platform Fee | Seller Gets |
|------|--------------|-------------|
| Free | €70.00 | €930.00 |
| Plus | €40.00 | €960.00 |
| Pro | €10.00 | €990.00 |

---

## 💳 Payment Processing

### Stripe Connect Integration

ProductifyAI uses **Stripe Connect** to handle marketplace payments:

**Flow:**
1. Buyer purchases product
2. Payment goes to ProductifyAI account
3. Platform commission deducted automatically
4. Seller receives payout via Connect transfer

**Implementation:**
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // €100
  currency: 'eur',
  application_fee_amount: 400, // €4 (4% for Plus seller)
  transfer_data: {
    destination: sellerConnectAccountId,
  },
});
```

### Order Record

Every transaction creates an `orders` record:

```typescript
{
  id: 'order-uuid',
  buyerId: 'buyer-uuid',
  sellerId: 'seller-uuid',
  productId: 'product-uuid',
  productTitle: 'Digital Course Template',
  amount: 10000, // €100 in cents
  subtotal: 10000,
  commission: 400, // €4 (4%)
  commissionRate: 4, // Percentage
  sellerPayout: 9600, // €96
  buyerPlan: 'plus', // Plan at time of purchase
  stripePaymentIntentId: 'pi_...',
  status: 'completed',
  createdAt: '2025-10-20T...',
}
```

---

## 📈 Revenue Model

### Platform Revenue Sources

**1. Subscription Revenue (Recurring)**
```
Plus: 198 users × €24/mo = €4,752/mo MRR
Pro: 70 users × €49/mo = €3,430/mo MRR
Total MRR = €8,182/mo
ARR = €98,184/year
```

**2. Marketplace Commissions (Variable)**
```
Free sellers (7%): €2,100/month (from €30K GMV)
Plus sellers (4%): €800/month (from €20K GMV)
Pro sellers (1%): €100/month (from €10K GMV)
Total Commission = €3,000/month
```

**Total Platform Revenue = €8,182 + €3,000 = €11,182/month**

### Break-Even Analysis

**Costs:**
- Supabase: €25/month (Pro plan)
- OpenAI API: ~€500/month (varies by usage)
- Stripe fees: 1.4% + €0.25 per transaction
- Infrastructure: €100/month (hosting, CDN)
- Total: ~€625/month

**Break-even:** ~60 Plus users OR 25 Pro users

---

## 🎚️ Commission Adjustments

### When to Adjust Rates

**Increase Commissions:**
- High support costs
- Need to subsidize free tier
- Market research shows willingness to pay

**Decrease Commissions:**
- Competitive pressure
- Incentivize high-volume sellers
- Reward loyal customers

### How to Change Rates

**Method 1: Manual (Admin Dashboard)**
1. Go to `/admin/users`
2. Find user → Open drawer
3. Change plan (auto-updates commission rate)

**Method 2: Database**
```sql
-- Update single user
UPDATE users 
SET commission_rate = 5 
WHERE id = 'user-uuid';

-- Update all users on a plan
UPDATE users 
SET commission_rate = 5 
WHERE plan = 'plus';
```

**Method 3: Code (Global)**
```typescript
// server/config/stripe.ts
export const PLANS = {
  PLUS: {
    limits: {
      commissionRate: 5, // Change from 4 to 5
    },
  },
};
```

**Note:** Existing orders keep their original commission rate (stored in `orders.commission_rate`).

---

## 📊 Admin Analytics

### Revenue Dashboard (`/admin/revenue`)

**View:**
- Total GMV (Gross Merchandise Value)
- Platform Commission (sum of all fees)
- Seller Payouts (total paid to sellers)
- Order count
- Top sellers table

**Calculations:**

```typescript
// From orders table
const totalGMV = orders.reduce((sum, o) => sum + o.amount, 0);
const totalCommission = orders.reduce((sum, o) => sum + o.commission, 0);
const totalPayout = orders.reduce((sum, o) => sum + o.sellerPayout, 0);

// Verification
console.assert(totalGMV === totalCommission + totalPayout);
```

### Seller Leaderboard

**Top Sellers (by payout):**
```
1. seller-abc123: €2,450 (25 orders)
2. seller-def456: €1,890 (18 orders)
3. seller-ghi789: €1,234 (12 orders)
```

**Use Cases:**
- Identify power sellers for case studies
- Offer Pro plan upgrades (lower commission incentive)
- Feature top sellers on marketplace

---

## 🛠️ API Reference

### Create Order

**POST /api/marketplace/orders**
```json
{
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "productId": "product-uuid",
  "productTitle": "My Digital Product",
  "amount": 10000 // €100 in cents
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "order": {
      "id": "order-uuid",
      "amount": 10000,
      "commission": 400,
      "sellerPayout": 9600,
      "commissionRate": 4,
      "status": "pending"
    },
    "breakdown": {
      "total": 10000,
      "commission": 400,
      "commissionRate": "4%",
      "sellerReceives": 9600
    }
  }
}
```

### Process Payment

**POST /api/marketplace/orders/:orderId/pay**
```json
{
  "paymentMethodId": "pm_..." // Stripe payment method
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "orderId": "order-uuid",
    "paymentIntentId": "pi_...",
    "status": "completed"
  }
}
```

### Get Orders

**GET /api/marketplace/orders?userId={id}&type=seller**
```json
{
  "ok": true,
  "data": {
    "orders": [ /* array of orders */ ],
    "summary": {
      "count": 25,
      "totalAmount": 125000, // €1,250
      "totalCommission": 5000, // €50
      "totalPayout": 120000 // €1,200 (seller receives)
    }
  }
}
```

---

## 🔐 Security & Compliance

### PCI Compliance

- ✅ **No card data stored:** Stripe handles all payment info
- ✅ **Tokenization:** Payment methods tokenized by Stripe
- ✅ **Webhook signatures:** All webhooks verified
- ✅ **HTTPS only:** Production requires SSL

### Data Privacy

- **Buyer info:** Never shared with seller
- **Seller payout:** Never shown to buyer
- **Commission rate:** Visible only to seller and admin
- **Order history:** User can only see their own orders

### Fraud Prevention

- **Stripe Radar:** Automatic fraud detection
- **3D Secure:** SCA compliance (EU requirement)
- **Refund policy:** Configurable in Stripe Dashboard
- **Dispute handling:** Via Stripe Dashboard

---

## 🚨 Error Handling

### Common Errors

**"Payment processing failed"**
- **Cause:** Seller has no Stripe Connect account
- **Fix:** Seller must complete Connect onboarding

**"Webhook signature verification failed"**
- **Cause:** Wrong `STRIPE_WEBHOOK_SECRET`
- **Fix:** Copy correct secret from Stripe Dashboard

**"Invalid price ID"**
- **Cause:** Price ID env var not set or incorrect
- **Fix:** Verify `STRIPE_PRICE_ID_PLUS` and `STRIPE_PRICE_ID_PRO`

### Logging

All commission-related events logged:

```typescript
Logger.info(`Order created: ${orderId}, commission ${commission} (${rate}%)`);
Logger.warn(`Payment failed for customer: ${customerId}`);
Logger.error('Stripe API error', error);
```

**View logs:** Check server console or log files

---

## 🎯 Best Practices

### For Admins

1. **Monitor Weekly:** Review `/admin/revenue` for anomalies
2. **Watch Churn:** Track canceled subscriptions
3. **Test Regularly:** Use Stripe test mode before changes
4. **Backup Data:** Orders and subscriptions are critical
5. **Review Top Sellers:** Offer support and features

### For Developers

1. **Always log:** Commission calculations and changes
2. **Validate amounts:** Check for negative or zero values
3. **Handle webhooks idempotently:** Same event may fire twice
4. **Test edge cases:** Refunds, disputes, failed payments
5. **Cache Stripe data:** Avoid rate limits

---

**Version:** 1.0  
**Last Updated:** October 20, 2025  
**Maintainer:** ProductifyAI Finance Team  
**Status:** Production Ready 💳

