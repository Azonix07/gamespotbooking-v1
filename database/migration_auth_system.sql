-- ============================================================================
-- Authentication System Migration
-- Adds users, memberships tables and updates bookings with user_id
-- ============================================================================

USE gamespot_booking;

-- ============================================================================
-- Table: users
-- Stores customer accounts (NOT admin users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: memberships
-- Stores customer membership subscriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_type ENUM('monthly', 'quarterly', 'annual') NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    discount_percentage INT NOT NULL DEFAULT 10 COMMENT 'Percentage discount (e.g., 10 for 10%)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Update bookings table: Add optional user_id and email
-- ============================================================================

-- Add user_id column if not exists
SET @col_exists_user_id = (SELECT COUNT(*) 
                           FROM information_schema.COLUMNS 
                           WHERE TABLE_SCHEMA = 'gamespot_booking' 
                           AND TABLE_NAME = 'bookings' 
                           AND COLUMN_NAME = 'user_id');

SET @query_user_id = IF(@col_exists_user_id = 0,
    'ALTER TABLE bookings ADD COLUMN user_id INT NULL COMMENT "NULL for guest bookings, user_id for logged-in users"',
    'SELECT "user_id column already exists" AS message'
);

PREPARE stmt FROM @query_user_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add customer_email column if not exists
SET @col_exists_email = (SELECT COUNT(*) 
                         FROM information_schema.COLUMNS 
                         WHERE TABLE_SCHEMA = 'gamespot_booking' 
                         AND TABLE_NAME = 'bookings' 
                         AND COLUMN_NAME = 'customer_email');

SET @query_email = IF(@col_exists_email = 0,
    'ALTER TABLE bookings ADD COLUMN customer_email VARCHAR(255) NULL COMMENT "Customer email for communication"',
    'SELECT "customer_email column already exists" AS message'
);

PREPARE stmt FROM @query_email;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on user_id if not exists
SET @idx_exists = (SELECT COUNT(*) 
                   FROM information_schema.STATISTICS 
                   WHERE TABLE_SCHEMA = 'gamespot_booking' 
                   AND TABLE_NAME = 'bookings' 
                   AND INDEX_NAME = 'idx_user_id');

SET @query_idx = IF(@idx_exists = 0,
    'ALTER TABLE bookings ADD INDEX idx_user_id (user_id)',
    'SELECT "idx_user_id already exists" AS message'
);

PREPARE stmt FROM @query_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint (if not exists)
SET @fk_exists = (SELECT COUNT(*) 
                  FROM information_schema.TABLE_CONSTRAINTS 
                  WHERE CONSTRAINT_SCHEMA = 'gamespot_booking' 
                  AND TABLE_NAME = 'bookings' 
                  AND CONSTRAINT_NAME = 'fk_bookings_user_id');

SET @query_fk = IF(@fk_exists = 0,
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "fk_bookings_user_id constraint already exists" AS message'
);

PREPARE stmt FROM @query_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Insert sample users for testing
-- ============================================================================
-- Password for all test users: 'password123'
-- Hash generated using: bcrypt.hashpw(b'password123', bcrypt.gensalt())
INSERT IGNORE INTO users (name, email, phone, password_hash) VALUES 
('Test User', 'test@example.com', '9876543210', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqgOX8/v0G'),
('John Customer', 'john@example.com', '9876543211', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqgOX8/v0G');

-- ============================================================================
-- Insert sample membership for testing
-- ============================================================================
INSERT IGNORE INTO memberships (user_id, plan_type, start_date, end_date, status, discount_percentage) VALUES 
(1, 'monthly', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'active', 15);

-- ============================================================================
-- Verification queries
-- ============================================================================
SELECT 'Users table created successfully' AS message;
SELECT COUNT(*) AS user_count FROM users;

SELECT 'Memberships table created successfully' AS message;
SELECT COUNT(*) AS membership_count FROM memberships;

SELECT 'Bookings table updated successfully' AS message;
DESCRIBE bookings;

-- Show active memberships
SELECT 
    u.name,
    u.email,
    m.plan_type,
    m.start_date,
    m.end_date,
    m.status,
    m.discount_percentage,
    DATEDIFF(m.end_date, CURDATE()) AS days_remaining
FROM users u
JOIN memberships m ON u.id = m.user_id
WHERE m.status = 'active';
