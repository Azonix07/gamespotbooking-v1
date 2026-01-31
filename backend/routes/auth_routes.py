"""
Authentication API Routes
Handles user signup, login, logout, password reset
"""

from flask import Blueprint, request, jsonify, session
from services.auth_service import (
    register_user,
    login_user,
    get_user_by_id,
    create_reset_token,
    reset_password_with_token,
    send_reset_email
)
from routes.admin import verify_php_password
from config.database import get_db_connection
from middleware.auth import generate_admin_token, generate_user_token

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/auth/signup', methods=['POST', 'OPTIONS'])
def signup():
    """
    Register a new user
    
    POST body:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "1234567890",
        "password": "password123",
        "confirmPassword": "password123"
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirmPassword', '')
        
        # Validate inputs
        if not all([name, email, phone, password]):
            return jsonify({'success': False, 'error': 'All fields are required'}), 400
        
        if password != confirm_password:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400
        
        # Register user
        result = register_user(name, email, phone, password)
        
        if result['success']:
            # Auto-login after signup
            session['user_logged_in'] = True
            session['user_id'] = result['user']['id']
            session['user_name'] = result['user']['name']
            session['user_email'] = result['user']['email']
            session.permanent = True
            
            return jsonify(result), 201
        else:
            return jsonify(result), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    """
    Unified login for both admin and customers
    
    POST body:
    {
        "username": "admin" OR "email": "user@example.com",
        "password": "password123"
    }
    
    - If username="admin" → Admin login (check admin_users table)
    - Otherwise → Customer login (check users table with email)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not password:
            return jsonify({'success': False, 'error': 'Password is required'}), 400
        
        # Check if it's an admin login
        if username == 'admin' or email == 'admin':
            # Admin login flow
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            query = 'SELECT * FROM admin_users WHERE username = %s'
            cursor.execute(query, ('admin',))
            admin = cursor.fetchone()
            
            if not admin or not verify_php_password(password, admin['password_hash']):
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
            
            # Set admin session (for desktop browsers with cookies)
            session.clear()  # Clear any existing session
            session['admin_logged_in'] = True
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            session.permanent = True
            
            # Generate JWT token (for mobile browsers without cookies)
            token = generate_admin_token(admin['id'], admin['username'])
            
            return jsonify({
                'success': True,
                'message': 'Admin login successful',
                'user_type': 'admin',
                'username': admin['username'],
                'token': token  # Mobile browsers use this token
            })
        
        # Customer login flow
        if not email and not username:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        # If username provided but not "admin", treat as email
        login_email = email if email else username
        
        result = login_user(login_email, password)
        
        if result['success']:
            # Set customer session (for desktop browsers with cookies)
            session.clear()  # Clear any existing session
            session['user_logged_in'] = True
            session['user_id'] = result['user']['id']
            session['user_name'] = result['user']['name']
            session['user_email'] = result['user']['email']
            session['user_phone'] = result['user']['phone']
            session.permanent = True
            
            # Generate JWT token (for mobile browsers without cookies)
            token = generate_user_token(
                result['user']['id'],
                result['user']['email'],
                result['user']['name']
            )
            
            return jsonify({
                **result,
                'user_type': 'customer',
                'token': token  # Mobile browsers use this token
            })
        else:
            return jsonify(result), 401
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@auth_bp.route('/api/auth/logout', methods=['POST', 'OPTIONS'])
def logout():
    """
    Logout current user (admin or customer)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    session.clear()
    
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    })


@auth_bp.route('/api/auth/check', methods=['GET', 'OPTIONS'])
def check_session():
    """
    Check if user is logged in and return user data
    
    Returns:
    {
        "authenticated": true,
        "user_type": "admin" | "customer",
        "user": { ... user data ... }
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    # Check admin session
    if session.get('admin_logged_in'):
        return jsonify({
            'success': True,
            'authenticated': True,
            'user_type': 'admin',
            'user': {
                'username': session.get('admin_username'),
                'id': session.get('admin_id')
            }
        })
    
    # Check customer session
    if session.get('user_logged_in'):
        user_id = session.get('user_id')
        user_data = get_user_by_id(user_id)
        
        if user_data:
            return jsonify({
                'success': True,
                'authenticated': True,
                'user_type': 'customer',
                'user': user_data
            })
    
    # Not logged in
    return jsonify({
        'success': True,
        'authenticated': False,
        'user_type': None,
        'user': None
    })


@auth_bp.route('/api/auth/forgot-password', methods=['POST', 'OPTIONS'])
def forgot_password():
    """
    Request password reset
    
    POST body:
    {
        "email": "user@example.com"
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        result = create_reset_token(email)
        
        if result['success'] and 'token' in result:
            # Send reset email
            send_reset_email(
                email=email,
                token=result['token'],
                user_name=result['user']['name']
            )
        
        # Always return success (don't reveal if email exists)
        return jsonify({
            'success': True,
            'message': 'If the email exists, a reset link will be sent'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/auth/reset-password', methods=['POST', 'OPTIONS'])
def reset_password():
    """
    Reset password with token
    
    POST body:
    {
        "token": "reset_token_here",
        "password": "new_password123",
        "confirmPassword": "new_password123"
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        token = data.get('token', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirmPassword', '')
        
        if not all([token, password, confirm_password]):
            return jsonify({'success': False, 'error': 'All fields are required'}), 400
        
        if password != confirm_password:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400
        
        result = reset_password_with_token(token, password)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/auth/me', methods=['GET', 'OPTIONS'])
def get_current_user():
    """
    Get current logged-in user's full details
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    if not session.get('user_logged_in'):
        return jsonify({'success': False, 'error': 'Not logged in'}), 401
    
    user_id = session.get('user_id')
    user_data = get_user_by_id(user_id)
    
    if user_data:
        return jsonify({
            'success': True,
            'user': user_data
        })
    else:
        return jsonify({'success': False, 'error': 'User not found'}), 404
