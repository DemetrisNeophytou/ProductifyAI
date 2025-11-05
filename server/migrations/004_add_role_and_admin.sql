/**
 * Migration: Add role column and set admin user
 * Ensures users table has role field and sets initial admin
 */

-- Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role varchar(20) DEFAULT 'user';
    RAISE NOTICE 'Added role column to users table';
  END IF;
END $$;

-- Set admin role for specific email
UPDATE users 
SET role = 'admin' 
WHERE email = 'dneophytou27@gmail.com';

-- If user doesn't exist yet, this will be set on first login
-- Log result
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
  RAISE NOTICE 'Total admin users: %', admin_count;
END $$;

