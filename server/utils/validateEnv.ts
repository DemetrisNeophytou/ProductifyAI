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

  const required = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID_PLUS',
    'STRIPE_PRICE_ID_PRO',
    'OPENAI_API_KEY',
    'RESEND_API_KEY',
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    Logger.error(`❌ Missing required environment variables in production: ${missing.join(', ')}`);
    Logger.error('Set these in your deployment platform or .env file');
    throw new Error(`Production environment validation failed. Missing: ${missing.join(', ')}`);
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

