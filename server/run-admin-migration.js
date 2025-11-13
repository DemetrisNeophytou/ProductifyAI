/**
 * Run Admin Role Migration
 * Adds role column and sets admin user
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log('🔧 Running admin role migration...\n');

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL or SUPABASE_URL not found in environment');
    console.log('Set MOCK_DB=true to skip this migration\n');
    process.exit(1);
  }

  try {
    // Connect to database
    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log('✅ Connected to database\n');

    // Read migration SQL
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', '004_add_role_and_admin.sql'),
      'utf-8'
    );

    // Execute migration
    console.log('📝 Executing migration...\n');
    await client.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📧 Admin role set for: dneophytou27@gmail.com\n');
    console.log('You can now access /admin routes with this account.\n');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nIf the table already has a role column, this is safe to ignore.\n');
    process.exit(1);
  }
}

runMigration();



