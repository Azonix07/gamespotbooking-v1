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
def get_profile():
    """Get user profile, rewards data, and booking history"""
    try:
        user_id = session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get user profile
        cursor.execute("""
            SELECT id, name, email, phone, profile_picture, gamespot_points, 
                   instagram_shares, free_playtime_minutes, created_at
            FROM users
            WHERE id = %s
        """, (user_id,))
        
        profile = cursor.fetchone()
        
        if not profile:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get rewards data
        rewards = {
            'gamespot_points': profile['gamespot_points'] or 0,
            'instagram_shares': profile['instagram_shares'] or 0,
            'free_playtime_minutes': profile['free_playtime_minutes'] or 0
        }
        
        # Get user's booking history
        cursor.execute("""
            SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.duration_minutes,
                b.total_price,
                b.status,
                b.driving_after_ps5,
                b.points_awarded,
                b.created_at,
                GROUP_CONCAT(
                    CONCAT(bd.device_type, ':', COALESCE(bd.device_number, 'NA'), ':', bd.player_count)
                    SEPARATOR '|'
                ) as devices
            FROM bookings b
            LEFT JOIN booking_devices bd ON b.id = bd.booking_id
            WHERE b.user_id = %s
            GROUP BY b.id
            ORDER BY b.booking_date DESC, b.start_time DESC
            LIMIT 50
        """, (user_id,))
        
        bookings = cursor.fetchall()
        
        # Format bookings data
        formatted_bookings = []
        for booking in bookings:
            devices_list = []
            if booking['devices']:
                for device_str in booking['devices'].split('|'):
                    parts = device_str.split(':')
                    devices_list.append({
                        'type': parts[0],
                        'number': None if parts[1] == 'NA' else int(parts[1]),
                        'players': int(parts[2])
                    })
            
            formatted_bookings.append({
                'id': booking['id'],
                'date': booking['booking_date'].strftime('%Y-%m-%d'),
                'time': str(booking['start_time']),
                'duration': booking['duration_minutes'],
                'price': float(booking['total_price']),
                'status': booking['status'],
                'devices': devices_list,
                'points_earned': int(booking['total_price'] * 0.50) if booking['points_awarded'] else 0,
                'created_at': booking['created_at'].strftime('%Y-%m-%d %H:%M:%S')
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
        print(f'[Profile] Error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


@user_bp.route('/api/user/profile-picture', methods=['POST'])
@require_auth
def upload_profile_picture():
    """Upload user profile picture"""
    try:
        user_id = session.get('user_id')
        
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
        print(f'[Profile Picture Upload] Error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


@user_bp.route('/api/rewards/instagram-share', methods=['POST'])
@require_auth
def track_instagram_share():
    """Track Instagram share"""
    try:
        user_id = session.get('user_id')
        
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
        print(f'[Instagram Share] Error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


@user_bp.route('/api/rewards/redeem', methods=['POST'])
@require_auth
def redeem_reward():
    """Redeem rewards using points"""
    try:
        user_id = session.get('user_id')
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
        print(f'[Redeem Reward] Error: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


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
        
        print(f'[Points] Awarded {points_earned} points to user {user_id} for booking ₹{booking_amount}')
        
    except Exception as e:
        print(f'[Award Points] Error: {str(e)}')
