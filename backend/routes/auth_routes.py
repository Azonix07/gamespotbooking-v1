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
from services.sms_service import sms_service
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
    
    # MOBILE FIX: Check JWT token if no session (mobile browsers block cookies)
    from middleware.auth import verify_token
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        if payload:
            if payload.get('user_type') == 'admin':
                return jsonify({
                    'success': True,
                    'authenticated': True,
                    'user_type': 'admin',
                    'user': {
                        'username': payload.get('username'),
                        'id': payload.get('admin_id')
                    }
                })
            elif payload.get('user_type') == 'customer':
                user_data = get_user_by_id(payload.get('user_id'))
                if user_data:
                    # Also restore session for subsequent requests
                    session['user_logged_in'] = True
                    session['user_id'] = payload.get('user_id')
                    session['user_email'] = payload.get('email')
                    session['user_name'] = payload.get('name')
                    session.permanent = True
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


# OTP-based Login System
import random
import time

# In-memory OTP storage (for production, use Redis or database)
otp_storage = {}

@auth_bp.route('/api/auth/send-otp', methods=['POST', 'OPTIONS'])
def send_otp():
    """Send OTP to mobile number"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        phone = data.get('phone', '').strip()
        
        if not phone or len(phone) < 10:
            return jsonify({'success': False, 'error': 'Valid phone number is required'}), 400
        
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Store OTP with expiry (5 minutes)
        otp_storage[phone] = {
            'otp': otp,
            'expires_at': time.time() + 300,  # 5 minutes
            'attempts': 0
        }
        
        # Send OTP via SMS
        success, message = sms_service.send_otp(phone, otp)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to send OTP. Please check your phone number and try again.'
            }), 500
        
        # Return success without OTP (sent via SMS only)
        return jsonify({
            'success': True,
            'message': 'OTP sent successfully to your mobile number',
            'phone': phone
        })
        
    except Exception as e:
        print(f'[OTP] Error sending OTP: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/auth/verify-otp', methods=['POST', 'OPTIONS'])
def verify_otp():
    """Verify OTP and login user"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        phone = data.get('phone', '').strip()
        otp = data.get('otp', '').strip()
        name = data.get('name', '').strip()  # Optional for new users
        
        if not phone or not otp:
            return jsonify({'success': False, 'error': 'Phone and OTP are required'}), 400
        
        # Check if OTP exists and is valid
        stored_data = otp_storage.get(phone)
        
        if not stored_data:
            return jsonify({'success': False, 'error': 'OTP not found or expired'}), 400
        
        # Check expiry
        if time.time() > stored_data['expires_at']:
            del otp_storage[phone]
            return jsonify({'success': False, 'error': 'OTP expired'}), 400
        
        # Check attempts
        if stored_data['attempts'] >= 3:
            del otp_storage[phone]
            return jsonify({'success': False, 'error': 'Too many attempts. Please request a new OTP'}), 400
        
        # Verify OTP
        if stored_data['otp'] != otp:
            stored_data['attempts'] += 1
            return jsonify({'success': False, 'error': 'Invalid OTP'}), 400
        
        # OTP verified - clear it
        del otp_storage[phone]
        
        # Check if user exists
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('SELECT * FROM users WHERE phone = %s', (phone,))
        user = cursor.fetchone()
        
        if not user:
            # Create new user
            if not name:
                cursor.close()
                conn.close()
                return jsonify({'success': False, 'error': 'Name is required for new users'}), 400
            
            email = f'{phone}@gamespot.local'  # Generate dummy email
            cursor.execute(
                'INSERT INTO users (name, email, phone, password_hash) VALUES (%s, %s, %s, %s)',
                (name, email, phone, 'OTP_LOGIN')  # Dummy password for OTP users
            )
            conn.commit()
            user_id = cursor.lastrowid
            
            user = {
                'id': user_id,
                'name': name,
                'email': email,
                'phone': phone
            }
        
        cursor.close()
        conn.close()
        
        # Set session
        session['user_logged_in'] = True
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['user_email'] = user['email']
        session['user_phone'] = user['phone']
        session.permanent = True
        
        # Generate JWT token
        token = generate_user_token(user['id'], user['email'], user['name'])
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'phone': user['phone']
            },
            'token': token,
            'userType': 'customer'
        })
        
    except Exception as e:
        print(f'[OTP] Error verifying OTP: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/auth/google-login', methods=['POST', 'OPTIONS'])
