-- Add missing columns and tables for multilingual and social features

-- Step 1: Add user_id column to projects table (make it nullable for now)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Step 2: Add locale column to project_blocks table
ALTER TABLE project_blocks ADD COLUMN IF NOT EXISTS locale VARCHAR(5) DEFAULT 'en';
ALTER TABLE project_blocks ADD COLUMN IF NOT EXISTS original_id VARCHAR;

-- Step 3: Create social_packs table
CREATE TABLE IF NOT EXISTS social_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  platforms JSONB NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create media table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  prompt TEXT NOT NULL,
  license VARCHAR(40) DEFAULT 'generated' NOT NULL,
  attribution TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create indexes for social_packs
CREATE INDEX IF NOT EXISTS idx_social_packs_project ON social_packs(project_id);
CREATE INDEX IF NOT EXISTS idx_social_packs_locale ON social_packs(locale);

-- Step 6: Create indexes for media
CREATE INDEX IF NOT EXISTS idx_media_project ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);

-- Step 7: Create analytics metrics_events table
CREATE TABLE IF NOT EXISTS metrics_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  kind VARCHAR(40) NOT NULL,
  value NUMERIC,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 8: Create indexes for metrics_events
CREATE INDEX IF NOT EXISTS idx_metrics_events_user ON metrics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_events_project ON metrics_events(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_events_kind ON metrics_events(kind);
CREATE INDEX IF NOT EXISTS idx_metrics_events_created_at ON metrics_events(created_at);
