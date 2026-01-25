-- Insert Active Instagram Promotion
-- Win 30 Minutes FREE Gaming by Following @gamespot_kdlr

USE gamespot_booking;

-- Insert the promotion
INSERT INTO instagram_promotions (
    campaign_name,
    instagram_handle,
    discount_type,
    discount_value,
    required_friends_count,
    max_redemptions_per_user,
    start_date,
    end_date,
    terms_conditions,
    is_active
) VALUES (
    'Win 30 Minutes FREE Gaming!',
    '@gamespot_kdlr',
    'free_minutes',
    30.00,
    2,
    1,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 90 DAY),
    '1. You must follow @gamespot_kdlr on Instagram\n2. Share our profile with at least 2 friends\n3. Provide their Instagram handles when claiming\n4. The 30-minute discount will be automatically applied when you book\n5. This promotion can only be claimed once per user\n6. Admin verification required before redemption\n7. Valid for 90 days from claim date',
    1
);

-- Verify the promotion was created
SELECT 
    id,
    campaign_name,
    instagram_handle,
    discount_type,
    discount_value,
    required_friends_count,
    is_active,
    start_date,
    end_date
FROM instagram_promotions
WHERE is_active = 1
ORDER BY created_at DESC
LIMIT 1;
