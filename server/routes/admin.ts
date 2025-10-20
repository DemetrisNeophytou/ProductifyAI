/**
 * Admin API Routes
 * System stats, analytics, configuration, and admin utilities
 */

import { Router } from 'express';
import { Logger } from '../utils/logger';

const router = Router();

/**
 * Get system statistics
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // TODO: When real DB connected, query actual stats
    const stats = {
      uptime: '2d 14h 32m',
      totalUsers: 1248,
      totalProjects: 3542,
      totalKBDocs: 15,
      aiRequestsToday: 892,
      avgLatency: 234,
      errorRate: 0.02,
      systemHealth: 'healthy',
    };

    res.json({ ok: true, data: stats });
  } catch (error: any) {
    Logger.error('Failed to fetch admin stats', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get analytics data
 * GET /api/admin/analytics?range=7d
 */
router.get('/analytics', async (req, res) => {
  try {
    const { range = '7d' } = req.query;

    // TODO: Query real analytics from DB
    const analytics = {
      aiRequests: {
        today: 892,
        week: 6234,
        month: 24891,
        trend: 12.3,
      },
      latency: {
        avg: 234,
        p95: 450,
        p99: 680,
      },
      kbLookups: {
        today: 7136,
        avgPerRequest: 8,
      },
      tokenUsage: {
        total: 1245890,
        cost: 24.92,
        byModel: [
          { model: 'gpt-4o', tokens: 523400, cost: 15.7 },
          { model: 'gpt-4o-mini', tokens: 722490, cost: 9.22 },
        ],
      },
      usersByPlan: {
        free: 980,
        plus: 198,
        pro: 70,
      },
    };

    res.json({ ok: true, data: analytics, range });
  } catch (error: any) {
    Logger.error('Failed to fetch analytics', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get system configuration
 * GET /api/admin/config
 */
router.get('/config', async (req, res) => {
  try {
    const config = {
      database: {
        url: process.env.DATABASE_URL || process.env.SUPABASE_URL || 'Not configured',
        connected: true, // TODO: Check actual connection
        poolSize: parseInt(process.env.DB_POOL_MAX || '10'),
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        embeddingModel: 'text-embedding-3-large',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '5050'),
        corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
      },
      features: {
        evalMode: process.env.VITE_EVAL_MODE === 'true' || process.env.EVAL_MODE === 'true',
        mockDb: process.env.MOCK_DB === 'true',
      },
    };

    res.json({ ok: true, data: config });
  } catch (error: any) {
    Logger.error('Failed to fetch config', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Get recent logs
 * GET /api/admin/logs?limit=50
 */
router.get('/logs', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // TODO: Read from actual log files or DB
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'System started successfully',
        metadata: {},
      },
    ];

    res.json({ ok: true, data: logs, limit });
  } catch (error: any) {
    Logger.error('Failed to fetch logs', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Clear system logs
 * POST /api/admin/logs/clear
 */
router.post('/logs/clear', async (req, res) => {
  try {
    // TODO: Actually clear old logs
    Logger.info('Admin cleared system logs');

    res.json({ ok: true, message: 'Logs cleared successfully' });
  } catch (error: any) {
    Logger.error('Failed to clear logs', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Restart evaluation suite
 * POST /api/admin/evaluation/restart
 */
router.post('/evaluation/restart', async (req, res) => {
  try {
    // TODO: Clear evaluation cache/results
    Logger.info('Admin restarted evaluation suite');

    res.json({ ok: true, message: 'Evaluation suite restarted' });
  } catch (error: any) {
    Logger.error('Failed to restart evaluation', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Admin middleware - Role guard
 * Apply to all /api/admin routes
 */
export function requireAdmin(req: any, res: any, next: any) {
  // TODO: When auth is fully implemented, check user role
  // For now, check if EVAL_MODE is enabled
  const evalMode = process.env.VITE_EVAL_MODE === 'true' || process.env.EVAL_MODE === 'true';

  if (!evalMode) {
    Logger.warn('Unauthorized admin access attempt');
    return res.status(403).json({
      ok: false,
      error: 'Admin access required. Set EVAL_MODE=true to enable.',
    });
  }

  // TODO: Add user role check when auth is ready
  // if (req.user?.role !== 'admin') {
  //   return res.status(403).json({ ok: false, error: 'Admin role required' });
  // }

  next();
}

export default router;

