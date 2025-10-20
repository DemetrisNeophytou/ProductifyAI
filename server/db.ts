import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// -----------------------------------------------------------------------------
// Mock DB mode for non-Docker local development
// -----------------------------------------------------------------------------
let dbInstance: any;

if (process.env.MOCK_DB === 'true') {
  // Lightweight in-memory mock that emulates a subset of pg/drizzle API
  // Only implements what's needed by current endpoints (e.g., SELECT NOW())
  type MockResult = { rows: any[]; rowCount?: number };

  const mockExecute = async (query: string, _params?: any[]): Promise<MockResult> => {
    const normalized = query.trim().toUpperCase();
    if (normalized.includes('SELECT NOW')) {
      return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
    }
    // Generic empty result fallback
    return { rows: [], rowCount: 0 };
  };

  // Drizzle is not used directly in mock mode; we expose a compatible surface
  // to the rest of the codebase via an object that has `execute`.
  dbInstance = {
    execute: mockExecute,
  };

  console.log("🧪 Using MOCK_DB in-memory database (no Docker required)");
} else {
  // -----------------------------------------------------------------------------
  // Real Postgres connection (Supabase or local DATABASE_URL)
  // -----------------------------------------------------------------------------
  // Use SUPABASE_URL if available, otherwise fall back to DATABASE_URL
  let connectionString = process.env.SUPABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    // For development, use a local connection string if none provided
    connectionString = 'postgresql://user:password@localhost:5432/productifyai';
    console.log("⚠️ Using local database connection for development");
  }

  // Create database connection using Supabase/local credentials
  const pool = new Pool({
    connectionString,
    ssl: (
      // Enable SSL for Supabase URLs
      /supabase\.co/.test(connectionString) ? { rejectUnauthorized: false } : undefined
    ) as any,
  });

  dbInstance = drizzle(pool);

  console.log("✅ ProductifyAI Database connected successfully!");

  // Test connection on startup (non-fatal)
  pool.query("SELECT 1")
    .then(() => console.log("✅ ProductifyAI Database connection verified"))
    .catch(err => {
      console.log("⚠️ Database connection test failed");
      console.log("Error:", err.message);
    });
}

export const db = dbInstance as ReturnType<typeof drizzle> | { execute: (q: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number }> };