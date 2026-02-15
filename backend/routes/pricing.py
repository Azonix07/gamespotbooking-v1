"""
Pricing API Route
Handles price calculations with membership rate-based pricing.
Optimized: skips DB query for anonymous users, single-pass computation.
"""

from flask import Blueprint, request, jsonify, session
from utils.helpers import calculate_ps5_price, calculate_driving_price
from config.database import get_db_connection

pricing_bp = Blueprint('pricing', __name__)

# Import plan metadata
from routes.membership_routes import VALID_PLANS


def _get_user_id_from_request():
    """Extract user_id from session or JWT — lightweight, no DB call."""
    uid = session.get('user_id')
    if uid:
        return uid
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer ') and len(auth_header) > 7:
        try:
            from middleware.auth import verify_token
            payload = verify_token(auth_header[7:].strip())
            if payload and payload.get('user_id'):
                return payload['user_id']
        except Exception:
            pass
    return None


def get_user_active_memberships(user_id):
    """Get all active memberships for a user (could have story + driving)"""
    if not user_id:
        return []

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = '''
            SELECT
                id, plan_type,
                COALESCE(total_hours, 0) as total_hours,
                COALESCE(hours_used, 0) as hours_used,
                discount_percentage,
                DATEDIFF(end_date, CURDATE()) as days_remaining
            FROM memberships
            WHERE user_id = %s
            AND status = 'active'
            AND end_date >= CURDATE()
            AND plan_type IN ('solo_quest','legend_mode','god_mode','ignition','turbo','apex')
            ORDER BY created_at DESC
        '''
        cursor.execute(query, (user_id,))
        return cursor.fetchall()

    except Exception as e:
        print(f"Error fetching memberships: {e}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def calculate_membership_price(duration_minutes, rate_per_hour):
    """Calculate price using membership hourly rate"""
    return round(rate_per_hour * duration_minutes / 60.0, 2)


@pricing_bp.route('/api/pricing.php', methods=['POST', 'OPTIONS'])
def calculate_pricing():
    """Calculate pricing for bookings with membership rate support"""

    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()

        ps5_bookings = data.get('ps5_bookings', [])
        driving_sim = data.get('driving_sim', False)
        duration_minutes = data.get('duration_minutes', 0)

        # Lenient duration validation — default to 60 if invalid so pricing doesn't break
        if duration_minutes not in [30, 60, 90, 120]:
            duration_minutes = 60

        ps5_price = 0
        driving_price = 0
        breakdown = []

        # Calculate PS5 prices — each unit can have its own duration
        if isinstance(ps5_bookings, list):
            for ps5 in ps5_bookings:
                player_count = ps5.get('player_count', 0)
                device_number = ps5.get('device_number', 0)
                # Per-unit duration: use unit's own duration, fallback to global
                unit_dur = ps5.get('duration', duration_minutes)
                if unit_dur not in [30, 60, 90, 120]:
                    unit_dur = duration_minutes

                if 1 <= player_count <= 4:
                    price = calculate_ps5_price(player_count, unit_dur)
                    ps5_price += price

                    breakdown.append({
                        'device': f'PS5 Unit {device_number}',
                        'players': player_count,
                        'duration': unit_dur,
                        'price': price
                    })

        # Calculate driving simulator price (normal rate)
        if driving_sim:
            driving_price = calculate_driving_price(duration_minutes)
            breakdown.append({
                'device': 'Driving Simulator',
                'players': 1,
                'price': driving_price
            })

        original_price = ps5_price + driving_price

        # ─── Check membership-based pricing ───
        # Skip DB call entirely for anonymous users (no session, no JWT)
        user_id = _get_user_id_from_request()
        memberships = get_user_active_memberships(user_id) if user_id else []

        # Find relevant memberships by category
        story_membership = None
        driving_membership = None

        for m in memberships:
            plan_info = VALID_PLANS.get(m['plan_type'], {})
            cat = plan_info.get('category', '')
            if cat == 'story' and not story_membership:
                m['_plan_info'] = plan_info
                story_membership = m
            elif cat == 'driving' and not driving_membership:
                m['_plan_info'] = plan_info
                driving_membership = m

        membership_ps5_final = ps5_price
        membership_driving_final = driving_price
        membership_applied = False
        hours_warning = False
        hours_warning_message = ''
        active_membership_info = None

        # booking_hours = max duration across all PS5 units (or driving duration)
        # This is used to check if the user has enough membership hours
        max_ps5_duration = max(
            [ps5.get('duration', duration_minutes) for ps5 in (ps5_bookings if isinstance(ps5_bookings, list) else [])],
            default=duration_minutes
        )
        booking_hours = max(max_ps5_duration, duration_minutes) / 60.0

        # Apply story membership to PS5 bookings
        # IMPORTANT: Membership pass covers ONLY the pass holder (1 player).
        # Exception: god_mode allows bringing 1 friend free (covers 2 players).
        # Extra players beyond the covered count are charged at normal rates.
        if story_membership and ps5_price > 0:
            total_h = float(story_membership['total_hours'])
            used_h = float(story_membership['hours_used'])
            remaining_h = max(0, total_h - used_h)
            rate = story_membership['_plan_info'].get('rate', 0)
            plan_type = story_membership['plan_type']

            # god_mode covers 2 players (pass holder + 1 friend), others cover 1
            covered_players = 2 if plan_type == 'god_mode' else 1

            if remaining_h >= booking_hours:
                # Calculate membership price per PS5 unit considering player count
                membership_ps5_final = 0
                for ps5 in (ps5_bookings if isinstance(ps5_bookings, list) else []):
                    player_count = ps5.get('player_count', 1)
                    unit_dur = ps5.get('duration', duration_minutes)
                    if unit_dur not in [30, 60, 90, 120]:
                        unit_dur = duration_minutes

                    # Membership rate applies to covered players
                    members_covered = min(player_count, covered_players)
                    extra_players = max(0, player_count - covered_players)

                    # Covered players at membership rate
                    member_price = calculate_membership_price(unit_dur, rate)
                    # Extra players at normal rate (difference between full price and covered-only price)
                    if extra_players > 0:
                        normal_full = calculate_ps5_price(player_count, unit_dur)
                        normal_covered_only = calculate_ps5_price(members_covered, unit_dur)
                        extra_price = normal_full - normal_covered_only
                    else:
                        extra_price = 0

                    membership_ps5_final += member_price + extra_price

                membership_applied = True
                active_membership_info = {
                    'id': story_membership['id'],
                    'plan_type': story_membership['plan_type'],
                    'category': 'story',
                    'rate_per_hour': rate,
                    'hours_remaining': remaining_h,
                    'hours_this_booking': booking_hours,
                    'days_remaining': story_membership['days_remaining'],
                    'covered_players': covered_players
                }
            else:
                # Hours exceeded — normal price + warning
                hours_warning = True
                hours_warning_message = (
                    f'Story Pass has {remaining_h:.1f}h remaining but booking '
                    f'needs {booking_hours:.1f}h. Normal rate applied for PS5.'
                )

        # Apply driving membership to driving sim bookings
        if driving_membership and driving_price > 0:
            total_h = float(driving_membership['total_hours'])
            used_h = float(driving_membership['hours_used'])
            remaining_h = max(0, total_h - used_h)
            rate = driving_membership['_plan_info'].get('rate', 0)

            if remaining_h >= booking_hours:
                membership_driving_final = calculate_membership_price(duration_minutes, rate)
                membership_applied = True
                if not active_membership_info:
                    active_membership_info = {
                        'id': driving_membership['id'],
                        'plan_type': driving_membership['plan_type'],
                        'category': 'driving',
                        'rate_per_hour': rate,
                        'hours_remaining': remaining_h,
                        'hours_this_booking': booking_hours,
                        'days_remaining': driving_membership['days_remaining']
                    }
            else:
                if not hours_warning:
                    hours_warning = True
                    hours_warning_message = (
                        f'Driving Pass has {remaining_h:.1f}h remaining but booking '
                        f'needs {booking_hours:.1f}h. Normal rate applied for Driving Sim.'
                    )

        final_price = membership_ps5_final + membership_driving_final
        discount_amount = max(0, original_price - final_price)

        response_data = {
            'success': True,
            'ps5_price': ps5_price,
            'driving_price': driving_price,
            'original_price': original_price,
            'total_price': final_price,
            'breakdown': breakdown,
            'has_discount': membership_applied and discount_amount > 0,
            'discount_percentage': round(
                (discount_amount / original_price * 100) if original_price > 0 else 0, 1
            ),
            'discount_amount': discount_amount,
            'hours_warning': hours_warning,
            'hours_warning_message': hours_warning_message
        }

        if active_membership_info:
            response_data['membership'] = active_membership_info

        return jsonify(response_data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
