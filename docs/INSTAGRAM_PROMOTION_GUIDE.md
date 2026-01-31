# Instagram Promotion System Implementation Guide

## Overview
Complete implementation of Instagram follow/share promotion system where users can win 30 minutes of FREE gaming by following GameSpot's Instagram account and sharing with 2 friends.

## Features Implemented

### 1. **Database Schema** (`migration_instagram_promotion.sql`)
- `instagram_promotions` table - Manages promotion campaigns
- `user_instagram_redemptions` table - Tracks user claims and redemptions
- Updated `bookings` table with discount tracking fields
- One-time redemption per user per promotion
- Automatic expiry after 30 days

### 2. **Backend API** (`instagram_promotion.py`)

#### Public Endpoints:
- `GET /api/instagram-promo/active` - Get active promotions
  
#### User Endpoints (Login Required):
- `GET /api/instagram-promo/check-eligibility` - Check if user can claim
- `POST /api/instagram-promo/claim` - Claim the promotion
- `GET /api/instagram-promo/my-redemptions` - View user's redemptions
- `POST /api/instagram-promo/validate-code` - Validate redemption code for booking

#### Admin Endpoints (Admin Login Required):
- `GET /api/admin/instagram-promo/redemptions` - View all redemptions
- `PUT /api/admin/instagram-promo/verify/:id` - Verify/reject redemption

### 3. **Frontend** (`InstagramPromoPage.jsx`)

#### Key Features:
- **Login Gate** - Must be logged in to access
- **Eligibility Check** - Shows if user can claim
- **Step-by-Step Guide** - Clear instructions to follow
- **Claim Form** - Collect Instagram username and friend handles
- **Status Display** - Shows redemption code and status
- **Responsive Design** - Works on all devices

### 4. **Auto-Discount Application**
When a logged-in user with valid Instagram promotion books:
- Backend checks for unused redemptions
- Applies 30-minute free gaming automatically
- Marks redemption as used
- Links to booking record

## User Flow

```
1. User clicks "Win Free Game" in navbar
   ↓
2. Must login/signup (redirected if not logged in)
   ↓
3. View promotion details and requirements:
   - Follow @gamespot_kdlr on Instagram
   - Share with 2 friends
   ↓
4. Click "Claim Now" button
   ↓
5. Fill form with:
   - Instagram username
   - Friend 1 Instagram handle
   - Friend 2 Instagram handle
   ↓
6. Submit claim
   ↓
7. Receive unique redemption code (e.g., INSTA-AB3K-9F2L)
   ↓
8. Status: "Verified" (auto-approved)
   ↓
9. Go to booking page
   ↓
10. Discount automatically applied when booking
   ↓
11. Redemption marked as "Used"
   ↓
12. Cannot claim again (one-time per user)
```

## Database Tables

### instagram_promotions
- `id` - Primary key
- `campaign_name` - "Follow & Share - Win 30 Min Free Gaming"
- `instagram_handle` - "@gamespot_kdlr"
- `discount_type` - 'free_minutes'
- `discount_value` - 30 (minutes)
- `required_friends_count` - 2
- `max_redemptions_per_user` - 1
- `is_active` - TRUE
- `start_date` / `end_date` - Campaign duration

### user_instagram_redemptions
- `id` - Primary key
- `user_id` - Foreign key to users
- `promotion_id` - Foreign key to instagram_promotions
- `instagram_username` - User's Instagram handle
- `shared_with_friends` - Comma-separated friend handles
- `verification_status` - 'pending', 'verified', 'rejected'
- `redemption_code` - Unique code (INSTA-XXXX-XXXX)
- `is_used` - Whether discount has been applied
- `used_booking_id` - Link to booking
- `expires_at` - 30 days from creation

### bookings (updated fields)
- `instagram_redemption_id` - Link to redemption
- `discount_amount` - Amount discounted
- `discount_type` - 'instagram_promo'

## Admin Features

Admins can:
- View all redemptions
- Filter by status (pending/verified/rejected)
- Verify or reject claims
- See statistics (total, used, pending)
- Check if user genuinely followed Instagram

## Security Features

