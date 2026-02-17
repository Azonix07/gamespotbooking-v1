"""
Rental Bookings API Routes
Handles VR and PS5 rental booking operations
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_admin
from datetime import datetime, timedelta
import re

rentals_bp = Blueprint('rentals', __name__)

def validate_phone(phone):
    """Validate phone number format"""
    pattern = r'^\+?[1-9]\d{1,14}$'
    return re.match(pattern, phone.replace(' ', '').replace('-', ''))

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email)

@rentals_bp.route('/api/rentals', methods=['GET', 'POST', 'OPTIONS'])
def handle_rentals():
    """Handle rental booking operations"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # GET: Retrieve rental bookings (Admin only)
    if request.method == 'GET':
        auth_error = require_admin()
        if auth_error:
            return auth_error
        conn = None
        cursor = None
        
        try:
            # Get query parameters
            status = request.args.get('status')
            device_type = request.args.get('device_type')
            date_from = request.args.get('date_from')
            date_to = request.args.get('date_to')
            limit = request.args.get('limit', 100, type=int)
            offset = request.args.get('offset', 0, type=int)
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Build query with filters
            query = 'SELECT * FROM rental_bookings WHERE 1=1'
            params = []
            
            if status:
                query += ' AND status = %s'
                params.append(status)
            
            if device_type:
                query += ' AND device_type = %s'
                params.append(device_type)
            
            if date_from:
                query += ' AND start_date >= %s'
                params.append(date_from)
            
            if date_to:
                query += ' AND end_date <= %s'
                params.append(date_to)
            
            query += ' ORDER BY created_at DESC LIMIT %s OFFSET %s'
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            rentals = cursor.fetchall()
            
            # Get total count
            count_query = 'SELECT COUNT(*) as total FROM rental_bookings WHERE 1=1'
            count_params = params[:-2]  # Exclude limit and offset
            
            if status:
                count_query += ' AND status = %s'
            if device_type:
                count_query += ' AND device_type = %s'
            if date_from:
                count_query += ' AND start_date >= %s'
            if date_to:
                count_query += ' AND end_date <= %s'
            
            cursor.execute(count_query, count_params if count_params else [])
            total = cursor.fetchone()['total']
            
            return jsonify({
                'success': True,
                'rentals': rentals,
                'total': total,
                'limit': limit,
                'offset': offset
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # POST: Create new rental booking
    if request.method == 'POST':
        conn = None
        cursor = None
        
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = [
                'customer_name', 'customer_phone', 'delivery_address',
                'device_type', 'start_date', 'end_date', 'rental_days',
                'package_type', 'base_price', 'total_price'
            ]
            
            for field in required_fields:
                if field not in data or not data[field]:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Validate phone number
            if not validate_phone(data['customer_phone']):
                return jsonify({
                    'success': False,
                    'error': 'Invalid phone number format'
                }), 400
            
            # Validate email if provided
            if data.get('customer_email') and not validate_email(data['customer_email']):
                return jsonify({
                    'success': False,
                    'error': 'Invalid email format'
                }), 400
            
            # Validate device type
            if data['device_type'] not in ['vr', 'ps5']:
                return jsonify({
                    'success': False,
                    'error': 'Invalid device type. Must be "vr" or "ps5"'
                }), 400
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Generate booking ID
            booking_id = f"RNT-{datetime.now().strftime('%Y%m%d')}-{datetime.now().timestamp():.0f}"
            
            # First, ensure the table exists with proper structure
            try:
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS rental_bookings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        customer_name VARCHAR(100),
                        customer_phone VARCHAR(20),
                        customer_email VARCHAR(255),
                        delivery_address TEXT,
                        device_type VARCHAR(20) DEFAULT 'vr',
                        start_date DATE,
                        end_date DATE,
                        rental_days INT DEFAULT 1,
                        extra_controllers INT DEFAULT 0,
                        controller_cost DECIMAL(10,2) DEFAULT 0,
                        package_type VARCHAR(20) DEFAULT 'daily',
                        base_price DECIMAL(10,2) DEFAULT 0,
                        total_price DECIMAL(10,2) DEFAULT 0,
                        savings DECIMAL(10,2) DEFAULT 0,
                        status VARCHAR(20) DEFAULT 'pending',
                        payment_status VARCHAR(20) DEFAULT 'pending',
                        booking_id VARCHAR(50),
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                conn.commit()
            except:
                conn.rollback()
            
            # Add missing columns if table already exists with different structure
            columns_to_add = [
                ("customer_name", "VARCHAR(100)"),
                ("customer_phone", "VARCHAR(20)"),
                ("customer_email", "VARCHAR(255)"),
                ("delivery_address", "TEXT"),
                ("device_type", "VARCHAR(20) DEFAULT 'vr'"),
                ("start_date", "DATE"),
                ("end_date", "DATE"),
                ("rental_days", "INT DEFAULT 1"),
                ("extra_controllers", "INT DEFAULT 0"),
                ("controller_cost", "DECIMAL(10,2) DEFAULT 0"),
                ("package_type", "VARCHAR(20) DEFAULT 'daily'"),
                ("base_price", "DECIMAL(10,2) DEFAULT 0"),
                ("total_price", "DECIMAL(10,2) DEFAULT 0"),
                ("savings", "DECIMAL(10,2) DEFAULT 0"),
                ("status", "VARCHAR(20) DEFAULT 'pending'"),
                ("payment_status", "VARCHAR(20) DEFAULT 'pending'"),
                ("booking_id", "VARCHAR(50)"),
                ("notes", "TEXT"),
                ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for col_name, col_type in columns_to_add:
                try:
                    cursor.execute(f"ALTER TABLE rental_bookings ADD COLUMN {col_name} {col_type}")
                    conn.commit()
                except Exception as alter_err:
                    # Column already exists or other error - that's fine
                    conn.rollback()
            
            # Insert rental booking
            query = '''
                INSERT INTO rental_bookings (
                    customer_name, customer_phone, customer_email, delivery_address,
                    device_type, rental_type, item_name, start_date, end_date, rental_days,
                    extra_controllers, controller_cost,
                    package_type, base_price, total_price, savings,
                    status, payment_status, booking_id, notes
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            '''
            
            # Determine item name based on device type
            item_name = 'Meta Quest 3' if data['device_type'] == 'vr' else 'PlayStation 5'
            
            params = (
                data['customer_name'],
                data['customer_phone'],
                data.get('customer_email', ''),
                data.get('delivery_address', ''),
                data['device_type'],
                data['device_type'],  # rental_type = device_type (vr or ps5)
                item_name,  # item_name
                data['start_date'],
                data['end_date'],
                data['rental_days'],
                data.get('extra_controllers', 0),
                data.get('controller_cost', 0.00),
                data.get('package_type', 'daily'),
                data.get('base_price', 0),
                data['total_price'],
                data.get('savings', 0.00),
                'pending',
                'pending',
                booking_id,
                data.get('notes', '')
            )
            
            cursor.execute(query, params)
            conn.commit()
            
            rental_id = cursor.lastrowid
            
            # Notify admin
            try:
                from services.admin_notify import notify_new_rental
                notify_new_rental(
                    rental_id=rental_id,
                    user_name=data['customer_name'],
                    user_phone=data['customer_phone'],
                    game_title=item_name,
                    duration_days=data['rental_days']
                )
            except Exception as notify_err:
                import sys
                sys.stderr.write(f"[Rental] Admin notification failed (non-critical): {notify_err}\n")
            
            return jsonify({
                'success': True,
                'message': 'Rental booking created successfully',
                'rental_id': rental_id,
                'booking_id': booking_id
            }), 201
            
        except Exception as e:
            if conn:
                conn.rollback()
            error_msg = str(e).lower()
            # If table doesn't exist, try to create it
            if "doesn't exist" in error_msg or "does not exist" in error_msg or "1146" in str(e):
                try:
                    # Auto-create the table
                    conn2 = get_db_connection()
                    cursor2 = conn2.cursor(dictionary=True)
                    create_table_query = '''
                        CREATE TABLE IF NOT EXISTS rental_bookings (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            customer_name VARCHAR(100) NOT NULL,
                            customer_phone VARCHAR(20) NOT NULL,
                            customer_email VARCHAR(255),
                            delivery_address TEXT NOT NULL,
                            device_type ENUM('vr', 'ps5') NOT NULL DEFAULT 'vr',
                            start_date DATE NOT NULL,
                            end_date DATE NOT NULL,
                            rental_days INT NOT NULL,
                            extra_controllers INT DEFAULT 0,
                            controller_cost DECIMAL(10, 2) DEFAULT 0.00,
                            package_type ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL,
                            base_price DECIMAL(10, 2) NOT NULL,
                            total_price DECIMAL(10, 2) NOT NULL,
                            savings DECIMAL(10, 2) DEFAULT 0.00,
                            status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
                            payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
                            booking_id VARCHAR(50) UNIQUE,
                            notes TEXT,
                            admin_notes TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                        )
                    '''
                    cursor2.execute(create_table_query)
                    conn2.commit()
                    
                    # Now retry the insert
                    cursor2.execute(query, params)
                    conn2.commit()
                    rental_id = cursor2.lastrowid
                    
                    cursor2.close()
                    conn2.close()
                    
                    return jsonify({
                        'success': True,
                        'message': 'Rental booking created successfully (table was auto-created)',
                        'rental_id': rental_id,
                        'booking_id': booking_id
                    }), 201
                except Exception as e2:
                    return jsonify({'success': False, 'error': f'Failed to create table: {str(e2)}'}), 500
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

@rentals_bp.route('/api/rentals/<int:rental_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def handle_rental_by_id(rental_id):
    """Handle individual rental booking operations (admin only)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # All individual rental operations require admin auth
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    # GET: Retrieve specific rental
    if request.method == 'GET':
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = 'SELECT * FROM rental_bookings WHERE id = %s'
            cursor.execute(query, (rental_id,))
            rental = cursor.fetchone()
            
            if not rental:
                return jsonify({
                    'success': False,
                    'error': 'Rental booking not found'
                }), 404
            
            return jsonify({
                'success': True,
                'rental': rental
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # PUT: Update rental booking (admin only — auth checked above)
    if request.method == 'PUT':
        conn = None
        cursor = None
        
        try:
            data = request.get_json()
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Build update query dynamically
            update_fields = []
            params = []
            
            allowed_fields = [
                'status', 'payment_status', 'start_date', 'end_date',
                'total_price', 'admin_notes'
            ]
            
            for field in allowed_fields:
                if field in data:
                    update_fields.append(f'{field} = %s')
                    params.append(data[field])
            
            if not update_fields:
                return jsonify({
                    'success': False,
                    'error': 'No valid fields to update'
                }), 400
            
            params.append(rental_id)
            
            query = f'UPDATE rental_bookings SET {", ".join(update_fields)} WHERE id = %s'
            cursor.execute(query, params)
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({
                    'success': False,
                    'error': 'Rental booking not found'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'Rental booking updated successfully'
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
    
    # DELETE: Cancel/delete rental booking (admin only — auth checked above)
    if request.method == 'DELETE':
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Soft delete: Update status to cancelled
            query = 'UPDATE rental_bookings SET status = %s WHERE id = %s'
            cursor.execute(query, ('cancelled', rental_id))
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({
                    'success': False,
                    'error': 'Rental booking not found'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'Rental booking cancelled successfully'
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

@rentals_bp.route('/api/rentals/stats', methods=['GET', 'OPTIONS'])
def get_rental_stats():
    """Get rental statistics (admin only)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # Require admin auth (supports both session and JWT)
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Call stored procedure
        cursor.callproc('get_rental_stats')
        
        # Fetch results
        stats = None
        for result in cursor.stored_results():
            stats = result.fetchone()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
