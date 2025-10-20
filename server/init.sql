-- ProductifyAI Database Initialization Script
-- This script creates the necessary tables and initial data

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSON operations
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR UNIQUE NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url TEXT,
    subscription_tier VARCHAR DEFAULT 'free',
    subscription_status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    type VARCHAR NOT NULL CHECK (type IN ('ebook', 'template', 'course', 'playbook')),
    status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR DEFAULT 'USD',
    sales_count INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PAGES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS pages (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    content TEXT,
    page_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- BLOCKS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS blocks (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    page_id VARCHAR NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL CHECK (type IN ('text', 'image', 'video', 'code', 'quote')),
    content JSONB NOT NULL,
    block_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PROJECT BLOCKS TABLE (for Canvas data)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_blocks (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    canvas_data JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_auto_save INTEGER DEFAULT 0 CHECK (is_auto_save IN (0, 1)),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- ASSETS TABLE (for Media)
-- =============================================================================

CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR REFERENCES projects(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'logo', 'cover', 'file', 'video')),
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    license VARCHAR(40) DEFAULT 'generated',
    attribution TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PURCHASES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR NOT NULL DEFAULT 'USD',
    payment_method VARCHAR,
    payment_id VARCHAR UNIQUE,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Pages indexes
CREATE INDEX IF NOT EXISTS idx_pages_project_id ON pages(project_id);
CREATE INDEX IF NOT EXISTS idx_pages_order ON pages(project_id, page_order);

-- Blocks indexes
CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_order ON blocks(page_id, block_order);

-- Project blocks indexes
CREATE INDEX IF NOT EXISTS idx_project_blocks_project ON project_blocks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_blocks_version ON project_blocks(project_id, version);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_project_id ON purchases(project_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert a default demo user
INSERT INTO users (id, email, first_name, last_name, subscription_tier) 
VALUES ('demo-user', 'demo@productifyai.com', 'Demo', 'User', 'free')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_blocks_updated_at BEFORE UPDATE ON project_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for projects with user information
CREATE OR REPLACE VIEW projects_with_users AS
SELECT 
    p.*,
    u.email as user_email,
    u.first_name,
    u.last_name,
    u.subscription_tier
FROM projects p
JOIN users u ON p.user_id = u.id;

-- View for project statistics
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id,
    p.title,
    p.type,
    p.status,
    p.price,
    p.sales_count,
    p.revenue,
    COUNT(pa.id) as page_count,
    COUNT(a.id) as asset_count,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN pages pa ON p.id = pa.project_id
LEFT JOIN assets a ON p.id = a.project_id
GROUP BY p.id, p.title, p.type, p.status, p.price, p.sales_count, p.revenue, p.created_at, p.updated_at;
