# 🚀 New Authentication System - Quick Start

## ✅ What's New

1. **OTP Login** - No password needed, just mobile number + OTP
2. **Google Sign In** - One-click login with Google account
3. **Apple Sign In** - One-click login with Apple ID
4. **No Signup Tab** - Users automatically created on first login

## 🔧 Setup (5 minutes)

### Step 1: Install Dependencies

```bash
# Backend
cd backend
python -m pip install google-auth google-auth-oauthlib requests

# Frontend (already done)
cd frontend
npm install
```

### Step 2: Run Database Migration

```bash
cd database
mysql -u root -p gamespot_booking < migration_oauth.sql
```

Or run SQL directly:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255);
```

### Step 3: Get Google Client ID (Optional - for Google Login)

1. Go to https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. Create OAuth 2.0 Client ID
4. Add authorized origins: `http://localhost:3000`
5. Copy Client ID

### Step 4: Configure Environment

Create `frontend/.env`:
```env
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:5000
```

Update `backend/routes/auth_routes.py` line 527:
```python
'YOUR_GOOGLE_CLIENT_ID_HERE'  # Replace with actual client ID
```

### Step 5: Start Services

```bash
# Terminal 1: Backend
cd backend
python app.py

# Terminal 2: Frontend  
cd frontend
npm start
```

### Step 6: Test!

Go to http://localhost:3000/login

## 🧪 Testing

### OTP Login (Works Immediately)
1. Enter mobile: `9876543210`
2. Click "Send OTP"
3. Check browser console for OTP
4. Enter OTP + your name
5. Click "Verify & Login"

### Google Login (Needs Setup)
1. Get Google Client ID (see Step 3)
2. Add to frontend/.env
3. Add to backend auth_routes.py
4. Click "Continue with Google"
5. Select Google account

### Apple Login (Needs Apple Developer Account)
1. Get Apple Services ID ($99/year)
2. Configure in Apple Developer Portal
3. Works on HTTPS only (production)

## 📂 Files Changed

### New Files:
- `frontend/src/pages/LoginPage.jsx` - New OTP + OAuth UI
- `frontend/src/pages/LoginPage_old.jsx` - Backup of old version
- `database/migration_oauth.sql` - OAuth fields migration
- `OAUTH_SETUP_GUIDE.md` - Detailed setup instructions
- `test_new_auth.sh` - Test script

### Modified Files:
- `backend/routes/auth_routes.py` - Added `/api/auth/send-otp`, `/api/auth/verify-otp`, `/api/auth/google-login`, `/api/auth/apple-login`
- `backend/requirements.txt` - Added OAuth dependencies
- `frontend/src/styles/LoginPage.css` - Added social login styles
- `frontend/package.json` - Already had `@react-oauth/google`

## 🎯 What Works Right Now

✅ **OTP Login** - Fully working (shows OTP in console for testing)
✅ **Backend Endpoints** - All 4 auth endpoints ready
✅ **Frontend UI** - Clean single-page login with all options
✅ **Auto User Creation** - New users created automatically
✅ **Session Management** - JWT tokens + sessions

## ⚙️ What Needs Configuration

🔧 **Google OAuth** - Need to add Client ID (5 min setup)
🔧 **Apple Sign In** - Need Apple Developer account ($99/year)
🔧 **SMS Gateway** - For production OTP delivery (Twilio/AWS SNS)

## 🐛 Troubleshooting

### "Failed to send OTP"
- Check backend is running on port 5000
- Check backend console for errors

### "Google login failed"
- Verify Client ID in frontend/.env
- Verify Client ID in backend auth_routes.py matches
- Check authorized origins in Google Console

### "Database error"
- Run migration_oauth.sql
- Check users table has oauth_provider columns

## 📖 Documentation

- **Detailed Setup**: See `OAUTH_SETUP_GUIDE.md`
- **API Docs**: See backend/routes/auth_routes.py comments
- **UI Components**: See frontend/src/pages/LoginPage.jsx

## 🎉 Quick Demo

Without any configuration, you can:
1. Start backend + frontend
2. Go to /login
3. Use OTP login with any 10-digit number
4. See OTP in browser console
5. Login successfully!

Google and Apple require setup but the UI is ready to go!
