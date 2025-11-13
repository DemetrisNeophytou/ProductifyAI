/**
 * Analytics Routes
 * Handles product analytics and metrics tracking
 */

import { Router } from "express";
import { db } from "../db";
import { metricsEvents } from "../schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router = Router();

// POST /api/analytics/event - Track analytics event
router.post("/event", async (req, res) => {
  try {
    const { projectId, kind, value, metadata } = req.body;

    // Validate required fields
    if (!projectId || !kind) {
      return res.status(400).json({
        ok: false,
        error: "projectId and kind are required"
      });
    }

    // Create analytics event
    const [event] = await db.insert(metricsEvents).values({
      projectId,
      userId: null, // Will be set when auth is implemented
      kind,
      value: value || null,
      metadata: metadata || null
    }).returning();

    res.status(201).json({
      ok: true,
      data: event
    });

  } catch (error: any) {
    console.error('Analytics event error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to track analytics event"
    });
  }
});

// GET /api/analytics/summary - Get analytics summary for a project
router.get("/summary", async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    if (!projectId) {
      return res.status(400).json({
        ok: false,
        error: "projectId is required"
      });
    }

    // Build date filter
    let dateFilter = sql`1=1`;
    if (startDate) {
      dateFilter = sql`${dateFilter} AND created_at >= ${startDate}`;
    }
    if (endDate) {
      dateFilter = sql`${dateFilter} AND created_at <= ${endDate}`;
    }

    // Get summary metrics
    const summary = await db.execute(sql`
      SELECT 
        kind,
        COUNT(*) as count,
        SUM(value) as total_value,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value
      FROM metrics_events 
      WHERE project_id = ${projectId} 
      AND ${dateFilter}
      GROUP BY kind
      ORDER BY count DESC
    `);

    // Get total metrics
    const totals = await db.execute(sql`
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN kind = 'lead' THEN 1 ELSE 0 END) as total_leads,
        SUM(CASE WHEN kind = 'sale' THEN 1 ELSE 0 END) as total_sales,
        SUM(CASE WHEN kind = 'revenue' THEN value ELSE 0 END) as total_revenue,
        SUM(CASE WHEN kind = 'view' THEN 1 ELSE 0 END) as total_views,
        SUM(CASE WHEN kind = 'click' THEN 1 ELSE 0 END) as total_clicks
      FROM metrics_events 
      WHERE project_id = ${projectId} 
      AND ${dateFilter}
    `);

    // Get daily metrics for charts
    const dailyMetrics = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        kind,
        COUNT(*) as count,
        SUM(value) as total_value
      FROM metrics_events 
      WHERE project_id = ${projectId} 
      AND ${dateFilter}
      GROUP BY DATE(created_at), kind
      ORDER BY date DESC
    `);

    res.json({
      ok: true,
      data: {
        summary: summary.rows,
        totals: totals.rows[0],
        dailyMetrics: dailyMetrics.rows
      }
    });

  } catch (error: any) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch analytics summary"
    });
  }
});

// GET /api/analytics/events - Get raw events for a project
router.get("/events", async (req, res) => {
  try {
    const { projectId, kind, limit = 100, offset = 0 } = req.query;

    if (!projectId) {
      return res.status(400).json({
        ok: false,
        error: "projectId is required"
      });
    }

    let query = db.select().from(metricsEvents).where(eq(metricsEvents.projectId, projectId as string));

    if (kind) {
      query = query.where(and(eq(metricsEvents.projectId, projectId as string), eq(metricsEvents.kind, kind as string)));
    }

    const events = await query
      .limit(Number(limit))
      .offset(Number(offset))
      .orderBy(sql`created_at DESC`);

    res.json({
      ok: true,
      data: events
    });

  } catch (error: any) {
    console.error('Analytics events error:', error);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch analytics events"
    });
  }
});

export default router;


