# Google OAuth Setup - Fix "Invalid Client" Error

## The Problem

You're seeing: **"Error 401: invalid_client - The OAuth client was not found"**

This happens because you need to create your OWN Google OAuth Client ID for your app.

## Solution: Create Your Google OAuth Client ID

### Step 1: Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### Step 2: Create a New Project (or select existing)

1. Click on the project dropdown at the top
2. Click **"New Project"**
3. Name it: `GameSpot Booking`
4. Click **"Create"**

### Step 3: Enable Google+ API

1. Go to **APIs & Services** → **Library**
2. Search for: `Google+ API`
3. Click on it and click **"Enable"**

### Step 4: Create OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Click **"Create"**

Fill in the form:
- **App name**: `GameSpot Booking`
- **User support email**: Your email
- **Developer contact**: Your email
4. Click **"Save and Continue"**
5. Skip "Scopes" → Click **"Save and Continue"**
6. Skip "Test users" → Click **"Save and Continue"**
7. Click **"Back to Dashboard"**

### Step 5: Create OAuth Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Choose **"Web application"**
4. Name it: `GameSpot Web Client`

**IMPORTANT - Add these URLs:**

**Authorized JavaScript origins:**
```
http://localhost:3000
http://localhost:3001
https://gamespotbooking-v1-main-production.up.railway.app
```

**Authorized redirect URIs:**
```
http://localhost:3000
http://localhost:3001
https://gamespotbooking-v1-main-production.up.railway.app
```

5. Click **"Create"**

### Step 6: Copy Your Client ID

You'll see a popup with:
- **Client ID**: Something like `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret**: (you don't need this for frontend OAuth)

**COPY the Client ID!**

## Update Your Code

### Local Development

Update `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

**Replace `YOUR_CLIENT_ID_HERE` with the Client ID you just copied!**

### Production (Railway)

1. Go to **Railway** → **Frontend Service** → **Variables**
2. Add variable:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
   ```
3. Click **"Save"** (Railway will redeploy)

## Test It

### 1. Restart Your Frontend

If running locally:
```bash
# Stop the server (Ctrl+C)
# Start it again
cd frontend
npm start
```

### 2. Try Google Sign In

1. Go to: http://localhost:3000/login
2. Click **"Continue with Google"**
3. You should see Google's sign-in popup
4. Select your Google account
5. ✅ Login successful!

## Common Issues

### Still seeing "invalid_client"?

1. **Wait 5 minutes** - Google needs time to propagate the settings
2. **Clear browser cache** - Old client ID might be cached
3. **Check the URLs match exactly** - http vs https, trailing slashes matter
4. **Verify Client ID in .env** - No quotes, no spaces

### "Access blocked: This app's request is invalid"?

- Your OAuth consent screen needs to be published
- Or add yourself as a test user in OAuth consent screen

### "Redirect URI mismatch"?

- Go back to Google Console → Credentials → Edit your OAuth client
- Make sure your current URL is in "Authorized redirect URIs"

## Need Your Railway Frontend URL?

Go to Railway → Frontend Service → Settings → Domains

It should be something like:
`https://gamespotbooking-v1-main-production.up.railway.app`

Add this to Google Console authorized origins and redirect URIs!

## Quick Reference

**Google Console**: https://console.cloud.google.com/apis/credentials
**What you need**: OAuth 2.0 Client ID (Web application type)
**Where to add it**: 
- Local: `frontend/.env` → `REACT_APP_GOOGLE_CLIENT_ID`
- Railway: Frontend Service → Variables → `REACT_APP_GOOGLE_CLIENT_ID`

## After Setup

Once your Client ID is configured:
- ✅ Google Sign In will work
- ✅ Users can login with their Google account
- ✅ No more "invalid_client" error
- ✅ Automatic account creation in your database

---

**Important**: Don't share your Client ID publicly in git repos if it's a production app, but for development it's fine!
