# 📱 Fast2SMS Setup - Super Simple (3 minutes)

## Why Fast2SMS?
- ✅ **No phone number needed**
- ✅ **Free 50 SMS** on signup
- ✅ **₹0.10 per SMS** (vs Twilio ₹0.65)
- ✅ **Just need API key**
- ✅ **Perfect for India**

## Setup (3 minutes)

### Step 1: Sign Up
1. Go to https://www.fast2sms.com/
2. Click "Sign Up" (free)
3. Verify your email

### Step 2: Get API Key
1. Login to Fast2SMS Dashboard
2. Go to **"Dev API"** section
3. Copy your **API Key** (looks like: `abcdefghijklmnopqrstuvwxyz123456789`)

### Step 3: Add to Railway
Railway → **Backend Service** → **Variables**:

```
FAST2SMS_API_KEY=your_api_key_here
```

That's it! **Only 1 variable needed!**

### Step 4: Test
1. Railway will auto-redeploy (2 min)
2. Go to your site → Login
3. Enter your mobile number
4. **SMS arrives on your phone!** 📱

## Cost Comparison

| Service | Setup | Phone Number? | Cost (India) | Free Tier |
|---------|-------|---------------|--------------|-----------|
| **Fast2SMS** ⭐ | 3 min | ❌ No | ₹0.10/SMS | 50 SMS |
| Twilio | 10 min | ✅ Yes ($1/mo) | ₹0.65/SMS | $15 credit |
| MSG91 | 5 min | ❌ No | ₹0.15/SMS | 100 SMS |

## Features

✅ **OTP Route** - Optimized for verification codes
✅ **No sender registration** - Works immediately
✅ **99% delivery rate** in India
✅ **Instant delivery** - Usually under 5 seconds

## Pricing

- **Free**: 50 SMS on signup
- **Pay as you go**: ₹0.10 per SMS
- **Bulk plans**:
  - 1,000 SMS = ₹100 (₹0.10/SMS)
  - 10,000 SMS = ₹900 (₹0.09/SMS)
  - 1,00,000 SMS = ₹8,000 (₹0.08/SMS)

## Testing

After adding API key to Railway:

1. Wait 2 minutes for deployment
2. Check Railway logs: `[SMS] ✅ Fast2SMS initialized (India)`
3. Go to login page
4. Enter mobile: `9876543210`
5. Click "Send OTP"
6. **SMS delivered to phone!**
7. Enter OTP and login

## Troubleshooting

### Not receiving SMS?
1. Check Railway logs for `[SMS] ❌ Fast2SMS error`
2. Verify API key is correct (no spaces)
3. Check phone number is 10 digits
4. Verify Fast2SMS account has credits

### API Key not working?
1. Go to Fast2SMS Dashboard
2. Check if API key is active
3. Try regenerating API key
4. Make sure you copied the full key

### Still shows OTP in logs?
- That's the fallback! SMS might have failed
- Check Fast2SMS Dashboard → Reports for delivery status
- Verify you have credits remaining

## Alternative: If Fast2SMS doesn't work

### Option 1: MSG91 (Similar to Fast2SMS)
1. Sign up at https://msg91.com/
2. Get Auth Key
3. Railway variable: `MSG91_AUTH_KEY=your_key`

### Option 2: Keep Twilio (if you need international)
- Only use if you have users outside India
- Requires phone number purchase

## Your Current Setup

**SMS Service supports both:**
- **Fast2SMS** (Priority) - If `FAST2SMS_API_KEY` is set
- **Twilio** (Fallback) - If Fast2SMS not set and Twilio configured

Just add `FAST2SMS_API_KEY` to Railway and you're done! 🎉

---

## Quick Summary

1. Sign up: https://www.fast2sms.com/
2. Get API key from Dev API section
3. Add to Railway: `FAST2SMS_API_KEY=your_key`
4. Done! Users receive SMS in 5 seconds

**Estimated setup time: 3 minutes**
**Cost: Free for first 50 SMS, then ₹0.10/SMS**
