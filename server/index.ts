import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { DatabaseService } from "./services/database-service";
import { Logger } from "./utils/logger";
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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get("/", (_req, res) => {
  res.json({
    message: "✅ ProductifyAI backend is running successfully!",
    version: "1.0.0",
    service: "ProductifyAI API",
    timestamp: new Date().toISOString()
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

// Health Check
app.get("/health/db", async (_req, res) => {
  try {
    const dbService = DatabaseService.getInstance();
    const healthStatus = await dbService.getHealthStatus();
    
    if (healthStatus.status === 'Connected') {
      res.json(healthStatus);
    } else {
      res.status(500).json(healthStatus);
    }
  } catch (error: any) {
    Logger.error("Health check endpoint error", error);
    res.status(500).json({ 
      status: "Error", 
      error: error.message,
      service: "ProductifyAI Database"
    });
  }
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  Logger.info("🚀 Starting ProductifyAI server...");
  Logger.info(`🌐 Server running on port ${PORT}`);
  Logger.info(`📊 Health check: http://localhost:${PORT}/health/db`);
  Logger.info(`🔗 Supabase URL: ${process.env.SUPABASE_URL || process.env.DATABASE_URL || 'Not configured'}`);
  
  // Test database connection on startup
  const dbService = DatabaseService.getInstance();
  dbService.testConnection();
});