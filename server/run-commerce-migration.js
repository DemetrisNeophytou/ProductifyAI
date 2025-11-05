import { DatabaseService } from './services/database-service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCommerceMigration() {
  const dbService = DatabaseService.getInstance();

  try {
    console.log('🔄 Running commerce migration...');

    const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', '003_add_commerce_tables.sql'), 'utf8');

    await dbService.executeQuery(migrationSQL);

    console.log('✅ Commerce migration completed successfully!');

    // Test the new tables
    const result = await dbService.executeQuery(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('listings', 'orders', 'entitlements', 'reviews')
    `);

    console.log('📊 New commerce tables created:', result.rows.map(r => r.table_name));

  } catch (error) {
    console.error('❌ Commerce migration failed:', error.message);
    process.exit(1);
  }
}

runCommerceMigration();
