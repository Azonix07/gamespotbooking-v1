-- Theme System Migration
-- Adds settings table for storing site-wide theme configuration

-- Create settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Insert default theme setting (purple/violet theme)
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('site_theme', 'theme-purple')
ON DUPLICATE KEY UPDATE setting_value = 'theme-purple';

-- Insert theme description
INSERT INTO site_settings (setting_key, setting_value) 
VALUES ('theme_description', 'Default purple/violet gradient theme')
ON DUPLICATE KEY UPDATE setting_value = 'Default purple/violet gradient theme';

-- Create index for faster lookups
CREATE INDEX idx_setting_key ON site_settings(setting_key);
