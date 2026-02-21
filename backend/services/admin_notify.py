"""
Admin Notification Service for GameSpot
Sends FREE Gmail email notifications to admin when new bookings or requests come in.

SETUP (Option A — Gmail SMTP):
  1. Go to your Google Account → Security → 2-Step Verification (turn ON)
  2. Go to https://myaccount.google.com/apppasswords
  3. Create an App Password (select "Mail" and "Other - GameSpot")
  4. Copy the 16-character password
  5. Set these env vars on Railway:
       GMAIL_USER=gamespotkdlr@gmail.com
       GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (the 16-char app password)
       ADMIN_NOTIFY_EMAILS=gamespotkdlr@gmail.com   (comma-separated recipients)

SETUP (Option B — Resend.com, recommended for Railway):
  1. Sign up at https://resend.com (free: 100 emails/day)
  2. Get your API key from the dashboard
  3. Verify your domain OR use the onboarding@resend.dev sender
  4. Set env var on Railway:
       RESEND_API_KEY=re_xxxxxxxx
  (Still set ADMIN_NOTIFY_EMAILS for recipient addresses)

Environment Variables:
  GMAIL_USER            - Your Gmail address (sender)
  GMAIL_APP_PASSWORD    - Google App Password (NOT your regular password)
  ADMIN_NOTIFY_EMAILS   - Comma-separated admin email addresses to receive notifications
  RESEND_API_KEY        - (Optional) Resend.com API key — used as primary if set
"""

import os
import sys
import ssl
import json
import threading
import smtplib
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def _get_gmail_config():
    """Return Gmail SMTP config."""
    return {
        'user': os.getenv('GMAIL_USER', ''),
        'password': os.getenv('GMAIL_APP_PASSWORD', ''),
    }


def _get_admin_emails():
    """Return list of admin email addresses to notify."""
    raw = os.getenv('ADMIN_NOTIFY_EMAILS', '')
    if not raw:
        # Fallback: send to the same Gmail account
        gmail_user = os.getenv('GMAIL_USER', '')
        return [gmail_user] if gmail_user else []
    return [e.strip() for e in raw.split(',') if e.strip()]


def _send_in_background(fn, *args, **kwargs):
    """Run notification in a background thread so it doesn't slow down the API response."""
    def _worker():
        try:
            fn(*args, **kwargs)
        except Exception as e:
            sys.stderr.write(f"[AdminNotify] Background send error: {type(e).__name__}: {e}\n")
            import traceback
            sys.stderr.write(f"[AdminNotify] Traceback: {traceback.format_exc()}\n")
    t = threading.Thread(target=_worker, daemon=True)
    t.start()


