/**
 * Environment Validation
 * Ensures required environment variables are set in production
 */

import { Logger } from './logger';

export function validateProductionEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    Logger.info('Development mode - skipping strict env validation');
    return true;
  }

  const requiredCore = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const missing = requiredCore.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    Logger.error(`❌ Missing required environment variables in production: ${missing.join(', ')}`);
    Logger.error('Set these in your deployment platform or .env file');
    throw new Error(`Production environment validation failed. Missing: ${missing.join(', ')}`);
  }

  const isMeaningful = (value: string | undefined) => {
    if (!value) return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) return false;
    if (lower.includes('your-') || lower.includes('placeholder') || lower.includes('dummy')) return false;
    return true;
  };

  const stripeKeys = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID_PLUS', 'STRIPE_PRICE_ID_PRO'];
  const stripeConfigured = stripeKeys.every((key) => isMeaningful(process.env[key]));

  if (!stripeConfigured) {
    Logger.warn('⚠️ Stripe credentials incomplete. Stripe-dependent features will operate in mock mode.');
    if (!process.env.MOCK_STRIPE) {
      process.env.MOCK_STRIPE = 'true';
    }
  }

  if (!isMeaningful(process.env.RESEND_API_KEY)) {
    Logger.warn('⚠️ RESEND_API_KEY not configured. Transactional emails will be logged to console.');
  }

  // Validate secrets are strong enough
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    Logger.error('JWT_SECRET must be at least 32 characters');
    throw new Error('JWT_SECRET too short');
  }

  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    Logger.error('SESSION_SECRET must be at least 32 characters');
    throw new Error('SESSION_SECRET too short');
  }

  Logger.info('✅ Production environment validation passed');
  return true;
}

export default validateProductionEnv;



