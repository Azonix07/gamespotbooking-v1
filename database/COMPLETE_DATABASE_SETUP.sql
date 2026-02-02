-- ============================================================================
-- GAMESPOT BOOKING SYSTEM - COMPLETE DATABASE SETUP
-- Fresh database with all features included
-- ============================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS gamespot_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gamespot_booking;

-- Drop existing tables (fresh start)
DROP TABLE IF EXISTS points_history;
DROP TABLE IF EXISTS user_rewards;
DROP TABLE IF EXISTS instagram_shares;
DROP TABLE IF EXISTS booking_devices;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admin_users;

-- ============================================================================
-- USERS TABLE (Customer Accounts with Rewards)
-- ============================================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    profile_picture VARCHAR(500) DEFAULT NULL COMMENT 'Profile picture URL/path',
    
    -- Rewards System
    gamespot_points INT DEFAULT 0 COMMENT 'Loyalty points (50% of booking amount)',
    instagram_shares INT DEFAULT 0 COMMENT 'Instagram shares count (max 5)',
    free_playtime_minutes INT DEFAULT 0 COMMENT 'Free playtime from rewards',
    
    -- Password Reset
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL,
    
    -- OAuth
    google_id VARCHAR(255) NULL,
    apple_id VARCHAR(255) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_google_id (google_id),
    INDEX idx_apple_id (apple_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ADMIN USERS TABLE
-- ============================================================================
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin (username: admin, password: admin)
INSERT INTO admin_users (username, password_hash) VALUES 
('admin', '$2y$12$qbp46enymzBqm1aIBg2J2eVR7kcplJ15lviAk99WuHgb08QBROBXm');

-- ============================================================================
-- BOOKINGS TABLE (With User Association)
-- ============================================================================
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- User Association
    user_id INT NULL COMMENT 'NULL for guest bookings, user_id for logged-in users',
    
    -- Customer Info
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NULL,
    
    -- Booking Details
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes IN (30, 60, 90, 120)),
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Additional Options
    driving_after_ps5 BOOLEAN DEFAULT FALSE,
    
    -- Status
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'confirmed',
    
    -- Points Awarded
    points_awarded BOOLEAN DEFAULT FALSE COMMENT 'Track if points were given',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_booking_date_time (booking_date, start_time),
    INDEX idx_status (status),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- BOOKING DEVICES TABLE
-- ============================================================================
CREATE TABLE booking_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    device_type ENUM('ps5', 'driving_sim') NOT NULL,
    device_number INT NULL COMMENT 'PS5 unit number (1, 2, 3), NULL for driving_sim',
    player_count INT NOT NULL CHECK (player_count >= 1 AND player_count <= 4),
    price DECIMAL(10,2) NOT NULL,
    
    INDEX idx_booking_id (booking_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- MEMBERSHIPS TABLE
-- ============================================================================
CREATE TABLE memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_type ENUM('monthly', 'quarterly', 'annual') NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    discount_percentage INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- USER REWARDS TABLE (Redemption Tracking)
-- ============================================================================
CREATE TABLE user_rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reward_type VARCHAR(50) NOT NULL COMMENT 'ps5_extra_hour, vr_free_day, instagram_free_time',
    points_spent INT NOT NULL DEFAULT 0,
    reward_description TEXT,
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' COMMENT 'active, used, expired',
    used_at TIMESTAMP NULL,
    
    INDEX idx_user_rewards (user_id, status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- POINTS HISTORY TABLE (Track All Points Earned)
-- ============================================================================
CREATE TABLE points_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    booking_id INT NULL,
    points_earned INT NOT NULL,
    points_type VARCHAR(50) DEFAULT 'booking' COMMENT 'booking, bonus, referral, manual',
    booking_amount DECIMAL(10,2) NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_points_history (user_id, created_at),
    INDEX idx_booking_id (booking_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSTAGRAM SHARES TABLE (Track Share Progress)
-- ============================================================================
CREATE TABLE instagram_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    share_count INT DEFAULT 0,
    reward_claimed BOOLEAN DEFAULT FALSE,
    last_share_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_instagram_shares (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Sample User 1
INSERT INTO users (name, email, phone, password_hash, gamespot_points) VALUES
('Test User', 'test@gamespot.com', '9876543210', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqFqCcPO6C', 250);

-- Sample User 2  
INSERT INTO users (name, email, phone, password_hash, gamespot_points) VALUES
('John Doe', 'john@example.com', '9999999999', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqFqCcPO6C', 500);

-- Sample Booking for User 1 (₹500 booking)
INSERT INTO bookings (user_id, customer_name, customer_phone, customer_email, booking_date, start_time, duration_minutes, total_price, status, points_awarded) 
VALUES (1, 'Test User', '9876543210', 'test@gamespot.com', '2026-02-05', '14:00:00', 60, 500.00, 'completed', TRUE);

INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price) 
VALUES (1, 'ps5', 1, 4, 500.00);

-- Points awarded for booking (50% of ₹500 = 250 points)
INSERT INTO points_history (user_id, booking_id, points_earned, points_type, booking_amount, description)
VALUES (1, 1, 250, 'booking', 500.00, 'Earned 50% points from PS5 booking');

-- Sample Booking for User 2 (₹1000 booking)
INSERT INTO bookings (user_id, customer_name, customer_phone, customer_email, booking_date, start_time, duration_minutes, total_price, status, points_awarded) 
VALUES (2, 'John Doe', '9999999999', 'john@example.com', '2026-02-06', '16:00:00', 90, 1000.00, 'confirmed', TRUE);

INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price) 
VALUES (2, 'ps5', 2, 4, 700.00), (2, 'driving_sim', NULL, 1, 300.00);

-- Points for second booking (50% of ₹1000 = 500 points)
INSERT INTO points_history (user_id, booking_id, points_earned, points_type, booking_amount, description)
VALUES (2, 2, 500, 'booking', 1000.00, 'Earned 50% points from PS5 + Driving Sim booking');

-- Guest Booking (no user_id)
INSERT INTO bookings (user_id, customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, status) 
VALUES (NULL, 'Guest Customer', '8888888888', '2026-02-07', '18:00:00', 60, 300.00, 'confirmed');

INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price) 
VALUES (3, 'ps5', 3, 2, 300.00);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show all tables
SHOW TABLES;

-- Show users with their points
SELECT id, name, email, gamespot_points, instagram_shares, free_playtime_minutes, created_at 
FROM users;

-- Show all bookings with user info
SELECT 
    b.id,
    b.user_id,
    u.name as user_name,
    b.customer_name,
    b.booking_date,
    b.start_time,
    b.total_price,
    b.status,
    b.points_awarded
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
ORDER BY b.booking_date DESC;

-- Show points history
SELECT 
    ph.id,
    u.name as user_name,
    ph.points_earned,
    ph.booking_amount,
    ph.points_type,
    ph.description,
    ph.created_at
FROM points_history ph
JOIN users u ON ph.user_id = u.id
ORDER BY ph.created_at DESC;

-- ============================================================================
-- DATABASE SETUP COMPLETE!
-- ============================================================================
-- Features included:
-- ✅ User accounts with rewards (profile_picture, gamespot_points, instagram_shares)
-- ✅ Bookings linked to users (user_id column)
-- ✅ Guest bookings supported (user_id can be NULL)
-- ✅ Points history tracking
-- ✅ Rewards redemption tracking
-- ✅ Instagram share rewards
-- ✅ Admin access to all data
-- ✅ Users can only see their own bookings
-- ✅ Sample data included for testing
-- ============================================================================