def google_login():
    """
    Handle Google OAuth login
    
    POST body:
    {
        "credential": "google_jwt_token"
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        
        data = request.get_json()
        credential = data.get('credential')
        
        if not credential:
            return jsonify({'success': False, 'error': 'No credential provided'}), 400
        
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            credential, 
            google_requests.Request(),
            '377614306435-te2kkpi5p7glk1tfe7halc24svv14l32.apps.googleusercontent.com'
        )
        
        # Extract user info
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        google_id = idinfo['sub']
        
        # Check if user exists or create new
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, name, email, phone 
            FROM users 
            WHERE email = %s OR oauth_provider_id = %s
        """, (email, google_id))
        
        user = cursor.fetchone()
        
        if not user:
            # Create new user
            cursor.execute("""
                INSERT INTO users (name, email, phone, password_hash, oauth_provider, oauth_provider_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (name, email, '', 'GOOGLE_OAUTH', 'google', google_id))
            
            conn.commit()
            user_id = cursor.lastrowid
            
            user = {
                'id': user_id,
                'name': name,
                'email': email,
                'phone': ''
            }
        
        cursor.close()
        conn.close()
        
        # Set session
        session['user_logged_in'] = True
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['user_email'] = user['email']
        session['user_phone'] = user.get('phone', '')
        session.permanent = True
        
        # Generate JWT token
        token = generate_user_token(user['id'], user['email'], user['name'])
        
        return jsonify({
            'success': True,
            'message': 'Google login successful',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'phone': user.get('phone', '')
            },
            'token': token,
            'userType': 'customer'
        })
        
    except ValueError as e:
        # Invalid token
        print(f'[Google Login] Invalid token: {str(e)}')
        return jsonify({'success': False, 'error': 'Invalid Google token'}), 401
    except Exception as e:
        print(f'[Google Login] Error: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/auth/apple-login', methods=['POST', 'OPTIONS'])
def apple_login():
    """
    Handle Apple Sign In
    
    POST body:
    {
        "id_token": "apple_jwt_token",
        "user": {
            "name": {"firstName": "John", "lastName": "Doe"},
            "email": "user@privaterelay.appleid.com"
        }
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        import jwt
        import requests as http_requests
        
        data = request.get_json()
        id_token_str = data.get('id_token')
        user_data = data.get('user', {})
        
        if not id_token_str:
            return jsonify({'success': False, 'error': 'No id_token provided'}), 400
        
        # Get Apple's public keys
        apple_keys_url = 'https://appleid.apple.com/auth/keys'
        apple_keys_response = http_requests.get(apple_keys_url)
        apple_keys = apple_keys_response.json()
        
        # Decode token (simplified - in production use proper verification)
        decoded = jwt.decode(id_token_str, options={"verify_signature": False})
        
        # Extract user info
        apple_id = decoded['sub']
        email = decoded.get('email', user_data.get('email', f'{apple_id}@appleid.com'))
        
        # Get name from user data if provided (only on first sign-in)
        name = 'Apple User'
        if user_data and 'name' in user_data:
            first_name = user_data['name'].get('firstName', '')
            last_name = user_data['name'].get('lastName', '')
            name = f"{first_name} {last_name}".strip() or 'Apple User'
        
        # Check if user exists or create new
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT id, name, email, phone 
            FROM users 
            WHERE email = %s OR oauth_provider_id = %s
        """, (email, apple_id))
        
        user = cursor.fetchone()
        
        if not user:
            # Create new user
            cursor.execute("""
                INSERT INTO users (name, email, phone, password_hash, oauth_provider, oauth_provider_id, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (name, email, '', 'APPLE_OAUTH', 'apple', apple_id))
            
            conn.commit()
            user_id = cursor.lastrowid
            
            user = {
                'id': user_id,
                'name': name,
                'email': email,
                'phone': ''
            }
        
        cursor.close()
        conn.close()
        
        # Set session
        session['user_logged_in'] = True
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['user_email'] = user['email']
        session['user_phone'] = user.get('phone', '')
        session.permanent = True
        
        # Generate JWT token
        token = generate_user_token(user['id'], user['email'], user['name'])
        
        return jsonify({
            'success': True,
            'message': 'Apple login successful',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'phone': user.get('phone', '')
            },
            'token': token,
            'userType': 'customer'
        })
        
    except Exception as e:
        print(f'[Apple Login] Error: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
