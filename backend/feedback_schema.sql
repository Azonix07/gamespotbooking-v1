-- User Feedback/Suggestions Table
CREATE TABLE IF NOT EXISTS user_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('suggestion', 'bug', 'query', 'feature', 'other') NOT NULL,
    message TEXT NOT NULL,
    name VARCHAR(255) DEFAULT 'Anonymous',
    email VARCHAR(255) DEFAULT '',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'reviewed', 'resolved', 'closed') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
