# Railway Deployment Troubleshooting Guide

## Current Issue: 502 Bad Gateway

The server is likely failing to start or Railway can't connect to it.

## ✅ REQUIRED Railway Settings

### 1. Service Configuration
- **Root Directory:** `frontend` (CRITICAL!)
- **Build Command:** Leave empty or set to: `CI=false npm install && npm run build`
- **Start Command:** Leave empty or set to: `node server.js`

### 2. Environment Variables
Add these in the Variables tab:
```
REACT_APP_API_URL=https://gamespotkdlr.com
NODE_ENV=production
PORT=(should be automatically set by Railway)
```

### 3. Networking
- Generate a public domain in Settings → Networking
- Port should be automatically detected

## 🔍 Debugging Steps

### Step 1: Check Deploy Logs
Go to Deployments → Click latest deployment → Scroll to bottom

**Look for:**
```
🚀 Starting GameSpot Frontend Server...
✅ Build directory found
✅ index.html found
✅ Server running at http://0.0.0.0:3000
```

**Common Errors:**
- ❌ "Build directory does not exist" → Build command not running
- ❌ "Cannot find module 'express'" → npm install not running
- ❌ "EADDRINUSE" → Port conflict (shouldn't happen on Railway)

### Step 2: Verify Build Phase
Check Build Logs for:
```
> react-scripts build
Creating an optimized production build...
Compiled successfully.
```

### Step 3: Check Service Health
- Health check path should be `/health`
- Railway will ping this endpoint to verify service is running

## 🚨 Common Issues

### Issue 1: Wrong Root Directory
**Problem:** Railway is looking in the wrong folder
**Solution:** Set Root Directory to `frontend` in Settings → General

### Issue 2: Build Not Running
**Problem:** Build command not executing
**Solution:** Make sure `npm run build` is in build command

### Issue 3: Server Not Starting
**Problem:** Node process crashes immediately
**Solution:** Check Deploy Logs for error messages

### Issue 4: Port Not Binding
**Problem:** Server listening on wrong port
**Solution:** Server should use `process.env.PORT` (already done)

## 🔧 Quick Fix Checklist

- [ ] Root Directory is set to `frontend`
- [ ] Environment variables are set
- [ ] Public domain is generated
- [ ] Latest commit is deployed
- [ ] Deploy logs show "Server running"
- [ ] Health check returns 200 OK

## 📞 If Still Not Working

1. Copy the entire Deploy Logs (after build completes)
2. Share them for detailed debugging
3. Check if build directory contains index.html
