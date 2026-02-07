-- Migration: Add email column to admin_users table
-- Run this on Railway database to update existing admin_users

-- Add email column if it doesn't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE NULL;

-- Update existing admin user to have email
UPDATE admin_users 
SET email = 'admin@gamespot.in' 
WHERE username = 'admin' AND email IS NULL;

-- Verify the change
SELECT id, username, email, created_at FROM admin_users;
