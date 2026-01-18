"""
Admin API Route
Handles admin authentication (login, logout, session check)
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
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
            
            username = data.get('username', '')
            password = data.get('password', '')
            
            if not username or not password:
                return jsonify({'success': False, 'error': 'Username and password are required'}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Get admin user
            query = 'SELECT * FROM admin_users WHERE username = %s'
            cursor.execute(query, (username,))
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
            return jsonify({'success': False, 'error': str(e)}), 500
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


def require_admin():
    """Check if admin is logged in"""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'error': 'Unauthorized. Admin login required.'}), 401
    return None


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
        return jsonify({'success': False, 'error': str(e)}), 500
        
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
                m.created_at,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                DATEDIFF(m.end_date, CURDATE()) as days_remaining
            FROM memberships m
            JOIN users u ON m.user_id = u.id
            ORDER BY m.created_at DESC
        '''
        cursor.execute(query)
        memberships = cursor.fetchall()
        
        # Convert dates to ISO format
        for membership in memberships:
            membership['start_date'] = membership['start_date'].isoformat()
            membership['end_date'] = membership['end_date'].isoformat()
            membership['created_at'] = membership['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'memberships': memberships,
            'count': len(memberships)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
        
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
        return jsonify({'success': False, 'error': str(e)}), 500
        
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
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
