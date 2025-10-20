import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

// URL-encode ?? to %3F%3F for proper PostgreSQL connection
const dbUrl = (process.env.DATABASE_URL || "").replace(/\?\?/g, '%3F%3F');

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/schema.ts",
  out: "./drizzle",
  dbCredentials: { 
    url: dbUrl || "postgresql://postgres:Dn171074%3F%3F270705@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"
  },
});
