-- Add OAuth fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255),
ADD INDEX idx_oauth_provider_id (oauth_provider_id);

-- Update existing users to have NULL for oauth fields
UPDATE users SET oauth_provider = NULL WHERE oauth_provider IS NULL OR oauth_provider = '';
UPDATE users SET oauth_provider_id = NULL WHERE oauth_provider_id IS NULL OR oauth_provider_id = '';
