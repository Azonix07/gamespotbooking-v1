# Apple Sign In Setup Guide

## ✅ Code is Ready! Just Need Apple Developer Setup

The Apple Sign In code is fully implemented. You just need to configure it in Apple Developer Console.

## Requirements

- **Apple Developer Account** ($99/year)
- **Domain name** (for production)

## Step 1: Enroll in Apple Developer Program

Visit: https://developer.apple.com/programs/enroll/

Cost: $99/year

## Step 2: Create App ID

1. Go to: https://developer.apple.com/account/resources/identifiers/list
2. Click **"+"** to create new identifier
3. Select **"App IDs"** → Continue
4. Select **"App"** → Continue
5. Fill in:
   - **Description**: GameSpot Booking
   - **Bundle ID**: `com.gamespot.booking` (must match APPLE_CLIENT_ID in code)
   - **Capabilities**: Check ✅ **Sign in with Apple**
6. Click **"Continue"** → **"Register"**

## Step 3: Create Services ID (for Web)

1. Go to: https://developer.apple.com/account/resources/identifiers/list/serviceId
2. Click **"+"** to create new identifier
3. Select **"Services IDs"** → Continue
4. Fill in:
   - **Description**: GameSpot Booking Web
   - **Identifier**: `com.gamespot.booking.web` (or use same as App ID)
5. Check ✅ **Sign in with Apple**
6. Click **"Configure"** next to Sign in with Apple

### Configure Sign in with Apple:

**Primary App ID**: Select your App ID (`com.gamespot.booking`)

**Website URLs** → Click **"+"**:
- **Domains**: `gamespotbooking-v1-production-185b.up.railway.app`
- **Return URLs**: 
  - `https://gamespotbooking-v1-production-185b.up.railway.app`
  - Add `http://localhost:3000` for local testing

7. Click **"Save"** → **"Continue"** → **"Register"**

## Step 4: Update Environment Variables

### Local Development (.env)

Update `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=556892794157-0ou93bns5ok2n32nk3nruhhnf4juog1h.apps.googleusercontent.com
REACT_APP_APPLE_CLIENT_ID=com.gamespot.booking.web
REACT_APP_APPLE_REDIRECT_URI=http://localhost:3000
```

### Production (Railway)

Add to **Railway Frontend Service** → **Variables**:

```
REACT_APP_APPLE_CLIENT_ID=com.gamespot.booking.web
REACT_APP_APPLE_REDIRECT_URI=https://gamespotbooking-v1-production-185b.up.railway.app
```

## Step 5: Test Apple Sign In

### Local Testing:

```bash
cd frontend
npm start
```

Go to http://localhost:3000/login and click **"Continue with Apple"**

### Production Testing:

After Railway deploys, visit your website and test!

## How It Works

### User Flow:
1. User clicks **"Continue with Apple"**
2. Apple popup appears (or redirects on mobile)
3. User authenticates with Face ID/Touch ID/Password
4. Apple returns ID token and user info
5. Frontend sends token to backend
6. Backend verifies token and creates/logs in user
7. User is logged in! ✅

### Data Received:
- **Email**: Real email or Apple Private Relay (`xyz@privaterelay.appleid.com`)
- **Name**: Only on first sign-in
- **Apple ID**: Unique user identifier

## Important Notes

### Apple Private Relay
Users can choose to hide their email. Apple provides a private relay email like:
```
abc123def456@privaterelay.appleid.com
```

This forwards to their real email. Your app can still send emails normally!

### Name Only on First Sign-In
Apple only sends the user's name the FIRST time they sign in. After that, you need to use the stored name from your database.

### Testing Before Publishing

You can test with your own Apple ID immediately after setup. Add test users in Apple Developer Console if needed.

## Troubleshooting

### "Invalid Client" Error
- Check that your Services ID matches `REACT_APP_APPLE_CLIENT_ID`
- Verify domain and return URLs are correct
- Make sure Sign in with Apple is enabled for the Services ID

### "Popup Closed" - Not an Error
If user closes the Apple popup, the code handles it gracefully (no error shown)

### Apple Sign In Button Not Working
- Check browser console for errors
- Verify Apple JS SDK loaded: `window.AppleID` should exist
- Clear cache and try again

## Production Checklist

Before going live:

- ✅ Apple Developer account enrolled ($99/year)
- ✅ App ID created with Sign in with Apple enabled
- ✅ Services ID created and configured
- ✅ Production domain added to Apple Developer Console
- ✅ Environment variables set in Railway
- ✅ Test with real Apple ID
- ✅ Backend Apple login endpoint working

## Current Status

**Frontend**: ✅ Ready
**Backend**: ✅ Ready
**Apple Setup**: ⏳ Needs Apple Developer Account

Once you complete Apple Developer setup (Steps 1-3), Apple Sign In will work immediately!

## Costs

- **Apple Developer Program**: $99/year (one-time setup)
- **No per-user costs**: Unlike SMS, Apple Sign In is free after enrollment

## Alternative: Skip Apple Sign In

If you don't want to pay $99/year:

1. Keep the button but show a message:
   ```javascript
   setError('Apple Sign In requires Apple Developer account. Please use Google or OTP login.');
   ```

2. Or remove the Apple button entirely

Most users are fine with Google + OTP options!

## Need Help?

- Apple Developer Support: https://developer.apple.com/support/
- Sign in with Apple Docs: https://developer.apple.com/sign-in-with-apple/
- Human Readable Guide: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js

---

**Next Steps**: Get Apple Developer account → Create App ID & Services ID → Add environment variables → Test! 🎉
