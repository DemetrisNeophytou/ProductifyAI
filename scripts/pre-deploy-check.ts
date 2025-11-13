/**
 * Pre-Deployment Check Script
 * Validates production environment before deployment
 */

import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env
dotenv.config();

console.log('🔍 ProductifyAI Pre-Deployment Checklist\n');
console.log('================================================\n');

const checks: { name: string; status: boolean; message: string }[] = [];

// Check 1: Node Environment
const isProduction = process.env.NODE_ENV === 'production';
checks.push({
  name: 'NODE_ENV',
  status: isProduction,
  message: isProduction ? 'production' : `${process.env.NODE_ENV || 'not set'} (should be production)`,
});

// Check 2: Database
const hasDatabase = !!process.env.DATABASE_URL;
const mockDB = process.env.MOCK_DB === 'true';
checks.push({
  name: 'DATABASE',
  status: hasDatabase && !mockDB,
  message: hasDatabase ? (mockDB ? 'Mock mode ON (should be OFF)' : 'Connected') : 'DATABASE_URL missing',
});

// Check 3: Stripe
const hasStripe = !!process.env.STRIPE_SECRET_KEY;
const hasPrices = !!(process.env.STRIPE_PRICE_ID_PLUS && process.env.STRIPE_PRICE_ID_PRO);
const hasWebhook = !!process.env.STRIPE_WEBHOOK_SECRET;
checks.push({
  name: 'STRIPE',
  status: hasStripe && hasPrices && hasWebhook,
  message: hasStripe
    ? hasPrices
      ? hasWebhook
        ? 'Configured'
        : 'Missing STRIPE_WEBHOOK_SECRET'
      : 'Missing price IDs'
    : 'Missing STRIPE_SECRET_KEY',
});

// Check 4: OpenAI
const hasOpenAI = !!process.env.OPENAI_API_KEY;
checks.push({
  name: 'OPENAI',
  status: hasOpenAI,
  message: hasOpenAI ? 'Configured' : 'Missing OPENAI_API_KEY',
});

// Check 5: Email
const hasEmail = !!process.env.RESEND_API_KEY;
checks.push({
  name: 'EMAIL',
  status: hasEmail,
  message: hasEmail ? 'Resend configured' : 'Missing RESEND_API_KEY (will use console)',
});

// Check 6: Security
const hasJWT = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32;
const hasSession = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32;
checks.push({
  name: 'SECURITY',
  status: !!(hasJWT && hasSession),
  message:
    hasJWT && hasSession
      ? 'Secrets configured'
      : !hasJWT
      ? 'JWT_SECRET missing or too short (<32 chars)'
      : 'SESSION_SECRET missing or too short (<32 chars)',
});

// Check 7: Frontend URL
const hasFrontend = !!process.env.FRONTEND_URL;
checks.push({
  name: 'FRONTEND_URL',
  status: hasFrontend,
  message: hasFrontend ? process.env.FRONTEND_URL! : 'Missing FRONTEND_URL',
});

// Print results
console.log('Checks:\n');
checks.forEach((check) => {
  const icon = check.status ? '✅' : '❌';
  console.log(`${icon} ${check.name.padEnd(20)} ${check.message}`);
});

console.log('\n================================================\n');

const allPassed = checks.every((c) => c.status);
const criticalPassed = checks.filter(c => ['DATABASE', 'STRIPE', 'OPENAI'].includes(c.name)).every(c => c.status);

if (allPassed) {
  console.log('✅ All checks passed! Ready for production deployment.\n');
  console.log('Next steps:');
  console.log('1. npm run build');
  console.log('2. npm start (test locally)');
  console.log('3. Deploy to Vercel/Render/Docker\n');
  process.exit(0);
} else if (criticalPassed) {
  console.log('⚠️  Some optional checks failed, but core services are ready.\n');
  console.log('You can proceed, but some features may use fallbacks.\n');
  process.exit(0);
} else {
  console.log('❌ Critical checks failed. Fix the issues above before deploying.\n');
  console.log('Required: DATABASE_URL, STRIPE_SECRET_KEY, OPENAI_API_KEY\n');
  process.exit(1);
}



