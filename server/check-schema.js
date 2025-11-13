import { DatabaseService } from './services/database-service.js';
import 'dotenv/config';

async function checkSchema() {
  const dbService = DatabaseService.getInstance();

  try {
    console.log('🔍 Checking database schema...');

    // Check projects table structure
    const projectsResult = await dbService.executeQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Projects table columns:');
    projectsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check metrics_events table structure
    const metricsResult = await dbService.executeQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'metrics_events' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Metrics_events table columns:');
    metricsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check foreign key constraints
    const fkResult = await dbService.executeQuery(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'metrics_events'
    `);
    
    console.log('\n🔗 Foreign key constraints for metrics_events:');
    fkResult.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();