1. **Login Required** - Must be authenticated
2. **One-Time Use** - Cannot claim multiple times
3. **Unique Codes** - Each redemption has unique code
4. **Expiry** - Codes expire after 30 days
5. **Verification Status** - Admin can reject fraudulent claims
6. **Database Constraints** - UNIQUE constraint on (user_id, promotion_id)

## Setup Instructions

### 1. Run Database Migration
```bash
mysql -u root -p gamespot_booking < database/migration_instagram_promotion.sql
```

### 2. Register Blueprint in Flask App
Already added in `backend/app.py`:
```python
from routes.instagram_promotion import instagram_promo_bp
app.register_blueprint(instagram_promo_bp)
```

### 3. Frontend Routes
Already added in `frontend/src/App.js`:
```javascript
<Route path="/win-free-game" element={<InstagramPromoPage />} />
<Route path="/instagram-promo" element={<InstagramPromoPage />} />
```

### 4. Update Navbar Links
Already updated in `frontend/src/components/Navbar.jsx`:
```javascript
onClick={() => navigate('/win-free-game')}
```

## Testing

### Test User Flow:
1. Login as user
2. Go to `/win-free-game`
3. Follow Instagram (manually verify)
4. Share with 2 friends
5. Fill claim form
6. Receive code
7. Go to booking
8. Verify discount applied

### Test Admin Flow:
1. Login as admin
2. Go to admin dashboard
3. View Instagram redemptions
4. Verify/reject claims
5. Check statistics

## Booking Integration

When user books with Instagram promo:
```javascript
// Check for active Instagram redemption
const redemption = await checkInstagramRedemption(user_id);

if (redemption && !redemption.is_used) {
  // Apply 30-minute free discount
  const freeMinutes = redemption.discount_value; // 30
  // Adjust booking price
  finalPrice = calculateWithDiscount(basePrice, freeMinutes);
  
  // Mark redemption as used
  await markRedemptionAsUsed(redemption.id, booking.id);
}
```

## Analytics

Track:
- Total claims
- Verified vs rejected
- Used vs unused
- Most active users
- Conversion rate (claims → bookings)

## Future Enhancements

1. **Instagram API Integration** - Auto-verify follows
2. **Screenshot Upload** - User uploads share proof
3. **Multiple Campaigns** - Run different promotions
4. **Referral Tracking** - Track which friends signed up
5. **Email Notifications** - Send code via email
6. **SMS Integration** - Send code via SMS

## API Examples

### Claim Promotion
```bash
curl -X POST http://localhost:8000/api/instagram-promo/claim \
  -H "Content-Type: application/json" \
  -H "Cookie: gamespot_session=..." \
  -d '{
    "promotion_id": 1,
    "instagram_username": "john_gamer",
    "shared_with_friends": ["friend1", "friend2"]
  }'
```

### Response:
```json
{
  "success": true,
  "message": "Instagram promotion claimed successfully!",
  "redemption": {
    "id": 123,
    "redemption_code": "INSTA-AB3K-9F2L",
    "discount_type": "free_minutes",
    "discount_value": 30,
    "expires_at": "2026-02-24T10:30:00",
    "verification_status": "verified"
  }
}
```

## Notes

- Default campaign created automatically during migration
- Instagram handle: @gamespot_kdlr
- Discount: 30 minutes FREE
- Required friends: 2
- Max claims per user: 1
- Expiry: 30 days
- Auto-verified (change to 'pending' for manual verification)

## Files Created/Modified

### Created:
1. `/database/migration_instagram_promotion.sql`
2. `/backend/routes/instagram_promotion.py`
3. `/backend/middleware/auth.py` (updated with decorators)
4. `/frontend/src/pages/InstagramPromoPage.jsx`
5. `/frontend/src/styles/InstagramPromoPage.css`
6. `/docs/INSTAGRAM_PROMOTION_GUIDE.md` (this file)

### Modified:
1. `/backend/app.py` - Added blueprint registration
2. `/frontend/src/App.js` - Added routes
3. `/frontend/src/components/Navbar.jsx` - Updated link

---

## Support

For issues or questions:
- Backend API: Check `/backend/routes/instagram_promotion.py`
- Frontend: Check `/frontend/src/pages/InstagramPromoPage.jsx`
- Database: Check `/database/migration_instagram_promotion.sql`

---

**Implementation Complete!** 🎉
