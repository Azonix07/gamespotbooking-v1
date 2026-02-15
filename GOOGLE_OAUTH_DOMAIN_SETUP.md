# Google OAuth Domain Setup Guide

## Problem
After moving to your custom domain `gamespotkdlr.com`, Google Sign-In stopped working with this error:

```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
Failed to load resource: the server responded with a status of 403
```

## Why This Happens

Google OAuth has **strict security** — it only allows sign-in from domains you explicitly authorize in Google Cloud Console. Your OAuth Client ID (`556892794157-0ou93bns5ok2n32nk3nruhhnf4juog1h`) was configured for the old Railway URLs, but NOT for `gamespotkdlr.com`.

## How Google OAuth Works in Your App

### 1. Frontend (React)
- **Component**: `@react-oauth/google` library
- **Files**: 
  - `frontend/src/App.js` — Wraps app in `<GoogleOAuthProvider>`
  - `frontend/src/pages/LoginPage.jsx` — Shows `<GoogleLogin>` button
  - `frontend/src/pages/SignupPage.jsx` — Shows `<GoogleLogin>` button for signup

### 2. OAuth Flow
```
User clicks "Continue with Google"
    ↓
Google shows account picker (only if origin is authorized)
    ↓
Google returns JWT credential token to your frontend
    ↓
Frontend sends token to backend: POST /api/auth/google-login
    ↓
Backend verifies token with Google, creates/updates user
    ↓
Backend returns session + JWT to frontend
```

### 3. Backend API
- **Endpoint**: `/api/auth/google-login` (in `backend/routes/auth_routes.py`)
- **Verifies** the Google token using `google.oauth2.id_token.verify_oauth2_token()`
- **Creates or updates** user in database
- **Auto-verifies** email (OAuth users bypass email verification)

---

## Solution: Add Your Domain to Google OAuth

### Step 1: Go to Google Cloud Console
1. Open **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)**
2. Make sure you're in the correct project
3. Look for **OAuth 2.0 Client IDs** section

### Step 2: Find Your OAuth Client
- Click on: **`Web client (auto created by Google Service)`** 
- Or the one with ID: `556892794157-0ou93bns5ok2n32nk3nruhhnf4juog1h`

### Step 3: Add Authorized JavaScript Origins
Scroll to **Authorized JavaScript origins** and click **+ ADD URI**

Add these URLs (one at a time):

```
https://gamespotkdlr.com
https://www.gamespotkdlr.com
```

**Why both?**
- `https://gamespotkdlr.com` — Your main domain
- `https://www.gamespotkdlr.com` — In case users type "www"

**⚠️ Important:**
- Must be **HTTPS** (not HTTP)
- No trailing slash
- Must match EXACTLY what the browser shows

### Step 4: Add Authorized Redirect URIs
Scroll to **Authorized redirect URIs** and click **+ ADD URI**

Add these URLs:

```
https://gamespotkdlr.com
https://gamespotkdlr.com/login
https://gamespotkdlr.com/signup
https://www.gamespotkdlr.com
https://www.gamespotkdlr.com/login
https://www.gamespotkdlr.com/signup
```

**Why these paths?**
- `/login` and `/signup` — Your login/signup pages
- Root `/` — OAuth callback can land here too

### Step 5: Keep Old URLs (Optional but Recommended)
**Don't delete** the old Railway URLs from the list — keep them for backward compatibility:

```
https://gamespotbooking-v1-production.up.railway.app
https://gamespotweb-production.up.railway.app
```

This ensures old bookmarks/links still work.

### Step 6: Save
Click **SAVE** at the bottom of the page.

---

## After Saving

### ⏱️ Propagation Time
Google needs **a few minutes** to propagate the changes globally. Usually takes **1-5 minutes**.

### ✅ How to Test

1. **Clear browser cache** (or open incognito/private window)
2. Go to `https://gamespotkdlr.com/login`
3. Click **"Continue with Google"**
4. You should see the Google account picker (no 403 error!)

### 🔍 If It Still Doesn't Work

1. **Check browser console** (F12 → Console tab)
   - Look for any remaining 403 or CORS errors
   - Note the exact origin being used

2. **Verify exact domain match**:
   - Browser URL bar shows: `https://gamespotkdlr.com/login`
   - Google Console has **exactly**: `https://gamespotkdlr.com` (no `/login` in origins)

3. **Wait a bit longer**: Can take up to 10 minutes in rare cases

4. **Check Google Cloud Project**: Make sure you edited the correct OAuth client in the correct project

---

## Current Configuration

### Your OAuth Client ID
```
556892794157-0ou93bns5ok2n32nk3nruhhnf4juog1h.apps.googleusercontent.com
```

### Where It's Used
- `frontend/.env`: `REACT_APP_GOOGLE_CLIENT_ID`
- `frontend/.env.production`: Same
- `frontend/src/App.js`: Hardcoded fallback

### API Endpoint
```
POST https://gamespotbooking-v1-production.up.railway.app/api/auth/google-login
```

**Payload:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjQ..."
}
```

---

## Summary Checklist

- [ ] Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
- [ ] Find OAuth 2.0 Client ID: `556892794157-0ou93bns5ok2n32nk3nruhhnf4juog1h`
- [ ] Add to **Authorized JavaScript origins**:
  - `https://gamespotkdlr.com`
  - `https://www.gamespotkdlr.com`
- [ ] Add to **Authorized redirect URIs**:
  - `https://gamespotkdlr.com`
  - `https://gamespotkdlr.com/login`
  - `https://gamespotkdlr.com/signup`
  - `https://www.gamespotkdlr.com` (and www variants)
- [ ] Click **Save**
- [ ] Wait 1-5 minutes
- [ ] Test on `https://gamespotkdlr.com/login`

---

## Additional Notes

### Why This Is Secure
Google requires **pre-authorization** of domains to prevent:
- **Phishing attacks** (attackers can't use your Client ID on their fake sites)
- **OAuth hijacking** (tokens can only be sent to approved domains)

### No Code Changes Needed
Once you add the domains in Google Cloud Console, **no code changes** are needed — the same Client ID works for all authorized domains.

### Testing in Development
For local testing, also add:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

(These might already be there from previous development)

---

## Screenshots Guide

### Finding OAuth Client
```
Google Cloud Console
→ APIs & Services
→ Credentials
→ OAuth 2.0 Client IDs section
→ Click "Web client (auto created by Google Service)"
```

### What to Configure
```
┌─────────────────────────────────────────────┐
│ Authorized JavaScript origins               │
├─────────────────────────────────────────────┤
│ + ADD URI                                   │
│ https://gamespotkdlr.com                   │
│ https://www.gamespotkdlr.com               │
│ (keep old Railway URLs too)                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Authorized redirect URIs                    │
├─────────────────────────────────────────────┤
│ + ADD URI                                   │
│ https://gamespotkdlr.com                   │
│ https://gamespotkdlr.com/login             │
│ https://gamespotkdlr.com/signup            │
│ (+ www variants)                            │
└─────────────────────────────────────────────┘
```

---

## Need Help?

If you're still seeing the 403 error after following these steps:

1. **Check the exact error message** in browser console
2. **Verify the domain** in the error matches what you added
3. **Try incognito mode** to rule out caching issues
4. **Contact Google Support** if the domain is genuinely added but still rejected (rare)
