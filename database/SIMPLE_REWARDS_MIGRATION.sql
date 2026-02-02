-- ============================================================================
-- GameSpot Rewards System Migration - SIMPLE VERSION
-- Add rewards columns to existing users table
-- Run this on Railway MySQL
-- ============================================================================

-- Step 1: Add profile picture column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) DEFAULT NULL 
COMMENT 'Profile picture URL/path';

-- Step 2: Add gamespot points column  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gamespot_points INT DEFAULT 0 
COMMENT 'Loyalty points earned (50% of booking amount)';

-- Step 3: Add instagram shares column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS instagram_shares INT DEFAULT 0 
COMMENT 'Number of Instagram shares (max 5 for reward)';

-- Step 4: Add free playtime minutes column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS free_playtime_minutes INT DEFAULT 0 
COMMENT 'Free playtime minutes from rewards';

-- Step 5: Create user_rewards table for redemption tracking
CREATE TABLE IF NOT EXISTS user_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reward_type VARCHAR(50) NOT NULL COMMENT 'ps5_extra_hour, vr_free_day, instagram_free_time',
    points_spent INT NOT NULL DEFAULT 0,
    reward_description TEXT,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' COMMENT 'active, used, expired',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_rewards (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 6: Create points_history table for tracking
CREATE TABLE IF NOT EXISTS points_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    booking_id INT NULL COMMENT 'Reference to booking if points from booking',
    points_earned INT NOT NULL,
    points_type VARCHAR(50) DEFAULT 'booking' COMMENT 'booking, bonus, referral',
    booking_amount DECIMAL(10,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_points_history (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 7: Create instagram_shares table (optional tracking)
CREATE TABLE IF NOT EXISTS instagram_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    share_count INT DEFAULT 0,
    reward_claimed BOOLEAN DEFAULT FALSE,
    last_share_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_instagram_shares (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification queries (optional - just to check)
SELECT 
    'users table columns' AS info,
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME IN ('profile_picture', 'gamespot_points', 'instagram_shares', 'free_playtime_minutes');

-- Show new tables
SHOW TABLES LIKE '%reward%';
SHOW TABLES LIKE '%points%';
SHOW TABLES LIKE '%instagram%';

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- Now your profile page will work!
-- Points system: 50% of booking amount = points
-- Rewards: PS5 (500pts), VR (3000pts), Instagram (30 mins free)
-- ============================================================================
