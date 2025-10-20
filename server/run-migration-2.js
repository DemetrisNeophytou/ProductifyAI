import { DatabaseService } from './services/database-service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration2() {
  const dbService = DatabaseService.getInstance();

  try {
    console.log('🔄 Running migration 2: Fix metrics_events table...');

    const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', '002_fix_metrics_events.sql'), 'utf8');

    await dbService.executeQuery(migrationSQL);

    console.log('✅ Migration 2 completed successfully!');

    // Test the fix
    const result = await dbService.executeQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'metrics_events' 
      AND column_name = 'project_id'
    `);

    console.log('📊 metrics_events.project_id column type:', result.rows[0]);

  } catch (error) {
    console.error('❌ Migration 2 failed:', error.message);
    process.exit(1);
  }
}

runMigration2();
