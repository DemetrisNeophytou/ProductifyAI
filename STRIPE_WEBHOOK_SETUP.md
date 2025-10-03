# Stripe Webhook Configuration Guide

## Overview
Your webhook endpoint is already implemented at `/api/webhooks/stripe` and handles:
- ✅ checkout.session.completed
- ✅ customer.subscription.updated
- ✅ customer.subscription.deleted
- ✅ invoice.payment_failed

## Setup Steps

### 1. Get Your Replit Domain
Your webhook URL will be:
```
https://[YOUR-REPLIT-DOMAIN].replit.app/api/webhooks/stripe
```

To find your domain:
- Look in Replit console logs for: `REPLIT_DEV_DOMAIN=xxxxx.replit.dev`
- Or check environment variable: `echo $REPLIT_DEV_DOMAIN`

### 2. Configure in Stripe Dashboard

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks

2. **Add Endpoint:**
   - Click "+ Add endpoint"
   - Enter URL: `https://[YOUR-DOMAIN].replit.app/api/webhooks/stripe`

3. **Select Events:**
   Select these 4 events:
   - ✅ `checkout.session.completed` - When payment succeeds
   - ✅ `customer.subscription.updated` - When subscription changes
   - ✅ `customer.subscription.deleted` - When user cancels
   - ✅ `invoice.payment_failed` - When payment fails

4. **Copy Webhook Signing Secret:**
   - After creating, click endpoint to view details
   - Copy the "Signing secret" (starts with `whsec_...`)

### 3. Add to Replit Secrets

1. Go to Replit Secrets (🔒 Tools → Secrets)
2. Add new secret:
   ```
   Key: STRIPE_WEBHOOK_SECRET
   Value: whsec_xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 4. Verify Setup

After configuration, you can test by:
1. Making a test purchase in test mode
2. Check Stripe Dashboard → Webhooks → [your endpoint] → Events
3. Verify events show "succeeded" status

## What Each Event Does

### checkout.session.completed
- Activates subscription after successful payment
- Updates user record with:
  - subscriptionTier (plus/pro)
  - subscriptionStatus (active)
  - stripeSubscriptionId
  - subscriptionPeriodEnd

### customer.subscription.updated  
- Handles plan changes (upgrade/downgrade)
- Updates subscription status changes
- Syncs period end date

### customer.subscription.deleted
- Sets subscriptionStatus to 'cancelled'
- User retains access until period end

### invoice.payment_failed
- Sets subscriptionStatus to 'past_due'
- Triggers retry logic on Stripe side

## Troubleshooting

**Webhook failing?**
1. Check STRIPE_WEBHOOK_SECRET is set correctly
2. Verify URL matches your Replit domain exactly
3. Check server logs for signature verification errors

**Events not received?**
1. Ensure endpoint is in "Live mode" (not test mode)
2. Verify selected events match above list
3. Check Stripe Dashboard webhook logs for delivery attempts

## Security Notes

- ✅ Webhook signature verification implemented
- ✅ Only processes verified Stripe events
- ✅ Raw body parsing configured correctly
- ✅ Error handling for invalid signatures

## Next Steps

Once configured:
1. Test with a real checkout session
2. Monitor webhook dashboard for successful deliveries
3. Verify user subscription status updates in your database
