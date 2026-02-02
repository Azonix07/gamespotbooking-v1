-- ============================================================
-- GameSpot Rewards System Migration
-- Run this in Railway MySQL Query Console
-- ============================================================

-- Step 1: Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gamespot_points INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_shares INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_playtime_minutes INT DEFAULT 0;

-- Step 2: Create user_rewards table (track redemptions)
CREATE TABLE IF NOT EXISTS user_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    points_spent INT NOT NULL,
    reward_description TEXT,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 3: Create points_history table (track points earned per booking)
CREATE TABLE IF NOT EXISTS points_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    booking_id INT,
    points_earned INT NOT NULL,
    points_type VARCHAR(50) DEFAULT 'booking',
    booking_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 4: Create instagram_shares table (track share progress)
CREATE TABLE IF NOT EXISTS instagram_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    share_count INT DEFAULT 0,
    reward_claimed BOOLEAN DEFAULT FALSE,
    last_share_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Migration Complete!
-- ============================================================
-- Tables created:
--   • users (extended with 4 new columns)
--   • user_rewards (redemption records)
--   • points_history (points earned tracking)
--   • instagram_shares (share tracking)
-- ============================================================
