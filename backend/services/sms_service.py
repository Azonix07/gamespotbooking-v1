"""
SMS Service for OTP delivery
Supports WhatsApp (Twilio), Fast2SMS (India), Twilio SMS (International)
"""

import os
import requests

class SMSService:
    def __init__(self):
        # WhatsApp (Twilio - Recommended, No DLT needed)
        self.twilio_whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
        
        # Fast2SMS (India - Requires DLT)
        self.fast2sms_key = os.getenv('FAST2SMS_API_KEY')
        
        # Twilio (International SMS)
        self.twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')
        
        # Determine which service to use (priority order)
        if self.twilio_whatsapp_number and self.twilio_sid and self.twilio_token:
            self.provider = 'whatsapp'
            self.enabled = True
            print("[SMS] ✅ WhatsApp (Twilio) initialized - No DLT needed!")
            try:
                from twilio.rest import Client
                self.twilio_client = Client(self.twilio_sid, self.twilio_token)
            except Exception as e:
                self.enabled = False
                print(f"[SMS] ⚠️ Twilio initialization failed: {str(e)}")
        elif self.fast2sms_key:
            self.provider = 'fast2sms'
            self.enabled = True
            print("[SMS] ✅ Fast2SMS initialized (India) - Requires DLT")
        elif self.twilio_sid and self.twilio_token and self.twilio_phone:
            self.provider = 'twilio'
            self.enabled = True
            print("[SMS] ✅ Twilio SMS initialized (International)")
            try:
                from twilio.rest import Client
                self.twilio_client = Client(self.twilio_sid, self.twilio_token)
            except Exception as e:
                self.enabled = False
                print(f"[SMS] ⚠️ Twilio initialization failed: {str(e)}")
        else:
            self.provider = None
            self.enabled = False
            print("[SMS] ⚠️ No SMS/WhatsApp provider configured - OTP will be shown in popup")
    
    def send_otp_whatsapp(self, phone, otp):
        """Send OTP via WhatsApp (Twilio)"""
        try:
            from twilio.base.exceptions import TwilioRestException
            
            # Format phone number for WhatsApp
            if not phone.startswith('+'):
                phone = f'+91{phone}'  # India country code
            
            # WhatsApp requires 'whatsapp:' prefix
            whatsapp_to = f'whatsapp:{phone}'
            
            message = self.twilio_client.messages.create(
                body=f'🎮 *GameSpot Verification*\n\nYour OTP code is: *{otp}*\n\nValid for 5 minutes.\nDo not share this code with anyone.',
                from_=self.twilio_whatsapp_number,
                to=whatsapp_to
            )
            
            print(f'[SMS] ✅ WhatsApp sent to {phone}: {message.sid}')
            return True, 'OTP sent via WhatsApp'
            
        except Exception as e:
            print(f'[SMS] ❌ WhatsApp error: {str(e)}')
            return False, f'WhatsApp failed: {str(e)}'
    
    def send_otp_fast2sms(self, phone, otp):
        """Send OTP via Fast2SMS (India)"""
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            
            # Remove +91 if present
            phone = phone.replace('+91', '').replace('+', '')
            
            payload = {
                "route": "otp",
                "sender_id": "TXTIND",
                "message": f"Your GameSpot verification code is {otp}. Valid for 5 minutes.",
                "variables_values": otp,
                "flash": 0,
                "numbers": phone
            }
            
            headers = {
                "authorization": self.fast2sms_key,
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers)
            result = response.json()
            
            if result.get('return') == True:
                print(f'[SMS] ✅ Fast2SMS sent to {phone}: {result.get("request_id")}')
                return True, 'OTP sent successfully via SMS'
            else:
                print(f'[SMS] ❌ Fast2SMS error: {result}')
                return False, f'SMS failed: {result.get("message", "Unknown error")}'
                
        except Exception as e:
            print(f'[SMS] ❌ Fast2SMS exception: {str(e)}')
            return False, f'SMS error: {str(e)}'
    
    def send_otp_twilio(self, phone, otp):
        """Send OTP via Twilio (International)"""
        try:
            from twilio.base.exceptions import TwilioRestException
            
            # Format phone number
            if not phone.startswith('+'):
                phone = f'+91{phone}'
            
            message = self.twilio_client.messages.create(
                body=f'Your GameSpot verification code is: {otp}\n\nValid for 5 minutes. Do not share this code.',
                from_=self.twilio_phone,
                to=phone
            )
            
            print(f'[SMS] ✅ Twilio sent to {phone}: {message.sid}')
            return True, 'OTP sent successfully via SMS'
            
        except Exception as e:
            print(f'[SMS] ❌ Twilio error: {str(e)}')
            return False, f'SMS failed: {str(e)}'
    
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
            return True, 'No messaging service configured - OTP shown in popup'
        
        # Send via configured provider (priority: WhatsApp > Fast2SMS > Twilio SMS)
        if self.provider == 'whatsapp':
            success, message = self.send_otp_whatsapp(phone, otp)
        elif self.provider == 'fast2sms':
            success, message = self.send_otp_fast2sms(phone, otp)
        elif self.provider == 'twilio':
            success, message = self.send_otp_twilio(phone, otp)
        else:
            success, message = False, 'No messaging provider available'
        
        # Fallback: Log OTP if SMS fails
        if not success:
            print(f'[SMS] 📱 FALLBACK - OTP for {phone}: {otp}')
        
        return success, message

# Singleton instance
sms_service = SMSService()
