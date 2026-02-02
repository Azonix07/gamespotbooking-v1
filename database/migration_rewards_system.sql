-- Add rewards and points system to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gamespot_points INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_shares INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_playtime_minutes INT DEFAULT 0;

-- Create rewards table to track redemptions
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

-- Create points history table
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

-- Create instagram share tracking
CREATE TABLE IF NOT EXISTS instagram_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    share_count INT DEFAULT 0,
    reward_claimed BOOLEAN DEFAULT FALSE,
    last_share_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
