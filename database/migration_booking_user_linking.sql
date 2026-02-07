-- ============================================================================
-- BOOKING ↔ USER LINKING MIGRATION
-- Run this in Railway MySQL Query Console
-- 
-- This migration:
-- 1. Adds user_id column to bookings (if missing)
-- 2. Adds status and points_awarded columns (if missing)
-- 3. Adds index on customer_phone for fast phone-based lookups
-- 4. Links existing guest bookings to registered users by matching phone
-- 5. Awards retroactive points for linked bookings
-- ============================================================================

-- Step 1: Add missing columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id INT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS points_awarded BOOLEAN DEFAULT FALSE;

-- Step 2: Add indexes for performance
-- Index on customer_phone for matching guest bookings to users
CREATE INDEX IF NOT EXISTS idx_customer_phone ON bookings (customer_phone);
-- Index on user_id for profile page booking history
CREATE INDEX IF NOT EXISTS idx_user_id ON bookings (user_id);

-- Step 3: Link existing guest bookings to registered users by phone number
-- This updates all bookings where user_id is NULL but we can match customer_phone to a user
UPDATE bookings b
INNER JOIN users u ON b.customer_phone = u.phone
SET b.user_id = u.id
WHERE b.user_id IS NULL;

-- Step 4: Award retroactive points for linked bookings
-- Insert points_history records for bookings that now have a user_id but no points awarded
INSERT INTO points_history (user_id, booking_id, points_earned, points_type, booking_amount)
SELECT 
    b.user_id,
    b.id,
    FLOOR(b.total_price * 0.50),
    'booking',
    b.total_price
FROM bookings b
WHERE b.user_id IS NOT NULL 
  AND b.points_awarded = FALSE
  AND b.total_price > 0;

-- Update user points totals
UPDATE users u
SET u.gamespot_points = u.gamespot_points + (
    SELECT COALESCE(SUM(FLOOR(b.total_price * 0.50)), 0)
    FROM bookings b
    WHERE b.user_id = u.id AND b.points_awarded = FALSE AND b.total_price > 0
)
WHERE u.id IN (
    SELECT DISTINCT user_id FROM bookings WHERE user_id IS NOT NULL AND points_awarded = FALSE
);

-- Mark all linked bookings as points_awarded
UPDATE bookings SET points_awarded = TRUE WHERE user_id IS NOT NULL AND points_awarded = FALSE;

-- ============================================================================
-- VERIFICATION QUERIES (run these to check the results)
-- ============================================================================

-- Check how many bookings were linked
-- SELECT COUNT(*) as linked_bookings FROM bookings WHERE user_id IS NOT NULL;

-- Check unlinked guest bookings (no matching user account)
-- SELECT customer_name, customer_phone, COUNT(*) as booking_count 
-- FROM bookings WHERE user_id IS NULL 
-- GROUP BY customer_name, customer_phone;

-- Check user points
-- SELECT u.name, u.phone, u.gamespot_points, COUNT(b.id) as total_bookings
-- FROM users u LEFT JOIN bookings b ON b.user_id = u.id
-- GROUP BY u.id ORDER BY u.gamespot_points DESC;
