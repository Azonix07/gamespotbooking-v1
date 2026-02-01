"""
SMS Service for OTP delivery
Supports Twilio with fallback to console logging
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
            try:
                self.client = Client(self.twilio_sid, self.twilio_token)
                self.enabled = True
                print("[SMS] ✅ Twilio SMS service initialized")
            except Exception as e:
                self.client = None
                self.enabled = False
                print(f"[SMS] ⚠️ Twilio initialization failed: {str(e)}")
        else:
            self.client = None
            self.enabled = False
            print("[SMS] ⚠️ Twilio not configured - OTP will only be logged to console")
    
    def send_otp(self, phone, otp):
        """
        Send OTP via SMS
        
        Args:
            phone (str): Phone number (10 digits or with country code)
            otp (str): 6-digit OTP code
            
        Returns:
            tuple: (success: bool, message: str)
        """
        if not self.enabled:
            # Development mode - log OTP
            print(f'[SMS] 📱 DEV MODE - OTP for {phone}: {otp}')
            return True, 'SMS service not configured - OTP logged to console'
        
        try:
            # Format phone number (add country code if not present)
            formatted_phone = phone
            if not phone.startswith('+'):
                # Default to India country code, change if needed
                formatted_phone = f'+91{phone}'
            
            # Send SMS via Twilio
            message = self.client.messages.create(
                body=f'Your GameSpot verification code is: {otp}\n\nValid for 5 minutes. Do not share this code.',
                from_=self.twilio_phone,
                to=formatted_phone
            )
            
            print(f'[SMS] ✅ SMS sent to {formatted_phone}: {message.sid}')
            return True, 'OTP sent successfully via SMS'
            
        except TwilioRestException as e:
            print(f'[SMS] ❌ Twilio error: {str(e)}')
            # Fallback: Log OTP if SMS fails
            print(f'[SMS] 📱 FALLBACK - OTP for {phone}: {otp}')
            return False, f'SMS failed, check logs for OTP: {str(e)}'
            
        except Exception as e:
            print(f'[SMS] ❌ Unexpected error: {str(e)}')
            print(f'[SMS] 📱 FALLBACK - OTP for {phone}: {otp}')
            return False, f'SMS error, check logs for OTP'

# Singleton instance
sms_service = SMSService()
