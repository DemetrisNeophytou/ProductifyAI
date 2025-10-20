-- Add commerce tables for marketplace and monetization

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' NOT NULL,
  category VARCHAR(50) NOT NULL,
  tags JSONB DEFAULT '[]',
  cover_image TEXT,
  preview_images JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  file_size INTEGER,
  download_count INTEGER DEFAULT 0 NOT NULL,
  rating NUMERIC(3,2) DEFAULT 0 NOT NULL,
  review_count INTEGER DEFAULT 0 NOT NULL,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id VARCHAR NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR UNIQUE,
  stripe_payment_intent_id VARCHAR UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  payment_method VARCHAR(50),
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(120),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);

-- Create entitlements table
CREATE TABLE IF NOT EXISTS entitlements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  listing_id VARCHAR REFERENCES listings(id) ON DELETE CASCADE,
  order_id VARCHAR REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  permissions JSONB DEFAULT '{"can_download": true, "can_clone": false, "can_share": false, "can_modify": false}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id VARCHAR NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  title VARCHAR(200),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  helpful_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for listings
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_published_at ON listings(published_at);

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Create indexes for entitlements
CREATE INDEX IF NOT EXISTS idx_entitlements_user ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_project ON entitlements(project_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_listing ON entitlements(listing_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_type ON entitlements(type);
CREATE INDEX IF NOT EXISTS idx_entitlements_status ON entitlements(status);

-- Create indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_user_listing ON reviews(user_id, listing_id);
