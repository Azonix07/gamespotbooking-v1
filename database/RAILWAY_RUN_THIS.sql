-- ============================================================================
-- Instagram Promotion System - RAILWAY COMPATIBLE VERSION
-- ============================================================================
-- Railway uses database name "railway" by default
-- This script will work regardless of database name
-- ============================================================================

-- Step 1: Create instagram_promotions table
CREATE TABLE IF NOT EXISTS instagram_promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name VARCHAR(100) NOT NULL,
    instagram_handle VARCHAR(100) NOT NULL DEFAULT '@gamespot_kdlr',
    discount_type ENUM('fixed_amount', 'percentage', 'free_minutes') NOT NULL DEFAULT 'free_minutes',
    discount_value DECIMAL(10,2) NOT NULL,
    required_friends_count INT NOT NULL DEFAULT 2,
    max_redemptions_per_user INT NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    terms_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Create user_instagram_redemptions table
CREATE TABLE IF NOT EXISTS user_instagram_redemptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    promotion_id INT NOT NULL,
    instagram_username VARCHAR(100) NOT NULL,
    shared_with_friends JSON NOT NULL,
    redemption_code VARCHAR(20) UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    verified_at TIMESTAMP NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_in_booking_id INT,
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES instagram_promotions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_promotion (user_id, promotion_id),
    INDEX idx_redemption_code (redemption_code),
    INDEX idx_verification (is_verified),
    INDEX idx_usage (is_used),
    INDEX idx_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Insert the active Instagram promotion
INSERT INTO instagram_promotions (
    campaign_name,
    instagram_handle,
    discount_type,
    discount_value,
    required_friends_count,
    max_redemptions_per_user,
    start_date,
    end_date,
    terms_conditions,
    is_active
) VALUES (
    'Win 30 Minutes FREE Gaming!',
    '@gamespot_kdlr',
    'free_minutes',
    30.00,
    2,
    1,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 90 DAY),
    '1. You must follow @gamespot_kdlr on Instagram
2. Share our profile with at least 2 friends
3. Provide their Instagram handles when claiming
4. The 30-minute discount will be automatically applied when you book
5. This promotion can only be claimed once per user
6. Admin verification required before redemption code can be used
7. Redemption code valid for 90 days from claim date
8. Cannot be combined with other offers',
    1
);

-- Step 4: Verify
SELECT 
    'SUCCESS! Promotion Created:' AS Status,
    id,
    campaign_name,
    instagram_handle,
    CONCAT(discount_value, ' minutes') AS discount,
    required_friends_count AS friends_required,
    start_date,
    end_date
FROM instagram_promotions
WHERE is_active = 1;
