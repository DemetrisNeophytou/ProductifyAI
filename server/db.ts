import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import { AppDB, QueryAPI } from "./db/types";

dotenv.config();

// -----------------------------------------------------------------------------
// Mock DB mode for non-Docker local development
// -----------------------------------------------------------------------------
type MockResult = { rows: unknown[]; rowCount?: number };
type MockDb = QueryAPI & {
  execute: (query: string, params?: unknown[]) => Promise<MockResult>;
};

let dbInstance: AppDB;

if (process.env.MOCK_DB === 'true') {
  // Lightweight in-memory mock that emulates a subset of pg/drizzle API
  // Only implements what's needed by current endpoints (e.g., SELECT NOW())
  const mockExecute = async (query: string, _params?: unknown[]): Promise<MockResult> => {
    const normalized = query.trim().toUpperCase();
    if (normalized.includes('SELECT NOW')) {
      return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
    }
    // Generic empty result fallback
    return { rows: [], rowCount: 0 };
  };

  // Drizzle is not used directly in mock mode; we expose a compatible surface
  // to the rest of the codebase via an object that has `execute`.
  const notSupported = <T extends keyof QueryAPI>(method: T): QueryAPI[T] => {
    return ((..._args: Parameters<QueryAPI[T]>) => {
      throw new Error(`Mock DB does not implement ${method}.`);
    }) as QueryAPI[T];
  };

  const mockDb: MockDb = {
    execute: mockExecute,
    select: notSupported("select"),
    insert: notSupported("insert"),
    update: notSupported("update"),
    delete: notSupported("delete"),
  };

  dbInstance = mockDb as unknown as AppDB;

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
  const sslConfig: boolean | { rejectUnauthorized: boolean } | undefined =
    /supabase\.co/.test(connectionString) ? { rejectUnauthorized: false } : undefined;

  const pool = new Pool({
    connectionString,
    ssl: sslConfig,
  });

  dbInstance = drizzle(pool) as unknown as AppDB;

  console.log("✅ ProductifyAI Database connected successfully!");

  // Test connection on startup (non-fatal)
  pool.query("SELECT 1")
    .then(() => console.log("✅ ProductifyAI Database connection verified"))
    .catch(err => {
      console.log("⚠️ Database connection test failed");
      console.log("Error:", err.message);
    });
}

export const db: AppDB = dbInstance;

