"""
Bookings API Route
Handles creating, reading, updating, and deleting bookings
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_admin, verify_token
from middleware.rate_limiter import rate_limit
from utils.helpers import (
    validate_booking_data, 
    get_affected_slots, 
    calculate_ps5_price, 
    calculate_driving_price
)
from routes.membership_routes import VALID_PLANS
import mysql.connector
import sys
import traceback


class BookingError(Exception):
    """Custom exception for booking business-logic errors (safe to show to users)"""
    pass

bookings_bp = Blueprint('bookings', __name__)


# ── Module-level column existence cache ──
# Avoids querying INFORMATION_SCHEMA on every booking POST (~5-15ms each)
_column_cache = {}  # key: "table.column" -> bool

def _has_column(cursor, table_name, column_name):
    """Check if a column exists, with caching to avoid repeated INFORMATION_SCHEMA queries."""
    cache_key = f"{table_name}.{column_name}"
    if cache_key in _column_cache:
        return _column_cache[cache_key]
    try:
        cursor.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s
        """, (table_name, column_name))
        exists = cursor.fetchone() is not None
        _column_cache[cache_key] = exists
        return exists
    except Exception:
        return False


# Note: require_admin is now imported from middleware.auth
# It supports both session-based and JWT token authentication


def _get_current_user_id():
    """
    Try to identify the logged-in user from session or JWT token.
    Returns user_id (int) if authenticated, None otherwise.
    This is optional — bookings work for guests too.
    """
    # 1. Check session (desktop browsers with cookies)
    if session.get('user_logged_in') and session.get('user_id'):
        return session.get('user_id')
    
    # 2. Check JWT token (mobile browsers without cookies)
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer ') and len(auth_header) > 7:
        token = auth_header[7:].strip()
        payload = verify_token(token)
        if payload and payload.get('user_type') == 'customer' and payload.get('user_id'):
            return payload.get('user_id')
    
    return None

