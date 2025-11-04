/**
 * ProductifyAI Server - Hardened Edition
 * 
 * Includes comprehensive security middleware:
 * - Helmet.js security headers
 * - Strict CORS with whitelisting
 * - Rate limiting on all API routes
 * - Input validation middleware
 * - Enhanced health checks
 */

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { DatabaseService } from "./services/database-service";
import { Logger } from "./utils/logger";

// Security Middleware
import {
  securityHeaders,
  strictCors,
  globalApiRateLimiter,
  sanitizeRequest,
  securityLogger,
  validateSecurityConfig,
  requestSizeLimiter,
} from "./middleware/security";

// Routes
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
import productsRouter from "./routes/products";
import aiRouter from "./routes/ai";
import videoRouter from "./routes/video";
import authRouter from "./routes/auth";
import filesRouter from "./routes/files";
import paymentsRouter from "./routes/payments";
import healthRouter from "./routes/health-secure";

const app = express();

// Validate security configuration on startup
try {
  validateSecurityConfig();
} catch (error) {
  Logger.error("Security configuration validation failed. Exiting.");
  process.exit(1);
}

// Security Headers (Helmet.js)
app.use(securityHeaders);

// Strict CORS
app.use(strictCors());

// Request body parsers with size limits
app.use(express.json(requestSizeLimiter.json));
app.use(express.urlencoded({ ...requestSizeLimiter.urlencoded, extended: true }));

// Security logging
app.use(securityLogger);

// Request sanitization
app.use(sanitizeRequest);

// Global API rate limiting
app.use('/api', globalApiRateLimiter);

// Logging middleware
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.path}`);
  next();
});

// Root health check (liveness probe for Kubernetes/Docker)
app.get("/healthz", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "ProductifyAI API",
  });
});

// Readiness check (for Kubernetes/Docker)
app.get("/readyz", async (req, res) => {
  try {
    const dbService = DatabaseService.getInstance();
    const healthStatus = await dbService.getHealthStatus();
    
    if (healthStatus.status === 'Connected') {
      res.json({
        status: "ready",
        timestamp: new Date().toISOString(),
        database: healthStatus,
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        database: healthStatus,
      });
    }
  } catch (error: any) {
    res.status(503).json({
      status: "not_ready",
      error: error.message,
    });
  }
});

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    message: "✅ ProductifyAI backend is running successfully!",
    version: "1.0.0",
    service: "ProductifyAI API",
    timestamp: new Date().toISOString(),
    security: "enabled",
  });
});

// API Routes
app.use("/products", productsRouter);
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
app.use("/api/ai", aiRouter);
app.use("/api/auth", authRouter);
app.use("/api/files", filesRouter);
app.use("/api/payments", paymentsRouter);

// Enhanced Health Check Routes
app.use("/api/health", healthRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error
  Logger.error("Unhandled error:", err);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.name || "Internal Server Error",
    message: isDevelopment ? err.message : "An error occurred processing your request",
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 5050;
const server = app.listen(PORT, () => {
  Logger.info("🛡️ Starting ProductifyAI server with security hardening...");
  Logger.info(`🌐 Server running on port ${PORT}`);
  Logger.info(`🔒 Security features enabled:`);
  Logger.info(`   ✓ Helmet.js security headers`);
  Logger.info(`   ✓ Strict CORS with whitelist`);
  Logger.info(`   ✓ Global API rate limiting`);
  Logger.info(`   ✓ Request sanitization`);
  Logger.info(`   ✓ Input validation ready (Zod)`);
  Logger.info(`📊 Health checks:`);
  Logger.info(`   - Liveness:  http://localhost:${PORT}/healthz`);
  Logger.info(`   - Readiness: http://localhost:${PORT}/readyz`);
  Logger.info(`   - Detailed:  http://localhost:${PORT}/api/health`);
  Logger.info(`🔗 Database: ${process.env.SUPABASE_URL || process.env.DATABASE_URL || 'Not configured'}`);
  
  // Test database connection on startup
  const dbService = DatabaseService.getInstance();
  dbService.testConnection();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    Logger.info('Server closed. Process terminating.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    Logger.info('Server closed. Process terminating.');
    process.exit(0);
  });
});

export default app;

