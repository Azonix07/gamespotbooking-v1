"""
Admin API Route
Handles admin authentication (login, logout, session check)
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_admin, check_admin_auth, generate_admin_token
import bcrypt

admin_bp = Blueprint('admin', __name__)

def verify_php_password(password: str, hash_from_db: str) -> bool:
    """
    Verify password against PHP's password_hash() bcrypt format
    PHP uses $2y$ prefix, Python bcrypt uses $2b$, but they're compatible
    """
    try:
        # Convert string password to bytes
        password_bytes = password.encode('utf-8')
        # Convert hash to bytes, replacing $2y$ with $2b$ for Python bcrypt compatibility
        hash_bytes = hash_from_db.replace('$2y$', '$2b$').encode('utf-8')
        # Verify
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

@admin_bp.route('/api/admin.php', methods=['GET', 'POST', 'OPTIONS'])
def handle_admin():
    """Handle admin operations"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    action = request.args.get('action', '')
    
    # Admin Login
    if request.method == 'POST' and action == 'login':
        conn = None
        cursor = None
        
        try:
            data = request.get_json()
            
            username = data.get('username', '').strip().lower()
            password = data.get('password', '')
            
            if not username or not password:
                return jsonify({'success': False, 'error': 'Email and password are required'}), 400
            
            # Accept admin@gamespot.in or admin as valid login
            if username != 'admin@gamespot.in' and username != 'admin':
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Query by username='admin' which always exists in the database
            query = 'SELECT * FROM admin_users WHERE username = %s'
            cursor.execute(query, ('admin',))
            admin = cursor.fetchone()
            
            if not admin or not verify_php_password(password, admin['password_hash']):
                return jsonify({'success': False, 'error': 'Invalid username or password'}), 401
            
            # Set session
            session['admin_logged_in'] = True
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            session.permanent = True
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'username': admin['username']
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': 'An error occurred'}), 500
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # Admin Logout
    if request.method == 'POST' and action == 'logout':
        session.clear()
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
    
    # Check Admin Session
    if request.method == 'GET' and action == 'check':
        authenticated = session.get('admin_logged_in', False)
        
        return jsonify({
            'success': True,
            'authenticated': authenticated,
            'username': session.get('admin_username') if authenticated else None
        })
    
    # Invalid action
    return jsonify({'success': False, 'error': 'Invalid action'}), 400


# Note: require_admin is now imported from middleware.auth
# It supports both session-based and JWT token authentication


