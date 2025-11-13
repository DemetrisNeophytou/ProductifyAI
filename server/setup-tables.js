import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Dn171074%3F%3F270705@aws-1-eu-north-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  try {
    console.log('Creating tables...');
    
    // Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        type VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        template_id VARCHAR,
        metadata JSONB,
        brand JSONB,
        outline JSONB,
        cover_image_url TEXT,
        background_color TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created projects table');

    // Create pages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        settings JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created pages table');

    // Create blocks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id VARCHAR NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        content JSONB NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        settings JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created blocks table');

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pages_project ON pages(project_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_pages_project_order ON pages(project_id, "order")');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_blocks_project ON blocks(project_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_blocks_page_order ON blocks(page_id, "order")');
    console.log('✅ Created indexes');

    console.log('🎉 All tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createTables();


