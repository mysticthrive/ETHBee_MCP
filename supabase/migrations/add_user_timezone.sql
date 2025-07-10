-- Add timezone column to users table
ALTER TABLE users 
ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC';

-- Add comment to explain the column
COMMENT ON COLUMN users.timezone IS 'User timezone in IANA timezone format (e.g., America/New_York, Europe/London)';

-- Create index for timezone queries if needed
CREATE INDEX idx_users_timezone ON users(timezone);

-- Update existing users to have UTC as default timezone
UPDATE users SET timezone = 'UTC' WHERE timezone IS NULL;
