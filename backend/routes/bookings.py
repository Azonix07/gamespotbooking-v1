"""
Bookings API Route
Handles creating, reading, updating, and deleting bookings
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_admin
from middleware.rate_limiter import rate_limit
from utils.helpers import (
    validate_booking_data, 
    get_affected_slots, 
    calculate_ps5_price, 
    calculate_driving_price
)
import mysql.connector

bookings_bp = Blueprint('bookings', __name__)


# Note: require_admin is now imported from middleware.auth
# It supports both session-based and JWT token authentication

@bookings_bp.route('/api/bookings.php', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def handle_bookings():
    """Handle all booking operations"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
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
                ORDER BY b.booking_date DESC, b.start_time DESC, b.id
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
                        'driving_after_ps5': bool(row['driving_after_ps5']),
                        'created_at': str(row['created_at']),
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
            
            # Start transaction
            conn.start_transaction()
            
            # Check availability for all affected slots
            affected_slots = get_affected_slots(start_time, duration_minutes)
            
            for slot in affected_slots:
                slot_time = slot + ':00'
                
                # Check PS5 availability
                if ps5_bookings:
                    for ps5 in ps5_bookings:
                        device_number = ps5['device_number']
                        
                        # Check if this PS5 unit is already booked for this slot
                        query = """
                            SELECT COUNT(*) as count
                            FROM bookings b
                            JOIN booking_devices bd ON b.id = bd.booking_id
                            WHERE b.booking_date = %s
                            AND bd.device_type = 'ps5'
                            AND bd.device_number = %s
                            AND b.start_time <= %s
                            AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
                        """
                        
                        cursor.execute(query, (booking_date, device_number, slot_time, slot_time))
                        result = cursor.fetchone()
                        
                        if result['count'] > 0:
                            raise Exception(f"PS5 Unit {device_number} is not available for the selected time slot")
                    
                    # Check total PS5 player limit (max 10 players at any time)
                    new_total_players = sum(ps5['player_count'] for ps5 in ps5_bookings)
                    
                    query = """
                        SELECT SUM(bd.player_count) as total_players
                        FROM bookings b
                        JOIN booking_devices bd ON b.id = bd.booking_id
                        WHERE b.booking_date = %s
                        AND bd.device_type = 'ps5'
                        AND b.start_time <= %s
                        AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
                    """
                    
                    cursor.execute(query, (booking_date, slot_time, slot_time))
                    result = cursor.fetchone()
                    existing_players = int(result['total_players'] or 0)
                    
                    if existing_players + new_total_players > 10:
                        raise Exception(f"Total PS5 players would exceed maximum of 10 for time slot {slot}")
                
                # Check driving simulator availability
                if driving_sim:
                    query = """
                        SELECT COUNT(*) as count
                        FROM bookings b
                        JOIN booking_devices bd ON b.id = bd.booking_id
                        WHERE b.booking_date = %s
                        AND bd.device_type = 'driving_sim'
                        AND b.start_time <= %s
                        AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
                    """
                    
                    cursor.execute(query, (booking_date, slot_time, slot_time))
                    result = cursor.fetchone()
                    
                    if result['count'] > 0:
                        raise Exception(f"Driving Simulator is not available for time slot {slot}")
            
            # Insert booking
            bonus_minutes = data.get('bonus_minutes', 0)
            promo_code_id = data.get('promo_code_id')
            
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
            
            booking_id = cursor.lastrowid
            
            # Insert PS5 bookings
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
            
            # Insert driving simulator booking
            if driving_sim:
                price = calculate_driving_price(duration_minutes)
                query = """
                    INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price)
                    VALUES (%s, 'driving_sim', NULL, 1, %s)
                """
                cursor.execute(query, (booking_id, price))
            
            conn.commit()
            
            # Mark promo code as used if applicable
            if promo_code_id:
                try:
                    cursor.execute('''
                        UPDATE promo_codes
                        SET current_uses = current_uses + 1
                        WHERE id = %s
                    ''', (promo_code_id,))
                    conn.commit()
                except Exception as promo_err:
                    print(f'Warning: Failed to update promo code usage: {str(promo_err)}')
            
            return jsonify({
                'success': True,
                'booking_id': booking_id,
                'message': 'Booking created successfully'
            }), 201
            
        except Exception as e:
            if conn:
                conn.rollback()
            return jsonify({'success': False, 'error': 'An error occurred'}), 400
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
            
            conn.start_transaction()
            
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
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
