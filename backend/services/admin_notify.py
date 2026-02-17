"""
Admin Notification Service for GameSpot
Sends FREE Telegram notifications to admin when new bookings or requests come in.

WHY TELEGRAM?
  - 100% free forever (no trial limits, no per-message cost)
  - Instant push notifications on Android/iOS/Desktop
  - Supports multiple admins via a single Telegram group
  - No phone number verification or sandbox joining needed
  - Simple HTTP API - just needs a bot token and chat ID

SETUP (one-time, 2 minutes):
  1. Open Telegram, search for @BotFather
  2. Send /newbot -> give it a name (e.g. "GameSpot Alerts")
  3. Copy the bot token -> set as TELEGRAM_BOT_TOKEN env var
  4. Create a Telegram group, add all 3 admins + the bot
  5. Get the group chat ID (send a message, then check the API)
  6. Set TELEGRAM_CHAT_ID env var

Environment Variables:
  TELEGRAM_BOT_TOKEN  - Bot token from @BotFather (required)
  TELEGRAM_CHAT_ID    - Group chat ID where notifications go (required)
                        Can be comma-separated for multiple groups/users
"""

import os
import sys
import threading
import requests as _requests
from datetime import datetime


def _get_bot_token():
    return os.getenv('TELEGRAM_BOT_TOKEN', '')


def _get_chat_ids():
    """Return list of Telegram chat IDs (group or individual)."""
    raw = os.getenv('TELEGRAM_CHAT_ID', '')
    if not raw:
        return []
    return [c.strip() for c in raw.split(',') if c.strip()]


def _send_in_background(fn, *args, **kwargs):
    """Run notification in a background thread so it doesn't slow down the API response."""
    def _worker():
        try:
            fn(*args, **kwargs)
        except Exception as e:
            sys.stderr.write(f"[AdminNotify] Background send error: {e}\n")
    t = threading.Thread(target=_worker, daemon=True)
    t.start()


def _send_telegram(message):
    """Send a Telegram message to all configured chat IDs."""
    bot_token = _get_bot_token()
    chat_ids = _get_chat_ids()

    if not bot_token:
        sys.stderr.write("[AdminNotify] TELEGRAM_BOT_TOKEN not set - skipping notification\n")
        return
    if not chat_ids:
        sys.stderr.write("[AdminNotify] TELEGRAM_CHAT_ID not set - skipping notification\n")
        return

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    for chat_id in chat_ids:
        try:
            resp = _requests.post(url, json={
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML',
                'disable_web_page_preview': True
            }, timeout=10)

            if resp.status_code == 200:
                sys.stderr.write(f"[AdminNotify] Telegram sent to chat {chat_id}\n")
            else:
                sys.stderr.write(f"[AdminNotify] Telegram failed for chat {chat_id}: {resp.status_code} {resp.text[:200]}\n")
        except Exception as e:
            sys.stderr.write(f"[AdminNotify] Telegram error for chat {chat_id}: {e}\n")


# ==========================================
#  PUBLIC NOTIFICATION FUNCTIONS
# ==========================================

def notify_new_booking(booking_id, customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, devices_text):
    """Notify admin about a new booking."""
    msg = (
        f"🎮 <b>New Booking #{booking_id}</b>\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"👤 <b>Customer:</b> {customer_name}\n"
        f"📞 <b>Phone:</b> {customer_phone}\n"
        f"📅 <b>Date:</b> {booking_date}\n"
        f"🕐 <b>Time:</b> {start_time}\n"
        f"⏱ <b>Duration:</b> {duration_minutes} min\n"
        f"🕹 <b>Devices:</b> {devices_text}\n"
        f"💰 <b>Price:</b> ₹{total_price}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🔗 <a href='https://gamespotkdlr.com/admin/dashboard'>Open Dashboard</a>"
    )
    _send_in_background(_send_telegram, msg)


def notify_new_membership_request(membership_id, user_name, user_phone, plan_type, amount):
    """Notify admin about a new membership purchase/request."""
    msg = (
        f"⭐ <b>New Membership Request</b>\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"👤 <b>Member:</b> {user_name}\n"
        f"📞 <b>Phone:</b> {user_phone}\n"
        f"📋 <b>Plan:</b> {plan_type}\n"
        f"💰 <b>Amount:</b> ₹{amount}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"⚠️ <b>Action Required:</b> Approve or Reject\n"
        f"🔗 <a href='https://gamespotkdlr.com/admin/dashboard'>Open Dashboard</a>"
    )
    _send_in_background(_send_telegram, msg)


def notify_new_quest_pass(quest_id, user_name, user_phone, game_title):
    """Notify admin about a new Quest Pass request."""
    msg = (
        f"🏆 <b>New Quest Pass #{quest_id}</b>\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"👤 <b>Player:</b> {user_name}\n"
        f"📞 <b>Phone:</b> {user_phone}\n"
        f"🎮 <b>Game:</b> {game_title}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"⚠️ <b>Action Required:</b> Approve\n"
        f"🔗 <a href='https://gamespotkdlr.com/admin/dashboard'>Open Dashboard</a>"
    )
    _send_in_background(_send_telegram, msg)


def notify_new_party_booking(party_id, customer_name, customer_phone, event_date, event_type, guests):
    """Notify admin about a new party booking."""
    msg = (
        f"🎉 <b>New Party Booking #{party_id}</b>\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"�� <b>Customer:</b> {customer_name}\n"
        f"📞 <b>Phone:</b> {customer_phone}\n"
        f"📅 <b>Event Date:</b> {event_date}\n"
        f"🎈 <b>Type:</b> {event_type}\n"
        f"👥 <b>Guests:</b> {guests}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🔗 <a href='https://gamespotkdlr.com/admin/dashboard'>Open Dashboard</a>"
    )
    _send_in_background(_send_telegram, msg)


def notify_new_offer_claim(claim_id, user_name, user_phone, offer_name):
    """Notify admin about a new offer/promo claim."""
    msg = (
        f"🎁 <b>New Offer Claim #{claim_id}</b>\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"👤 <b>Customer:</b> {user_name}\n"
        f"📞 <b>Phone:</b> {user_phone}\n"
        f"🏷 <b>Offer:</b> {offer_name}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"⚠️ <b>Action Required:</b> Verify & Approve\n"
        f"🔗 <a href='https://gamespotkdlr.com/admin/dashboard'>Open Dashboard</a>"
    )
    _send_in_background(_send_telegram, msg)


def notify_new_rental(rental_id, user_name, user_phone, game_title, duration_days):
    """Notify admin about a new game rental."""
    msg = (
        f"📦 <b>New Game Rental #{rental_id}</b>\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"👤 <b>Customer:</b> {user_name}\n"
        f"📞 <b>Phone:</b> {user_phone}\n"
        f"🎮 <b>Game:</b> {game_title}\n"
        f"📅 <b>Duration:</b> {duration_days} days\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🔗 <a href='https://gamespotkdlr.com/admin/dashboard'>Open Dashboard</a>"
    )
    _send_in_background(_send_telegram, msg)


def notify_generic(title, details_dict):
    """Send a generic admin notification."""
    details = '\n'.join(f"<b>{k}:</b> {v}" for k, v in details_dict.items())
    msg = (
        f"📢 <b>{title}</b>\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"{details}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🔗 <a href='https://gamespotkdlr.com/admin/dashboard'>Open Dashboard</a>"
    )
    _send_in_background(_send_telegram, msg)
