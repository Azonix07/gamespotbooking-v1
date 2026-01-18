-- ============================================================================
-- GAMESPOT DATABASE SCHEMA FOR RAILWAY (COMPLETE)
-- ============================================================================

-- Table: admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: users (customer accounts)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NULL,
    user_id INT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    driving_after_ps5 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: booking_devices
CREATE TABLE IF NOT EXISTS booking_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    device_type VARCHAR(20) NOT NULL,
    device_number INT NULL,
    player_count INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Table: memberships
CREATE TABLE IF NOT EXISTS memberships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    discount_percentage INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: games
CREATE TABLE IF NOT EXISTS games (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    platform VARCHAR(50) DEFAULT 'PS5',
    ps5_number INT NULL,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: game_recommendations
CREATE TABLE IF NOT EXISTS game_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_name VARCHAR(255) NOT NULL,
    description TEXT,
    recommended_by VARCHAR(100),
    user_id INT NULL,
    votes INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: game_votes
CREATE TABLE IF NOT EXISTS game_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recommendation_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (recommendation_id, session_id)
);

-- Table: game_scores (for discount game)
CREATE TABLE IF NOT EXISTS game_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    enemies_shot INT DEFAULT 0,
    boss_enemies_shot INT DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    game_duration_seconds INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: game_leaderboard
CREATE TABLE IF NOT EXISTS game_leaderboard (
    id INT PRIMARY KEY AUTO_INCREMENT,
    player_name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    game_type VARCHAR(50) DEFAULT 'discount_game',
    enemies_shot INT DEFAULT 0,
    boss_enemies_shot INT DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0,
    duration_seconds INT DEFAULT 60,
    is_winner BOOLEAN DEFAULT FALSE,
    prize_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: game_winners
CREATE TABLE IF NOT EXISTS game_winners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    leaderboard_id INT NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    prize_type VARCHAR(50) DEFAULT 'free_gaming',
    prize_value DECIMAL(10,2) DEFAULT 0,
    claimed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: rental_bookings
CREATE TABLE IF NOT EXISTS rental_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255) NULL,
    rental_type VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: college_bookings
CREATE TABLE IF NOT EXISTS college_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    college_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NULL,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    expected_attendees INT DEFAULT 50,
    requirements TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: college_event_media
CREATE TABLE IF NOT EXISTS college_event_media (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    media_type VARCHAR(20) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: updates (for news/announcements - legacy)
CREATE TABLE IF NOT EXISTS updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'update',
    priority VARCHAR(20) DEFAULT 'normal',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: shop_updates (news/announcements - new)
CREATE TABLE IF NOT EXISTS shop_updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'update',
    priority VARCHAR(20) DEFAULT 'normal',
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: feedback (legacy)
CREATE TABLE IF NOT EXISTS feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_feedback
CREATE TABLE IF NOT EXISTS user_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    rating INT DEFAULT 5,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: page_visits (analytics)
CREATE TABLE IF NOT EXISTS page_visits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    page VARCHAR(255) NOT NULL,
    referrer VARCHAR(500) NULL,
    user_agent VARCHAR(500) NULL,
    ip_address VARCHAR(45) NULL,
    session_id VARCHAR(255) NULL,
    user_id INT NULL,
    device_type VARCHAR(50) DEFAULT 'desktop',
    browser VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: site_settings
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default admin (password: 9645136006)
INSERT INTO admin_users (username, password_hash) 
SELECT 'admin', '$2b$12$98Li8bi7umLkDpvZdMWXxuczmYDKKKexeTk8xRwOv3JUQ48BA93uy'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');

-- Insert default theme
INSERT INTO site_settings (setting_key, setting_value) 
SELECT 'theme', 'theme-purple'
WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE setting_key = 'theme');

-- Sample games
INSERT IGNORE INTO games (name, description, genre, platform, ps5_number, is_available) VALUES
('FIFA 25', 'Latest football simulation game', 'Sports', 'PS5', 1, TRUE),
('Call of Duty: Modern Warfare III', 'First-person shooter', 'Action', 'PS5', 1, TRUE),
('Spider-Man 2', 'Open world superhero adventure', 'Action-Adventure', 'PS5', 2, TRUE),
('Gran Turismo 7', 'Racing simulation', 'Racing', 'PS5', 2, TRUE),
('God of War Ragnarok', 'Action-adventure epic', 'Action-Adventure', 'PS5', 3, TRUE),
('Hogwarts Legacy', 'Open world RPG in Harry Potter universe', 'RPG', 'PS5', 3, TRUE);

-- Verify tables
SHOW TABLES;
