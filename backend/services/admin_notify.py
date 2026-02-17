"""
Admin Notification Service for GameSpot
Sends email/WhatsApp notifications to admin when new bookings or requests come in.

Required Environment Variable:
  ADMIN_NOTIFY_EMAIL  - Admin's email address to receive notifications
                        (e.g. admin@gamespot.in or your personal Gmail)

Optional:
  ADMIN_NOTIFY_PHONE  - Admin's phone number for WhatsApp alerts (e.g. +919645136006)

Uses the existing EmailService (Brevo/Resend/SMTP) and SMSService (Twilio/WhatsApp).
"""

import os
import sys
import threading
from datetime import datetime


def _get_admin_email():
    return os.getenv('ADMIN_NOTIFY_EMAIL', '')


def _get_admin_phone():
    return os.getenv('ADMIN_NOTIFY_PHONE', '')


def _send_in_background(fn, *args, **kwargs):
    """Run notification in a background thread so it doesn't slow down the API response."""
    def _worker():
        try:
            fn(*args, **kwargs)
        except Exception as e:
            sys.stderr.write(f"[AdminNotify] Background send error: {e}\n")
    t = threading.Thread(target=_worker, daemon=True)
    t.start()


def _send_admin_email(subject, html_body, text_body=None):
    """Send an email to admin using existing EmailService."""
    admin_email = _get_admin_email()
    if not admin_email:
        sys.stderr.write("[AdminNotify] ⚠️ ADMIN_NOTIFY_EMAIL not set — skipping email notification\n")
        return

    try:
        from services.email_service import email_service
        if not email_service.enabled:
            sys.stderr.write("[AdminNotify] ⚠️ Email service not configured — skipping notification\n")
            return
        success, msg = email_service.send_email(admin_email, subject, html_body, text_body)
        if success:
            sys.stderr.write(f"[AdminNotify] ✅ Email sent to {admin_email}: {subject}\n")
        else:
            sys.stderr.write(f"[AdminNotify] ❌ Email failed: {msg}\n")
    except Exception as e:
        sys.stderr.write(f"[AdminNotify] ❌ Email error: {e}\n")


def _send_admin_whatsapp(message):
    """Send a WhatsApp message to admin using existing SMSService."""
    admin_phone = _get_admin_phone()
    if not admin_phone:
        return  # WhatsApp is optional

    try:
        from services.sms_service import sms_service
        if not sms_service.enabled:
            return

        if sms_service.provider in ('twilio', 'whatsapp'):
            from twilio.rest import Client
            client = sms_service.twilio_client

            if not admin_phone.startswith('+'):
                admin_phone = f'+91{admin_phone}'

            client.messages.create(
                body=message,
                from_=sms_service.twilio_whatsapp_number or sms_service.twilio_phone,
                to=f'whatsapp:{admin_phone}' if sms_service.provider == 'whatsapp' else admin_phone
            )
            sys.stderr.write(f"[AdminNotify] ✅ WhatsApp/SMS sent to {admin_phone}\n")
    except Exception as e:
        sys.stderr.write(f"[AdminNotify] ⚠️ WhatsApp/SMS failed (non-critical): {e}\n")


# ═══════════════════════════════════════════
#  PUBLIC NOTIFICATION FUNCTIONS
# ═══════════════════════════════════════════

def notify_new_booking(booking_id, customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, devices_text):
    """Notify admin about a new booking."""

    subject = f"🎮 New Booking #{booking_id} — {customer_name}"

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:30px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">🎮 New Booking!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#333;">
              <tr><td style="font-weight:600;color:#888;width:130px;">Booking ID</td><td style="font-weight:700;color:#ff6b35;">#{booking_id}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Customer</td><td>{customer_name}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Phone</td><td><a href="tel:{customer_phone}" style="color:#2563eb;">{customer_phone}</a></td></tr>
              <tr><td style="font-weight:600;color:#888;">Date</td><td>{booking_date}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Time</td><td>{start_time}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Duration</td><td>{duration_minutes} min</td></tr>
              <tr><td style="font-weight:600;color:#888;">Devices</td><td>{devices_text}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Total Price</td><td style="font-weight:700;color:#059669;">₹{total_price}</td></tr>
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="https://gamespotkdlr.com/admin/dashboard"
                 style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                View in Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:14px 32px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:11px;">GameSpot Admin Notification • {datetime.now().strftime('%d %b %Y, %I:%M %p')}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    text_body = (
        f"🎮 NEW BOOKING #{booking_id}\n"
        f"Customer: {customer_name}\n"
        f"Phone: {customer_phone}\n"
        f"Date: {booking_date}\n"
        f"Time: {start_time}\n"
        f"Duration: {duration_minutes} min\n"
        f"Devices: {devices_text}\n"
        f"Price: ₹{total_price}\n"
        f"Dashboard: https://gamespotkdlr.com/admin/dashboard"
    )

    whatsapp_msg = (
        f"🎮 *New Booking #{booking_id}*\n"
        f"👤 {customer_name}\n"
        f"📞 {customer_phone}\n"
        f"📅 {booking_date} at {start_time}\n"
        f"⏱ {duration_minutes} min\n"
        f"🕹 {devices_text}\n"
        f"💰 ₹{total_price}"
    )

    _send_in_background(_send_admin_email, subject, html_body, text_body)
    _send_in_background(_send_admin_whatsapp, whatsapp_msg)


