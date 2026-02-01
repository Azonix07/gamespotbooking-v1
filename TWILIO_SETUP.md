# 📱 Twilio SMS Setup - Quick Guide

## Get Twilio Account (5 minutes)

### Step 1: Sign Up
1. Go to https://www.twilio.com/try-twilio
2. Sign up (free account)
3. Get **$15 free credit** = ~1,900 SMS messages

### Step 2: Get Phone Number
1. After signup, Twilio will guide you to get a phone number
2. Select a phone number with SMS capability
3. Note down: **Your Twilio Phone Number** (e.g., +1234567890)

### Step 3: Get Credentials
1. Go to Twilio Console Dashboard
2. Find these values:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)

### Step 4: Add to Railway

Go to Railway → **Backend Service** → **Variables** → Add these:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Example:
```
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcd
TWILIO_AUTH_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TWILIO_PHONE_NUMBER=+15551234567
```

### Step 5: Deploy
Railway will automatically redeploy with Twilio integration.

## Testing

1. Go to your site: `https://your-frontend.up.railway.app/login`
2. Enter your real mobile number
3. Click "Send OTP"
4. **You will receive SMS on your phone!** 📱
5. Enter the OTP from SMS
6. Login successfully!

## Cost

- **Free tier**: $15 credit (~1,900 SMS)
- **India SMS**: $0.0079 per message
- **USA SMS**: $0.0075 per message
- **Pay as you go**: Top up when needed

## Troubleshooting

### SMS not received?
1. Check Railway Backend logs for errors
2. Verify Twilio credentials are correct
3. Check phone number format (should be +91XXXXXXXXXX for India)
4. Verify Twilio phone number is SMS-capable
5. Check Twilio Console → Logs for delivery status

### Error: "Unable to create record"?
- Your Twilio trial account may need phone verification
- Go to Twilio Console → Phone Numbers → Verified Caller IDs
- Add your phone number for testing

### Still seeing OTP in logs?
- Good! That's the fallback. SMS might have failed.
- Check Twilio Console → Messaging → Logs
- Verify phone number format

## Going Live

For production with many users:
1. Upgrade Twilio account (remove trial restrictions)
2. Add more credits as needed
3. Consider bulk SMS pricing plans
4. Monitor usage in Twilio Console

## Alternative: Indian SMS Providers

If Twilio is expensive for India:
- **MSG91**: ₹0.15/SMS (https://msg91.com/)
- **Fast2SMS**: ₹0.10/SMS (https://www.fast2sms.com/)
- **TextLocal**: ₹0.12/SMS (https://www.textlocal.in/)

Let me know if you want to switch to any of these!

---

**Your SMS integration is ready!** Just add the 3 environment variables to Railway and users will start receiving real SMS! 🎉
