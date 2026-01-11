-- Migration: Add active_group_id to users table
-- Execute this in Supabase SQL Editor

-- Add active_group_id column (nullable, references family_groups)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active_group_id TEXT;

-- Add foreign key constraint (optional, but recommended for data integrity)
-- Note: We make it nullable because a user might not have any groups yet
ALTER TABLE users
ADD CONSTRAINT fk_users_active_group 
FOREIGN KEY (active_group_id) 
REFERENCES family_groups(id) 
ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.active_group_id IS 'ID of the currently active group/space for this user';
