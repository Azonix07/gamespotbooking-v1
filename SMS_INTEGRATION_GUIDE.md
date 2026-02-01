# SMS Integration for OTP

## Current Issue
OTP is currently only logged to Railway backend logs. You need to integrate an SMS service to send actual text messages to users' phones.

## Recommended SMS Services

### Option 1: Twilio (Most Popular) ⭐
**Cost:** $0.0079 per SMS (India)
**Setup Time:** 10 minutes

#### Steps:
1. Sign up at https://www.twilio.com/
2. Get $15 free credit (covers ~1,900 SMS)
3. Get your credentials:
   - Account SID
   - Auth Token
   - Phone Number (Twilio provides one)

4. Add to Railway Backend Environment Variables:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

5. Install Twilio SDK in backend:
```bash
pip install twilio
```

6. Update `backend/routes/auth_routes.py` - Add at top:
```python
from twilio.rest import Client
import os

# Initialize Twilio client
twilio_client = Client(
    os.getenv('TWILIO_ACCOUNT_SID'),
    os.getenv('TWILIO_AUTH_TOKEN')
)
TWILIO_PHONE = os.getenv('TWILIO_PHONE_NUMBER')
```

7. Replace line 372-374 in send_otp() function:
```python
# Send OTP via SMS
if TWILIO_PHONE:
    try:
        message = twilio_client.messages.create(
            body=f'Your GameSpot verification code is: {otp}. Valid for 5 minutes.',
            from_=TWILIO_PHONE,
            to=f'+91{phone}'  # Add country code
        )
        print(f'[OTP] SMS sent successfully to {phone}: {message.sid}')
    except Exception as e:
        print(f'[OTP] SMS failed: {str(e)}')
        # Fallback: Log OTP if SMS fails
        print(f'[OTP] OTP for {phone}: {otp}')
else:
    # Development mode: Only log OTP
    print(f'[OTP] OTP for {phone}: {otp}')
```

### Option 2: AWS SNS (Amazon)
**Cost:** $0.00645 per SMS (India)
**Best for:** If you're already using AWS

#### Steps:
1. Go to AWS Console → SNS
2. Enable SMS messaging
3. Get credentials (Access Key + Secret Key)
4. Install: `pip install boto3`

### Option 3: MSG91 (India-focused)
**Cost:** ₹0.15 per SMS
**Best for:** Indian users only

#### Steps:
1. Sign up at https://msg91.com/
2. Get Auth Key
3. Use their API

### Option 4: Fast2SMS (India)
**Cost:** ₹0.10 per SMS
**Free:** 50 SMS on signup

## Implementation Code (Twilio - Ready to Use)

Create `backend/services/sms_service.py`:

```python
"""
SMS Service for OTP delivery
Supports Twilio (default) with fallback to console logging
"""

import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

class SMSService:
    def __init__(self):
        self.twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')
        
        if self.twilio_sid and self.twilio_token and self.twilio_phone:
            self.client = Client(self.twilio_sid, self.twilio_token)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            print("[SMS] Twilio not configured - OTP will only be logged")
    
    def send_otp(self, phone, otp):
        """
        Send OTP via SMS
        Returns: (success: bool, message: str)
        """
        if not self.enabled:
            print(f'[SMS] DEV MODE - OTP for {phone}: {otp}')
            return True, f'OTP logged to console (SMS not configured)'
        
        try:
            # Format phone number (add country code if not present)
            if not phone.startswith('+'):
                phone = f'+91{phone}'  # India country code
            
            message = self.client.messages.create(
                body=f'Your GameSpot verification code is: {otp}\n\nValid for 5 minutes.\n\nDo not share this code.',
                from_=self.twilio_phone,
                to=phone
            )
            
            print(f'[SMS] ✅ Sent to {phone}: {message.sid}')
            return True, 'OTP sent successfully'
            
        except TwilioRestException as e:
            print(f'[SMS] ❌ Twilio error: {str(e)}')
            # Fallback: Log OTP
            print(f'[SMS] FALLBACK - OTP for {phone}: {otp}')
            return False, f'SMS failed: {str(e)}'
        except Exception as e:
            print(f'[SMS] ❌ Error: {str(e)}')
            print(f'[SMS] FALLBACK - OTP for {phone}: {otp}')
            return False, f'SMS error: {str(e)}'

# Singleton instance
sms_service = SMSService()
```

Then update `auth_routes.py`:

```python
# At top of file, add:
from services.sms_service import sms_service

# In send_otp() function, replace the print line with:
success, message = sms_service.send_otp(phone, otp)
if not success:
    # SMS failed but OTP is logged, still return success
    pass
```

## Quick Setup for Railway

1. **Add Twilio credentials to Railway:**
   - Railway → Backend Service → Variables
   - Add: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

2. **Update requirements.txt:**
   ```
   twilio==8.11.0
   ```

3. **Railway will auto-deploy** and SMS will start working!

## Testing

### Development (No SMS):
- OTP appears in Railway backend logs
- Copy from logs to test

### Production (With SMS):
- User enters phone number
- Receives SMS with OTP
- Enters OTP to login

## Cost Estimate

With Twilio:
- 1,000 users/month = ~$8/month
- 10,000 users/month = ~$80/month
- Free tier: $15 credit = ~1,900 SMS

## Security Notes

1. **Never send OTP in API response** ✅ (Already fixed)
2. **Always use HTTPS** ✅ (Railway provides this)
3. **Rate limit OTP requests** (TODO: Add rate limiting)
4. **Expire OTP after 5 minutes** ✅ (Already implemented)
5. **Limit OTP attempts to 3** ✅ (Already implemented)

## Next Steps

1. Sign up for Twilio (get free $15 credit)
2. Add credentials to Railway environment variables
3. Update `requirements.txt` to include `twilio==8.11.0`
4. Create `sms_service.py` file
5. Update `auth_routes.py` to use SMS service
6. Push code to Railway
7. Test with real phone number!

Your OTP system will then send real SMS messages! 📱
