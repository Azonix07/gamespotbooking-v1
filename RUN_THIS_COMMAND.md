# 🚀 AUTOMATIC FIX - Run This Command

## Problem
Instagram promotion tables don't exist in Railway database.

## ✅ SOLUTION - Run this ONE command:

### Option 1: Using curl (Terminal/Command Prompt)
```bash
curl -X POST https://gamespotkdlr.com/api/admin/setup-instagram-promo
```

### Option 2: Using your browser
Just visit this URL (it will show "Method Not Allowed" but you need POST):
```
https://gamespotkdlr.com/api/admin/setup-instagram-promo
```

### Option 3: Using Postman or Insomnia
- Method: **POST**
- URL: `https://gamespotkdlr.com/api/admin/setup-instagram-promo`
- Click **Send**

### Option 4: Using Thunder Client (VS Code Extension)
- Install Thunder Client extension
- Create new request
- Method: **POST**  
- URL: `https://gamespotkdlr.com/api/admin/setup-instagram-promo`
- Send

---

## What This Does

1. ✅ Creates `instagram_promotions` table
2. ✅ Creates `user_instagram_redemptions` table
3. ✅ Inserts "Win 30 Minutes FREE Gaming!" promotion
4. ✅ Sets it as active with 90-day expiry

---

## Expected Response

### Success:
```json
{
  "success": true,
  "message": "Instagram promotion system setup complete!",
  "promotion": {
    "id": 1,
    "campaign_name": "Win 30 Minutes FREE Gaming!",
    "discount_value": 30,
    "instagram_handle": "@gamespot_kdlr"
  }
}
```

### Already Setup:
```json
{
  "success": true,
  "message": "Tables already exist and promotion is active",
  "note": "No changes made"
}
```

---

## Verify It Worked

After running the POST request, check:

1. **Check tables exist:**
   ```bash
   curl https://gamespotkdlr.com/api/admin/check-instagram-tables
   ```

2. **Check promotion is active:**
   ```bash
   curl https://gamespotkdlr.com/api/instagram-promo/active
   ```

3. **Visit your website:**
   - Go to: `/win-free-game`
   - Should now show: "Win 30 Minutes FREE Gaming!" 🎉

---

## Timeline

1. **Wait 2-3 minutes** for Railway to deploy the new code
2. **Run the POST command** (any of the options above)
3. **Refresh your website** - promotion should appear!

---

## 🎯 EASIEST WAY:

**Just copy and paste this in your terminal:**

```bash
sleep 120 && curl -X POST https://gamespotkdlr.com/api/admin/setup-instagram-promo
```

This waits 2 minutes for Railway to deploy, then automatically sets up everything! ⏰

---

**NO RAILWAY DASHBOARD ACCESS NEEDED!** 🚀
