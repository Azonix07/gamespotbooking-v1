"""
Email Service for GameSpot
Sends emails via SMTP (Gmail, Outlook, or any SMTP provider)

Required environment variables:
  SMTP_HOST      - SMTP server (default: smtp.gmail.com)
  SMTP_PORT      - SMTP port (default: 587 for TLS, 465 for SSL)
  SMTP_EMAIL     - Sender email address
  SMTP_PASSWORD  - App password (NOT your regular password)
  FRONTEND_URL   - Frontend URL for links

For Gmail:
  1. Go to https://myaccount.google.com/apppasswords
  2. Generate an App Password for "Mail"
  3. Set SMTP_EMAIL=youremail@gmail.com and SMTP_PASSWORD=<16-char-app-password>
"""

import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


# Connection timeout to prevent request hanging if SMTP is unreachable
SMTP_TIMEOUT_SECONDS = 15


class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_email = os.getenv('SMTP_EMAIL', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.frontend_url = os.getenv(
            'FRONTEND_URL',
            'https://gamespotweb-production.up.railway.app'
        )

        if self.smtp_email and self.smtp_password:
            self.enabled = True
            sys.stderr.write(f"[Email] ✅ SMTP configured: {self.smtp_host}:{self.smtp_port} from {self.smtp_email}\n")
        else:
            self.enabled = False
            sys.stderr.write("[Email] ⚠️ SMTP not configured (set SMTP_EMAIL + SMTP_PASSWORD env vars)\n")

    def _get_smtp_connection(self):
        """
        Create SMTP connection with correct TLS/SSL handling.
        Port 465 = implicit SSL (SMTP_SSL), Port 587 = STARTTLS, others = try STARTTLS.
        """
        if self.smtp_port == 465:
            server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=SMTP_TIMEOUT_SECONDS)
        else:
            server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=SMTP_TIMEOUT_SECONDS)
            server.ehlo()
            server.starttls()
            server.ehlo()
        server.login(self.smtp_email, self.smtp_password)
        return server

    def send_email(self, to_email, subject, html_body, text_body=None):
        """
        Send an email via SMTP.
        Returns: tuple (success: bool, message: str)
        """
        if not self.enabled:
            sys.stderr.write("[Email] ❌ Cannot send — SMTP not configured\n")
            return False, 'Email service not configured'

        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = f'GameSpot <{self.smtp_email}>'
            msg['To'] = to_email
            msg['Subject'] = subject

            if text_body:
                msg.attach(MIMEText(text_body, 'plain'))
            msg.attach(MIMEText(html_body, 'html'))

            with self._get_smtp_connection() as server:
                server.sendmail(self.smtp_email, to_email, msg.as_string())

            sys.stderr.write(f"[Email] ✅ Sent to {to_email}: {subject}\n")
            return True, 'Email sent successfully'

        except smtplib.SMTPAuthenticationError as e:
            sys.stderr.write(f"[Email] ❌ SMTP auth failed: {e}\n")
            return False, 'SMTP authentication failed — check SMTP_EMAIL and SMTP_PASSWORD'
        except smtplib.SMTPConnectError as e:
            sys.stderr.write(f"[Email] ❌ SMTP connect failed: {e}\n")
            return False, 'Cannot connect to SMTP server'
        except TimeoutError:
            sys.stderr.write(f"[Email] ❌ SMTP timeout after {SMTP_TIMEOUT_SECONDS}s\n")
            return False, 'SMTP connection timed out'
        except Exception as e:
            sys.stderr.write(f"[Email] ❌ Send failed: {e}\n")
            return False, f'Email send failed: {str(e)}'

    def send_password_reset(self, to_email, token, user_name):
        """
        Send a password reset email with a styled HTML template.

        Args:
            to_email: Recipient email
            token: Reset token
            user_name: User's display name

        Returns:
            tuple: (success: bool, message: str)
        """
        reset_link = f"{self.frontend_url}/reset-password?token={token}"

        subject = "Reset Your Password — GameSpot"

        html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#ff6b35,#ff9966);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;">🎮 GameSpot</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Reset Your Password</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hi <strong>{user_name}</strong>,<br><br>
              We received a request to reset your password. Click the button below to set a new one:
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="{reset_link}"
                 style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">
                Reset Password
              </a>
            </div>
            <p style="color:#888;font-size:13px;line-height:1.5;margin:24px 0 0;">
              This link expires in <strong>24 hours</strong>.<br>
              If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px;">
            <p style="color:#aaa;font-size:12px;margin:0;text-align:center;">
              Can't click the button? Copy and paste this URL:<br>
              <a href="{reset_link}" style="color:#ff6b35;word-break:break-all;">{reset_link}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fafafa;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;">© 2026 GameSpot Gaming Lounge. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

        text_body = f"""Hi {user_name},

We received a request to reset your password. Visit the link below to set a new one:

{reset_link}

This link expires in 24 hours.
If you didn't request this, you can safely ignore this email.

— GameSpot Team"""

        return self.send_email(to_email, subject, html_body, text_body)

    def send_otp_email(self, to_email, otp, user_name, purpose='password reset'):
        """
        Send an OTP code via email (fallback when SMS is not configured).

        Args:
            to_email: Recipient email
            otp: The OTP code
            user_name: User's display name
            purpose: What the OTP is for

        Returns:
            tuple: (success: bool, message: str)
        """
        subject = "Your GameSpot Verification Code"

        html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#ff6b35,#ff9966);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;">🎮 GameSpot</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;text-align:center;">
            <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Verification Code</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hi <strong>{user_name}</strong>, here is your OTP for {purpose}:
            </p>
            <div style="background:#f8f9fa;border:2px dashed #ff6b35;border-radius:12px;padding:24px;margin:24px auto;max-width:200px;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a2e;">{otp}</span>
            </div>
            <p style="color:#888;font-size:13px;line-height:1.5;margin:24px 0 0;">
              This code expires in <strong>5 minutes</strong>.<br>
              Do not share this code with anyone.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;">© 2026 GameSpot Gaming Lounge. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

        text_body = f"""Hi {user_name},

Your GameSpot verification code for {purpose} is: {otp}

This code expires in 5 minutes.
Do not share this code with anyone.

— GameSpot Team"""

        return self.send_email(to_email, subject, html_body, text_body)


# Singleton instance
email_service = EmailService()
