# Twilio SMS Setup Guide

## ✅ SMS Feature Enabled

The system is now configured to send OTP via Twilio SMS. No more OTP display on screen!

## Required Configuration

### 1. Get Your Twilio Credentials

Visit: https://console.twilio.com/

You'll need:
- **Account SID** (starts with AC...)
- **Auth Token** (from your console)
- **Phone Number** (the Twilio number you purchased, format: +1234567890)

### 2. Local Development Setup

Create/update `backend/.env` file:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Railway Production Setup

Go to Railway Backend Service → Variables:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Click **Save** - Railway will automatically redeploy.

## How It Works Now

### Before (Old System):
- ❌ OTP shown on screen
- ❌ "Testing mode" messages
- ❌ OTP in API response

### After (New System):
- ✅ OTP sent via real SMS
- ✅ Production-ready messaging
- ✅ OTP hidden from response
- ✅ Proper error handling

## Testing Your Setup

### 1. Start Backend Locally

```bash
cd backend
python app.py
```

Look for: `[SMS] ✅ Twilio SMS initialized - Ready to send OTP`

### 2. Test OTP Send

```bash
curl -X POST http://localhost:8000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"YOUR_PHONE_NUMBER"}'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent successfully to your mobile number",
  "phone": "YOUR_PHONE_NUMBER"
}
```

You should receive SMS on your phone!

### 3. Frontend Test

Start frontend and try login:
1. Enter your phone number
2. Click "Send OTP"
3. Success message: "OTP sent successfully! Please check your SMS."
4. Check your phone for SMS with 6-digit OTP
5. Enter OTP and complete login

## SMS Format

Your users will receive:

```
Your GameSpot verification code is: 123456

Valid for 5 minutes. Do not share this code.
```

## Troubleshooting

### Backend shows: "No SMS provider configured"
- Check environment variables are set correctly
- Restart backend after adding variables

### SMS not received
- Verify phone number format (10 digits for India, or +countrycode for others)
- Check Twilio Console for delivery status
- Ensure your Twilio number can send to the destination country
- Check Twilio account balance

### Error: "Failed to send OTP"
- Check Twilio credentials are correct
- Verify your Twilio number is active
- Check backend logs for detailed error

## Phone Number Formats

The system automatically adds country code:

- Input: `9876543210` → Sends to: `+919876543210` (India)
- Input: `+14155551234` → Sends to: `+14155551234` (US)

## Cost

- India SMS: ~₹0.50 per message via Twilio
- International: Check Twilio pricing for your country
- Your Twilio number: ~$1/month rental

## Deploy to Production

Once tested locally:

```bash
cd c:\Users\abhin\OneDrive\Documents\gamespotbooking-v1-main
git add .
git commit -m "Enable Twilio SMS - Remove OTP display feature"
git push origin main
```

Railway will auto-deploy in 2-3 minutes!

## Need Help?

- Twilio Console: https://console.twilio.com/
- Twilio SMS Docs: https://www.twilio.com/docs/sms
- Backend logs: `railway logs` command
