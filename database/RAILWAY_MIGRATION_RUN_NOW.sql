-- Railway MySQL OAuth Migration
-- Run this in Railway Query tab or via mysql client

USE railway;

-- Add OAuth columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);

-- Add index for faster OAuth lookups
ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_oauth_provider_id (oauth_provider_id);

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
AND COLUMN_NAME LIKE 'oauth%';

-- Check if it worked
SHOW COLUMNS FROM users;
