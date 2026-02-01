# Railway Backend Troubleshooting

## Problem: No logs showing

### Step 1: Check Railway Dashboard

1. Go to Railway Dashboard
2. Make sure you're looking at **Backend Service** (not Frontend)
3. Click **Deployments** tab
4. Check latest deployment status:
   - ✅ Green "Success" - Backend is running
   - ❌ Red "Failed" - Backend crashed
   - 🟡 Yellow "Building" - Still deploying

### Step 2: View Build Logs

Railway → Backend → Deployments → Click latest deployment → **Build Logs**

Look for errors like:
- `ModuleNotFoundError: No module named 'twilio'`
- `ImportError: cannot import name 'sms_service'`
- Any Python errors

### Step 3: View Runtime Logs

Railway → Backend → Deployments → Click latest deployment → **Deploy Logs**

Look for:
- `[SMS] ✅ Fast2SMS initialized` (Good!)
- `[SMS] ⚠️ No SMS provider configured` (Need API key)
- Any crash messages

### Step 4: Test Backend is Running

Open this URL in browser:
```
https://your-backend-url.up.railway.app/api/health
```

Should return: `{"status": "ok"}`

If you get error 503 or "Application failed to respond":
- Backend crashed
- Check Build Logs for errors

## Common Issues:

### Issue 1: Backend won't start
**Cause:** Missing dependency `requests`

**Solution:** Already fixed in latest commit. Redeploy:
- Railway → Backend → Deployments → Three dots → Redeploy

### Issue 2: Import error for sms_service
**Cause:** File not uploaded or Railway using cached version

**Solution:** 
1. Check GitHub: Is `backend/services/sms_service.py` there?
2. Railway → Backend → Settings → Redeploy

### Issue 3: No logs at all
**Cause:** Looking at wrong service

**Solution:**
- Make sure you clicked **Backend** service (not Frontend or MySQL)
- Check the service name contains "backend"

## Quick Test Locally

Test if SMS service works:

```bash
cd backend
python -c "from services.sms_service import sms_service; print(sms_service.enabled)"
```

Should print: `False` (no API key) or `True` (API key set)

If error: Backend code has issue

## Tell me:

1. **What's the deployment status?** (Success / Failed / Building)
2. **Do you see this URL working?** `https://your-backend-url.up.railway.app/api/health`
3. **Any errors in Build Logs?**

I'll help you fix it!