@admin_bp.route('/api/admin/users', methods=['GET', 'OPTIONS'])
def get_all_users():
    """Get all registered users with their membership status"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin authentication
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all users with active membership info
        query = '''
            SELECT 
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at,
                m.id as membership_id,
                m.plan_type,
                m.status as membership_status,
                m.end_date,
                m.discount_percentage,
                DATEDIFF(m.end_date, CURDATE()) as days_remaining
            FROM users u
            LEFT JOIN memberships m ON u.id = m.user_id 
                AND m.status = 'active' 
                AND m.end_date >= CURDATE()
            ORDER BY u.created_at DESC
        '''
        cursor.execute(query)
        users = cursor.fetchall()
        
        # Convert dates to ISO format
        for user in users:
            user['created_at'] = user['created_at'].isoformat()
            if user['end_date']:
                user['end_date'] = user['end_date'].isoformat()
        
        return jsonify({
            'success': True,
            'users': users,
            'count': len(users)
        })
        
    except Exception as e:
        print(f"Error in get_all_users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/memberships', methods=['GET', 'OPTIONS'])
def get_all_memberships():
    """Get all membership subscriptions with user info"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin authentication
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all memberships with user info
        query = '''
            SELECT 
                m.id,
                m.user_id,
                m.plan_type,
                m.start_date,
                m.end_date,
                m.status,
                m.discount_percentage,
                COALESCE(m.total_hours, 0) as total_hours,
                COALESCE(m.hours_used, 0) as hours_used,
                m.created_at,
                m.dedicated_game,
                COALESCE(m.dedicated_game_status, 'none') as dedicated_game_status,
                m.game_request_date,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                DATEDIFF(m.end_date, CURDATE()) as days_remaining
            FROM memberships m
            JOIN users u ON m.user_id = u.id
            ORDER BY 
                FIELD(m.status, 'pending', 'active', 'expired', 'cancelled', 'rejected'),
                m.created_at DESC
        '''
        cursor.execute(query)
        memberships = cursor.fetchall()
        
        # Convert dates to ISO format
        for membership in memberships:
            membership['start_date'] = membership['start_date'].isoformat()
            membership['end_date'] = membership['end_date'].isoformat()
            membership['created_at'] = membership['created_at'].isoformat()
            if membership.get('game_request_date'):
                membership['game_request_date'] = membership['game_request_date'].isoformat()
        
        return jsonify({
            'success': True,
            'memberships': memberships,
            'count': len(memberships)
        })
        
    except Exception as e:
        print(f"Error in get_all_memberships: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/membership/approve/<int:membership_id>', methods=['POST', 'OPTIONS'])
def approve_membership(membership_id):
    """Approve a pending membership request — activates the plan"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get the pending membership
        cursor.execute('SELECT * FROM memberships WHERE id = %s AND status = %s', (membership_id, 'pending'))
        membership = cursor.fetchone()
        
        if not membership:
            return jsonify({'success': False, 'error': 'Pending membership not found'}), 404
        
        # Use VALID_PLANS from membership_routes for durations & hours
        from routes.membership_routes import VALID_PLANS
        
        from datetime import date, timedelta
        start_date = date.today()
        plan_info = VALID_PLANS.get(membership['plan_type'], {})
        duration = plan_info.get('days', 30)
        total_hours = plan_info.get('hours', 0)
        end_date = start_date + timedelta(days=duration)
        
        # Cancel any existing active membership for the same user
        cancel_query = '''
            UPDATE memberships 
            SET status = 'cancelled', end_date = CURDATE()
            WHERE user_id = %s AND status = 'active' AND id != %s
        '''
        cursor.execute(cancel_query, (membership['user_id'], membership_id))
        
        # Activate this membership
        activate_query = '''
            UPDATE memberships 
            SET status = 'active', start_date = %s, end_date = %s,
                total_hours = %s, hours_used = 0
            WHERE id = %s
        '''
        cursor.execute(activate_query, (start_date, end_date, total_hours, membership_id))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Membership #{membership_id} approved and activated successfully'
        })
        
    except Exception as e:
        print(f"Error approving membership: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/membership/reject/<int:membership_id>', methods=['POST', 'OPTIONS'])
def reject_membership(membership_id):
    """Reject a pending membership request"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get the pending membership
        cursor.execute('SELECT * FROM memberships WHERE id = %s AND status = %s', (membership_id, 'pending'))
        membership = cursor.fetchone()
        
        if not membership:
            return jsonify({'success': False, 'error': 'Pending membership not found'}), 404
        
        # Reject (set status to rejected)
        cursor.execute('UPDATE memberships SET status = %s WHERE id = %s', ('rejected', membership_id))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Membership #{membership_id} rejected'
        })
        
    except Exception as e:
        print(f"Error rejecting membership: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/membership/approve-game/<int:membership_id>', methods=['POST', 'OPTIONS'])
def approve_game_request(membership_id):
    """Approve a dedicated game request for a membership"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(
            'SELECT id, dedicated_game, dedicated_game_status FROM memberships WHERE id = %s AND status = %s',
            (membership_id, 'active')
        )
        membership = cursor.fetchone()
        
        if not membership:
            return jsonify({'success': False, 'error': 'Active membership not found'}), 404
        
        if membership.get('dedicated_game_status') != 'pending':
            return jsonify({'success': False, 'error': 'No pending game request found'}), 400
        
        cursor.execute(
            'UPDATE memberships SET dedicated_game_status = %s WHERE id = %s',
            ('approved', membership_id)
        )
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Game request "{membership["dedicated_game"]}" approved for membership #{membership_id}'
        })
        
    except Exception as e:
        print(f"Error approving game request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/membership/reject-game/<int:membership_id>', methods=['POST', 'OPTIONS'])
def reject_game_request(membership_id):
    """Reject a dedicated game request for a membership"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(
            'SELECT id, dedicated_game, dedicated_game_status FROM memberships WHERE id = %s AND status = %s',
            (membership_id, 'active')
        )
        membership = cursor.fetchone()
        
        if not membership:
            return jsonify({'success': False, 'error': 'Active membership not found'}), 404
        
        if membership.get('dedicated_game_status') != 'pending':
            return jsonify({'success': False, 'error': 'No pending game request found'}), 400
        
        # Reject: reset to none / keep the old game name but mark as rejected
        cursor.execute(
            'UPDATE memberships SET dedicated_game_status = %s WHERE id = %s',
            ('rejected', membership_id)
        )
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Game request "{membership["dedicated_game"]}" rejected for membership #{membership_id}'
        })
        
    except Exception as e:
        print(f"Error rejecting game request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/stats', methods=['GET', 'OPTIONS'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin authentication
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total users
        cursor.execute('SELECT COUNT(*) as count FROM users')
        total_users = cursor.fetchone()['count']
        
        # Active memberships
        cursor.execute('''
            SELECT COUNT(*) as count FROM memberships 
            WHERE status = 'active' AND end_date >= CURDATE()
        ''')
        active_memberships = cursor.fetchone()['count']
        
        # Total bookings
        cursor.execute('SELECT COUNT(*) as count FROM bookings')
        total_bookings = cursor.fetchone()['count']
        
        # Total revenue (all time)
        cursor.execute('SELECT COALESCE(SUM(total_price), 0) as revenue FROM bookings')
        total_revenue = float(cursor.fetchone()['revenue'])
        
        # This month's bookings
        cursor.execute('''
            SELECT COUNT(*) as count FROM bookings 
            WHERE MONTH(booking_date) = MONTH(CURDATE()) 
            AND YEAR(booking_date) = YEAR(CURDATE())
        ''')
        month_bookings = cursor.fetchone()['count']
        
        # This month's revenue
        cursor.execute('''
            SELECT COALESCE(SUM(total_price), 0) as revenue FROM bookings 
            WHERE MONTH(booking_date) = MONTH(CURDATE()) 
            AND YEAR(booking_date) = YEAR(CURDATE())
        ''')
        month_revenue = float(cursor.fetchone()['revenue'])
        
        # Today's bookings
        cursor.execute('''
            SELECT COUNT(*) as count FROM bookings 
            WHERE booking_date = CURDATE()
        ''')
        today_bookings = cursor.fetchone()['count']
        
        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'active_memberships': active_memberships,
                'total_bookings': total_bookings,
                'total_revenue': total_revenue,
                'month_bookings': month_bookings,
                'month_revenue': month_revenue,
                'today_bookings': today_bookings
            }
        })
        
    except Exception as e:
        print(f"Error in get_dashboard_stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/theme', methods=['GET', 'OPTIONS'])
def get_theme():
    """Get current site theme setting"""
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get theme setting
        query = 'SELECT setting_value FROM site_settings WHERE setting_key = %s'
        cursor.execute(query, ('site_theme',))
        result = cursor.fetchone()
        
        theme = result['setting_value'] if result else 'theme-purple'
        
        return jsonify({
            'success': True,
            'theme': theme
        })
        
    except Exception as e:
        # Return default theme if table doesn't exist yet
        return jsonify({
            'success': True,
            'theme': 'theme-purple'
        })
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/theme', methods=['POST'])
def update_theme():
    """Update site theme setting (admin only)"""
    # Check admin authentication
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        theme = data.get('theme', 'theme-purple')
        
        # Validate theme
        valid_themes = ['theme-purple', 'theme-blue', 'theme-green', 'theme-red', 'theme-dark', 'theme-light']
        if theme not in valid_themes:
            return jsonify({'success': False, 'error': 'Invalid theme'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        admin_id = session.get('admin_id')
        
        # Update or insert theme setting
        query = '''
            INSERT INTO site_settings (setting_key, setting_value, updated_by) 
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value),
                updated_by = VALUES(updated_by),
                updated_at = CURRENT_TIMESTAMP
        '''
        cursor.execute(query, ('site_theme', theme, admin_id))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Theme updated successfully',
            'theme': theme
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


# ============================================
# RENTAL BOOKINGS - Admin Endpoints
# ============================================

@admin_bp.route('/api/admin/rentals', methods=['GET', 'OPTIONS'])
def get_all_rentals():
    """Get all rental bookings (VR & PS5)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin authentication
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all rentals
        query = '''
            SELECT 
                id,
                customer_name,
                customer_phone,
                customer_email,
                device_type,
                rental_days,
                extra_controllers,
                controller_cost,
                start_date,
                end_date,
                delivery_address,
                package_type,
                base_price,
                total_price,
                savings,
                status,
                payment_status,
                booking_id,
                notes,
                created_at
            FROM rental_bookings
            ORDER BY created_at DESC
        '''
        cursor.execute(query)
        rentals = cursor.fetchall()
        
        # Convert dates to ISO format
        for rental in rentals:
            if rental.get('start_date'):
                rental['start_date'] = rental['start_date'].isoformat() if hasattr(rental['start_date'], 'isoformat') else str(rental['start_date'])
            if rental.get('end_date'):
                rental['end_date'] = rental['end_date'].isoformat() if hasattr(rental['end_date'], 'isoformat') else str(rental['end_date'])
            if rental.get('created_at'):
                rental['created_at'] = rental['created_at'].isoformat() if hasattr(rental['created_at'], 'isoformat') else str(rental['created_at'])
        
        return jsonify({
            'success': True,
            'rentals': rentals,
            'count': len(rentals)
        })
        
    except Exception as e:
        error_msg = str(e).lower()
        # If table doesn't exist, return empty array instead of error
        if "doesn't exist" in error_msg or "does not exist" in error_msg or "1146" in str(e):
            return jsonify({
                'success': True,
                'rentals': [],
                'count': 0,
                'message': 'Rental bookings table not initialized yet'
            })
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/rentals/<int:rental_id>/status', methods=['PUT', 'OPTIONS'])
def update_rental_status(rental_id):
    """Update rental booking status"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        valid_statuses = ['pending', 'confirmed', 'delivered', 'returned', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('UPDATE rental_bookings SET status = %s WHERE id = %s', (new_status, rental_id))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Rental status updated to {new_status}'
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


# ============================================
# COLLEGE EVENT BOOKINGS - Admin Endpoints
# ============================================

@admin_bp.route('/api/admin/college-bookings', methods=['GET', 'OPTIONS'])
def get_all_college_bookings():
    """Get all college event bookings"""
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin authentication
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all college bookings
        query = '''
            SELECT 
                id,
                college_name,
                college_city,
                college_state,
                event_name,
                event_type,
                event_start_date,
                event_end_date,
                expected_participants,
                contact_person_name,
                contact_person_email,
                contact_person_phone,
                contact_person_role,
                equipment_requested,
                setup_requirements,
                additional_notes,
                budget_range,
                distance_km,
                estimated_travel_cost,
                estimated_total,
                status,
                admin_notes,
                created_at
            FROM college_bookings
            ORDER BY created_at DESC
        '''
        cursor.execute(query)
        bookings = cursor.fetchall()
        
        # Convert dates and times to ISO format
        for booking in bookings:
            for key, value in booking.items():
                if value is not None and hasattr(value, 'isoformat'):
                    booking[key] = value.isoformat()
                elif value is not None and hasattr(value, 'total_seconds'):
                    # Handle timedelta objects
                    booking[key] = str(value)
        
        return jsonify({
            'success': True,
            'college_bookings': bookings,
            'count': len(bookings)
        })
        
    except Exception as e:
        error_msg = str(e).lower()
        # If table doesn't exist, return empty array instead of error
        if "doesn't exist" in error_msg or "does not exist" in error_msg or "1146" in str(e):
            return jsonify({
                'success': True,
                'college_bookings': [],
                'count': 0,
                'message': 'College bookings table not initialized yet'
            })
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/college-bookings/<int:booking_id>/status', methods=['PUT', 'OPTIONS'])
def update_college_booking_status(booking_id):
    """Update college booking status"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        admin_notes = data.get('admin_notes', '')
        
        valid_statuses = ['pending', 'reviewing', 'confirmed', 'in_progress', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(
            'UPDATE college_bookings SET status = %s, admin_notes = %s WHERE id = %s', 
            (new_status, admin_notes, booking_id)
        )
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'College booking status updated to {new_status}'
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


# ============================================
# ADMIN DASHBOARD STATS - Updated with all data
# ============================================

@admin_bp.route('/api/admin/dashboard-stats', methods=['GET', 'OPTIONS'])
def get_full_dashboard_stats():
    """Get complete dashboard statistics including rentals, college"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        stats = {}
        
        # Regular bookings stats
        try:
            cursor.execute('SELECT COUNT(*) as count FROM bookings')
            stats['total_bookings'] = cursor.fetchone()['count']
            
            cursor.execute('SELECT COALESCE(SUM(total_price), 0) as revenue FROM bookings')
            stats['total_revenue'] = float(cursor.fetchone()['revenue'])
        except:
            stats['total_bookings'] = 0
            stats['total_revenue'] = 0
        
        # Rental stats
        try:
            cursor.execute('SELECT COUNT(*) as count FROM rental_bookings')
            stats['total_rentals'] = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM rental_bookings WHERE status = 'pending'")
            stats['pending_rentals'] = cursor.fetchone()['count']
            
            cursor.execute('SELECT COALESCE(SUM(total_price), 0) as revenue FROM rental_bookings')
            stats['rental_revenue'] = float(cursor.fetchone()['revenue'])
        except:
            stats['total_rentals'] = 0
            stats['pending_rentals'] = 0
            stats['rental_revenue'] = 0
        
        # College booking stats
        try:
            cursor.execute('SELECT COUNT(*) as count FROM college_bookings')
            stats['total_college_bookings'] = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM college_bookings WHERE status = 'pending'")
            stats['pending_college_bookings'] = cursor.fetchone()['count']
        except:
            stats['total_college_bookings'] = 0
            stats['pending_college_bookings'] = 0
        
        # Users and memberships
        try:
            cursor.execute('SELECT COUNT(*) as count FROM users')
            stats['total_users'] = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM memberships WHERE status = 'active' AND end_date >= CURDATE()")
            stats['active_memberships'] = cursor.fetchone()['count']
        except:
            stats['total_users'] = 0
            stats['active_memberships'] = 0
        
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


# ============================================================
# ADMIN: UNBLOCK USER
# ============================================================

@admin_bp.route('/api/admin/unblock-user', methods=['POST', 'OPTIONS'])
def unblock_user():
    """
    Unblock a user account that was blocked due to too many failed login attempts.
    Resets failed_attempts to 0 and is_blocked to FALSE.
    
    POST body:
    { "user_id": 123 }
    or
    { "email": "user@example.com" }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        email = data.get('email', '').strip().lower()
        
        if not user_id and not email:
            return jsonify({'success': False, 'error': 'user_id or email is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if user_id:
            cursor.execute("SELECT id, name, email, is_blocked FROM users WHERE id = %s", (user_id,))
        else:
            cursor.execute("SELECT id, name, email, is_blocked FROM users WHERE email = %s", (email,))
        
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        cursor.execute(
            "UPDATE users SET is_blocked = FALSE, failed_attempts = 0 WHERE id = %s",
            (user['id'],)
        )
        conn.commit()
        
        import sys
        sys.stderr.write(f"[Admin] ✅ User unblocked: {user['email']} (id={user['id']})\n")
        
        return jsonify({
            'success': True,
            'message': f"User {user['name']} ({user['email']}) has been unblocked."
        })
    
    except Exception as e:
        import sys
        sys.stderr.write(f"[Admin] ❌ Unblock user error: {e}\n")
        return jsonify({'success': False, 'error': 'Failed to unblock user'}), 500
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ════════════════════════════════════════════════════════
# EXPENSES & FINANCIAL MANAGEMENT
# ════════════════════════════════════════════════════════

def ensure_expenses_table(cursor):
    """Create expenses table if it doesn't exist"""
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            expense_date DATE NOT NULL,
            category VARCHAR(50) NOT NULL,
            description VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ''')


@admin_bp.route('/api/admin/expenses', methods=['GET', 'POST', 'OPTIONS'])
def handle_expenses():
    """Get or create expenses"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_expenses_table(cursor)
        
        if request.method == 'GET':
            # Get expenses with optional date filter
            date_from = request.args.get('date_from', '')
            date_to = request.args.get('date_to', '')
            category = request.args.get('category', '')
            
            query = 'SELECT * FROM expenses WHERE 1=1'
            params = []
            
            if date_from:
                query += ' AND expense_date >= %s'
                params.append(date_from)
            if date_to:
                query += ' AND expense_date <= %s'
                params.append(date_to)
            if category:
                query += ' AND category = %s'
                params.append(category)
            
            query += ' ORDER BY expense_date DESC, created_at DESC'
            
            cursor.execute(query, params)
            expenses = cursor.fetchall()
            
            # Convert Decimal and date types for JSON
            for exp in expenses:
                exp['amount'] = float(exp['amount'])
                if exp.get('expense_date'):
                    exp['expense_date'] = str(exp['expense_date'])
                if exp.get('created_at'):
                    exp['created_at'] = str(exp['created_at'])
                if exp.get('updated_at'):
                    exp['updated_at'] = str(exp['updated_at'])
            
            return jsonify({'success': True, 'expenses': expenses})
        
        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            expense_date = data.get('expense_date')
            category = data.get('category', '')
            description = data.get('description', '')
            amount = data.get('amount', 0)
            
            if not expense_date or not category or not description or not amount:
                return jsonify({'success': False, 'error': 'All fields are required'}), 400
            
            cursor.execute('''
                INSERT INTO expenses (expense_date, category, description, amount)
                VALUES (%s, %s, %s, %s)
            ''', (expense_date, category, description, float(amount)))
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Expense added successfully',
                'expense_id': cursor.lastrowid
            })
    
    except Exception as e:
        print(f"Error in handle_expenses: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/expenses/<int:expense_id>', methods=['DELETE', 'OPTIONS'])
def delete_expense(expense_id):
    """Delete an expense"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('DELETE FROM expenses WHERE id = %s', (expense_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Expense not found'}), 404
        
        return jsonify({'success': True, 'message': 'Expense deleted'})
    
    except Exception as e:
        print(f"Error deleting expense: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/financial-summary', methods=['GET', 'OPTIONS'])
def get_financial_summary():
    """Get daily/weekly/monthly financial summary with revenue, expenses, and profit"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_expenses_table(cursor)
        
        # Today's revenue
        cursor.execute('''
            SELECT COALESCE(SUM(total_price), 0) as revenue, COUNT(*) as bookings
            FROM bookings WHERE booking_date = CURDATE()
        ''')
        today = cursor.fetchone()
        today_revenue = float(today['revenue'])
        today_bookings = today['bookings']
        
        # Today's expenses
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date = CURDATE()
        ''')
        today_expenses = float(cursor.fetchone()['total'])
        
        # This week revenue & expenses
        cursor.execute('''
            SELECT COALESCE(SUM(total_price), 0) as revenue, COUNT(*) as bookings
            FROM bookings WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ''')
        week = cursor.fetchone()
        week_revenue = float(week['revenue'])
        week_bookings = week['bookings']
        
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
            WHERE expense_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ''')
        week_expenses = float(cursor.fetchone()['total'])
        
        # This month revenue & expenses
        cursor.execute('''
            SELECT COALESCE(SUM(total_price), 0) as revenue, COUNT(*) as bookings
            FROM bookings WHERE MONTH(booking_date) = MONTH(CURDATE()) 
            AND YEAR(booking_date) = YEAR(CURDATE())
        ''')
        month = cursor.fetchone()
        month_revenue = float(month['revenue'])
        month_bookings = month['bookings']
        
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total FROM expenses 
            WHERE MONTH(expense_date) = MONTH(CURDATE()) 
            AND YEAR(expense_date) = YEAR(CURDATE())
        ''')
        month_expenses = float(cursor.fetchone()['total'])
        
        # Last 30 days daily revenue (for chart)
        cursor.execute('''
            SELECT booking_date as date, COALESCE(SUM(total_price), 0) as revenue, COUNT(*) as bookings
            FROM bookings 
            WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY booking_date ORDER BY booking_date
        ''')
        daily_revenue_raw = cursor.fetchall()
        
        # Last 30 days daily expenses (for chart)
        cursor.execute('''
            SELECT expense_date as date, COALESCE(SUM(amount), 0) as total
            FROM expenses 
            WHERE expense_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY expense_date ORDER BY expense_date
        ''')
        daily_expenses_raw = cursor.fetchall()
        
        # Build the 30-day chart data
        from datetime import datetime, timedelta
        chart_data = []
        expenses_map = {str(e['date']): float(e['total']) for e in daily_expenses_raw}
        revenue_map = {}
        bookings_map = {}
        for r in daily_revenue_raw:
            revenue_map[str(r['date'])] = float(r['revenue'])
            bookings_map[str(r['date'])] = r['bookings']
        
        for i in range(30, -1, -1):
            d = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            rev = revenue_map.get(d, 0)
            exp = expenses_map.get(d, 0)
            chart_data.append({
                'date': d,
                'revenue': rev,
                'expenses': exp,
                'profit': rev - exp,
                'bookings': bookings_map.get(d, 0)
            })
        
        # Expense breakdown by category (this month)
        cursor.execute('''
            SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
            FROM expenses 
            WHERE MONTH(expense_date) = MONTH(CURDATE()) 
            AND YEAR(expense_date) = YEAR(CURDATE())
            GROUP BY category ORDER BY total DESC
        ''')
        category_breakdown = cursor.fetchall()
        for cat in category_breakdown:
            cat['total'] = float(cat['total'])
        
        return jsonify({
            'success': True,
            'summary': {
                'today': {
                    'revenue': today_revenue,
                    'expenses': today_expenses,
                    'profit': today_revenue - today_expenses,
                    'bookings': today_bookings
                },
                'week': {
                    'revenue': week_revenue,
                    'expenses': week_expenses,
                    'profit': week_revenue - week_expenses,
                    'bookings': week_bookings
                },
                'month': {
                    'revenue': month_revenue,
                    'expenses': month_expenses,
                    'profit': month_revenue - month_expenses,
                    'bookings': month_bookings
                },
                'chart_data': chart_data,
                'category_breakdown': category_breakdown
            }
        })
    
    except Exception as e:
        print(f"Error in financial_summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ═══════════════════════════════════════════════════════════════
# Monthly Financial Summary (fetch any month's data)
# ═══════════════════════════════════════════════════════════════

@admin_bp.route('/api/admin/financial-summary/monthly', methods=['GET', 'OPTIONS'])
def get_monthly_financial_summary():
    """Get financial summary for a specific month/year"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        
        if not month or not year:
            return jsonify({'success': False, 'error': 'month and year required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_expenses_table(cursor)
        
        from datetime import datetime, timedelta
        import calendar
        
        days_in_month = calendar.monthrange(year, month)[1]
        
        # Monthly revenue
        cursor.execute('''
            SELECT COALESCE(SUM(total_price), 0) as revenue, COUNT(*) as bookings
            FROM bookings WHERE MONTH(booking_date) = %s AND YEAR(booking_date) = %s
        ''', (month, year))
        rev = cursor.fetchone()
        total_revenue = float(rev['revenue'])
        total_bookings = rev['bookings']
        
        # Monthly expenses
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total FROM expenses
            WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s
        ''', (month, year))
        total_expenses = float(cursor.fetchone()['total'])
        
        # Daily chart data for the month
        cursor.execute('''
            SELECT booking_date as date, COALESCE(SUM(total_price), 0) as revenue, COUNT(*) as bookings
            FROM bookings 
            WHERE MONTH(booking_date) = %s AND YEAR(booking_date) = %s
            GROUP BY booking_date ORDER BY booking_date
        ''', (month, year))
        daily_rev = cursor.fetchall()
        
        cursor.execute('''
            SELECT expense_date as date, COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s
            GROUP BY expense_date ORDER BY expense_date
        ''', (month, year))
        daily_exp = cursor.fetchall()
        
        rev_map = {str(r['date']): float(r['revenue']) for r in daily_rev}
        bk_map = {str(r['date']): r['bookings'] for r in daily_rev}
        exp_map = {str(e['date']): float(e['total']) for e in daily_exp}
        
        chart_data = []
        for day in range(1, days_in_month + 1):
            d = f"{year}-{month:02d}-{day:02d}"
            r = rev_map.get(d, 0)
            e = exp_map.get(d, 0)
            chart_data.append({
                'date': d,
                'revenue': r,
                'expenses': e,
                'profit': r - e,
                'bookings': bk_map.get(d, 0)
            })
        
        # Category breakdown for the month
        cursor.execute('''
            SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
            FROM expenses 
            WHERE MONTH(expense_date) = %s AND YEAR(expense_date) = %s
            GROUP BY category ORDER BY total DESC
        ''', (month, year))
        cats = cursor.fetchall()
        for c in cats:
            c['total'] = float(c['total'])
        
        # Week-wise breakdown
        weeks = []
        for w in range(0, days_in_month, 7):
            start_day = w + 1
            end_day = min(w + 7, days_in_month)
            week_rev = sum(chart_data[i]['revenue'] for i in range(w, end_day))
            week_exp = sum(chart_data[i]['expenses'] for i in range(w, end_day))
            week_bk = sum(chart_data[i]['bookings'] for i in range(w, end_day))
            weeks.append({
                'label': f"Day {start_day}-{end_day}",
                'revenue': week_rev,
                'expenses': week_exp,
                'profit': week_rev - week_exp,
                'bookings': week_bk
            })
        
        return jsonify({
            'success': True,
            'summary': {
                'month': month,
                'year': year,
                'month_name': calendar.month_name[month],
                'total_revenue': total_revenue,
                'total_expenses': total_expenses,
                'total_profit': total_revenue - total_expenses,
                'total_bookings': total_bookings,
                'chart_data': chart_data,
                'category_breakdown': cats,
                'weeks': weeks
            }
        })
    
    except Exception as e:
        print(f"Error in monthly_financial_summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ═══════════════════════════════════════════════════════════════
# Shop Closures Management
# ═══════════════════════════════════════════════════════════════

def ensure_closures_table(cursor):
    """Create shop_closures table if it doesn't exist"""
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shop_closures (
            id INT AUTO_INCREMENT PRIMARY KEY,
            closure_date DATE NOT NULL,
            closure_type ENUM('full_day', 'time_range') NOT NULL DEFAULT 'full_day',
            start_time TIME DEFAULT NULL,
            end_time TIME DEFAULT NULL,
            reason VARCHAR(255) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')


@admin_bp.route('/api/admin/closures', methods=['GET', 'POST', 'OPTIONS'])
def handle_closures():
    """CRUD for shop closures"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_closures_table(cursor)
        
        if request.method == 'GET':
            # Get upcoming + recent closures
            cursor.execute('''
                SELECT * FROM shop_closures
                WHERE closure_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                ORDER BY closure_date ASC, start_time ASC
            ''')
            closures = cursor.fetchall()
            for c in closures:
                c['closure_date'] = str(c['closure_date'])
                c['start_time'] = str(c['start_time']) if c['start_time'] else None
                c['end_time'] = str(c['end_time']) if c['end_time'] else None
                c['created_at'] = str(c['created_at'])
            
            return jsonify({'success': True, 'closures': closures})
        
        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            closure_date = data.get('closure_date')
            closure_type = data.get('closure_type', 'full_day')
            start_time = data.get('start_time')
            end_time = data.get('end_time')
            reason = data.get('reason', '')
            
            if not closure_date:
                return jsonify({'success': False, 'error': 'closure_date is required'}), 400
            
            if closure_type == 'time_range':
                if not start_time or not end_time:
                    return jsonify({'success': False, 'error': 'start_time and end_time required for time_range'}), 400
            
            cursor.execute('''
                INSERT INTO shop_closures (closure_date, closure_type, start_time, end_time, reason)
                VALUES (%s, %s, %s, %s, %s)
            ''', (closure_date, closure_type, start_time if closure_type == 'time_range' else None, 
                  end_time if closure_type == 'time_range' else None, reason))
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Closure added successfully',
                'closure_id': cursor.lastrowid
            })
    
    except Exception as e:
        print(f"Error in handle_closures: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/admin/closures/<int:closure_id>', methods=['DELETE', 'OPTIONS'])
def delete_closure(closure_id):
    """Delete a shop closure"""
    if request.method == 'OPTIONS':
        return '', 200
    
    auth_error = require_admin()
    if auth_error:
        return auth_error
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('DELETE FROM shop_closures WHERE id = %s', (closure_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'error': 'Closure not found'}), 404
        
        return jsonify({'success': True, 'message': 'Closure deleted'})
    
    except Exception as e:
        print(f"Error deleting closure: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@admin_bp.route('/api/closures/check', methods=['GET', 'OPTIONS'])
def check_closures():
    """Public endpoint: Check if a date has any closures (used by booking page)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    date = request.args.get('date')
    if not date:
        return jsonify({'success': False, 'error': 'date required'}), 400
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        ensure_closures_table(cursor)
        
        cursor.execute('''
            SELECT * FROM shop_closures WHERE closure_date = %s
        ''', (date,))
        closures = cursor.fetchall()
        
        is_full_day_closed = any(c['closure_type'] == 'full_day' for c in closures)
        
        blocked_times = []
        for c in closures:
            if c['closure_type'] == 'time_range' and c['start_time'] and c['end_time']:
                st = c['start_time']
                et = c['end_time']
                # Convert timedelta to HH:MM string
                if hasattr(st, 'total_seconds'):
                    sh = int(st.total_seconds()) // 3600
                    sm = (int(st.total_seconds()) % 3600) // 60
                    st = f"{sh:02d}:{sm:02d}"
                else:
                    st = str(st)[:5]
                if hasattr(et, 'total_seconds'):
                    eh = int(et.total_seconds()) // 3600
                    em = (int(et.total_seconds()) % 3600) // 60
                    et = f"{eh:02d}:{em:02d}"
                else:
                    et = str(et)[:5]
                blocked_times.append({
                    'start': st,
                    'end': et,
                    'reason': c['reason'] or 'Shop closed'
                })
        
        return jsonify({
            'success': True,
            'date': date,
            'is_closed': is_full_day_closed,
            'blocked_times': blocked_times,
            'reason': next((c['reason'] for c in closures if c['closure_type'] == 'full_day'), '') if is_full_day_closed else ''
        })
    
    except Exception as e:
        print(f"Error checking closures: {e}")
        return jsonify({'success': True, 'is_closed': False, 'blocked_times': []})
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ==========================================
#  NOTIFICATION DIAGNOSTICS & TEST
# ==========================================

@admin_bp.route('/api/admin/test-notification', methods=['POST', 'OPTIONS'])
def test_notification():
    """Send a test email notification to verify Gmail SMTP config (Admin only)"""
    if request.method == 'OPTIONS':
        return '', 200

    auth_error = require_admin()
    if auth_error:
        return auth_error

    import os
    gmail_user = os.getenv('GMAIL_USER', '')
    gmail_pass = os.getenv('GMAIL_APP_PASSWORD', '')
    admin_emails = os.getenv('ADMIN_NOTIFY_EMAILS', '')
    resend_key = os.getenv('RESEND_API_KEY', '')

    config_status = {
        'GMAIL_USER': 'SET' if gmail_user else 'NOT SET',
        'GMAIL_APP_PASSWORD': 'SET' if gmail_pass else 'NOT SET',
        'GMAIL_APP_PASSWORD_LENGTH': len(gmail_pass) if gmail_pass else 0,
        'ADMIN_NOTIFY_EMAILS': admin_emails if admin_emails else gmail_user or 'NOT SET',
        'RESEND_API_KEY': 'SET' if resend_key else 'NOT SET',
        'recommended_method': 'Resend (HTTP)' if resend_key else 'Gmail SMTP',
    }

    if not resend_key and (not gmail_user or not gmail_pass):
        return jsonify({
            'success': False,
            'error': 'No email provider configured. Set RESEND_API_KEY (recommended for Railway) or GMAIL_USER + GMAIL_APP_PASSWORD.',
            'config_status': config_status
        }), 400

    try:
        from services.admin_notify import notify_generic
        notify_generic("🔔 Test Notification", {
            "Status": "Email notifications are working!",
            "Method": "Resend HTTP API" if resend_key else "Gmail SMTP",
            "Sent from": "GameSpot Admin Dashboard",
            "Time": str(os.popen('date').read().strip()),
        })
        return jsonify({
            'success': True,
            'message': f'Test notification queued via {"Resend" if resend_key else "Gmail SMTP"}! Check your inbox.',
            'config_status': config_status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to send test notification: {str(e)}',
            'config_status': config_status
        }), 500
