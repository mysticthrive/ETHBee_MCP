-- Run this script to add timezone support to the users table
-- This script should be executed in your Supabase SQL editor

-- Add timezone column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'UTC';

-- Add comment to explain the column
COMMENT ON COLUMN users.timezone IS 'User timezone in IANA timezone format (e.g., America/New_York, Europe/London)';

-- Create index for timezone queries if needed
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);

-- Update existing users to have UTC as default timezone
UPDATE users SET timezone = 'UTC' WHERE timezone IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND column_name = 'timezone';

-- Show sample of updated users table structure
SELECT 
    id, 
    email, 
    first_name, 
    last_name, 
    timezone, 
    created_at 
FROM users 
LIMIT 5;
