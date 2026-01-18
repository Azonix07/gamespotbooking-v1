-- GameSpot Web - Database Schema
-- MySQL 8.0+

-- Create database
CREATE DATABASE IF NOT EXISTS gamespot_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gamespot_booking;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS booking_devices;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS admin_users;

-- ============================================================================
-- Table: bookings
-- Stores all booking information
-- ============================================================================
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes IN (30, 60, 90, 120)),
    total_price DECIMAL(10,2) NOT NULL,
    driving_after_ps5 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_booking_date_time (booking_date, start_time),
    INDEX idx_booking_date (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: booking_devices
-- Stores which devices and players are booked for each booking
-- ============================================================================
CREATE TABLE booking_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    device_type ENUM('ps5', 'driving_sim') NOT NULL,
    device_number INT NULL COMMENT 'PS5 unit number (1, 2, or 3), NULL for driving_sim',
    player_count INT NOT NULL CHECK (player_count >= 1 AND player_count <= 4),
    price DECIMAL(10,2) NOT NULL,
    INDEX idx_booking_id (booking_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: admin_users
-- Stores admin credentials
-- ============================================================================
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Insert default admin user
-- Username: admin
-- Password: admin
-- ============================================================================
INSERT INTO admin_users (username, password_hash) VALUES 
('admin', '$2y$12$qbp46enymzBqm1aIBg2J2eVR7kcplJ15lviAk99WuHgb08QBROBXm');
-- The hash above is for password 'admin' (verified working)

-- ============================================================================
-- Sample data for testing (optional - can be removed in production)
-- ============================================================================

-- Sample booking 1: PS5 booking with 4 players for 1 hour
INSERT INTO bookings (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, driving_after_ps5) 
VALUES ('John Doe', '1234567890', '2025-12-26', '14:00:00', 60, 210, FALSE);

INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price) 
VALUES (1, 'ps5', 1, 4, 210);

-- Sample booking 2: PS5 + Driving Sim
INSERT INTO bookings (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, driving_after_ps5) 
VALUES ('Jane Smith', '0987654321', '2025-12-26', '16:00:00', 60, 280, TRUE);

INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price) 
VALUES 
(2, 'ps5', 2, 2, 150),
(2, 'driving_sim', NULL, 1, 170);

-- Sample booking 3: Multiple PS5 units
INSERT INTO bookings (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, driving_after_ps5) 
VALUES ('Bob Johnson', '5551234567', '2025-12-26', '18:00:00', 90, 610, FALSE);

INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price) 
VALUES 
(3, 'ps5', 1, 4, 270),
(3, 'ps5', 2, 3, 200),
(3, 'driving_sim', NULL, 1, 200);

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Verify tables created
SELECT 'Tables created successfully!' AS status;
SHOW TABLES;

-- Verify admin user
SELECT id, username, 'Password is hashed' AS password_status FROM admin_users;

-- Verify sample bookings
SELECT 
    b.id,
    b.customer_name,
    b.booking_date,
    b.start_time,
    b.duration_minutes,
    b.total_price,
    COUNT(bd.id) AS device_count
FROM bookings b
LEFT JOIN booking_devices bd ON b.id = bd.booking_id
GROUP BY b.id;

-- ============================================================================
-- Useful queries for development
-- ============================================================================

-- Get all bookings for a specific date with device details
-- SELECT 
--     b.*,
--     bd.device_type,
--     bd.device_number,
--     bd.player_count,
--     bd.price AS device_price
-- FROM bookings b
-- LEFT JOIN booking_devices bd ON b.id = bd.booking_id
-- WHERE b.booking_date = '2025-12-26'
-- ORDER BY b.start_time;

-- Check PS5 availability for a specific date and time
-- SELECT 
--     bd.device_number,
--     SUM(bd.player_count) AS total_players
-- FROM bookings b
-- JOIN booking_devices bd ON b.id = bd.booking_id
-- WHERE b.booking_date = '2025-12-26'
--   AND bd.device_type = 'ps5'
--   AND b.start_time = '14:00:00'
-- GROUP BY bd.device_number;
