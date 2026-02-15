-- ============================================================================
-- Dedicated Game Request Migration
-- Adds dedicated_game columns to memberships table
-- These columns are auto-migrated by app.py on startup
-- ============================================================================

ALTER TABLE memberships ADD COLUMN dedicated_game VARCHAR(255) DEFAULT NULL;
ALTER TABLE memberships ADD COLUMN dedicated_game_status ENUM('none','pending','approved','rejected') DEFAULT 'none';
ALTER TABLE memberships ADD COLUMN game_request_date DATETIME DEFAULT NULL;

-- Verify
SELECT 'Dedicated game columns added' AS status;
