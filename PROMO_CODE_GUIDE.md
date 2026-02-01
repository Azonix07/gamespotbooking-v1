# Promo Code System - Setup & Usage Guide

## Overview
The promo code system allows users to generate and apply promotional codes that provide bonus gaming minutes. Currently configured for **30 minutes** of additional free time.

## Features
- ✅ Generate promo codes from Invite page
- ✅ Generate promo codes from Instagram promotion claims
- ✅ Apply promo codes during booking checkout
- ✅ Automatic validation (expiry, usage limits)
- ✅ Visual feedback on successful application
- ✅ Bonus minutes displayed in booking confirmation

## Database Setup

### 1. Run Migration Script

**On Windows (PowerShell):**
```powershell
.\setup_promo_codes.ps1
```

**On Linux/Mac (Bash):**
```bash
chmod +x setup_promo_codes.sh
./setup_promo_codes.sh
```

**Manual MySQL Setup:**
```bash
mysql -u root -p gamespot_booking < database/promo_codes_migration.sql
```

### 2. Verify Setup
```sql
-- Check if tables were created
SHOW TABLES LIKE 'promo_codes';

-- View sample promo codes
SELECT * FROM promo_codes;
```

## How It Works

### For Users

#### 1. Generate Promo Code (Invite Page)
1. Navigate to `/invite` page
2. Click on "Get Offers" card
3. Must be logged in to generate code
4. System generates a unique code (e.g., `PROMO12AB34CD`)
5. Code is valid for 90 days with 30 mins bonus

#### 2. Generate from Instagram Promotion
1. Navigate to `/get-offers` page
2. Follow the Instagram account
3. Share with required number of friends
4. Claim the promotion
5. Receive promo code automatically

#### 3. Apply Promo Code During Booking
1. Go through normal booking flow:
   - Select date & time
   - Choose devices (PS5/Racing Sim)
   - Proceed to Review & Confirm
2. In the "Review & Confirm" step:
   - Find "Have a Promo Code?" section
   - Enter your promo code
   - Click "Apply"
3. Success message shows: "Additional 30 mins added!"
4. Bonus minutes appear in booking confirmation

### For Developers

#### Backend API Endpoints

**Generate Promo Code**
```javascript
POST /api/promo/generate
Headers: { Authorization: Bearer <token> }
Body: {
  "type": "invite",           // or "instagram", "special"
  "bonus_minutes": 30,
  "max_uses": 1,
  "expires_days": 90
}
Response: {
  "success": true,
  "promo_code": {
    "id": 123,
    "code": "PROMO12AB34CD",
    "bonus_minutes": 30,
    "max_uses": 1,
    "expires_at": "2026-05-02T10:30:00Z"
  }
}
```

**Validate Promo Code**
```javascript
POST /api/promo/validate
Body: { "code": "PROMO12AB34CD" }
Response: {
  "success": true,
  "valid": true,
  "promo_code": {
    "id": 123,
    "code": "PROMO12AB34CD",
    "type": "invite",
    "bonus_minutes": 30
  }
}
```

**Get My Promo Codes**
```javascript
GET /api/promo/my-codes
Headers: { Authorization: Bearer <token> }
Response: {
  "success": true,
  "promo_codes": [
    {
      "id": 123,
      "code": "PROMO12AB34CD",
      "bonus_minutes": 30,
      "current_uses": 0,
      "max_uses": 1,
      "is_active": true,
      "expires_at": "2026-05-02T10:30:00Z"
    }
  ]
}
```

## Promo Code Configuration

### Default Settings
- **Bonus Minutes:** 30 minutes
- **Max Uses:** 1 (single use)
- **Expiry:** 90 days from creation
- **Types:** `invite`, `instagram`, `special`

### Modify Bonus Minutes
To change from 30 minutes to another value:

**Frontend (InvitePage.jsx):**
```javascript
bonus_minutes: 60,  // Change from 30 to 60
```

**Frontend (InstagramPromoPage.jsx):**
```javascript
bonus_minutes: activePromotion.discount_value,  // Uses promotion value
```

**Backend (promo_codes.py):**
```python
bonus_minutes = data.get('bonus_minutes', 60)  # Default to 60
```

## Database Schema

### promo_codes Table
```sql
CREATE TABLE promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    code_type ENUM('invite', 'instagram', 'special'),
    bonus_minutes INT DEFAULT 30,
    max_uses INT DEFAULT 1,
    current_uses INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### bookings Table Updates
```sql
ALTER TABLE bookings 
  ADD COLUMN promo_code_id INT NULL,
  ADD COLUMN bonus_minutes INT DEFAULT 0;
```

## Validation Rules

A promo code is valid if:
1. ✅ Code exists in database
2. ✅ `is_active = TRUE`
3. ✅ Not expired (`expires_at > NOW()`)
4. ✅ Usage limit not reached (`current_uses < max_uses`)

## Testing

### Test Codes
The migration creates sample codes:
- `WELCOME30` - 30 mins, 100 uses, 6 months validity
- `INVITE30` - 30 mins, 1 use, 3 months validity

### Manual Testing Steps
1. Login to the application
2. Go to `/invite` page
3. Click "Get Offers" to generate a code
4. Copy the generated code
5. Go to booking page and select devices
6. Enter code in "Review & Confirm" step
7. Click "Apply"
8. Verify success message shows bonus minutes
9. Complete booking
10. Check booking confirmation shows bonus minutes

## Troubleshooting

### "Invalid promo code" Error
- Check code spelling (codes are uppercase)
- Verify code exists: `SELECT * FROM promo_codes WHERE code = 'YOUR_CODE'`
- Check if code is active and not expired

### Code Not Generating
- Ensure user is logged in
- Check backend logs for errors
- Verify database connection
- Check if `promo_codes` table exists

### Bonus Minutes Not Showing
- Check if `bonus_minutes` column exists in `bookings` table
- Verify booking data includes `bonus_minutes` and `promo_code_id`
- Check browser console for JavaScript errors

## Future Enhancements

Potential improvements:
- Admin panel to manage promo codes
- Analytics dashboard for code usage
- Different bonus types (discount %, free device)
- User-specific promo codes
- Referral tracking system
- Email delivery of promo codes

## Support

For issues or questions:
1. Check backend logs: `backend/app.py`
2. Check browser console for frontend errors
3. Verify database schema matches migration
4. Test with sample codes first

---
**Last Updated:** February 1, 2026
**Version:** 1.0.0