def _send_via_resend(subject, html_body, recipients):
    """Send email via Resend.com HTTP API (works on Railway, no SMTP needed)."""
    api_key = os.getenv('RESEND_API_KEY', '')
    if not api_key:
        return False  # Not configured, skip

    gmail_user = os.getenv('GMAIL_USER', 'noreply@gamespotkdlr.com')
    # Resend requires a verified domain sender, or use onboarding@resend.dev for testing
    from_email = os.getenv('RESEND_FROM_EMAIL', f'GameSpot Alerts <onboarding@resend.dev>')

    payload = json.dumps({
        "from": from_email,
        "to": recipients,
        "subject": subject,
        "html": html_body
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.resend.com/emails',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            sys.stderr.write(f"[AdminNotify] ✅ Resend sent to {', '.join(recipients)}: {subject} (id={result.get('id','?')})\n")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ''
        sys.stderr.write(f"[AdminNotify] Resend HTTP {e.code} error: {body}\n")
        return False
    except Exception as e:
        sys.stderr.write(f"[AdminNotify] Resend failed: {type(e).__name__}: {e}\n")
        return False


def _send_via_gmail_smtp(subject, html_body, recipients):
    """Send email via Gmail SMTP (may be blocked on Railway/cloud platforms)."""
    config = _get_gmail_config()
    password = config['password'].replace(' ', '') if config['password'] else ''

    if not config['user'] or not password:
        sys.stderr.write(f"[AdminNotify] Gmail SMTP: credentials not set. "
                         f"GMAIL_USER={'SET' if config['user'] else 'EMPTY'}, "
                         f"GMAIL_APP_PASSWORD={'SET' if config['password'] else 'EMPTY'}\n")
        return False

    msg = MIMEMultipart('alternative')
    msg['From'] = f'GameSpot Alerts <{config["user"]}>'
    msg['To'] = ', '.join(recipients)
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html'))

    methods = [
        ('SSL/465', 465, 'ssl'),
        ('TLS/587', 587, 'tls'),
    ]

    for method_name, port, mode in methods:
        try:
            if mode == 'ssl':
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL('smtp.gmail.com', port, timeout=30, context=context)
            else:
                server = smtplib.SMTP('smtp.gmail.com', port, timeout=30)
                server.ehlo()
                server.starttls()
                server.ehlo()

            server.login(config['user'], password)
            server.sendmail(config['user'], recipients, msg.as_string())
            server.quit()

            sys.stderr.write(f"[AdminNotify] ✅ Gmail SMTP sent via {method_name} to {', '.join(recipients)}: {subject}\n")
            return True

        except Exception as e:
            sys.stderr.write(f"[AdminNotify] Gmail SMTP {method_name} failed: {type(e).__name__}: {e}\n")
            continue

    return False


def _send_email(subject, html_body):
    """Send email using the best available method. Tries Resend first, then Gmail SMTP."""
    recipients = _get_admin_emails()
    if not recipients:
        sys.stderr.write("[AdminNotify] No admin emails configured - skipping notification\n")
        return

    sys.stderr.write(f"[AdminNotify] Sending: {subject} → {', '.join(recipients)}\n")

    # Method 1: Resend.com (HTTP API — works on Railway, no SMTP port needed)
    if os.getenv('RESEND_API_KEY'):
        if _send_via_resend(subject, html_body, recipients):
            return

    # Method 2: Gmail SMTP (may be blocked on cloud platforms like Railway)
    if os.getenv('GMAIL_USER') and os.getenv('GMAIL_APP_PASSWORD'):
        if _send_via_gmail_smtp(subject, html_body, recipients):
            return

    sys.stderr.write(f"[AdminNotify] ❌ All email methods failed for: {subject}\n")
    sys.stderr.write(f"[AdminNotify] 💡 TIP: Railway blocks SMTP ports. "
                     f"Set RESEND_API_KEY (free at resend.com) for reliable email on Railway.\n")


def _build_html_email(title, emoji, fields, action_text=None):
    """Build a beautiful HTML email template."""
    rows = ''
    for label, value in fields:
        rows += f'''
            <tr>
              <td style="padding:8px 16px;color:#888;font-size:14px;white-space:nowrap;vertical-align:top;">{label}</td>
              <td style="padding:8px 16px;color:#1a1a2e;font-size:14px;font-weight:600;">{value}</td>
            </tr>'''

    action_html = ''
    if action_text:
        action_html = f'''
        <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px 16px;margin:0 24px 20px;border-radius:4px;">
          <strong style="color:#856404;">⚠️ {action_text}</strong>
        </div>'''

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#ff6b35,#ff9966);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;">{emoji} {title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 0 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              {rows}
            </table>
          </td>
        </tr>
        {action_html}
        <tr>
          <td style="padding:16px 24px 24px;text-align:center;">
            <a href="https://gamespotkdlr.com/admin/dashboard"
               style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
              Open Admin Dashboard
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:11px;">GameSpot Gaming Lounge — Automated Admin Alert</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ==========================================
#  PUBLIC NOTIFICATION FUNCTIONS
# ==========================================

def notify_new_booking(booking_id, customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, devices_text):
    """Notify admin about a new booking."""
    subject = f"🎮 New Booking #{booking_id} — {customer_name}"
    html = _build_html_email(
        f"New Booking #{booking_id}", "🎮",
        [
            ("👤 Customer", customer_name),
            ("📞 Phone", customer_phone),
            ("📅 Date", str(booking_date)),
            ("🕐 Time", str(start_time)),
            ("⏱ Duration", f"{duration_minutes} min"),
            ("🕹 Devices", str(devices_text)),
            ("💰 Price", f"₹{total_price}"),
        ]
    )
    _send_in_background(_send_email, subject, html)


def notify_new_membership_request(membership_id, user_name, user_phone, plan_type, amount):
    """Notify admin about a new membership purchase/request."""
    subject = f"⭐ New Membership — {user_name} ({plan_type})"
    html = _build_html_email(
        "New Membership Request", "⭐",
        [
            ("👤 Member", user_name),
            ("📞 Phone", user_phone),
            ("📋 Plan", str(plan_type)),
            ("💰 Amount", f"₹{amount}"),
        ],
        action_text="Action Required: Approve or Reject"
    )
    _send_in_background(_send_email, subject, html)


def notify_new_quest_pass(quest_id, user_name, user_phone, game_title):
    """Notify admin about a new Quest Pass request."""
    subject = f"🏆 New Quest Pass #{quest_id} — {user_name}"
    html = _build_html_email(
        f"New Quest Pass #{quest_id}", "🏆",
        [
            ("👤 Player", user_name),
            ("📞 Phone", user_phone),
            ("🎮 Game", str(game_title)),
        ],
        action_text="Action Required: Approve"
    )
    _send_in_background(_send_email, subject, html)


def notify_new_party_booking(party_id, customer_name, customer_phone, event_date, event_type, guests):
    """Notify admin about a new party booking."""
    subject = f"🎉 New Party Booking #{party_id} — {customer_name}"
    html = _build_html_email(
        f"New Party Booking #{party_id}", "🎉",
        [
            ("👤 Customer", customer_name),
            ("📞 Phone", customer_phone),
            ("📅 Event Date", str(event_date)),
            ("🎈 Type", str(event_type)),
            ("👥 Guests", str(guests)),
        ]
    )
    _send_in_background(_send_email, subject, html)


def notify_new_offer_claim(claim_id, user_name, user_phone, offer_name):
    """Notify admin about a new offer/promo claim."""
    subject = f"🎁 New Offer Claim #{claim_id} — {user_name}"
    html = _build_html_email(
        f"New Offer Claim #{claim_id}", "🎁",
        [
            ("👤 Customer", user_name),
            ("📞 Phone", user_phone),
            ("🏷 Offer", str(offer_name)),
        ],
        action_text="Action Required: Verify & Approve"
    )
    _send_in_background(_send_email, subject, html)


def notify_new_rental(rental_id, user_name, user_phone, game_title, duration_days):
    """Notify admin about a new game rental."""
    subject = f"📦 New Rental #{rental_id} — {user_name}"
    html = _build_html_email(
        f"New Game Rental #{rental_id}", "📦",
        [
            ("👤 Customer", user_name),
            ("📞 Phone", user_phone),
            ("🎮 Game", str(game_title)),
            ("📅 Duration", f"{duration_days} days"),
        ]
    )
    _send_in_background(_send_email, subject, html)


def notify_generic(title, details_dict):
    """Send a generic admin notification."""
    fields = [(k, str(v)) for k, v in details_dict.items()]
    subject = f"📢 {title}"
    html = _build_html_email(title, "📢", fields)
    _send_in_background(_send_email, subject, html)


def notify_new_feedback(feedback_id, name, email, feedback_type, priority, message):
    """Notify admin about new user feedback."""
    priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(priority, "⚪")
    type_emoji = {"bug": "🐛", "suggestion": "💡", "feature": "🚀", "query": "❓"}.get(feedback_type, "💬")
    subject = f"{type_emoji} New Feedback #{feedback_id} — {name} ({feedback_type})"
    # Truncate message for email preview
    preview = message[:200] + '...' if len(message) > 200 else message
    html = _build_html_email(
        f"New Feedback #{feedback_id}", type_emoji,
        [
            ("👤 Name", name),
            ("📧 Email", email or 'Not provided'),
            ("📋 Type", str(feedback_type).capitalize()),
            (f"{priority_emoji} Priority", str(priority).capitalize()),
            ("💬 Message", preview),
        ],
        action_text="Review this feedback in the Admin Dashboard"
    )
    _send_in_background(_send_email, subject, html)


def notify_new_college_booking(booking_id, contact_name, contact_phone, college_name, event_date, estimated_cost, booking_ref):
    """Notify admin about a new college event booking inquiry."""
    subject = f"🎓 New College Event #{booking_id} — {college_name}"
    html = _build_html_email(
        f"New College Event #{booking_id}", "🎓",
        [
            ("👤 Contact", contact_name),
            ("📞 Phone", contact_phone),
            ("🏫 College", college_name),
            ("📅 Event Date", str(event_date)),
            ("💰 Est. Cost", f"₹{estimated_cost}"),
            ("🔖 Reference", booking_ref),
        ],
        action_text="Review & Respond to Inquiry"
    )
    _send_in_background(_send_email, subject, html)
