-- Analytics Database Schema
-- Track visitor data and page views

CREATE TABLE IF NOT EXISTS page_visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    referrer TEXT,
    visit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visit_time (visit_time),
    INDEX idx_page (page),
    INDEX idx_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for better query performance
ALTER TABLE page_visits ADD INDEX idx_date (DATE(visit_time));
