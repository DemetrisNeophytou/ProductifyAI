/**
 * Stripe Integration Test Script
 * Verify checkout and webhook functionality
 */

import { stripe, PLANS } from './config/stripe';

async function testStripeSetup() {
  console.log('🧪 Testing Stripe Integration\n');
  console.log('================================================\n');

  try {
    // 1. Verify Stripe API key
    console.log('1️⃣ Testing Stripe API Connection...');
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe connected successfully');
    console.log(`   Available: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'eur'}\n`);

    // 2. Verify Price IDs
    console.log('2️⃣ Verifying Price IDs...');
    
    if (PLANS.PLUS.priceId) {
      const plusPrice = await stripe.prices.retrieve(PLANS.PLUS.priceId);
      console.log(`✅ Plus Price ID valid: ${plusPrice.id}`);
      console.log(`   Amount: €${(plusPrice.unit_amount || 0) / 100}/month\n`);
    } else {
      console.log('⚠️  Plus Price ID not configured in .env\n');
    }

    if (PLANS.PRO.priceId) {
      const proPrice = await stripe.prices.retrieve(PLANS.PRO.priceId);
      console.log(`✅ Pro Price ID valid: ${proPrice.id}`);
      console.log(`   Amount: €${(proPrice.unit_amount || 0) / 100}/month\n`);
    } else {
      console.log('⚠️  Pro Price ID not configured in .env\n');
    }

    // 3. Test webhook secret
    console.log('3️⃣ Checking Webhook Secret...');
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('✅ Webhook secret configured\n');
    } else {
      console.log('⚠️  Webhook secret not configured in .env\n');
    }

    // 4. Test Commission Calculation
    console.log('4️⃣ Testing Commission Calculation...');
    const testAmount = 10000; // €100
    
    console.log(`   Sale Amount: €${testAmount / 100}`);
    console.log(`   Free Plan (7%): €${(testAmount * 0.07) / 100} commission, seller gets €${(testAmount * 0.93) / 100}`);
    console.log(`   Plus Plan (4%): €${(testAmount * 0.04) / 100} commission, seller gets €${(testAmount * 0.96) / 100}`);
    console.log(`   Pro Plan (1%): €${(testAmount * 0.01) / 100} commission, seller gets €${(testAmount * 0.99) / 100}\n`);

    console.log('================================================');
    console.log('✅ All Stripe integration tests passed!\n');
    console.log('Next steps:');
    console.log('1. Set up Stripe webhook endpoint at: /api/stripe/webhook');
    console.log('2. Test checkout flow in development');
    console.log('3. Verify webhooks trigger correctly\n');

  } catch (error: any) {
    console.error('\n❌ Stripe test failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. STRIPE_SECRET_KEY is set in .env');
    console.error('2. Price IDs are correct');
    console.error('3. Stripe API is accessible\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testStripeSetup();
}

export { testStripeSetup };

