-- Migration: Add authentication system
-- Description: Adds owner_id to stores table and updates users table for authentication

-- 1. Update users table to support authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'owner';

-- 2. Add unique constraint to email if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- 3. Update stores table to add owner_id relationship
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 4. Create index on owner_id for better query performance
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

-- 5. Create index on users email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 6. Add index on stores slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);

-- 7. Update existing stores to have a default owner (optional - adjust as needed)
-- If you have existing stores without owner_id, you may need to assign them to a user
-- UPDATE stores SET owner_id = 'some-user-uuid' WHERE owner_id IS NULL;

-- 8. Make owner_id required for new stores (optional - uncomment if you want it required)
-- ALTER TABLE stores ALTER COLUMN owner_id SET NOT NULL;

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.role IS 'User role: owner, admin, etc.';
COMMENT ON COLUMN stores.owner_id IS 'Reference to the user who owns this store';