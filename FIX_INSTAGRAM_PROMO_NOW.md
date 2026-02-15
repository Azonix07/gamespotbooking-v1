# 🚨 URGENT: Instagram Promotion Not Showing - FIX NOW

## Problem
Your website shows: "No Active Promotions - There are currently no active Instagram promotions."

## Root Cause
The `instagram_promotions` table doesn't exist in Railway database.

## ✅ SOLUTION (Follow these exact steps):

### Step 1: Open Railway Dashboard
1. Go to: **https://railway.app/dashboard**
2. Login if needed
3. Find your project: **gamespotbooking-v1** (or your project name)

### Step 2: Access MySQL Database
1. Click on the **MySQL** service (purple database icon)
2. Look for tabs at top: Overview, Variables, **Data**, Settings
3. Click the **"Data"** tab

### Step 3: Open Query Console
1. In the Data tab, you should see:
   - List of tables on left (users, bookings, etc.)
   - A **"Query"** button or SQL input area
2. Click **"Query"** or look for SQL editor

### Step 4: Run the SQL
1. Open this file in your GitHub repo:
   ```
   database/RAILWAY_RUN_THIS.sql
   ```
   
2. **Copy ALL the SQL code** from that file

3. **Paste it** into Railway's query console

4. **Click "Execute"** or "Run" button

5. **Wait for success message**: "SUCCESS! Promotion Created:"

### Step 5: Verify It Worked
1. Open new browser tab
2. Go to: `https://gamespotkdlr.com/api/instagram-promo/active`
3. You should see JSON with promotion data (not an error)

### Step 6: Check Your Website
1. Go to your live website
2. Navigate to: **/win-free-game**
3. You should now see: **"Win 30 Minutes FREE Gaming!"** 🎉

---

## 🆘 Still Not Working?

### Option A: Manual Table Creation
If Railway query doesn't work, try creating tables one by one:

**First, create table:**
```sql
CREATE TABLE instagram_promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name VARCHAR(100) NOT NULL,
    instagram_handle VARCHAR(100) NOT NULL DEFAULT '@gamespot_kdlr',
    discount_type ENUM('fixed_amount', 'percentage', 'free_minutes') NOT NULL DEFAULT 'free_minutes',
    discount_value DECIMAL(10,2) NOT NULL,
    required_friends_count INT NOT NULL DEFAULT 2,
    max_redemptions_per_user INT NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    terms_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Then insert promotion:**
```sql
INSERT INTO instagram_promotions (
    campaign_name, instagram_handle, discount_type, discount_value,
    required_friends_count, max_redemptions_per_user, start_date, end_date, is_active
) VALUES (
    'Win 30 Minutes FREE Gaming!', '@gamespot_kdlr', 'free_minutes', 30.00,
    2, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), 1
);
```

### Option B: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Connect to database
railway run mysql -u root -p
# Then paste the SQL from RAILWAY_RUN_THIS.sql
```

---

## 📋 Checklist

- [ ] Opened Railway dashboard
- [ ] Found MySQL database service
- [ ] Clicked "Data" tab
- [ ] Opened Query console
- [ ] Pasted SQL from `database/RAILWAY_RUN_THIS.sql`
- [ ] Clicked "Execute"
- [ ] Saw "SUCCESS! Promotion Created:" message
- [ ] Verified API returns promotion data
- [ ] Checked website shows promotion

---

## 🎯 What You're Creating

After running the SQL, users can:
1. ✅ Visit `/win-free-game` page
2. ✅ See "Win 30 Minutes FREE Gaming!" promotion
3. ✅ Login and fill Instagram username + 2 friend handles
4. ✅ Receive unique code (INSTA-XXXX-XXXX)
5. ✅ Admin verifies they followed/shared
6. ✅ When booking, 30-min discount auto-applies
7. ✅ One-time per user (can't claim again)

---

**Time to fix: 2 minutes** ⏱️

**Difficulty: Copy-paste** 📋

**Just run that SQL!** 🚀
