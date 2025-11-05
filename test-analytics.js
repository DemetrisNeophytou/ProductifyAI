import { DatabaseService } from './server/services/database-service.js';
import 'dotenv/config';

async function testAnalytics() {
  const dbService = DatabaseService.getInstance();
  
  try {
    console.log('🔍 Testing analytics table...');
    
    // Check if metrics_events table exists
    const result = await dbService.executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'metrics_events'
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ metrics_events table does not exist. Creating it...');
      
      // Create the table
      await dbService.executeQuery(`
        CREATE TABLE IF NOT EXISTS metrics_events (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          kind VARCHAR(40) NOT NULL,
          value NUMERIC,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Create indexes
      await dbService.executeQuery(`
        CREATE INDEX IF NOT EXISTS idx_metrics_events_user ON metrics_events(user_id);
        CREATE INDEX IF NOT EXISTS idx_metrics_events_project ON metrics_events(project_id);
        CREATE INDEX IF NOT EXISTS idx_metrics_events_kind ON metrics_events(kind);
        CREATE INDEX IF NOT EXISTS idx_metrics_events_created_at ON metrics_events(created_at);
      `);
      
      console.log('✅ metrics_events table created successfully!');
    } else {
      console.log('✅ metrics_events table exists');
    }
    
    // First create a test project
    console.log('🏗️ Creating test project...');
    const testProjectId = 'proj_test_analytics_123'; // String ID
    const projectResult = await dbService.executeQuery(`
      INSERT INTO projects (id, type, title, status)
      VALUES ('${testProjectId}', 'ebook', 'Test Project for Analytics', 'draft')
      ON CONFLICT (id) DO NOTHING
      RETURNING *
    `);
    
    console.log('✅ Test project created/exists:', projectResult.rows[0] || 'Already exists');
    
    // Test inserting a sample event with proper UUID
    console.log('🧪 Testing event insertion...');
    const insertResult = await dbService.executeQuery(`
      INSERT INTO metrics_events (project_id, kind, value, metadata)
      VALUES ('${testProjectId}', 'test', 1, '{"source": "test_script"}')
      RETURNING *
    `);
    
    console.log('✅ Sample event inserted:', insertResult.rows[0]);
    
    // Test summary query
    console.log('📊 Testing summary query...');
    const summaryResult = await dbService.executeQuery(`
      SELECT 
        kind,
        COUNT(*) as count,
        SUM(value) as total_value
      FROM metrics_events 
      WHERE project_id = '${testProjectId}'
      GROUP BY kind
    `);
    
    console.log('✅ Summary query result:', summaryResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAnalytics();