def notify_new_membership_request(membership_id, user_name, user_phone, plan_type, amount):
    """Notify admin about a new membership purchase/request."""

    subject = f"⭐ New Membership Request — {user_name} ({plan_type})"

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:30px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">⭐ New Membership Request</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#333;">
              <tr><td style="font-weight:600;color:#888;width:130px;">Member</td><td>{user_name}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Phone</td><td><a href="tel:{user_phone}" style="color:#2563eb;">{user_phone}</a></td></tr>
              <tr><td style="font-weight:600;color:#888;">Plan</td><td style="font-weight:700;color:#d97706;">{plan_type}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Amount</td><td style="font-weight:700;color:#059669;">₹{amount}</td></tr>
            </table>
            <p style="color:#dc2626;font-weight:600;font-size:13px;margin:20px 0 0;text-align:center;">⚠️ Action Required: Approve or Reject in Dashboard</p>
            <div style="margin-top:16px;text-align:center;">
              <a href="https://gamespotkdlr.com/admin/dashboard"
                 style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                View in Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:14px 32px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:11px;">GameSpot Admin Notification • {datetime.now().strftime('%d %b %Y, %I:%M %p')}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    whatsapp_msg = (
        f"⭐ *New Membership Request*\n"
        f"👤 {user_name}\n"
        f"📞 {user_phone}\n"
        f"📋 Plan: {plan_type}\n"
        f"💰 ₹{amount}\n"
        f"⚠️ Please approve/reject in dashboard"
    )

    _send_in_background(_send_admin_email, subject, html_body)
    _send_in_background(_send_admin_whatsapp, whatsapp_msg)


def notify_new_quest_pass(quest_id, user_name, user_phone, game_title):
    """Notify admin about a new Quest Pass request."""

    subject = f"🏆 New Quest Pass — {user_name} ({game_title})"

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:30px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">🏆 New Quest Pass</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#333;">
              <tr><td style="font-weight:600;color:#888;width:130px;">Quest ID</td><td>#{quest_id}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Player</td><td>{user_name}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Phone</td><td><a href="tel:{user_phone}" style="color:#2563eb;">{user_phone}</a></td></tr>
              <tr><td style="font-weight:600;color:#888;">Game</td><td style="font-weight:700;color:#6d28d9;">{game_title}</td></tr>
            </table>
            <p style="color:#dc2626;font-weight:600;font-size:13px;margin:20px 0 0;text-align:center;">⚠️ Action Required: Approve in Dashboard</p>
            <div style="margin-top:16px;text-align:center;">
              <a href="https://gamespotkdlr.com/admin/dashboard"
                 style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                View in Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:14px 32px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:11px;">GameSpot Admin Notification • {datetime.now().strftime('%d %b %Y, %I:%M %p')}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    whatsapp_msg = (
        f"🏆 *New Quest Pass*\n"
        f"👤 {user_name}\n"
        f"📞 {user_phone}\n"
        f"🎮 Game: {game_title}\n"
        f"⚠️ Please approve in dashboard"
    )

    _send_in_background(_send_admin_email, subject, html_body)
    _send_in_background(_send_admin_whatsapp, whatsapp_msg)


def notify_new_party_booking(party_id, customer_name, customer_phone, event_date, event_type, guests):
    """Notify admin about a new party booking."""

    subject = f"🎉 New Party Booking — {customer_name} ({event_type})"

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:30px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#ec4899,#db2777);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">🎉 New Party Booking</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#333;">
              <tr><td style="font-weight:600;color:#888;width:130px;">Booking ID</td><td>#{party_id}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Customer</td><td>{customer_name}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Phone</td><td><a href="tel:{customer_phone}" style="color:#2563eb;">{customer_phone}</a></td></tr>
              <tr><td style="font-weight:600;color:#888;">Event Date</td><td>{event_date}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Event Type</td><td style="font-weight:700;color:#db2777;">{event_type}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Guests</td><td>{guests}</td></tr>
            </table>
            <div style="margin-top:20px;text-align:center;">
              <a href="https://gamespotkdlr.com/admin/dashboard"
                 style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                View in Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:14px 32px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:11px;">GameSpot Admin Notification • {datetime.now().strftime('%d %b %Y, %I:%M %p')}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    whatsapp_msg = (
        f"🎉 *New Party Booking*\n"
        f"👤 {customer_name}\n"
        f"📞 {customer_phone}\n"
        f"📅 {event_date}\n"
        f"🎈 {event_type} — {guests} guests\n"
        f"Check dashboard for details"
    )

    _send_in_background(_send_admin_email, subject, html_body)
    _send_in_background(_send_admin_whatsapp, whatsapp_msg)


