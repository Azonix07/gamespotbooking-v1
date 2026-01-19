"""
College Setup Bookings API Routes
Handles college event and gaming setup requests
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from datetime import datetime
import re
import math

college_bp = Blueprint('college', __name__)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    distance = R * c
    return round(distance, 2)

def validate_phone(phone):
    """Validate phone number format"""
    pattern = r'^\+?[1-9]\d{1,14}$'
    return re.match(pattern, phone.replace(' ', '').replace('-', ''))

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email)

# GameSpot Kodungallur location
GAMESPOT_LAT = 10.2167
GAMESPOT_LNG = 76.2000

@college_bp.route('/api/college-bookings', methods=['GET', 'POST', 'OPTIONS'])
def handle_college_bookings():
    """Handle college booking operations"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # GET: Retrieve college bookings (with optional filters)
    if request.method == 'GET':
        conn = None
        cursor = None
        
        try:
            # Get query parameters
            status = request.args.get('status')
            event_type = request.args.get('event_type')
            date_from = request.args.get('date_from')
            date_to = request.args.get('date_to')
            search = request.args.get('search')
            limit = request.args.get('limit', 100, type=int)
            offset = request.args.get('offset', 0, type=int)
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Build query with filters
            query = 'SELECT * FROM college_bookings WHERE 1=1'
            params = []
            
            if status:
                query += ' AND status = %s'
                params.append(status)
            
            if event_type:
                query += ' AND event_type = %s'
                params.append(event_type)
            
            if date_from:
                query += ' AND event_start_date >= %s'
                params.append(date_from)
            
            if date_to:
                query += ' AND event_end_date <= %s'
                params.append(date_to)
            
            if search:
                query += ' AND (college_name LIKE %s OR event_name LIKE %s OR college_city LIKE %s)'
                search_param = f'%{search}%'
                params.extend([search_param, search_param, search_param])
            
            query += ' ORDER BY created_at DESC LIMIT %s OFFSET %s'
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            bookings = cursor.fetchall()
            
            # Get total count
            count_query = 'SELECT COUNT(*) as total FROM college_bookings WHERE 1=1'
            count_params = params[:-2]  # Exclude limit and offset
            
            if status:
                count_query += ' AND status = %s'
            if event_type:
                count_query += ' AND event_type = %s'
            if date_from:
                count_query += ' AND event_start_date >= %s'
            if date_to:
                count_query += ' AND event_end_date <= %s'
            if search:
                count_query += ' AND (college_name LIKE %s OR event_name LIKE %s OR college_city LIKE %s)'
            
            cursor.execute(count_query, count_params if count_params else [])
            total = cursor.fetchone()['total']
            
            return jsonify({
                'success': True,
                'bookings': bookings,
                'total': total,
                'limit': limit,
                'offset': offset
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # POST: Create new college booking
    if request.method == 'POST':
        conn = None
        cursor = None
        
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = [
                'contact_name', 'contact_phone', 'college_name', 'college_address',
                'event_start_date', 'event_end_date', 'event_duration_days'
            ]
            
            for field in required_fields:
                if field not in data or not data[field]:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Validate phone number
            if not validate_phone(data['contact_phone']):
                return jsonify({
                    'success': False,
                    'error': 'Invalid phone number format'
                }), 400
            
            # Validate email if provided
            if data.get('contact_email') and not validate_email(data['contact_email']):
                return jsonify({
                    'success': False,
                    'error': 'Invalid email format'
                }), 400
            
            # Calculate distance if coordinates provided
            estimated_distance = None
            if data.get('college_latitude') and data.get('college_longitude'):
                estimated_distance = calculate_distance(
                    GAMESPOT_LAT, GAMESPOT_LNG,
                    float(data['college_latitude']),
                    float(data['college_longitude'])
                )
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Ensure the table exists with proper structure
            try:
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS college_bookings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        contact_name VARCHAR(100),
                        contact_phone VARCHAR(20),
                        contact_email VARCHAR(255),
                        contact_position VARCHAR(100),
                        college_name VARCHAR(200),
                        college_address TEXT,
                        college_city VARCHAR(100),
                        college_state VARCHAR(100),
                        college_pincode VARCHAR(20),
                        college_latitude DECIMAL(10, 6),
                        college_longitude DECIMAL(10, 6),
                        estimated_distance_km DECIMAL(10, 2),
                        event_name VARCHAR(200),
                        event_type VARCHAR(50),
                        event_start_date DATE,
                        event_end_date DATE,
                        event_duration_days INT DEFAULT 1,
                        expected_students INT DEFAULT 0,
                        setup_type VARCHAR(50) DEFAULT 'standard',
                        ps5_stations INT DEFAULT 4,
                        vr_zones INT DEFAULT 2,
                        driving_simulator BOOLEAN DEFAULT TRUE,
                        additional_requirements TEXT,
                        base_price DECIMAL(10, 2) DEFAULT 0,
                        transport_cost DECIMAL(10, 2) DEFAULT 0,
                        setup_cost DECIMAL(10, 2) DEFAULT 0,
                        total_estimated_cost DECIMAL(10, 2) DEFAULT 0,
                        final_price DECIMAL(10, 2) DEFAULT 0,
                        status VARCHAR(50) DEFAULT 'inquiry',
                        booking_reference VARCHAR(50),
                        inquiry_source VARCHAR(50) DEFAULT 'website',
                        notes TEXT,
                        admin_notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ''')
                conn.commit()
            except:
                conn.rollback()
            
            # Add missing columns if table already exists
            columns_to_add = [
                ("contact_name", "VARCHAR(100)"),
                ("contact_person", "VARCHAR(100)"),
                ("contact_phone", "VARCHAR(20)"),
                ("contact_email", "VARCHAR(255)"),
                ("contact_position", "VARCHAR(100)"),
                ("college_name", "VARCHAR(200)"),
                ("college_address", "TEXT"),
                ("college_city", "VARCHAR(100)"),
                ("college_state", "VARCHAR(100)"),
                ("college_pincode", "VARCHAR(20)"),
                ("college_latitude", "DECIMAL(10, 6)"),
                ("college_longitude", "DECIMAL(10, 6)"),
                ("estimated_distance_km", "DECIMAL(10, 2)"),
                ("event_name", "VARCHAR(200)"),
                ("event_type", "VARCHAR(50)"),
                ("event_start_date", "DATE"),
                ("event_end_date", "DATE"),
                ("event_duration_days", "INT DEFAULT 1"),
                ("expected_students", "INT DEFAULT 0"),
                ("setup_type", "VARCHAR(50) DEFAULT 'standard'"),
                ("ps5_stations", "INT DEFAULT 4"),
                ("vr_zones", "INT DEFAULT 2"),
                ("driving_simulator", "BOOLEAN DEFAULT TRUE"),
                ("additional_requirements", "TEXT"),
                ("base_price", "DECIMAL(10, 2) DEFAULT 0"),
                ("transport_cost", "DECIMAL(10, 2) DEFAULT 0"),
                ("setup_cost", "DECIMAL(10, 2) DEFAULT 0"),
                ("total_estimated_cost", "DECIMAL(10, 2) DEFAULT 0"),
                ("final_price", "DECIMAL(10, 2) DEFAULT 0"),
                ("status", "VARCHAR(50) DEFAULT 'inquiry'"),
                ("booking_reference", "VARCHAR(50)"),
                ("inquiry_source", "VARCHAR(50) DEFAULT 'website'"),
                ("notes", "TEXT"),
                ("admin_notes", "TEXT")
            ]
            
            for col_name, col_type in columns_to_add:
                try:
                    cursor.execute(f"ALTER TABLE college_bookings ADD COLUMN {col_name} {col_type}")
                    conn.commit()
                except:
                    conn.rollback()
            
            # Generate booking reference
            booking_ref = f"COL-{datetime.now().strftime('%Y%m%d')}-{datetime.now().timestamp():.0f}"
            
            # Insert college booking
            query = '''
                INSERT INTO college_bookings (
                    contact_name, contact_person, contact_phone, contact_email, contact_position,
                    college_name, college_address, college_city, college_state, college_pincode,
                    college_latitude, college_longitude, estimated_distance_km,
                    event_name, event_type, event_start_date, event_end_date, event_duration_days,
                    expected_students, setup_type, ps5_stations, vr_zones, driving_simulator,
                    additional_requirements, base_price, transport_cost, setup_cost,
                    total_estimated_cost, final_price, status, booking_reference,
                    inquiry_source, notes
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            '''
            
            params = (
                data['contact_name'],
                data['contact_name'],  # contact_person = contact_name
                data['contact_phone'],
                data.get('contact_email', ''),
                data.get('contact_position', ''),
                data['college_name'],
                data['college_address'],
                data.get('college_city', ''),
                data.get('college_state', ''),
                data.get('college_pincode', ''),
                data.get('college_latitude'),
                data.get('college_longitude'),
                estimated_distance,
                data.get('event_name', ''),
                data.get('event_type', ''),
                data['event_start_date'],
                data['event_end_date'],
                data['event_duration_days'],
                data.get('expected_students', 0),
                data.get('setup_type', 'standard'),
                data.get('ps5_stations', 4),
                data.get('vr_zones', 2),
                data.get('driving_simulator', True),
                data.get('additional_requirements', ''),
                data.get('base_price', 0.00),
                data.get('transport_cost', 0.00),
                data.get('setup_cost', 0.00),
                data.get('total_estimated_cost', 0.00),
                data.get('final_price', 0.00),
                'inquiry',
                booking_ref,
                data.get('inquiry_source', 'website'),
                data.get('notes', '')
            )
            
            cursor.execute(query, params)
            conn.commit()
            
            booking_id = cursor.lastrowid
            
            return jsonify({
                'success': True,
                'message': 'College booking inquiry submitted successfully',
                'booking_id': booking_id,
                'booking_reference': booking_ref,
                'estimated_distance_km': estimated_distance
            }), 201
            
        except Exception as e:
            if conn:
                conn.rollback()
            return jsonify({'success': False, 'error': str(e)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

@college_bp.route('/api/college-bookings/<int:booking_id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def handle_college_booking_by_id(booking_id):
    """Handle individual college booking operations"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # GET: Retrieve specific college booking
    if request.method == 'GET':
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = 'SELECT * FROM college_bookings WHERE id = %s'
            cursor.execute(query, (booking_id,))
            booking = cursor.fetchone()
            
            if not booking:
                return jsonify({
                    'success': False,
                    'error': 'College booking not found'
                }), 404
            
            # Get associated media
            media_query = 'SELECT * FROM college_event_media WHERE college_booking_id = %s ORDER BY display_order, uploaded_at DESC'
            cursor.execute(media_query, (booking_id,))
            media = cursor.fetchall()
            
            booking['media'] = media
            
            return jsonify({
                'success': True,
                'booking': booking
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # PUT: Update college booking (admin only)
    if request.method == 'PUT':
        # Check admin session
        if not session.get('admin_logged_in'):
            return jsonify({
                'success': False,
                'error': 'Admin authentication required'
            }), 401
        
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
                'status', 'payment_status', 'event_start_date', 'event_end_date',
                'base_price', 'transport_cost', 'setup_cost', 'total_estimated_cost',
                'discount_percentage', 'final_price', 'payment_terms',
                'admin_notes', 'follow_up_date'
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
            
            params.append(booking_id)
            
            query = f'UPDATE college_bookings SET {", ".join(update_fields)} WHERE id = %s'
            cursor.execute(query, params)
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({
                    'success': False,
                    'error': 'College booking not found'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'College booking updated successfully'
            })
            
        except Exception as e:
            if conn:
                conn.rollback()
            return jsonify({'success': False, 'error': str(e)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # DELETE: Cancel college booking (admin only)
    if request.method == 'DELETE':
        # Check admin session
        if not session.get('admin_logged_in'):
            return jsonify({
                'success': False,
                'error': 'Admin authentication required'
            }), 401
        
        conn = None
        cursor = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Soft delete: Update status to cancelled
            query = 'UPDATE college_bookings SET status = %s WHERE id = %s'
            cursor.execute(query, ('cancelled', booking_id))
            conn.commit()
            
            if cursor.rowcount == 0:
                return jsonify({
                    'success': False,
                    'error': 'College booking not found'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'College booking cancelled successfully'
            })
            
        except Exception as e:
            if conn:
                conn.rollback()
            return jsonify({'success': False, 'error': str(e)}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

@college_bp.route('/api/college-bookings/stats', methods=['GET', 'OPTIONS'])
def get_college_stats():
    """Get college booking statistics (admin only)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin session
    if not session.get('admin_logged_in'):
        return jsonify({
            'success': False,
            'error': 'Admin authentication required'
        }), 401
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Call stored procedure
        cursor.callproc('get_college_stats')
        
        # Fetch results
        stats = None
        for result in cursor.stored_results():
            stats = result.fetchone()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@college_bp.route('/api/college-bookings/<int:booking_id>/media', methods=['POST', 'OPTIONS'])
def add_college_media(booking_id):
    """Add media (photos/videos) to college booking (admin only)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin session
    if not session.get('admin_logged_in'):
        return jsonify({
            'success': False,
            'error': 'Admin authentication required'
        }), 401
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'media_type' not in data or 'media_url' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: media_type, media_url'
            }), 400
        
        # Validate media_type
        if data['media_type'] not in ['image', 'video', 'youtube']:
            return jsonify({
                'success': False,
                'error': 'Invalid media_type. Must be "image", "video", or "youtube"'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Insert media
        query = '''
            INSERT INTO college_event_media (
                college_booking_id, media_type, media_url, thumbnail_url,
                caption, display_order, is_featured
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        '''
        
        params = (
            booking_id,
            data['media_type'],
            data['media_url'],
            data.get('thumbnail_url', ''),
            data.get('caption', ''),
            data.get('display_order', 0),
            data.get('is_featured', False)
        )
        
        cursor.execute(query, params)
        conn.commit()
        
        media_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Media added successfully',
            'media_id': media_id
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
