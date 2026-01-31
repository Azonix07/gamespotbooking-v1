-- Updates/News table for homepage announcements
CREATE TABLE IF NOT EXISTS shop_updates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('new_game', 'update', 'event', 'maintenance', 'offer', 'announcement') NOT NULL,
  image_url VARCHAR(500),
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_priority (priority),
  INDEX idx_active (is_active),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO shop_updates (title, description, category, priority, is_active) VALUES
('God of War Ragnarök Added!', 'Experience the epic Norse adventure with Kratos and Atreus. Now available on all PS5 stations!', 'new_game', 'high', TRUE),
('Weekend Gaming Marathon', 'Join us this Saturday for a 24-hour gaming marathon with special discounts and prizes!', 'event', 'high', TRUE),
('New Racing Simulators', 'Two brand new racing simulator setups with Logitech G923 wheels are now available for booking!', 'update', 'medium', TRUE),
('Holiday Membership Offer', 'Get 20% off on all membership plans! Limited time offer valid till Jan 15th.', 'offer', 'urgent', TRUE),
('Hogwarts Legacy Tournament', 'Sign up for our weekly Hogwarts Legacy competition. Winner gets free gaming hours!', 'event', 'medium', TRUE);
