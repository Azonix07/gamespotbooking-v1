# OAuth Setup Guide

## Google OAuth Configuration

### 1. Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - Application name: GameSpot Booking
   - Authorized domains: Your domain
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
7. Copy your **Client ID**

### 2. Configure Frontend

Create/Update `.env` file in `frontend/`:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:5000
```

### 3. Configure Backend

Update `backend/routes/auth_routes.py` line 527:

```python
idinfo = id_token.verify_oauth2_token(
    credential, 
    google_requests.Request(),
    'YOUR_GOOGLE_CLIENT_ID_HERE'  # Replace this
)
```

## Apple Sign In Configuration

### 1. Get Apple Services ID

1. Go to [Apple Developer](https://developer.apple.com/)
2. Sign in with your Apple Developer account (requires paid membership $99/year)
3. Go to **Certificates, Identifiers & Profiles**
4. Click **Identifiers** → **+** → **Services IDs**
5. Register a Services ID:
   - Description: GameSpot Booking
   - Identifier: com.gamespot.booking (must be unique)
6. Enable **Sign In with Apple**
7. Configure Sign In with Apple:
   - Primary App ID: Select your App ID
   - Website URLs:
     - Domains: `yourdomain.com`
     - Return URLs: `https://yourdomain.com/apple-callback`
8. Copy your **Services ID**

### 2. Configure Frontend

Update `.env` file in `frontend/`:

```env
REACT_APP_APPLE_CLIENT_ID=com.gamespot.booking
REACT_APP_APPLE_REDIRECT_URI=https://yourdomain.com/apple-callback
```

### 3. Add Apple Sign In JS SDK

Already included in `LoginPage.jsx`. No additional setup needed for basic implementation.

## Database Migration

Run the OAuth migration:

```bash
cd database
mysql -u your_user -p your_database < migration_oauth.sql
```

Or run directly:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255),
ADD INDEX idx_oauth_provider_id (oauth_provider_id);
```

## Install Dependencies

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## Test OAuth Flow

### Google Login Test:
1. Start backend: `python app.py`
2. Start frontend: `npm start`
3. Go to `/login`
4. Click "Continue with Google"
5. Select Google account
6. Should redirect to homepage after successful login

### Apple Login Test:
Note: Apple Sign In requires HTTPS in production. For testing:
1. Use a service like ngrok to get HTTPS tunnel
2. Configure Apple redirect URI with ngrok URL
3. Test the flow

## OTP Test (No Configuration Needed)

1. Enter 10-digit mobile number
2. Click "Send OTP"
3. Check browser console for OTP (development only)
4. Enter OTP and name
5. Click "Verify & Login"

## Production Checklist

- [ ] Add actual Google Client ID to frontend `.env`
- [ ] Add actual Google Client ID to backend `auth_routes.py`
- [ ] Remove OTP console.log in production
- [ ] Set up SMS gateway for real OTP delivery (Twilio/AWS SNS)
- [ ] Configure Apple Sign In with production domain
- [ ] Enable HTTPS for Apple Sign In
- [ ] Test all three login methods (OTP, Google, Apple)
- [ ] Set up proper error logging
- [ ] Add rate limiting for OTP requests

## Troubleshooting

### Google Login Error: "Invalid client ID"
- Verify GOOGLE_CLIENT_ID in frontend `.env`
- Verify client ID in backend `auth_routes.py` matches
- Check authorized origins in Google Cloud Console

### Apple Sign In Not Working
- Verify you have paid Apple Developer membership
- Check Services ID is correct
- Ensure redirect URI matches exactly
- Apple Sign In requires HTTPS (won't work on localhost)

### OTP Not Sending
- Check backend console for error messages
- Verify phone number is 10 digits
- Check if OTP is logged to console (development mode)

### Database Errors
- Run `migration_oauth.sql` to add required columns
- Verify database connection in backend

## Support

For issues, check:
1. Browser console for frontend errors
2. Backend terminal for API errors
3. Network tab to see failed requests
4. Database logs for SQL errors
