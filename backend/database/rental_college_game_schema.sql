-- ============================================
-- Rental, College Setup & Game Database Schema
-- Stores rental bookings, college event requests, and game leaderboard
-- ============================================

-- ============================================
-- 1. RENTAL BOOKINGS TABLE
-- Stores VR and PS5 rental requests
-- ============================================
CREATE TABLE IF NOT EXISTS rental_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Customer Information
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    delivery_address TEXT NOT NULL,
    
    -- Rental Details
    device_type ENUM('vr', 'ps5') NOT NULL DEFAULT 'vr',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_days INT NOT NULL,
    
    -- PS5 Specific
    extra_controllers INT DEFAULT 0,
    controller_cost DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Pricing
    package_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    savings DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status Management
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
    
    -- Tracking
    booking_id VARCHAR(50) UNIQUE,
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_device_type (device_type),
    INDEX idx_start_date (start_date),
    INDEX idx_status (status),
    INDEX idx_customer_phone (customer_phone),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. COLLEGE SETUP BOOKINGS TABLE
-- Stores college event and setup requests
-- ============================================
CREATE TABLE IF NOT EXISTS college_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Contact Person Information
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255),
    contact_position VARCHAR(100), -- e.g., "Student Council President"
    
    -- College Information
    college_name VARCHAR(255) NOT NULL,
    college_address TEXT NOT NULL,
    college_city VARCHAR(100),
    college_state VARCHAR(100),
    college_pincode VARCHAR(10),
    college_latitude DECIMAL(10, 8),
    college_longitude DECIMAL(11, 8),
    estimated_distance_km DECIMAL(8, 2),
    
    -- Event Details
    event_name VARCHAR(255), -- e.g., "Tech Fest 2026", "Annual Day"
    event_type VARCHAR(100), -- e.g., "Tech Fest", "Cultural Fest", "Sports Day"
    event_start_date DATE NOT NULL,
    event_end_date DATE NOT NULL,
    event_duration_days INT NOT NULL,
    expected_students INT,
    
    -- Setup Requirements
    setup_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'premium', 'custom'
    ps5_stations INT DEFAULT 4,
    vr_zones INT DEFAULT 2,
    driving_simulator BOOLEAN DEFAULT TRUE,
    additional_requirements TEXT,
    
    -- Pricing
    base_price DECIMAL(10, 2),
    transport_cost DECIMAL(10, 2),
    setup_cost DECIMAL(10, 2),
    total_estimated_cost DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    final_price DECIMAL(10, 2),
    
    -- Status Management
    status ENUM('inquiry', 'quote_sent', 'negotiating', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'inquiry',
    payment_status ENUM('pending', 'advance_paid', 'partially_paid', 'fully_paid', 'refunded') DEFAULT 'pending',
    payment_terms TEXT, -- e.g., "50% advance, 50% on completion"
    
    -- Tracking
    booking_reference VARCHAR(50) UNIQUE,
    inquiry_source VARCHAR(50), -- 'website', 'phone', 'email', 'referral'
    notes TEXT,
    admin_notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_college_name (college_name),
    INDEX idx_event_start_date (event_start_date),
    INDEX idx_status (status),
    INDEX idx_contact_phone (contact_phone),
    INDEX idx_created_at (created_at),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. GAME LEADERBOARD TABLE
-- Stores shooter game scores and player data
-- ============================================
CREATE TABLE IF NOT EXISTS game_leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Player Information
    player_name VARCHAR(50) NOT NULL,
    player_email VARCHAR(255),
    player_phone VARCHAR(20),
    
    -- Game Data
    score INT NOT NULL,
    enemies_shot INT DEFAULT 0,
    boss_enemies_shot INT DEFAULT 0,
    accuracy_percentage DECIMAL(5, 2) DEFAULT 0.00,
    game_duration_seconds INT DEFAULT 60,
    
    -- Game Session
    session_id VARCHAR(100),
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    
    -- Prize & Status
    is_winner BOOLEAN DEFAULT FALSE,
    prize_claimed BOOLEAN DEFAULT FALSE,
    prize_claim_date TIMESTAMP NULL,
    rank_position INT,
    
    -- Verification (to prevent cheating)
    is_verified BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    -- Tracking
    ip_address VARCHAR(45),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_score (score DESC),
    INDEX idx_player_name (player_name),
    INDEX idx_played_at (played_at),
    INDEX idx_is_winner (is_winner),
    INDEX idx_prize_claimed (prize_claimed),
    UNIQUE INDEX idx_player_session (player_name, session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. GAME WINNERS TABLE
-- Tracks monthly/weekly winners for prize distribution
-- ============================================
CREATE TABLE IF NOT EXISTS game_winners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Winner Information
    leaderboard_id INT NOT NULL,
    player_name VARCHAR(50) NOT NULL,
    player_email VARCHAR(255),
    player_phone VARCHAR(20) NOT NULL,
    
    -- Winner Details
    winning_score INT NOT NULL,
    winning_period ENUM('daily', 'weekly', 'monthly') DEFAULT 'monthly',
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Prize Details
    prize_description TEXT DEFAULT '30 minutes FREE gaming',
    prize_value DECIMAL(10, 2) DEFAULT 175.00, -- Half hour VR = ₹175
    
    -- Redemption
    redeemed BOOLEAN DEFAULT FALSE,
    redeemed_at TIMESTAMP NULL,
    redemption_booking_id INT,
    
    -- Verification
    verified_by_admin BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    admin_id INT,
    admin_notes TEXT,
    
    -- Tracking
    announced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (leaderboard_id) REFERENCES game_leaderboard(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_player_phone (player_phone),
    INDEX idx_period (period_start_date, period_end_date),
    INDEX idx_redeemed (redeemed),
    INDEX idx_announced_at (announced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. COLLEGE EVENT MEDIA TABLE
-- Stores photos/videos from completed college events
-- ============================================
CREATE TABLE IF NOT EXISTS college_event_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    college_booking_id INT NOT NULL,
    media_type ENUM('image', 'video', 'youtube') NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    caption TEXT,
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (college_booking_id) REFERENCES college_bookings(id) ON DELETE CASCADE,
    INDEX idx_college_booking (college_booking_id),
    INDEX idx_media_type (media_type),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Sample Rental Booking
INSERT INTO rental_bookings (
    customer_name, customer_phone, customer_email, delivery_address,
    device_type, start_date, end_date, rental_days,
    package_type, base_price, total_price,
    status, booking_id
) VALUES (
    'Rahul Sharma', '+91 98765 43210', 'rahul@email.com', '123 MG Road, Kodungallur, Kerala',
    'vr', '2026-02-01', '2026-02-07', 7,
    'weekly', 2100.00, 2100.00,
    'confirmed', CONCAT('RNT-', UNIX_TIMESTAMP())
);

-- Sample College Booking
INSERT INTO college_bookings (
    contact_name, contact_phone, contact_email,
    college_name, college_address, college_city, college_state,
    event_name, event_start_date, event_end_date, event_duration_days,
    expected_students, status, booking_reference
) VALUES (
    'Priya Kumar', '+91 99887 76655', 'priya@college.edu',
    'St. Thomas College', 'College Road, Thrissur', 'Thrissur', 'Kerala',
    'Tech Fest 2026', '2026-03-15', '2026-03-18', 4,
    600, 'inquiry', CONCAT('COL-', UNIX_TIMESTAMP())
);

-- Sample Game Score
INSERT INTO game_leaderboard (
    player_name, score, enemies_shot, boss_enemies_shot,
    accuracy_percentage, is_winner
) VALUES (
    'ProGamer123', 1250, 45, 8, 89.50, TRUE);

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD
-- ============================================

-- Active Rentals View
CREATE OR REPLACE VIEW active_rentals AS
SELECT 
    id, customer_name, customer_phone, device_type,
    start_date, end_date, rental_days, total_price,
    status, created_at
FROM rental_bookings
WHERE status IN ('pending', 'confirmed', 'in_progress')
ORDER BY start_date ASC;

-- Upcoming College Events View
CREATE OR REPLACE VIEW upcoming_college_events AS
SELECT 
    id, college_name, event_name, contact_name, contact_phone,
    event_start_date, event_end_date, expected_students,
    total_estimated_cost, status
FROM college_bookings
WHERE event_start_date >= CURDATE()
    AND status IN ('confirmed', 'in_progress')
ORDER BY event_start_date ASC;

-- Top Game Scores View
CREATE OR REPLACE VIEW top_game_scores AS
SELECT 
    player_name, score, enemies_shot, boss_enemies_shot,
    accuracy_percentage, played_at, is_winner
FROM game_leaderboard
WHERE is_verified = TRUE AND is_flagged = FALSE
ORDER BY score DESC
LIMIT 100;

-- Monthly Statistics View
CREATE OR REPLACE VIEW monthly_stats AS
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    'rentals' as category,
    COUNT(*) as count,
    SUM(total_price) as revenue
FROM rental_bookings
WHERE status != 'cancelled'
GROUP BY DATE_FORMAT(created_at, '%Y-%m')

UNION ALL

SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    'college_events' as category,
    COUNT(*) as count,
    SUM(final_price) as revenue
FROM college_bookings
WHERE status != 'cancelled'
GROUP BY DATE_FORMAT(created_at, '%Y-%m')

ORDER BY month DESC, category;

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Auto-generate booking_id for rentals
DELIMITER //
CREATE TRIGGER before_rental_insert
BEFORE INSERT ON rental_bookings
FOR EACH ROW
BEGIN
    IF NEW.booking_id IS NULL THEN
        SET NEW.booking_id = CONCAT('RNT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(LAST_INSERT_ID(), 6, '0'));
    END IF;
END//
DELIMITER ;

-- Auto-generate booking_reference for colleges
DELIMITER //
CREATE TRIGGER before_college_insert
BEFORE INSERT ON college_bookings
FOR EACH ROW
BEGIN
    IF NEW.booking_reference IS NULL THEN
        SET NEW.booking_reference = CONCAT('COL-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(LAST_INSERT_ID(), 6, '0'));
    END IF;
END//
DELIMITER ;

-- Update rank_position in game_leaderboard
DELIMITER //
CREATE TRIGGER after_game_score_insert
AFTER INSERT ON game_leaderboard
FOR EACH ROW
BEGIN
    UPDATE game_leaderboard SET rank_position = (
        SELECT COUNT(*) + 1
        FROM (SELECT score FROM game_leaderboard WHERE is_verified = TRUE) AS ranks
        WHERE score > NEW.score
    )
    WHERE id = NEW.id;
END//
DELIMITER ;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Get rental statistics
DELIMITER //
CREATE PROCEDURE get_rental_stats()
BEGIN
    SELECT 
        COUNT(*) as total_rentals,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN device_type = 'vr' THEN 1 ELSE 0 END) as vr_rentals,
        SUM(CASE WHEN device_type = 'ps5' THEN 1 ELSE 0 END) as ps5_rentals,
        SUM(total_price) as total_revenue,
        AVG(rental_days) as avg_rental_days
    FROM rental_bookings
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
END//
DELIMITER ;

-- Get college event statistics
DELIMITER //
CREATE PROCEDURE get_college_stats()
BEGIN
    SELECT 
        COUNT(*) as total_inquiries,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_events,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_events,
        SUM(expected_students) as total_students_reached,
        SUM(final_price) as total_revenue,
        AVG(event_duration_days) as avg_event_duration
    FROM college_bookings
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY);
END//
DELIMITER ;

-- Get game leaderboard with rankings
DELIMITER //
CREATE PROCEDURE get_game_leaderboard(IN limit_count INT)
BEGIN
    SELECT 
        @rank := @rank + 1 AS rank,
        player_name,
        score,
        enemies_shot,
        boss_enemies_shot,
        accuracy_percentage,
        played_at,
        is_winner,
        prize_claimed
    FROM game_leaderboard, (SELECT @rank := 0) r
    WHERE is_verified = TRUE AND is_flagged = FALSE
    ORDER BY score DESC
    LIMIT limit_count;
END//
DELIMITER ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes
CREATE INDEX idx_rental_date_status ON rental_bookings(start_date, status);
CREATE INDEX idx_college_event_date_status ON college_bookings(event_start_date, status);
CREATE INDEX idx_game_score_verified ON game_leaderboard(score DESC, is_verified, is_flagged);

-- Full-text search indexes
ALTER TABLE college_bookings ADD FULLTEXT INDEX ft_college_search (college_name, college_address, event_name);
ALTER TABLE rental_bookings ADD FULLTEXT INDEX ft_rental_search (customer_name, delivery_address);

-- ============================================
-- DONE! Schema is ready for use
-- ============================================
