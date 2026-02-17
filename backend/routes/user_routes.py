"""
User Profile and Rewards Routes
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_auth
import os
from werkzeug.utils import secure_filename
from datetime import datetime

user_bp = Blueprint('user', __name__)

# Configure upload folder
UPLOAD_FOLDER = 'static/uploads/profiles'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@user_bp.route('/api/user/profile', methods=['GET'])
@require_auth
def get_profile(user):
    """Get user profile, rewards data, and booking history — optimized single-pass"""
    try:
        user_id = user.get('id') or session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get user profile + rewards in ONE query (avoids 2 separate queries)
        cursor.execute("""
            SELECT id, name, email, phone, profile_picture, created_at,
                   COALESCE(gamespot_points, 0) AS gamespot_points,
                   COALESCE(instagram_shares, 0) AS instagram_shares,
                   COALESCE(free_playtime_minutes, 0) AS free_playtime_minutes
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        profile = cursor.fetchone()
        
        if not profile:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Extract rewards from the same row
        rewards = {
            'gamespot_points': profile.pop('gamespot_points', 0),
            'instagram_shares': profile.pop('instagram_shares', 0),
            'free_playtime_minutes': profile.pop('free_playtime_minutes', 0)
        }
        
        # Convert datetime to string
        if profile.get('created_at'):
            profile['created_at'] = profile['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        
        user_phone = profile.get('phone', '')
        
        # Get booking history with status + points_awarded in ONE query
        # Uses COALESCE to handle missing columns gracefully
        try:
            cursor.execute("""
                SELECT 
                    b.id,
                    b.customer_name,
                    b.booking_date,
                    b.start_time,
                    b.duration_minutes,
                    b.total_price,
                    b.created_at,
                    COALESCE(b.status, 'confirmed') AS status,
                    COALESCE(b.points_awarded, 0) AS points_awarded,
                    GROUP_CONCAT(
                        CONCAT(bd.device_type, ':', COALESCE(bd.device_number, 'NA'), ':', bd.player_count)
                        SEPARATOR '|'
                    ) as devices
                FROM bookings b
                LEFT JOIN booking_devices bd ON b.id = bd.booking_id
                WHERE b.user_id = %s OR b.customer_phone = %s
                GROUP BY b.id
                ORDER BY b.booking_date DESC, b.start_time DESC
                LIMIT 50
            """, (user_id, user_phone))
        except Exception:
            # Fallback if status/points_awarded columns missing
            cursor.execute("""
                SELECT 
                    b.id,
                    b.customer_name,
                    b.booking_date,
                    b.start_time,
                    b.duration_minutes,
                    b.total_price,
                    b.created_at,
                    'confirmed' AS status,
                    0 AS points_awarded,
                    GROUP_CONCAT(
                        CONCAT(bd.device_type, ':', COALESCE(bd.device_number, 'NA'), ':', bd.player_count)
                        SEPARATOR '|'
                    ) as devices
                FROM bookings b
                LEFT JOIN booking_devices bd ON b.id = bd.booking_id
                WHERE b.customer_phone = %s
                GROUP BY b.id
                ORDER BY b.booking_date DESC, b.start_time DESC
                LIMIT 50
            """, (user_phone,))
        
        bookings = cursor.fetchall()
        
        # Format bookings — pure Python, NO extra DB queries
        formatted_bookings = []
        for booking in bookings:
            devices_list = []
            if booking.get('devices'):
                try:
                    for device_str in booking['devices'].split('|'):
                        parts = device_str.split(':')
                        if len(parts) >= 3:
                            devices_list.append({
                                'type': parts[0],
                                'number': None if parts[1] == 'NA' else int(parts[1]),
                                'players': int(parts[2])
                            })
                except Exception:
                    pass
            
            points_awarded = bool(booking.get('points_awarded'))
            
            formatted_bookings.append({
                'id': booking['id'],
                'booked_as': booking.get('customer_name', ''),
                'date': booking['booking_date'].strftime('%Y-%m-%d') if booking.get('booking_date') else '',
                'time': str(booking.get('start_time', '')),
                'duration': booking.get('duration_minutes', 0),
                'price': float(booking.get('total_price', 0)),
                'status': booking.get('status', 'confirmed'),
                'devices': devices_list,
                'points_earned': int(float(booking.get('total_price', 0)) * 0.50) if points_awarded else 0,
                'created_at': booking['created_at'].strftime('%Y-%m-%d %H:%M:%S') if booking.get('created_at') else ''
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'profile': profile,
            'rewards': rewards,
            'bookings': formatted_bookings
        })
        
    except Exception as e:
        import sys, traceback
        sys.stderr.write(f'[Profile] Error: {str(e)}\n')
        sys.stderr.write(f'[Profile] Traceback:\n{traceback.format_exc()}\n')
        return jsonify({'success': False, 'error': 'An error occurred'}), 500


@user_bp.route('/api/user/profile-picture', methods=['POST'])
@require_auth
def upload_profile_picture(user):
    """Upload user profile picture"""
    try:
        user_id = user.get('id') or session.get('user_id')
        
        if 'profile_picture' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['profile_picture']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        # Create upload directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        # Generate unique filename
        filename = secure_filename(f'user_{user_id}_{datetime.now().timestamp()}.{file.filename.rsplit(".", 1)[1].lower()}')
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save file
        file.save(filepath)
        
        # Update database
        profile_picture_url = f'/{filepath.replace(os.sep, "/")}'
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users
            SET profile_picture = %s
            WHERE id = %s
        """, (profile_picture_url, user_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Profile picture updated',
            'profile_picture': profile_picture_url
        })
        
    except Exception as e:
        import sys; sys.stderr.write(f'[Profile Picture Upload] Error: {str(e)}')
        return jsonify({'success': False, 'error': 'An error occurred'}), 500


@user_bp.route('/api/rewards/instagram-share', methods=['POST'])
@require_auth
def track_instagram_share(user):
    """Track Instagram share"""
    try:
        user_id = user.get('id') or session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get current shares
        cursor.execute("""
            SELECT instagram_shares
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        current_shares = user['instagram_shares'] or 0
        
        if current_shares >= 5:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'You have already completed 5 shares'
            }), 400
        
        # Increment share count
        new_shares = current_shares + 1
        
        cursor.execute("""
            UPDATE users
            SET instagram_shares = %s
            WHERE id = %s
        """, (new_shares, user_id))
        
        conn.commit()
        
        # Get updated rewards
        cursor.execute("""
            SELECT gamespot_points, instagram_shares, free_playtime_minutes
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        rewards = {
            'gamespot_points': user['gamespot_points'] or 0,
            'instagram_shares': user['instagram_shares'] or 0,
            'free_playtime_minutes': user['free_playtime_minutes'] or 0
        }
        
        cursor.close()
        conn.close()
        
        message = f'Share {new_shares}/5 tracked!' if new_shares < 5 else 'Congratulations! You can now claim your 30 minutes free playtime!'
        
        return jsonify({
            'success': True,
            'message': message,
            'rewards': rewards
        })
        
    except Exception as e:
        import sys; sys.stderr.write(f'[Instagram Share] Error: {str(e)}')
        return jsonify({'success': False, 'error': 'An error occurred'}), 500


@user_bp.route('/api/rewards/redeem', methods=['POST'])
@require_auth
def redeem_reward(user):
    """Redeem rewards using points"""
    try:
        user_id = user.get('id') or session.get('user_id')
        data = request.get_json()
        reward_type = data.get('reward_type')
        
        if not reward_type:
            return jsonify({'success': False, 'error': 'Reward type required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get user's current points
        cursor.execute("""
            SELECT gamespot_points, instagram_shares, free_playtime_minutes
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        current_points = user['gamespot_points'] or 0
        
        # Define rewards
        rewards_config = {
            'instagram_free_time': {
                'points_required': 0,
                'description': '30 minutes free playtime from Instagram share',
                'action': 'free_playtime',
                'value': 30,
                'check': lambda u: u['instagram_shares'] >= 5 and u['free_playtime_minutes'] == 0
            },
            'ps5_extra_hour': {
                'points_required': 500,
                'description': '1 hour extra PS5 time (min booking ₹300)',
                'action': 'voucher',
                'value': '1_hour_ps5'
            },
            'vr_free_day': {
                'points_required': 3000,
                'description': '1 day VR rental free',
                'action': 'voucher',
                'value': '1_day_vr'
            }
        }
        
        if reward_type not in rewards_config:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'Invalid reward type'}), 400
        
        reward = rewards_config[reward_type]
        
        # Special check for Instagram reward
        if reward_type == 'instagram_free_time':
            if not reward['check'](user):
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'error': 'Reward not available'}), 400
            
            # Grant free playtime
            cursor.execute("""
                UPDATE users
                SET free_playtime_minutes = free_playtime_minutes + %s
                WHERE id = %s
            """, (reward['value'], user_id))
        else:
            # Check if user has enough points
            if current_points < reward['points_required']:
                cursor.close()
                conn.close()
                return jsonify({
                    'success': False,
                    'error': f'Not enough points. Need {reward["points_required"]} points.'
                }), 400
            
            # Deduct points
            cursor.execute("""
                UPDATE users
                SET gamespot_points = gamespot_points - %s
                WHERE id = %s
            """, (reward['points_required'], user_id))
        
        # Record redemption
        cursor.execute("""
            INSERT INTO user_rewards (user_id, reward_type, points_spent, reward_description)
            VALUES (%s, %s, %s, %s)
        """, (user_id, reward_type, reward.get('points_required', 0), reward['description']))
        
        conn.commit()
        
        # Get updated rewards
        cursor.execute("""
            SELECT gamespot_points, instagram_shares, free_playtime_minutes
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        user = cursor.fetchone()
        
        rewards = {
            'gamespot_points': user['gamespot_points'] or 0,
            'instagram_shares': user['instagram_shares'] or 0,
            'free_playtime_minutes': user['free_playtime_minutes'] or 0
        }
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Reward redeemed successfully! {reward["description"]}',
            'rewards': rewards
        })
        
    except Exception as e:
        import sys; sys.stderr.write(f'[Redeem Reward] Error: {str(e)}')
        return jsonify({'success': False, 'error': 'An error occurred'}), 500


@user_bp.route('/api/user/bookings/<int:booking_id>/cancel', methods=['POST', 'OPTIONS'])
@require_auth
def cancel_booking(user, booking_id):
    """
    Cancel a user's own booking.
    Rules:
      - Booking must belong to the user (by user_id or phone)
      - Booking must be in 'confirmed' status
      - Booking must be at least 2 hours in the future
    """
    if request.method == 'OPTIONS':
        return '', 200

    conn = None
    cursor = None
    try:
        user_id_val = user.get('id') or session.get('user_id')
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get user phone for matching
        cursor.execute("SELECT phone FROM users WHERE id = %s", (user_id_val,))
        user_row = cursor.fetchone()
        user_phone = user_row['phone'] if user_row else ''

        # Fetch the booking
        cursor.execute("""
            SELECT id, booking_date, start_time, duration_minutes, total_price,
                   customer_phone, user_id,
                   COALESCE(status, 'confirmed') AS status
            FROM bookings WHERE id = %s
        """, (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404

        # Verify ownership
        owns_booking = False
        if booking.get('user_id') and int(booking['user_id']) == int(user_id_val):
            owns_booking = True
        elif booking.get('customer_phone') == user_phone:
            owns_booking = True

        if not owns_booking:
            return jsonify({'success': False, 'error': 'You can only cancel your own bookings'}), 403

        # Check status
        if booking['status'] != 'confirmed':
            return jsonify({'success': False, 'error': f'Cannot cancel a booking with status: {booking["status"]}'}), 400

        # Check 2-hour cutoff
        booking_date = booking['booking_date']
        start_time = booking['start_time']
        # start_time may be timedelta
        if hasattr(start_time, 'total_seconds'):
            total_secs = int(start_time.total_seconds())
            hours_part = total_secs // 3600
            mins_part = (total_secs % 3600) // 60
        else:
            parts = str(start_time).split(':')
            hours_part = int(parts[0])
            mins_part = int(parts[1])

        booking_datetime = datetime.combine(
            booking_date,
            datetime.min.time().replace(hour=hours_part, minute=mins_part)
        )
        now = datetime.now()
        time_until = (booking_datetime - now).total_seconds()

        if time_until < 7200:  # 2 hours = 7200 seconds
            return jsonify({
                'success': False,
                'error': 'Bookings can only be cancelled at least 2 hours before the scheduled time'
            }), 400

        # Cancel the booking
        cursor.execute(
            "UPDATE bookings SET status = 'cancelled' WHERE id = %s",
            (booking_id,)
        )
        conn.commit()

        import sys
        sys.stderr.write(f"[Cancel] User {user_id_val} cancelled booking #{booking_id}\n")

        return jsonify({
            'success': True,
            'message': 'Booking cancelled successfully'
        })

    except Exception as e:
        if conn:
            conn.rollback()
        import sys, traceback
        sys.stderr.write(f"[Cancel Booking] Error: {e}\n{traceback.format_exc()}\n")
        return jsonify({'success': False, 'error': 'An error occurred while cancelling'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# Function to award points after booking (called from booking routes)
def award_booking_points(user_id, booking_amount):
    """Award points to user after successful booking (50% of amount)"""
    try:
        points_earned = int(booking_amount * 0.50)  # 50% of booking amount
        
        if points_earned == 0:
            return
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Add points to user
        cursor.execute("""
            UPDATE users
            SET gamespot_points = gamespot_points + %s
            WHERE id = %s
        """, (points_earned, user_id))
        
        # Record in points history
        cursor.execute("""
            INSERT INTO points_history (user_id, points_earned, points_type, booking_amount)
            VALUES (%s, %s, 'booking', %s)
        """, (user_id, points_earned, booking_amount))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        import sys; sys.stderr.write(f'[Points] Awarded {points_earned} points to user {user_id} for booking ₹{booking_amount}')
        
    except Exception as e:
        import sys; sys.stderr.write(f'[Award Points] Error: {str(e)}')
