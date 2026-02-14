-- Clear all membership data for a fresh start
-- Run this on your Railway database to reset the membership system

-- Step 1: Clear all membership records (pending, active, expired, etc.)
DELETE FROM memberships;

-- Step 2: Reset auto-increment ID counter to start from 1
ALTER TABLE memberships AUTO_INCREMENT = 1;

-- Step 3: Clear membership references from bookings (optional - keeps booking history but removes membership linkage)
UPDATE bookings SET membership_id = NULL, membership_rate = 0 WHERE membership_id IS NOT NULL;

-- Step 4: Verify - should return 0 rows
SELECT COUNT(*) as total_memberships FROM memberships;

-- Done! All membership records cleared.
-- Users can now subscribe to the new membership plans (solo_quest, legend_mode, god_mode, ignition, turbo, apex)
