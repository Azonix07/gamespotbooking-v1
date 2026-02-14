"""
Party Booking API Route
Handles creating, reading, and deleting party/full-shop bookings.
A party booking reserves ALL devices (PS5-1, PS5-2, PS5-3, Driving Sim) for 1-3 hours.
Price: ₹600 per hour.
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_admin, verify_token
from utils.helpers import get_affected_slots, generate_time_slots
from datetime import datetime, timedelta
import sys
import traceback


class PartyBookingError(Exception):
    """Custom exception for party booking errors"""
    pass


party_booking_bp = Blueprint('party_booking', __name__)

PARTY_PRICE_PER_HOUR = 600  # ₹600 per hour


def _get_current_user_id():
    """Get current user ID from session or JWT token"""
    # Try session first
    user_id = session.get('user_id')
    if user_id:
        return user_id
    
    # Try JWT token
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload:
                return payload.get('user_id')
        except Exception:
            pass
    return None


@party_booking_bp.route('/api/party-booking', methods=['GET', 'POST', 'DELETE', 'OPTIONS'])
def party_booking():
    """Party booking CRUD endpoint"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # GET - List all party bookings (Admin)
    if request.method == 'GET':
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT 
                    b.id,
                    b.customer_name,
                    b.customer_phone,
                    b.booking_date,
                    b.start_time,
                    b.duration_minutes,
                    b.total_price,
                    b.created_at,
                    b.booking_type
                FROM bookings b
                WHERE b.booking_type = 'party'
                ORDER BY b.booking_date DESC, b.start_time DESC
            """
            
            cursor.execute(query)
            bookings = cursor.fetchall()
            
            # Format the results
            formatted = []
            for booking in bookings:
                formatted.append({
                    'id': booking['id'],
                    'customer_name': booking['customer_name'],
                    'customer_phone': booking['customer_phone'],
                    'booking_date': str(booking['booking_date']),
                    'start_time': str(booking['start_time'])[:5],
                    'duration_minutes': booking['duration_minutes'],
                    'hours': booking['duration_minutes'] // 60,
                    'total_price': float(booking['total_price']),
                    'created_at': str(booking['created_at']),
                    'booking_type': 'party'
                })
            
            return jsonify({
                'success': True,
                'party_bookings': formatted
            })
            
        except Exception as e:
            sys.stderr.write(f"[Party GET] Error: {e}\n")
            # If booking_type column doesn't exist yet, return empty
            return jsonify({
                'success': True,
                'party_bookings': []
            })
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # POST - Create party booking
    if request.method == 'POST':
        conn = None
        cursor = None
        
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'Invalid request data'}), 400
            
            # Validate input
            customer_name = (data.get('customer_name') or '').strip()
            customer_phone = (data.get('customer_phone') or '').strip()
            booking_date = data.get('booking_date')
            start_time = data.get('start_time')
            hours = int(data.get('hours', 1))
            
            if len(customer_name) < 2:
                return jsonify({'success': False, 'error': 'Customer name is required (min 2 chars)'}), 400
            if len(customer_phone) < 10:
                return jsonify({'success': False, 'error': 'Valid phone number required (min 10 digits)'}), 400
            if not booking_date:
                return jsonify({'success': False, 'error': 'Booking date is required'}), 400
            if not start_time:
                return jsonify({'success': False, 'error': 'Start time is required'}), 400
            if hours not in [1, 2, 3]:
                return jsonify({'success': False, 'error': 'Hours must be 1, 2, or 3'}), 400
            
            # Validate date is not in the past
            try:
                bdate = datetime.strptime(booking_date, '%Y-%m-%d').date()
                if bdate < datetime.now().date():
                    return jsonify({'success': False, 'error': 'Booking date cannot be in the past'}), 400
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid date format'}), 400
            
            duration_minutes = hours * 60
            total_price = hours * PARTY_PRICE_PER_HOUR
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Ensure booking_type column exists
            try:
                cursor.execute("""
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'booking_type'
                """)
                if not cursor.fetchone():
                    cursor.execute("""
                        ALTER TABLE bookings ADD COLUMN booking_type VARCHAR(20) DEFAULT 'regular'
                    """)
                    conn.commit()
                    sys.stderr.write("[Party] Added booking_type column to bookings table\n")
            except Exception as col_err:
                sys.stderr.write(f"[Party] Column check error (non-critical): {col_err}\n")
            
            # Check availability — ALL devices must be free for the entire duration
            affected_slots = get_affected_slots(start_time, duration_minutes)
            
            for slot in affected_slots:
                slot_time = slot + ':00'
                
                # Check if ANY device is booked in this slot
                query = """
                    SELECT COUNT(*) as count
                    FROM bookings b
                    JOIN booking_devices bd ON b.id = bd.booking_id
                    WHERE b.booking_date = %s
                    AND b.start_time <= %s
                    AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
                """
                cursor.execute(query, (booking_date, slot_time, slot_time))
                result = cursor.fetchone()
                
                if result['count'] > 0:
                    raise PartyBookingError(
                        f"Time slot {slot} is not fully available. Some devices are already booked. "
                        f"Party booking requires ALL devices to be free."
                    )
            
            # Detect logged-in user
            current_user_id = _get_current_user_id()
            if not current_user_id:
                try:
                    cursor.execute(
                        "SELECT id FROM users WHERE phone = %s LIMIT 1",
                        (customer_phone,)
                    )
                    matched = cursor.fetchone()
                    if matched:
                        current_user_id = matched['id']
                except Exception:
                    pass
            
            # Check which columns exist
            has_user_id = True
            try:
                cursor.execute("""
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'user_id'
                """)
                if not cursor.fetchone():
                    has_user_id = False
            except Exception:
                has_user_id = False
            
            # Insert the party booking
            if has_user_id:
                query = """
                    INSERT INTO bookings 
                    (customer_name, customer_phone, booking_date, start_time, duration_minutes, 
                     total_price, driving_after_ps5, booking_type, user_id)
                    VALUES (%s, %s, %s, %s, %s, %s, 0, 'party', %s)
                """
                cursor.execute(query, (
                    customer_name, customer_phone, booking_date,
                    start_time + ':00', duration_minutes, total_price, current_user_id
                ))
            else:
                query = """
                    INSERT INTO bookings 
                    (customer_name, customer_phone, booking_date, start_time, duration_minutes, 
                     total_price, driving_after_ps5, booking_type)
                    VALUES (%s, %s, %s, %s, %s, %s, 0, 'party')
                """
                cursor.execute(query, (
                    customer_name, customer_phone, booking_date,
                    start_time + ':00', duration_minutes, total_price
                ))
            
            booking_id = cursor.lastrowid
            
            # Insert booking_devices for ALL devices (PS5-1, PS5-2, PS5-3, Driving Sim)
            # This ensures the slot availability system automatically blocks these slots
            device_query = """
                INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price)
                VALUES (%s, %s, %s, %s, %s)
            """
            
            # Book all 3 PS5 units with max players
            ps5_share = total_price * 0.75 / 3  # 75% split among 3 PS5s
            driving_share = total_price * 0.25    # 25% for driving sim
            
            for unit in [1, 2, 3]:
                cursor.execute(device_query, (booking_id, 'ps5', unit, 4, round(ps5_share, 2)))
            
            # Book driving simulator
            cursor.execute(device_query, (booking_id, 'driving_sim', None, 1, round(driving_share, 2)))
            
            conn.commit()
            
            sys.stderr.write(f"[Party] Created party booking #{booking_id} for {booking_date} at {start_time} ({hours}h)\n")
            
            return jsonify({
                'success': True,
                'booking_id': booking_id,
                'message': f'Party booking created! Full shop booked for {hours} hour{"s" if hours > 1 else ""} at ₹{total_price}',
                'total_price': total_price
            }), 201
            
        except PartyBookingError as e:
            if conn:
                conn.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400
        except Exception as e:
            if conn:
                conn.rollback()
            sys.stderr.write(f"[Party POST] Error: {e}\n")
            sys.stderr.write(f"[Party POST] Traceback:\n{traceback.format_exc()}\n")
            return jsonify({'success': False, 'error': 'An error occurred while creating the party booking.'}), 400
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # DELETE - Delete party booking (Admin only)
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
            
            # Delete booking (booking_devices will cascade if FK exists, otherwise delete manually)
            try:
                cursor.execute("DELETE FROM booking_devices WHERE booking_id = %s", (booking_id,))
            except Exception:
                pass
            
            cursor.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Party booking deleted successfully'
            })
            
        except Exception as e:
            sys.stderr.write(f"[Party DELETE] Error: {e}\n")
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
