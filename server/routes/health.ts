/**
 * Health Check Endpoint
 * Monitor system status and dependencies
 */

import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { stripe } from '../config/stripe';
import { Logger } from '../utils/logger';

const router = Router();

/**
 * Comprehensive health check
 * GET /api/health/status
 */
router.get('/status', async (req, res) => {
  const startTime = Date.now();
  const health: any = {
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {},
  };

  // Check Database
  try {
    if (process.env.MOCK_DB === 'true') {
      health.services.database = {
        status: 'mock',
        message: 'Using in-memory mock database',
      };
    } else {
      await db.select({ count: sql`1` }).from(users).limit(1);
      health.services.database = {
        status: 'connected',
        type: 'supabase',
      };
    }
  } catch (error: any) {
    health.ok = false;
    health.services.database = {
      status: 'error',
      message: error.message,
    };
  }

  // Check Stripe
  try {
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      health.services.stripe = {
        status: 'mock',
        message: 'Stripe not configured - using mock mode',
      };
    } else {
      await stripe.balance.retrieve();
      health.services.stripe = {
        status: 'connected',
      };
    }
  } catch (error: any) {
    health.services.stripe = {
      status: 'error',
      message: error.message,
    };
  }

  // Check Supabase
  if (process.env.SUPABASE_URL) {
    health.services.supabase = {
      status: 'configured',
      url: process.env.SUPABASE_URL,
    };
  } else {
    health.services.supabase = {
      status: 'not_configured',
    };
  }

  // Check OpenAI
  if (process.env.OPENAI_API_KEY) {
    health.services.openai = {
      status: 'configured',
    };
  } else {
    health.services.openai = {
      status: 'not_configured',
      message: 'AI features will not work',
    };
  }

  // Check Resend
  if (process.env.RESEND_API_KEY) {
    health.services.email = {
      status: 'configured',
      provider: 'resend',
    };
  } else {
    health.services.email = {
      status: 'mock',
      message: 'Emails logged to console',
    };
  }

  health.responseTime = Date.now() - startTime;

  Logger.info(`Health check completed in ${health.responseTime}ms`);

  res.status(health.ok ? 200 : 503).json(health);
});

/**
 * Simple ping endpoint
 * GET /api/health/ping
 */
router.get('/ping', (req, res) => {
  res.json({ ok: true, message: 'pong' });
});

export default router;



