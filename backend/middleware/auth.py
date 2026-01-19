"""
Authentication Middleware
Provides JWT token-based authentication for mobile compatibility
Falls back to session-based auth for desktop browsers
"""

import jwt
import os
from datetime import datetime, timedelta
from flask import request, session, jsonify
from functools import wraps

# JWT Configuration
JWT_SECRET = os.getenv('SECRET_KEY', 'gamespot-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24


def generate_admin_token(admin_id, username):
    """
    Generate a JWT token for admin authentication
    Used when session cookies might not work (mobile browsers)
    """
    payload = {
        'admin_id': admin_id,
        'username': username,
        'user_type': 'admin',
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_user_token(user_id, email, name):
    """
    Generate a JWT token for customer authentication
    """
    payload = {
        'user_id': user_id,
        'email': email,
        'name': name,
        'user_type': 'customer',
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token):
    """
    Verify and decode a JWT token
    Returns the payload if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_request():
    """
    Extract JWT token from Authorization header
    Supports: "Bearer <token>" format
    """
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]  # Remove "Bearer " prefix
    return None


def check_admin_auth():
    """
    Check if request is from an authenticated admin
    Supports both:
    1. Session-based auth (cookies) - desktop browsers
    2. JWT token auth (Authorization header) - mobile browsers
    
    Returns: (is_authenticated, admin_info or None)
    """
    # First, try session-based authentication (works on desktop)
    if session.get('admin_logged_in'):
        return True, {
            'admin_id': session.get('admin_id'),
            'username': session.get('admin_username')
        }
    
    # Second, try JWT token authentication (works on mobile)
    token = get_token_from_request()
    if token:
        payload = verify_token(token)
        if payload and payload.get('user_type') == 'admin':
            return True, {
                'admin_id': payload.get('admin_id'),
                'username': payload.get('username')
            }
    
    return False, None


def check_user_auth():
    """
    Check if request is from an authenticated user (admin or customer)
    
    Returns: (is_authenticated, user_info or None, user_type)
    """
    # First, try session-based authentication
    if session.get('admin_logged_in'):
        return True, {
            'admin_id': session.get('admin_id'),
            'username': session.get('admin_username')
        }, 'admin'
    
    if session.get('user_logged_in'):
        return True, {
            'user_id': session.get('user_id'),
            'name': session.get('user_name'),
            'email': session.get('user_email')
        }, 'customer'
    
    # Second, try JWT token authentication
    token = get_token_from_request()
    if token:
        payload = verify_token(token)
        if payload:
            user_type = payload.get('user_type')
            if user_type == 'admin':
                return True, {
                    'admin_id': payload.get('admin_id'),
                    'username': payload.get('username')
                }, 'admin'
            elif user_type == 'customer':
                return True, {
                    'user_id': payload.get('user_id'),
                    'name': payload.get('name'),
                    'email': payload.get('email')
                }, 'customer'
    
    return False, None, None


def require_admin():
    """
    Check if admin is logged in (session or JWT)
    Returns error response if not authenticated, None if authenticated
    """
    is_auth, admin_info = check_admin_auth()
    if not is_auth:
        return jsonify({'success': False, 'error': 'Unauthorized. Admin login required.'}), 401
    return None


def require_auth():
    """
    Check if any user is logged in (session or JWT)
    Returns error response if not authenticated, None if authenticated
    """
    is_auth, user_info, user_type = check_user_auth()
    if not is_auth:
        return jsonify({'success': False, 'error': 'Unauthorized. Login required.'}), 401
    return None
