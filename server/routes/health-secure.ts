/**
 * Enhanced Health Check Endpoints
 * 
 * Provides standardized health and readiness checks
 * for Kubernetes/Docker orchestration and monitoring
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { Logger } from '../utils/logger';

const router = Router();

/**
 * Basic health check (liveness probe)
 * GET /healthz
 * 
 * Returns 200 if server is running
 * Used by orchestrators to determine if container should be restarted
 */
router.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'ProductifyAI API',
    version: process.env.npm_package_version || '1.0.0',
  });
});

/**
 * Readiness check (readiness probe)
 * GET /readyz
 * 
 * Returns 200 only if server is ready to handle requests
 * Checks critical dependencies (database, etc.)
 * Used by orchestrators to determine if container should receive traffic
 */
router.get('/readyz', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {};
  let isReady = true;
  
  // Check 1: Database connectivity
  try {
    if (process.env.MOCK_DB === 'true') {
      checks.database = {
        status: 'ok',
        type: 'mock',
        message: 'Using in-memory mock database',
      };
    } else {
      const dbStart = Date.now();
      await db.select({ count: sql`1` }).from(users).limit(1);
      checks.database = {
        status: 'ok',
        type: process.env.DATABASE_URL ? 'postgresql' : 'supabase',
        responseTime: Date.now() - dbStart,
      };
    }
  } catch (error: any) {
    isReady = false;
    checks.database = {
      status: 'error',
      error: error.message,
    };
    Logger.error('Database health check failed:', error);
  }
  
  // Check 2: Environment configuration
  const requiredEnvVars = ['NODE_ENV'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingEnvVars.length > 0) {
    isReady = false;
    checks.environment = {
      status: 'error',
      missing: missingEnvVars,
    };
  } else {
    checks.environment = {
      status: 'ok',
      nodeEnv: process.env.NODE_ENV,
    };
  }
  
  // Check 3: Memory usage
  const memUsage = process.memoryUsage();
  const memoryThreshold = 1024 * 1024 * 1024; // 1GB threshold
  
  if (memUsage.heapUsed > memoryThreshold) {
    Logger.warn(`High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }
  
  checks.memory = {
    status: memUsage.heapUsed < memoryThreshold ? 'ok' : 'warning',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
  };
  
  const responseTime = Date.now() - startTime;
  const status = isReady ? 200 : 503;
  
  res.status(status).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    responseTime,
    checks,
  });
});

/**
 * Comprehensive health check
 * GET /api/health
 * 
 * Detailed health information about all services
 * Should be used for monitoring/alerting, not load balancing
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
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
      const dbStart = Date.now();
      await db.select({ count: sql`1` }).from(users).limit(1);
      health.services.database = {
        status: 'connected',
        type: process.env.DATABASE_URL ? 'postgresql' : 'supabase',
        responseTime: Date.now() - dbStart,
      };
    }
  } catch (error: any) {
    health.status = 'degraded';
    health.services.database = {
      status: 'error',
      error: error.message,
    };
  }
  
  // Check Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    health.services.stripe = {
      status: 'configured',
    };
  } else {
    health.services.stripe = {
      status: 'not_configured',
      message: 'Using mock mode',
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
      message: 'AI features disabled',
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
      status: 'not_configured',
      message: 'Emails logged to console',
    };
  }
  
  // System info
  const memUsage = process.memoryUsage();
  health.system = {
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    },
    cpu: {
      user: process.cpuUsage().user,
      system: process.cpuUsage().system,
    },
    uptime: Math.round(process.uptime()),
  };
  
  health.responseTime = Date.now() - startTime;
  
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(health);
});

/**
 * Simple ping endpoint
 * GET /api/health/ping
 * 
 * Minimal response for basic connectivity testing
 */
router.get('/ping', (req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Service version endpoint
 * GET /api/health/version
 * 
 * Returns version and build information
 */
router.get('/version', (req: Request, res: Response) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    buildDate: process.env.BUILD_DATE || 'unknown',
    gitCommit: process.env.GIT_COMMIT || 'unknown',
  });
});

export default router;

