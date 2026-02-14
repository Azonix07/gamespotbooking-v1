-- ============================================================================
-- Membership V2 Migration
-- Adds hours tracking, changes plan_type to VARCHAR for new plan names
-- Run this on your Railway MySQL database
-- ============================================================================

-- Step 1: Change plan_type from ENUM to VARCHAR to support new plan names
ALTER TABLE memberships MODIFY COLUMN plan_type VARCHAR(50) NOT NULL DEFAULT 'solo_quest';

-- Step 2: Add hours tracking columns
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS total_hours DECIMAL(6,2) NOT NULL DEFAULT 0
    COMMENT 'Total hours included in plan',
  ADD COLUMN IF NOT EXISTS hours_used DECIMAL(6,2) NOT NULL DEFAULT 0
    COMMENT 'Hours used so far this period';

-- Step 3: Add membership_id to bookings for tracking which membership was used
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS membership_id INT NULL DEFAULT NULL
    COMMENT 'Membership used for this booking (NULL = no membership)',
  ADD COLUMN IF NOT EXISTS membership_rate TINYINT(1) NOT NULL DEFAULT 0
    COMMENT 'Whether membership rate was applied';

-- Step 4: Update any existing active memberships with correct total_hours
-- (based on plan type from VALID_PLANS)
UPDATE memberships SET total_hours = 10 WHERE plan_type IN ('solo_quest', 'ignition') AND total_hours = 0;
UPDATE memberships SET total_hours = 20 WHERE plan_type IN ('legend_mode', 'turbo') AND total_hours = 0;
UPDATE memberships SET total_hours = 40 WHERE plan_type IN ('god_mode', 'apex') AND total_hours = 0;

-- Verify
SELECT 'Migration complete' AS status;