@bookings_bp.route('/api/bookings.php', methods=['GET', 'POST', 'PUT', 'DELETE'])
@rate_limit(max_requests=10, window_seconds=60)
def handle_bookings():
    """Handle all booking operations"""
    
    # GET - Fetch all bookings (Admin only)
    if request.method == 'GET':
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get all bookings with devices
            query = """
                SELECT 
                    b.*,
                    bd.id as device_id,
                    bd.device_type,
                    bd.device_number,
                    bd.player_count,
                    bd.price as device_price
                FROM bookings b
                LEFT JOIN booking_devices bd ON b.id = bd.booking_id
                ORDER BY b.id DESC
            """
            
            cursor.execute(query)
            all_rows = cursor.fetchall()
            
            # Group devices by booking
            bookings_map = {}
            for row in all_rows:
                booking_id = row['id']
                
                if booking_id not in bookings_map:
                    bookings_map[booking_id] = {
                        'id': int(row['id']),
                        'customer_name': row['customer_name'],
                        'customer_phone': row['customer_phone'],
                        'booking_date': str(row['booking_date']),
                        'start_time': str(row['start_time'])[:5],
                        'duration_minutes': int(row['duration_minutes']),
                        'total_price': float(row['total_price']),
                        'status': row.get('status') or 'confirmed',
                        'driving_after_ps5': bool(row['driving_after_ps5']),
                        'created_at': str(row['created_at']),
                        'user_id': row.get('user_id'),
                        'devices': []
                    }
                
                if row['device_id']:
                    bookings_map[booking_id]['devices'].append({
                        'device_type': row['device_type'],
                        'device_number': int(row['device_number']) if row['device_number'] else None,
                        'player_count': int(row['player_count']),
                        'price': float(row['device_price'])
                    })
            
            bookings = list(bookings_map.values())
            
            return jsonify({
                'success': True,
                'bookings': bookings
            })
            
        except Exception as e:
            print(f"Error in handle_bookings GET: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # POST - Create new booking
    if request.method == 'POST':
        conn = None
        cursor = None
        
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'Invalid request data'}), 400
            
            # Validate input
            errors = validate_booking_data(data)
            if errors:
                return jsonify({'success': False, 'error': ', '.join(errors)}), 400
            
            customer_name = data['customer_name'].strip()
            customer_phone = data['customer_phone'].strip()
            booking_date = data['booking_date']
            start_time = data['start_time']
            duration_minutes = int(data['duration_minutes'])
            ps5_bookings = data.get('ps5_bookings', [])
            driving_sim = data.get('driving_sim', False)
            driving_after_ps5 = data.get('driving_after_ps5', False)
            total_price = float(data['total_price'])
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Check if bonus_minutes/promo_code_id columns exist (cached)
            has_promo_columns = _has_column(cursor, 'bookings', 'bonus_minutes')
            
            # Start explicit transaction for the booking creation
            # (availability check + insert must be atomic)
            conn.autocommit = False
            
            # Check availability for all affected slots
            affected_slots = get_affected_slots(start_time, duration_minutes)
            
            for slot in affected_slots:
                slot_time = slot + ':00'
                
                # Check PS5 availability
                if ps5_bookings:
                    for ps5 in ps5_bookings:
                        device_number = ps5['device_number']
                        
                        # Check if this PS5 unit is already booked for this slot
                        # FOR UPDATE locks matching rows to prevent double-booking under concurrency
                        query = """
                            SELECT COUNT(*) as count
                            FROM bookings b
                            JOIN booking_devices bd ON b.id = bd.booking_id
                            WHERE b.booking_date = %s
                            AND COALESCE(b.status, 'confirmed') != 'cancelled'
                            AND bd.device_type = 'ps5'
                            AND bd.device_number = %s
                            AND b.start_time <= %s
                            AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
                            FOR UPDATE
                        """
                        
                        cursor.execute(query, (booking_date, device_number, slot_time, slot_time))
                        result = cursor.fetchone()
                        
                        if result['count'] > 0:
                            raise BookingError(f"PS5 Unit {device_number} is not available for the selected time slot")
                    
                    # Check total PS5 player limit (max 10 players at any time)
                    new_total_players = sum(ps5['player_count'] for ps5 in ps5_bookings)
                    
                    query = """
                        SELECT SUM(bd.player_count) as total_players
                        FROM bookings b
                        JOIN booking_devices bd ON b.id = bd.booking_id
                        WHERE b.booking_date = %s
                        AND COALESCE(b.status, 'confirmed') != 'cancelled'
                        AND bd.device_type = 'ps5'
                        AND b.start_time <= %s
                        AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
                        FOR UPDATE
                    """
                    
                    cursor.execute(query, (booking_date, slot_time, slot_time))
                    result = cursor.fetchone()
                    existing_players = int(result['total_players'] or 0)
                    
                    if existing_players + new_total_players > 10:
                        raise BookingError(f"Total PS5 players would exceed maximum of 10 for time slot {slot}")
                
                # Check driving simulator availability
                if driving_sim:
                    # FOR UPDATE locks matching rows to prevent double-booking under concurrency
                    query = """
                        SELECT COUNT(*) as count
                        FROM bookings b
                        JOIN booking_devices bd ON b.id = bd.booking_id
                        WHERE b.booking_date = %s
                        AND COALESCE(b.status, 'confirmed') != 'cancelled'
                        AND bd.device_type = 'driving_sim'
                        AND b.start_time <= %s
                        AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
                        FOR UPDATE
                    """
                    
                    cursor.execute(query, (booking_date, slot_time, slot_time))
                    result = cursor.fetchone()
                    
                    if result['count'] > 0:
                        raise BookingError(f"Driving Simulator is not available for time slot {slot}")
            
            # Detect logged-in user (optional — guests can book too)
            current_user_id = _get_current_user_id()
            
            # If not logged in via session/JWT, try to find user by phone number
            if not current_user_id:
                try:
                    cursor.execute(
                        "SELECT id FROM users WHERE phone = %s LIMIT 1",
                        (customer_phone,)
                    )
                    matched_user = cursor.fetchone()
                    if matched_user:
                        current_user_id = matched_user['id']
                except Exception:
                    pass  # Not critical — proceed as guest
            
            # Check if user_id column exists in bookings table (cached)
            has_user_id_column = _has_column(cursor, 'bookings', 'user_id')
            
            # Insert booking
            bonus_minutes = data.get('bonus_minutes', 0)
            promo_code_id = data.get('promo_code_id')
            
            if has_promo_columns and has_user_id_column:
                query = """
                    INSERT INTO bookings 
                    (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, driving_after_ps5, bonus_minutes, promo_code_id, user_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(query, (
                    customer_name,
                    customer_phone,
                    booking_date,
                    start_time + ':00',
                    duration_minutes,
                    total_price,
                    1 if driving_after_ps5 else 0,
                    bonus_minutes,
                    promo_code_id,
                    current_user_id  # NULL for guests, user_id for logged-in users
                ))
            elif has_user_id_column:
                query = """
                    INSERT INTO bookings 
                    (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, driving_after_ps5, user_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(query, (
                    customer_name,
                    customer_phone,
                    booking_date,
                    start_time + ':00',
                    duration_minutes,
                    total_price,
                    1 if driving_after_ps5 else 0,
                    current_user_id
                ))
            elif has_promo_columns:
                query = """
                    INSERT INTO bookings 
                    (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, driving_after_ps5, bonus_minutes, promo_code_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(query, (
                    customer_name,
                    customer_phone,
                    booking_date,
                    start_time + ':00',
                    duration_minutes,
                    total_price,
                    1 if driving_after_ps5 else 0,
                    bonus_minutes,
                    promo_code_id
                ))
            else:
                query = """
                    INSERT INTO bookings 
                    (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, driving_after_ps5)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(query, (
                    customer_name,
                    customer_phone,
                    booking_date,
                    start_time + ':00',
                    duration_minutes,
                    total_price,
                    1 if driving_after_ps5 else 0
                ))
            
            booking_id = cursor.lastrowid
            
            # Insert PS5 bookings
            devices_inserted = 0
            if ps5_bookings:
                query = """
                    INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price)
                    VALUES (%s, 'ps5', %s, %s, %s)
                """
                
                for ps5 in ps5_bookings:
                    price = calculate_ps5_price(ps5['player_count'], duration_minutes)
                    cursor.execute(query, (
                        booking_id,
                        ps5['device_number'],
                        ps5['player_count'],
                        price
                    ))
                    devices_inserted += 1
            
            # Insert driving simulator booking
            if driving_sim:
                price = calculate_driving_price(duration_minutes)
                query = """
                    INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price)
                    VALUES (%s, 'driving_sim', NULL, 1, %s)
                """
                cursor.execute(query, (booking_id, price))
                devices_inserted += 1
            
            conn.commit()
            # Restore autocommit for post-booking operations (promo, points, membership)
            # These are non-critical and can each auto-commit independently
            conn.autocommit = True
            sys.stderr.write(f"[Booking] Created booking #{booking_id} with {devices_inserted} device(s)\n")
            sys.stderr.flush()
            
            # ─── Notify admin about new booking ───
            try:
                from services.admin_notify import notify_new_booking
                devices_text_parts = []
                for ps5 in ps5_bookings:
                    devices_text_parts.append(f"PS5-{ps5['device_number']} ({ps5['player_count']}p)")
                if driving_sim:
                    devices_text_parts.append("Driving Sim")
                devices_text = ', '.join(devices_text_parts) or 'N/A'
                notify_new_booking(
                    booking_id=booking_id,
                    customer_name=customer_name,
                    customer_phone=customer_phone,
                    booking_date=booking_date,
                    start_time=start_time,
                    duration_minutes=duration_minutes,
                    total_price=total_price,
                    devices_text=devices_text
                )
            except Exception as notify_err:
                sys.stderr.write(f"[Booking] Admin notification failed (non-critical): {notify_err}\n")
            
            # Mark promo code as used if applicable
            if promo_code_id:
                try:
                    cursor.execute('''
                        UPDATE promo_codes
                        SET current_uses = current_uses + 1
                        WHERE id = %s
                    ''', (promo_code_id,))
                except Exception as promo_err:
                    print(f'Warning: Failed to update promo code usage: {str(promo_err)}')
            
            # Award points to logged-in user (50% of booking amount)
            if current_user_id and total_price > 0:
                try:
                    from routes.user_routes import award_booking_points
                    award_booking_points(current_user_id, total_price)
                    
                    # Mark booking as points_awarded
                    try:
                        cursor.execute(
                            "UPDATE bookings SET points_awarded = TRUE WHERE id = %s",
                            (booking_id,)
                        )
                    except Exception:
                        pass  # points_awarded column might not exist
                    
                    sys.stderr.write(f"[Booking] Points awarded to user {current_user_id} for booking #{booking_id}\n")
                except Exception as pts_err:
                    sys.stderr.write(f"[Booking] Points award failed (non-critical): {pts_err}\n")
            
            # ─── Track membership hours usage ───
            if current_user_id:
                try:
                    booking_hours = duration_minutes / 60.0
                    # Determine which device categories are in this booking
                    has_ps5 = bool(ps5_bookings)
                    has_driving = bool(driving_sim)

                    # Fetch user's active memberships
                    cursor.execute('''
                        SELECT id, plan_type,
                               COALESCE(total_hours, 0) as total_hours,
                               COALESCE(hours_used, 0) as hours_used
                        FROM memberships
                        WHERE user_id = %s AND status = 'active' AND end_date >= CURDATE()
                        ORDER BY created_at DESC
                    ''', (current_user_id,))
                    user_memberships = cursor.fetchall()

                    for mem in user_memberships:
                        plan_info = VALID_PLANS.get(mem['plan_type'], {})
                        cat = plan_info.get('category', '')
                        remaining_h = max(0, float(mem['total_hours']) - float(mem['hours_used']))

                        # Only deduct if category matches devices AND hours are sufficient
                        should_deduct = False
                        if cat == 'story' and has_ps5 and remaining_h >= booking_hours:
                            # Membership only covers limited players:
                            # god_mode covers 2 players, all others cover 1.
                            # Only deduct hours if ALL PS5 units have player_count within coverage.
                            covered_players = 2 if mem['plan_type'] == 'god_mode' else 1
                            all_units_covered = all(
                                ps5.get('player_count', 1) <= covered_players
                                for ps5 in (ps5_bookings if isinstance(ps5_bookings, list) else [])
                            )
                            if all_units_covered:
                                should_deduct = True
                            else:
                                sys.stderr.write(
                                    f"[Booking] Skipping membership #{mem['id']} hour deduction — "
                                    f"player count exceeds covered_players ({covered_players}) "
                                    f"for booking #{booking_id}\n"
                                )
                        elif cat == 'driving' and has_driving and remaining_h >= booking_hours:
                            should_deduct = True

                        if should_deduct:
                            cursor.execute('''
                                UPDATE memberships
                                SET hours_used = hours_used + %s
                                WHERE id = %s
                            ''', (booking_hours, mem['id']))
                            sys.stderr.write(
                                f"[Booking] Deducted {booking_hours}h from membership #{mem['id']} "
                                f"({mem['plan_type']}) for booking #{booking_id}\n"
                            )

                    # Try to store membership_id and membership_rate flag on the booking (cached check)
                    if _has_column(cursor, 'bookings', 'membership_id'):
                        # Find the primary membership used (story for ps5, driving for sim)
                        primary_mem_id = None
                        mem_rate_applied = False
                        for mem in user_memberships:
                            pi = VALID_PLANS.get(mem['plan_type'], {})
                            c = pi.get('category', '')
                            rem = max(0, float(mem['total_hours']) - float(mem['hours_used']))
                            if c == 'story' and has_ps5 and rem >= 0:
                                # Check player count coverage before marking rate applied
                                cp = 2 if mem['plan_type'] == 'god_mode' else 1
                                all_ok = all(
                                    ps5.get('player_count', 1) <= cp
                                    for ps5 in (ps5_bookings if isinstance(ps5_bookings, list) else [])
                                )
                                if all_ok:
                                    primary_mem_id = mem['id']
                                    mem_rate_applied = True
                                    break
                            elif c == 'driving' and has_driving and rem >= 0:
                                primary_mem_id = mem['id']
                                mem_rate_applied = True
                                break
                        if primary_mem_id:
                            try:
                                cursor.execute('''
                                    UPDATE bookings SET membership_id = %s, membership_rate = %s WHERE id = %s
                                ''', (primary_mem_id, 1 if mem_rate_applied else 0, booking_id))
                            except Exception:
                                pass  # membership_rate column might not exist yet

                except Exception as mem_err:
                    sys.stderr.write(f"[Booking] Membership hours tracking failed (non-critical): {mem_err}\n")

            return jsonify({
                'success': True,
                'booking_id': booking_id,
                'message': 'Booking created successfully'
            }), 201
            
        except BookingError as e:
            if conn:
                conn.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400
        except Exception as e:
            if conn:
                conn.rollback()
            sys.stderr.write(f"[Booking POST] Unexpected error: {e}\n")
            sys.stderr.write(f"[Booking POST] Traceback:\n{traceback.format_exc()}\n")
            return jsonify({'success': False, 'error': 'An error occurred while creating the booking. Please try again.'}), 400
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # PUT - Update booking (Admin only)
    if request.method == 'PUT':
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        booking_id = request.args.get('id')
        if not booking_id:
            return jsonify({'success': False, 'error': 'Booking ID is required'}), 400
        
        conn = None
        cursor = None
        
        try:
            data = request.get_json()
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get current booking
            query = "SELECT * FROM bookings WHERE id = %s"
            cursor.execute(query, (booking_id,))
            booking = cursor.fetchone()
            
            if not booking:
                return jsonify({'success': False, 'error': 'Booking not found'}), 404
            
            # Update only provided fields
            updates = []
            params = []
            
            if 'start_time' in data:
                updates.append("start_time = %s")
                params.append(data['start_time'] + ':00')
            
            if 'duration_minutes' in data:
                updates.append("duration_minutes = %s")
                params.append(int(data['duration_minutes']))
            
            if 'total_price' in data:
                updates.append("total_price = %s")
                params.append(float(data['total_price']))
            
            if updates:
                params.append(booking_id)
                query = f"UPDATE bookings SET {', '.join(updates)} WHERE id = %s"
                cursor.execute(query, params)
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Booking updated successfully'
            })
            
        except Exception as e:
            if conn:
                conn.rollback()
            sys.stderr.write(f"[Booking PUT] Unexpected error: {e}\n")
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # DELETE - Delete booking (Admin only)
    if request.method == 'DELETE':
        auth_error = require_admin()
        if auth_error:
            return auth_error
        
        booking_id = request.args.get('id')
        if not booking_id:
            return jsonify({'success': False, 'error': 'Booking ID is required'}), 400
        
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            query = "DELETE FROM bookings WHERE id = %s"
            cursor.execute(query, (booking_id,))
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Booking deleted successfully'
            })
            
        except Exception as e:
            sys.stderr.write(f"[Booking DELETE] Unexpected error: {e}\n")
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
