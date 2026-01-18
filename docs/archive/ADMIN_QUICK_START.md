# 🚀 QUICK START: Admin Dashboard Features

## 📍 How to Access

1. **Start Backend:**
   ```bash
   cd backend_python
   python3 app.py
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Login as Admin:**
   - Go to: `http://localhost:3000/login`
   - Username: `admin`
   - Password: `admin`

---

## 🎯 Dashboard Features

### Tab 1: 📊 Dashboard
**What you see:**
- Total Users count
- Active Memberships count
- Total Bookings count
- Total Revenue (all time)
- This Month's Bookings
- This Month's Revenue
- Today's Bookings

**What to test:**
- Click refresh to reload all data
- Hover over stat cards for animations

---

### Tab 2: 📋 Bookings

**Filter Bookings:**
- **Quick Filters**: All Time | Today | This Week | This Month
- **Custom Date**: Select From/To dates

**Pagination:**
- Choose items per page: 10 | 25 | 50 | 100
- Navigate pages with Previous/Next
- See page numbers (smart ellipsis)

**Actions:**
- ✏️ Edit: Click to modify time/duration/price
- 🗑️ Delete: Remove booking with confirmation
- All bookings show: ID, Customer, Phone, Date, Time, Duration, Devices, Price

---

### Tab 3: 👥 Users

**Search Users:**
- Type in search box to filter by name, email, or phone
- Results update in real-time

**User Cards Show:**
- Avatar with first letter
- Name and email
- Phone number
- Join date
- Membership status:
  - ✅ Active: Shows plan type, discount, days remaining
  - ❌ Inactive: "No active membership"

---

### Tab 4: 💳 Memberships

**Filter Memberships:**
- **All**: Show all subscriptions
- **Active**: Only active memberships
- **Expired**: Only expired ones
- **Cancelled**: Only cancelled ones

**Membership Table Shows:**
- ID, User name, Email
- Plan badge (monthly/quarterly/annual) with color
- Start and End dates
- Discount percentage
- Status badge (active/expired/cancelled) with color
- Days remaining (green if > 7 days, yellow if expiring)

---

## 🎨 Visual Guide

### Stat Cards
```
┌─────────────────────┐
│  👥                 │
│  25                 │  <- Value
│  Total Users        │  <- Label
└─────────────────────┘
```

### User Card
```
┌────────────────────────┐
│  [J]  John Doe        │  <- Avatar + Name
│       john@email.com  │  <- Email
│  📱 9876543210        │  <- Phone
│  📅 Jan 1, 2025       │  <- Join Date
│  💳 monthly (10% off) │  <- Membership
│     15 days remaining │
└────────────────────────┘
```

### Filter Buttons
```
[ All Time ] [ Today ] [ This Week ] [ This Month ]
     ↑ Active (highlighted in blue)
```

### Pagination
```
[ ← Previous ]  [ 1 ]  [ 2 ]  [ 3 ] ... [ 20 ]  [ Next → ]
                         ↑ Active (highlighted)
```

---

## 🔍 What to Look For

### ✅ Things Working:
- Tabs switch smoothly with animation
- Stats load from backend API
- Bookings filter by date correctly
- Pagination shows correct items
- User search works in real-time
- Membership filters update instantly
- Hover effects on cards
- Responsive design on mobile

### ❌ If Something Doesn't Work:
1. **Check Backend**: Is `python3 app.py` running?
2. **Check Console**: Open DevTools (F12) → Console tab
3. **Check Network**: DevTools → Network tab for API errors
4. **Check Database**: Run migration if users/memberships tables missing

---

## 🛠️ Common Issues & Fixes

### Issue: "No users found"
**Fix:** Run database migration:
```bash
mysql -u root -p gamespot_booking < database/migration_auth_system.sql
```

### Issue: Stats show 0
**Fix:** Backend might not be running or database is empty

### Issue: Pagination not working
**Fix:** Clear browser cache and reload (Cmd + Shift + R)

### Issue: Filters not applying
**Fix:** Check browser console for JavaScript errors

---

## 📊 Sample Data

If you need test data, insert these into MySQL:

```sql
-- Sample user
INSERT INTO users (name, email, phone, password_hash) 
VALUES ('Test User', 'test@example.com', '9876543210', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqgOX8/v0G');

-- Sample membership (monthly, active)
INSERT INTO memberships (user_id, plan_type, start_date, end_date, status, discount_percentage)
VALUES (1, 'monthly', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'active', 10);

-- Sample booking
INSERT INTO bookings (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price)
VALUES ('John Doe', '1234567890', CURDATE(), '14:00:00', 60, 380);
```

---

## 🎯 Testing Checklist

### Dashboard Tab ✅
- [ ] Stats cards display correct numbers
- [ ] Hover effects work on cards
- [ ] Refresh button reloads data

### Bookings Tab ✅
- [ ] Quick filters work (Today, Week, Month)
- [ ] Custom date range filters correctly
- [ ] Pagination changes items displayed
- [ ] Items per page selector works
- [ ] Edit booking works
- [ ] Delete booking works with confirmation

### Users Tab ✅
- [ ] Search by name works
- [ ] Search by email works
- [ ] Search by phone works
- [ ] User cards display all info
- [ ] Membership badges show correctly

### Memberships Tab ✅
- [ ] Filter by All shows everything
- [ ] Filter by Active shows only active
- [ ] Filter by Expired shows only expired
- [ ] Filter by Cancelled shows only cancelled
- [ ] Table displays all columns
- [ ] Days remaining shows correct colors

---

## 💡 Pro Tips

1. **Use Quick Filters**: Fastest way to find today's or this week's bookings
2. **Adjust Items Per Page**: Use 100 for overview, 10 for detailed review
3. **Search Users**: Faster than scrolling through cards
4. **Check Days Remaining**: Yellow = expiring soon, take action
5. **Dashboard First**: Always start with dashboard overview

---

## 🎉 You're All Set!

The admin dashboard now gives you complete control over:
- 📊 Business metrics
- 📋 Booking management with advanced filters
- 👥 User tracking and search
- 💳 Membership monitoring

Enjoy your upgraded admin experience! 🚀
