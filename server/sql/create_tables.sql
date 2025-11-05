-- Create projects table for AI Product Builder
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  type VARCHAR(50) NOT NULL, -- ebook, course, template
  title TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, final
  template_id VARCHAR, -- ID of template used to create this project
  metadata JSONB,
  brand JSONB,
  outline JSONB,
  cover_image_url TEXT,
  background_color TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create pages table for multi-page structure
CREATE TABLE IF NOT EXISTS pages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create blocks table for content blocks within pages
CREATE TABLE IF NOT EXISTS blocks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id VARCHAR NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- heading, paragraph, image, cta, list, quote, table
  content JSONB NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_pages_project ON pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_project_order ON pages(project_id, "order");

CREATE INDEX IF NOT EXISTS idx_blocks_page ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_project ON blocks(project_id);
CREATE INDEX IF NOT EXISTS idx_blocks_page_order ON blocks(page_id, "order");