def notify_new_offer_claim(claim_id, user_name, user_phone, offer_name):
    """Notify admin about a new offer/promo claim (e.g. Instagram promo)."""

    subject = f"🎁 New Offer Claim — {user_name} ({offer_name})"

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:30px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">🎁 New Offer Claim</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#333;">
              <tr><td style="font-weight:600;color:#888;width:130px;">Claim ID</td><td>#{claim_id}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Customer</td><td>{user_name}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Phone</td><td><a href="tel:{user_phone}" style="color:#2563eb;">{user_phone}</a></td></tr>
              <tr><td style="font-weight:600;color:#888;">Offer</td><td style="font-weight:700;color:#ea580c;">{offer_name}</td></tr>
            </table>
            <p style="color:#dc2626;font-weight:600;font-size:13px;margin:20px 0 0;text-align:center;">⚠️ Action Required: Verify & Approve</p>
            <div style="margin-top:16px;text-align:center;">
              <a href="https://gamespotkdlr.com/admin/dashboard"
                 style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                View in Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:14px 32px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:11px;">GameSpot Admin Notification • {datetime.now().strftime('%d %b %Y, %I:%M %p')}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    whatsapp_msg = (
        f"🎁 *New Offer Claim*\n"
        f"👤 {user_name}\n"
        f"📞 {user_phone}\n"
        f"🏷 {offer_name}\n"
        f"⚠️ Please verify & approve"
    )

    _send_in_background(_send_admin_email, subject, html_body)
    _send_in_background(_send_admin_whatsapp, whatsapp_msg)


def notify_new_rental(rental_id, user_name, user_phone, game_title, duration_days):
    """Notify admin about a new game rental."""

    subject = f"📦 New Game Rental — {user_name} ({game_title})"

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:30px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0ea5e9,#0284c7);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">📦 New Game Rental</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#333;">
              <tr><td style="font-weight:600;color:#888;width:130px;">Rental ID</td><td>#{rental_id}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Customer</td><td>{user_name}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Phone</td><td><a href="tel:{user_phone}" style="color:#2563eb;">{user_phone}</a></td></tr>
              <tr><td style="font-weight:600;color:#888;">Game</td><td style="font-weight:700;color:#0284c7;">{game_title}</td></tr>
              <tr><td style="font-weight:600;color:#888;">Duration</td><td>{duration_days} days</td></tr>
            </table>
            <div style="margin-top:20px;text-align:center;">
              <a href="https://gamespotkdlr.com/admin/dashboard"
                 style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                View in Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:14px 32px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:11px;">GameSpot Admin Notification • {datetime.now().strftime('%d %b %Y, %I:%M %p')}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    whatsapp_msg = (
        f"📦 *New Game Rental*\n"
        f"👤 {user_name}\n"
        f"📞 {user_phone}\n"
        f"🎮 {game_title}\n"
        f"📅 {duration_days} days"
    )

    _send_in_background(_send_admin_email, subject, html_body)
    _send_in_background(_send_admin_whatsapp, whatsapp_msg)


def notify_generic(title, details_dict):
    """Send a generic admin notification with a title and key-value details."""

    subject = f"📢 {title}"

    rows = ''.join(
        f'<tr><td style="font-weight:600;color:#888;width:130px;">{k}</td><td>{v}</td></tr>'
        for k, v in details_dict.items()
    )

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:30px 0;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#ff6b35,#ff8c42);padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:20px;">📢 {title}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#333;">
              {rows}
            </table>
            <div style="margin-top:20px;text-align:center;">
              <a href="https://gamespotkdlr.com/admin/dashboard"
                 style="display:inline-block;background:#ff6b35;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
                View in Dashboard →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:14px 32px;text-align:center;">
            <p style="margin:0;color:#aaa;font-size:11px;">GameSpot Admin Notification • {datetime.now().strftime('%d %b %Y, %I:%M %p')}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    whatsapp_msg = f"📢 *{title}*\n" + '\n'.join(f"{k}: {v}" for k, v in details_dict.items())

    _send_in_background(_send_admin_email, subject, html_body)
    _send_in_background(_send_admin_whatsapp, whatsapp_msg)
