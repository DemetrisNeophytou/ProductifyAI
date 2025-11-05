-- Fix metrics_events table to use varchar instead of uuid for project_id
-- This matches the projects table which uses varchar for id

-- Drop the existing foreign key constraint
ALTER TABLE metrics_events DROP CONSTRAINT IF EXISTS metrics_events_project_id_fkey;

-- Change the column type from uuid to varchar
ALTER TABLE metrics_events ALTER COLUMN project_id TYPE VARCHAR;

-- Recreate the foreign key constraint
ALTER TABLE metrics_events ADD CONSTRAINT metrics_events_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
