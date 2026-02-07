"""
Authentication API Routes
Handles user signup, login, logout, password reset
"""

import sys
import os
import random
import time
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
from middleware.auth import generate_admin_token, generate_user_token, generate_refresh_token, verify_token
from middleware.rate_limiter import auth_rate_limit
from utils.sanitizer import validate_email, validate_phone, validate_name, validate_password, sanitize, is_sql_injection, is_xss_attempt

auth_bp = Blueprint('auth', __name__)

# In-memory OTP storage (for production, use Redis or database)
otp_storage = {}


@auth_bp.route('/api/auth/signup', methods=['POST', 'OPTIONS'])
@auth_rate_limit(max_attempts=5, window_seconds=300)
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
        
        # Validate inputs with sanitizer
        valid, err = validate_name(name)
        if not valid:
            return jsonify({'success': False, 'error': err}), 400
        
        valid, err = validate_email(email)
        if not valid:
            return jsonify({'success': False, 'error': err}), 400
        
        valid, err = validate_phone(phone)
        if not valid:
            return jsonify({'success': False, 'error': err}), 400
        
        valid, err = validate_password(password)
        if not valid:
            return jsonify({'success': False, 'error': err}), 400
        
        if password != confirm_password:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400
        
        # Check for injection attempts
        if is_sql_injection(name) or is_xss_attempt(name):
            try:
                from utils.security_logger import log_injection_attempt
                log_injection_attempt('signup_name', name)
            except Exception:
                pass
            return jsonify({'success': False, 'error': 'Invalid input detected'}), 400
        
        # Sanitize name for storage
        name = sanitize(name, max_length=100, strip_html=True)
        
        # Register user
        result = register_user(name, email, phone, password)
        
        if result['success']:
            # Auto-login after signup
            session['user_logged_in'] = True
            session['user_id'] = result['user']['id']
            session['user_name'] = result['user']['name']
            session['user_email'] = result['user']['email']
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
                'token': token
            }), 201
        else:
            return jsonify(result), 400
        
    except Exception as e:
        sys.stderr.write(f"[Signup] Error: {e}\n")
        return jsonify({'success': False, 'error': 'Registration failed. Please try again.'}), 500


