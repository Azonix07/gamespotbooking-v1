-- Promo Codes System Migration
-- Adds promo codes table for invite rewards

-- Table: promo_codes
-- Stores promo codes generated from invites and other promotions
CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    code_type ENUM('invite', 'instagram', 'special') NOT NULL DEFAULT 'invite',
    bonus_minutes INT NOT NULL DEFAULT 30,
    max_uses INT NOT NULL DEFAULT 1,
    current_uses INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_expires (expires_at),
    INDEX idx_type (code_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add promo_code_id to bookings table
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE bookings ADD COLUMN promo_code_id INT NULL COMMENT "Applied promo code"',
        'SELECT "Column promo_code_id already exists in bookings" AS message'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'promo_code_id'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add bonus_minutes to bookings table
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE bookings ADD COLUMN bonus_minutes INT DEFAULT 0 COMMENT "Extra minutes from promo code"',
        'SELECT "Column bonus_minutes already exists in bookings" AS message'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'bonus_minutes'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert some sample promo codes for testing
INSERT INTO promo_codes (code, code_type, bonus_minutes, max_uses, is_active, expires_at)
VALUES 
    ('WELCOME30', 'special', 30, 100, TRUE, DATE_ADD(NOW(), INTERVAL 6 MONTH)),
    ('INVITE30', 'invite', 30, 1, TRUE, DATE_ADD(NOW(), INTERVAL 3 MONTH))
ON DUPLICATE KEY UPDATE code = code;

SELECT 'Promo codes migration completed successfully!' AS status;
