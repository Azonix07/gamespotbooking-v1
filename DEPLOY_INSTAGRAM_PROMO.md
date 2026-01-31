# 🚀 Deploy Instagram Promotion to Railway

## ✅ Promotion Created Locally

The Instagram promotion has been successfully created in your **local database**:

- **Campaign**: Win 30 Minutes FREE Gaming!
- **Instagram Handle**: @gamespot_kdlr
- **Required Friends**: 2
- **Discount**: 30 minutes FREE
- **Valid**: 90 days (until April 25, 2026)
- **One-time per user**: Yes

## 🎯 Next Steps: Add to Railway Production Database

You have **2 options** to add this promotion to your Railway database:

---

### **Option 1: Railway Dashboard (Recommended - Easy)**

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select your project** → Click on **MySQL database service**
3. **Click "Data" tab** (or "Query" / "Console")
4. **Paste this SQL** and execute:

```sql
USE gamespot_booking;

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
```

5. **Verify** with:
```sql
SELECT * FROM instagram_promotions WHERE is_active = 1;
```

---

### **Option 2: MySQL CLI (If you have Railway MySQL credentials)**

1. **Get your Railway MySQL credentials**:
   - Go to Railway → MySQL service → Variables tab
   - Find: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

2. **Connect via terminal**:
```bash
mysql -h <MYSQL_HOST> -u <MYSQL_USER> -p<MYSQL_PASSWORD> <MYSQL_DATABASE> < database/insert_instagram_promotion.sql
```

---

### **Option 3: Backend Migration Script (Advanced)**

Create an admin API endpoint to run migrations from the backend.

---

## 🔍 How to Verify It's Working

After adding the promotion to Railway database:

1. **Visit your live website**: https://your-site.railway.app
2. **Navigate to**: /win-free-game
3. **You should see**: The promotion page with "Win 30 Minutes FREE Gaming!"
4. **If logged in**: You can claim the promotion
5. **If not logged in**: You see the promotion details + login button

---

## 📊 What Happens Next

Once a user claims the promotion:

1. ✅ User logs in
2. ✅ Fills Instagram username + 2 friend handles
3. ✅ Gets unique redemption code (INSTA-XXXX-XXXX)
4. ✅ Admin verifies their Instagram follow/share
5. ✅ When user books, 30-min discount auto-applies
6. ✅ Redemption marked as "used" (one-time only)

---

## 🛠️ Current Status

- ✅ Local database: Promotion created
- ⏳ **Railway database: Needs manual SQL execution (see Option 1 above)**
- ✅ Backend API: Ready (all endpoints working)
- ✅ Frontend: Ready (page displays promotion)
- ✅ Admin verification: System in place

**Action Required**: Execute the SQL in Railway Dashboard to activate the promotion in production! 🚀
