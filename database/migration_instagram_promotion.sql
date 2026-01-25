-- ============================================================================
-- Instagram Promotion System Migration
-- Adds tables for managing Instagram follow/share promotions
-- ============================================================================

USE gamespot_booking;

-- ============================================================================
-- Table: instagram_promotions
-- Stores Instagram promotion campaigns and their details
-- ============================================================================
CREATE TABLE IF NOT EXISTS instagram_promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_name VARCHAR(100) NOT NULL,
    instagram_handle VARCHAR(100) NOT NULL DEFAULT '@gamespot_kdlr',
    discount_type ENUM('fixed_amount', 'percentage', 'free_minutes') NOT NULL DEFAULT 'free_minutes',
    discount_value DECIMAL(10,2) NOT NULL COMMENT 'Amount in rupees, percentage, or free minutes',
    required_friends_count INT NOT NULL DEFAULT 2 COMMENT 'Number of friends to share with',
    max_redemptions_per_user INT NOT NULL DEFAULT 1 COMMENT 'How many times a user can claim',
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE NULL COMMENT 'NULL means no expiry',
    terms_conditions TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: user_instagram_redemptions
-- Tracks which users have claimed Instagram promotions
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_instagram_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    promotion_id INT NOT NULL,
    instagram_username VARCHAR(100) NULL COMMENT 'User Instagram handle (optional verification)',
    shared_with_friends TEXT NULL COMMENT 'Comma-separated Instagram handles of friends',
    screenshot_url VARCHAR(500) NULL COMMENT 'URL to screenshot proof (optional)',
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    verification_notes TEXT NULL,
    verified_by INT NULL COMMENT 'Admin user ID who verified',
    verified_at TIMESTAMP NULL,
    redemption_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Unique code for booking discount',
    is_used BOOLEAN DEFAULT FALSE COMMENT 'Whether discount has been applied to a booking',
    used_booking_id INT NULL COMMENT 'Booking ID where discount was used',
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL COMMENT 'When the redemption code expires',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_promotion_id (promotion_id),
    INDEX idx_redemption_code (redemption_code),
    INDEX idx_verification_status (verification_status),
    INDEX idx_is_used (is_used),
    UNIQUE KEY unique_user_promotion (user_id, promotion_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES instagram_promotions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Update bookings table: Add Instagram promotion discount tracking
-- ============================================================================

-- Add instagram_redemption_id column if not exists
SET @col_exists_redemption = (SELECT COUNT(*) 
                              FROM information_schema.COLUMNS 
                              WHERE TABLE_SCHEMA = 'gamespot_booking' 
                              AND TABLE_NAME = 'bookings' 
                              AND COLUMN_NAME = 'instagram_redemption_id');

SET @query_redemption = IF(@col_exists_redemption = 0,
    'ALTER TABLE bookings ADD COLUMN instagram_redemption_id INT NULL COMMENT "Link to Instagram promotion redemption"',
    'SELECT "instagram_redemption_id column already exists" AS message'
);

PREPARE stmt FROM @query_redemption;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add discount_amount column if not exists
SET @col_exists_discount = (SELECT COUNT(*) 
                            FROM information_schema.COLUMNS 
                            WHERE TABLE_SCHEMA = 'gamespot_booking' 
                            AND TABLE_NAME = 'bookings' 
                            AND COLUMN_NAME = 'discount_amount');

SET @query_discount = IF(@col_exists_discount = 0,
    'ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 COMMENT "Discount applied from promotions"',
    'SELECT "discount_amount column already exists" AS message'
);

PREPARE stmt FROM @query_discount;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add discount_type column if not exists
SET @col_exists_discount_type = (SELECT COUNT(*) 
                                 FROM information_schema.COLUMNS 
                                 WHERE TABLE_SCHEMA = 'gamespot_booking' 
                                 AND TABLE_NAME = 'bookings' 
                                 AND COLUMN_NAME = 'discount_type');

SET @query_discount_type = IF(@col_exists_discount_type = 0,
    'ALTER TABLE bookings ADD COLUMN discount_type VARCHAR(50) NULL COMMENT "Type of discount: instagram_promo, membership, etc"',
    'SELECT "discount_type column already exists" AS message'
);

PREPARE stmt FROM @query_discount_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Insert default Instagram promotion campaign
-- ============================================================================
INSERT INTO instagram_promotions (
    campaign_name,
    instagram_handle,
    discount_type,
    discount_value,
    required_friends_count,
    max_redemptions_per_user,
    is_active,
    start_date,
    end_date,
    terms_conditions
) VALUES (
    'Follow & Share - Win 30 Min Free Gaming',
    '@gamespot_kdlr',
    'free_minutes',
    30,
    2,
    1,
    TRUE,
    CURDATE(),
    NULL,
    'Follow @gamespot_kdlr on Instagram and share with 2 friends to win 30 minutes of FREE gaming. One redemption per user. Discount will be applied automatically when booking while logged in. Valid for PS5 and Driving Simulator bookings.'
) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Useful Queries for Admins
-- ============================================================================

-- View all active promotions
-- SELECT * FROM instagram_promotions WHERE is_active = TRUE;

-- View pending verifications
-- SELECT 
--     r.*,
--     u.name AS user_name,
--     u.email AS user_email,
--     p.campaign_name
-- FROM user_instagram_redemptions r
-- JOIN users u ON r.user_id = u.id
-- JOIN instagram_promotions p ON r.promotion_id = p.id
-- WHERE r.verification_status = 'pending'
-- ORDER BY r.created_at DESC;

-- View statistics
-- SELECT 
--     p.campaign_name,
--     COUNT(r.id) AS total_redemptions,
--     SUM(CASE WHEN r.verification_status = 'verified' THEN 1 ELSE 0 END) AS verified,
--     SUM(CASE WHEN r.is_used = TRUE THEN 1 ELSE 0 END) AS used
-- FROM instagram_promotions p
-- LEFT JOIN user_instagram_redemptions r ON p.id = r.promotion_id
-- GROUP BY p.id;

SELECT 'Instagram Promotion System Migration Complete!' AS status;
