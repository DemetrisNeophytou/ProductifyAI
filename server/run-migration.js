import { DatabaseService } from './services/database-service.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const dbService = DatabaseService.getInstance();

  try {
    console.log('🔄 Running database migration...');
    
    const migrationSQL = fs.readFileSync(path.join(__dirname, 'migrations', '001_add_multilingual_tables.sql'), 'utf8');
    
    await dbService.executeQuery(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Test the new tables
    const result = await dbService.executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('social_packs', 'media')
    `);
    
    console.log('📊 New tables created:', result.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();


