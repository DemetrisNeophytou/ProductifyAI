import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { Logger } from "./utils/logger";
import { db } from "./db";

// Import all route modules
import productsRouter from "./routes/products";
import aiRouter from "./routes/ai";
import videoRouter from "./routes/video";
import authRouter from "./routes/auth";
import filesRouter from "./routes/files";
import paymentsRouter from "./routes/payments";
import aiBuilderRouter from "./routes/ai-builder";
import videoBuilderRouter from "./routes/video-builder";
import projectsRouter from "./routes/projects";
import translationRouter from "./routes/translation";
import socialRouter from "./routes/social";
import mediaGenerationRouter from "./routes/media-generation";
import analyticsRouter from "./routes/analytics";
import mediaRouter from "./routes/media";
import marketplaceRouter from "./routes/marketplace";
import checkoutRouter from "./routes/checkout";
import libraryRouter from "./routes/library";
import publishRouter from "./routes/publish";
import exportRouter from "./routes/export";
import kbRouter from "./routes/kb";
import adminRouter, { requireAdmin } from "./routes/admin";
import ragRouter from "./routes/rag";
import subscriptionRouter from "./routes/subscription";
import communityRouter from "./routes/community";
import aiExpertRouter from "./routes/aiExpert";

const app = express();

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// JSON and URL-encoded middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// =============================================================================
// ROUTES CONFIGURATION
// =============================================================================

// Root endpoint with ProductifyAI branding
app.get("/", (_req, res) => {
  res.json({
    message: "✅ ProductifyAI backend is running successfully!",
    version: "1.0.0",
    service: "ProductifyAI API",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health/db",
      api: "/api/*",
      products: "/products/*",
      auth: "/api/auth/*",
      payments: "/api/payments/*",
      files: "/api/files/*"
    }
  });
});

// API Routes
app.use("/products", productsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/video", videoRouter);
app.use("/api/auth", authRouter);
app.use("/api/files", filesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/ai", aiBuilderRouter);
app.use("/api/video", videoBuilderRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects", translationRouter);
app.use("/api/social", socialRouter);
app.use("/api/media", mediaGenerationRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/media", mediaRouter);
app.use("/listings", marketplaceRouter);
app.use("/checkout", checkoutRouter);
app.use("/me/library", libraryRouter);
app.use("/api/projects", publishRouter);
app.use("/api/projects", exportRouter);
app.use("/api/kb", kbRouter);
app.use("/api/admin", requireAdmin, adminRouter);
app.use("/api/rag", ragRouter);

// Stripe subscription routes (webhook needs raw body, registered separately)
app.use("/api/stripe", subscriptionRouter);
app.use("/api/subscription", subscriptionRouter);

// Community and AI Expert routes
app.use("/api/community", communityRouter);
app.use("/api/ai", aiExpertRouter);

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================

app.get("/health/db", async (_req, res) => {
  try {
    const result = await db.execute(`SELECT NOW() AS now`);
    res.json({ 
      ok: true, 
      now: result.rows[0].now,
      service: "ProductifyAI Database",
      status: "Connected",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    Logger.error("Health check endpoint error", error);
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      service: "ProductifyAI Database",
      status: "Error",
      timestamp: new Date().toISOString()
    });
  }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  Logger.info("🚀 Starting ProductifyAI server...");
  Logger.info(`🌐 Server running on port ${PORT}`);
  Logger.info(`📊 Health check: http://localhost:${PORT}/health/db`);
  Logger.info(`🔗 Supabase URL: ${process.env.SUPABASE_URL || process.env.DATABASE_URL || 'Not configured'}`);
  Logger.info(`🎯 ProductifyAI API ready for requests`);
  
  // Test database connection on startup
  db.execute(`SELECT 1`)
    .then(() => Logger.info("✅ ProductifyAI Database connection verified"))
    .catch(err => Logger.error("⚠️ Database connection failed", err));
});