@auth_bp.route('/api/auth/login', methods=['POST', 'OPTIONS'])
@auth_rate_limit(max_attempts=10, window_seconds=300)
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
        
        # Check if it's an admin login (accept admin@gamespot.in or admin as username)
        login_identifier = email if email else username.lower()
        
        if login_identifier == 'admin@gamespot.in' or login_identifier == 'admin':
            # Admin login flow
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Query by username='admin' which always exists in the database
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
            refresh_token = generate_refresh_token(admin['id'], 'admin')
            
            response = jsonify({
                'success': True,
                'message': 'Admin login successful',
                'user_type': 'admin',
                'username': admin['username'],
                'token': token
            })
            # Set refresh token as HttpOnly cookie (not accessible to JS)
            response.set_cookie(
                'refresh_token', refresh_token,
                httponly=True, secure=True, samesite='None',
                max_age=7*24*60*60, path='/api/auth'
            )
            
            try:
                from utils.security_logger import log_successful_login
                log_successful_login(admin['id'], 'admin')
            except Exception:
                pass
            
            return response
        
        # Customer login flow
        if not email and not username:
            return jsonify({'success': False, 'error': 'Email or phone number is required'}), 400
        
        # Accept email OR phone number as the login identifier
        login_identifier = email if email else username
        
        result = login_user(login_identifier, password)
        
        if result['success']:
            # Set customer session (for desktop browsers with cookies)
            session.clear()  # Clear any existing session
            session['user_logged_in'] = True
            session['user_id'] = result['user']['id']
            session['user_name'] = result['user']['name']
            session['user_email'] = result['user']['email']
            session['user_phone'] = result['user']['phone']
            session.permanent = True
            
            # Link any unclaimed guest bookings to this user (by phone number)
            try:
                from services.auth_service import link_guest_bookings_on_login
                link_guest_bookings_on_login(result['user']['id'], result['user'].get('phone', ''))
            except Exception as link_err:
                sys.stderr.write(f"[Login] Non-critical: guest booking link failed: {link_err}\n")
            
            # Generate JWT token (for mobile browsers without cookies)
            token = generate_user_token(
                result['user']['id'],
                result['user']['email'],
                result['user']['name']
            )
            refresh_token = generate_refresh_token(result['user']['id'], 'customer')
            
            response = jsonify({
                **result,
                'user_type': 'customer',
                'token': token
            })
            # Set refresh token as HttpOnly cookie
            response.set_cookie(
                'refresh_token', refresh_token,
                httponly=True, secure=True, samesite='None',
                max_age=7*24*60*60, path='/api/auth'
            )
            
            try:
                from utils.security_logger import log_successful_login
                log_successful_login(result['user']['id'], 'customer')
            except Exception:
                pass
            
            return response
        else:
            try:
                from utils.security_logger import log_failed_login
                log_failed_login(login_identifier)
            except Exception:
                pass
            return jsonify(result), 401
        
    except Exception as e:
        sys.stderr.write(f"[Login] Error: {e}\n")
        return jsonify({'success': False, 'error': 'Login failed. Please try again.'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@auth_bp.route('/api/auth/logout', methods=['POST', 'OPTIONS'])
def logout():
    """
    Logout current user (admin or customer)
    Clears session and refresh token cookie
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    session.clear()
    
    response = jsonify({
        'success': True,
        'message': 'Logged out successfully'
    })
    # Clear the refresh token cookie
    response.set_cookie(
        'refresh_token', '',
        httponly=True, secure=True, samesite='None',
        max_age=0, path='/api/auth'
    )
    
    return response


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
@auth_rate_limit(max_attempts=3, window_seconds=600)
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
        
        email_sent = False
        if result['success'] and 'token' in result:
            # Send reset email
            email_sent = send_reset_email(
                email=email,
                token=result['token'],
                user_name=result['user']['name']
            )
        
        # Return success — indicate if email was actually sent
        return jsonify({
            'success': True,
            'message': 'If the email exists, a reset link will be sent',
            'email_sent': email_sent
        })
        
    except Exception as e:
        sys.stderr.write(f"[ForgotPassword] Error: {e}\n")
        return jsonify({'success': True, 'message': 'If the email exists, a reset link will be sent', 'email_sent': False})


@auth_bp.route('/api/auth/reset-password', methods=['POST', 'OPTIONS'])
@auth_rate_limit(max_attempts=5, window_seconds=600)
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
        sys.stderr.write(f"[ResetPassword] Error: {e}\n")
        return jsonify({'success': False, 'error': 'Password reset failed. Please try again.'}), 500


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


# ============================================================
# PASSWORD RESET VIA PHONE OTP
# ============================================================

@auth_bp.route('/api/auth/forgot-password-otp', methods=['POST', 'OPTIONS'])
@auth_rate_limit(max_attempts=5, window_seconds=300)
def forgot_password_otp():
    """
    Send OTP to phone number for password reset.
    Only works if the phone number is registered.
    """
    if request.method == 'OPTIONS':
        return '', 200

    conn = None
    cursor = None
    try:
        data = request.get_json()
        phone = data.get('phone', '').strip()

        if not phone or len(phone) < 10:
            return jsonify({'success': False, 'error': 'Valid phone number is required'}), 400

        # Strip non-digit chars for matching
        phone_digits = phone.replace('+', '').replace(' ', '').replace('-', '')

        # Check if a user exists with this phone
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute('SELECT id, name, phone FROM users WHERE phone = %s', (phone_digits,))
        user = cursor.fetchone()

        if not user and len(phone_digits) > 10:
            last10 = phone_digits[-10:]
            cursor.execute('SELECT id, name, phone FROM users WHERE phone LIKE %s', (f'%{last10}',))
            user = cursor.fetchone()

        if not user:
            # Don't reveal if phone exists
            return jsonify({
                'success': True,
                'message': 'If an account exists with this number, an OTP has been sent'
            })

        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        actual_phone = user['phone']

        # Store OTP with purpose=reset and user_id
        otp_storage[f"reset_{actual_phone}"] = {
            'otp': otp,
            'user_id': user['id'],
            'expires_at': time.time() + 300,  # 5 minutes
            'attempts': 0
        }

        # Send OTP via SMS
        sms_sent = False
        email_sent = False

        if sms_service.enabled:
            success_sent, message = sms_service.send_otp(actual_phone, otp)
            if success_sent:
                sms_sent = True
            else:
                sys.stderr.write(f"[ForgotPasswordOTP] SMS send failed: {message}\n")

        # Fallback: send OTP via email if SMS didn't work
        if not sms_sent:
            try:
                from services.email_service import email_service
                # Look up user's email
                cursor.execute('SELECT email FROM users WHERE id = %s', (user['id'],))
                user_row = cursor.fetchone()
                user_email = user_row.get('email', '') if user_row else ''

                if email_service.enabled and user_email and '@' in user_email and not user_email.endswith('@gamespot.local'):
                    success_email, msg = email_service.send_otp_email(
                        user_email, otp, user['name'], purpose='password reset'
                    )
                    if success_email:
                        email_sent = True
                        sys.stderr.write(f"[ForgotPasswordOTP] OTP sent via email to {user_email}\n")
                    else:
                        sys.stderr.write(f"[ForgotPasswordOTP] Email fallback failed: {msg}\n")
            except Exception as email_err:
                sys.stderr.write(f"[ForgotPasswordOTP] Email fallback error: {email_err}\n")

        # Always log OTP to server stderr (visible in Railway logs)
        sys.stderr.write(f"[ForgotPasswordOTP] OTP for {actual_phone}: {otp}\n")

        # Build response message
        if sms_sent:
            resp_msg = 'OTP sent to your phone number'
        elif email_sent:
            resp_msg = 'OTP sent to your registered email address (SMS unavailable)'
        else:
            resp_msg = 'If an account exists with this number, an OTP has been sent'

        return jsonify({
            'success': True,
            'message': resp_msg,
            'delivery': 'sms' if sms_sent else ('email' if email_sent else 'pending')
        })

    except Exception as e:
        sys.stderr.write(f"[ForgotPasswordOTP] Error: {e}\n")
        return jsonify({'success': False, 'error': 'Failed to send OTP. Please try again.'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@auth_bp.route('/api/auth/reset-password-otp', methods=['POST', 'OPTIONS'])
@auth_rate_limit(max_attempts=5, window_seconds=600)
def reset_password_otp():
    """
    Verify OTP and reset password.
    
    POST body:
    {
        "phone": "9876543210",
        "otp": "123456",
        "password": "newpassword",
        "confirmPassword": "newpassword"
    }
    """
    if request.method == 'OPTIONS':
        return '', 200

    conn = None
    cursor = None
    try:
        data = request.get_json()
        phone = data.get('phone', '').strip()
        otp = data.get('otp', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirmPassword', '')

        if not all([phone, otp, password, confirm_password]):
            return jsonify({'success': False, 'error': 'All fields are required'}), 400

        if password != confirm_password:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400

        if len(password) < 6:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

        # Strip non-digit chars
        phone_digits = phone.replace('+', '').replace(' ', '').replace('-', '')

        # Look up stored OTP — try exact match and last-10-digits
        stored_data = otp_storage.get(f"reset_{phone_digits}")
        if not stored_data and len(phone_digits) > 10:
            last10 = phone_digits[-10:]
            # Search all reset keys for a match
            for key, val in list(otp_storage.items()):
                if key.startswith('reset_') and key.endswith(last10):
                    stored_data = val
                    break

        if not stored_data:
            return jsonify({'success': False, 'error': 'OTP not found or expired. Please request a new one.'}), 400

        # Check expiry
        if time.time() > stored_data['expires_at']:
            # Clean up
            for key in [k for k in otp_storage if k.startswith('reset_') and str(stored_data.get('user_id', '')) in str(otp_storage[k].get('user_id', ''))]:
                del otp_storage[key]
            return jsonify({'success': False, 'error': 'OTP expired. Please request a new one.'}), 400

        # Check attempts
        if stored_data['attempts'] >= 3:
            return jsonify({'success': False, 'error': 'Too many attempts. Please request a new OTP.'}), 400

        # Verify OTP
        if stored_data['otp'] != otp:
            stored_data['attempts'] += 1
            remaining = 3 - stored_data['attempts']
            return jsonify({'success': False, 'error': f'Invalid OTP. {remaining} attempts remaining.'}), 400

        # OTP verified — reset the password
        user_id = stored_data['user_id']

        from services.auth_service import hash_password
        password_hash = hash_password(password)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE users SET password_hash = %s, reset_token = NULL, reset_token_expiry = NULL WHERE id = %s',
            (password_hash, user_id)
        )
        conn.commit()

        # Clean up OTP
        for key in [k for k in list(otp_storage.keys()) if k.startswith('reset_')]:
            if otp_storage[key].get('user_id') == user_id:
                del otp_storage[key]

        return jsonify({
            'success': True,
            'message': 'Password reset successful! You can now login with your new password.'
        })

    except Exception as e:
        sys.stderr.write(f"[ResetPasswordOTP] Error: {e}\n")
        return jsonify({'success': False, 'error': 'Password reset failed. Please try again.'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# OTP-based Login System
# ============================================================

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
        sys.stderr.write(f"[OTP] Error sending OTP: {e}\n")
        return jsonify({'success': False, 'error': 'Failed to send OTP. Please try again.'}), 500


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
        sys.stderr.write(f"[OTP] Error verifying OTP: {e}\n")
        return jsonify({'success': False, 'error': 'OTP verification failed. Please try again.'}), 500


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
    
    conn = None
    cursor = None
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        
        data = request.get_json()
        credential = data.get('credential')
        
        if not credential:
            return jsonify({'success': False, 'error': 'No credential provided'}), 400
        
        # Verify the Google token
        google_client_id = os.getenv('GOOGLE_CLIENT_ID', '377614306435-te2kkpi5p7glk1tfe7halc24svv14l32.apps.googleusercontent.com')
        idinfo = id_token.verify_oauth2_token(
            credential, 
            google_requests.Request(),
            google_client_id
        )
        
        # Extract user info from Google
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        google_id = idinfo['sub']
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if oauth_provider_id column exists
        has_oauth_cols = False
        try:
            cursor.execute("""
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'oauth_provider_id'
            """)
            has_oauth_cols = cursor.fetchone() is not None
        except Exception:
            pass
        
        # Look up the user — try oauth_provider_id first, then email
        user = None
        if has_oauth_cols:
            cursor.execute("""
                SELECT id, name, email, phone 
                FROM users 
                WHERE email = %s OR oauth_provider_id = %s
            """, (email, google_id))
            user = cursor.fetchone()
        else:
            cursor.execute("""
                SELECT id, name, email, phone 
                FROM users 
                WHERE email = %s
            """, (email,))
            user = cursor.fetchone()
        
        if not user:
            # Create new user
            if has_oauth_cols:
                cursor.execute("""
                    INSERT INTO users (name, email, phone, password_hash, oauth_provider, oauth_provider_id, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """, (name, email, '', 'GOOGLE_OAUTH', 'google', google_id))
            else:
                cursor.execute("""
                    INSERT INTO users (name, email, phone, password_hash, created_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (name, email, '', 'GOOGLE_OAUTH'))
            
            conn.commit()
            user_id = cursor.lastrowid
            
            user = {
                'id': user_id,
                'name': name,
                'email': email,
                'phone': ''
            }
        else:
            # Existing user — update oauth columns if they exist and aren't set yet
            if has_oauth_cols:
                try:
                    cursor.execute("""
                        UPDATE users SET oauth_provider = 'google', oauth_provider_id = %s
                        WHERE id = %s AND (oauth_provider_id IS NULL OR oauth_provider_id = '')
                    """, (google_id, user['id']))
                    conn.commit()
                except Exception:
                    pass
        
        # Set session
        session.clear()
        session['user_logged_in'] = True
        session['user_id'] = user['id']
        session['user_name'] = user['name']
        session['user_email'] = user['email']
        session['user_phone'] = user.get('phone', '')
        session.permanent = True
        
        # Link guest bookings by email (Google users may not have phone)
        try:
            from services.auth_service import link_guest_bookings_on_login
            phone = user.get('phone', '')
            if phone:
                link_guest_bookings_on_login(user['id'], phone)
        except Exception:
            pass
        
        # Generate JWT token
        token = generate_user_token(user['id'], user['email'], user['name'])
        refresh_token = generate_refresh_token(user['id'], 'customer')
        
        response = jsonify({
            'success': True,
            'message': 'Google login successful',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'phone': user.get('phone', '')
            },
            'token': token,
            'user_type': 'customer',
            'userType': 'customer'
        })
        
        # Set refresh token as HttpOnly cookie
        response.set_cookie(
            'refresh_token', refresh_token,
            httponly=True, secure=True, samesite='None',
            max_age=7*24*60*60, path='/api/auth'
        )
        
        return response
        
    except ValueError as e:
        # Invalid token
        sys.stderr.write(f"[Google Login] Invalid token: {e}\n")
        return jsonify({'success': False, 'error': 'Invalid Google token'}), 401
    except Exception as e:
        sys.stderr.write(f"[Google Login] Error: {e}\n")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'Google login failed. Please try again.'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


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
        sys.stderr.write(f"[Apple Login] Error: {e}\n")
        return jsonify({'success': False, 'error': 'Apple login failed. Please try again.'}), 500


# ============================================================
# TOKEN REFRESH ENDPOINT
# ============================================================

@auth_bp.route('/api/auth/refresh', methods=['POST', 'OPTIONS'])
@auth_rate_limit(max_attempts=30, window_seconds=300)
def refresh_token():
    """
    Refresh an expired access token using a valid refresh token.
    
    The refresh token is read from the HttpOnly cookie set during login.
    Returns a new access token (and optionally a new refresh token).
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get refresh token from HttpOnly cookie
        refresh = request.cookies.get('refresh_token')
        
        # Fallback: also check request body (for mobile apps)
        if not refresh:
            data = request.get_json(silent=True)
            if data:
                refresh = data.get('refresh_token')
        
        if not refresh:
            return jsonify({'success': False, 'error': 'Refresh token required'}), 401
        
        # Verify the refresh token
        payload = verify_token(refresh)
        
        if not payload:
            return jsonify({'success': False, 'error': 'Invalid or expired refresh token', 'redirect': '/login'}), 401
        
        # Must be a refresh token, not an access token
        if payload.get('type') != 'refresh':
            return jsonify({'success': False, 'error': 'Invalid token type'}), 401
        
        user_id = payload.get('sub')
        user_type = payload.get('user_type', 'customer')
        
        if user_type == 'admin':
            # Generate new admin access token
            from config.database import get_db_connection
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute('SELECT id, username FROM admin_users WHERE id = %s', (user_id,))
            admin = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if not admin:
                return jsonify({'success': False, 'error': 'Admin not found', 'redirect': '/login'}), 401
            
            new_token = generate_admin_token(admin['id'], admin['username'])
            new_refresh = generate_refresh_token(admin['id'], 'admin')
            
            response = jsonify({
                'success': True,
                'token': new_token,
                'user_type': 'admin'
            })
        else:
            # Generate new customer access token
            from services.auth_service import get_user_by_id
            user = get_user_by_id(user_id)
            
            if not user:
                return jsonify({'success': False, 'error': 'User not found', 'redirect': '/login'}), 401
            
            new_token = generate_user_token(user['id'], user['email'], user['name'])
            new_refresh = generate_refresh_token(user['id'], 'customer')
            
            response = jsonify({
                'success': True,
                'token': new_token,
                'user_type': 'customer'
            })
        
        # Rotate refresh token (set new one in cookie)
        response.set_cookie(
            'refresh_token', new_refresh,
            httponly=True, secure=True, samesite='None',
            max_age=7*24*60*60, path='/api/auth'
        )
        
        return response
        
    except Exception as e:
        sys.stderr.write(f"[TokenRefresh] Error: {e}\n")
        return jsonify({'success': False, 'error': 'Token refresh failed'}), 500
