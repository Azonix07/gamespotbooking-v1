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
    """Generate a JWT token for admin authentication"""
    payload = {
        'admin_id': admin_id,
        'username': username,
        'user_type': 'admin',
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_user_token(user_id, email, name):
    """Generate a JWT token for customer authentication"""
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
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_login(f):
    """Decorator to require user authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Try session-based auth first
        if session.get('user_logged_in') and session.get('user_id'):
            return f(*args, **kwargs)
        
        # Try JWT auth
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload and payload.get('user_type') == 'customer':
                session['user_logged_in'] = True
                session['user_id'] = payload.get('user_id')
                session['user_email'] = payload.get('email')
                session['user_name'] = payload.get('name')
                return f(*args, **kwargs)
        
        return jsonify({
            'success': False,
            'error': 'Authentication required. Please login.',
            'redirect': '/login'
        }), 401
    
    return decorated_function


def require_admin(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Try session-based auth first
        if session.get('admin_logged_in') and session.get('admin_id'):
            return f(*args, **kwargs)
        
        # Try JWT auth
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            payload = verify_token(token)
            if payload and payload.get('user_type') == 'admin':
                session['admin_logged_in'] = True
                session['admin_id'] = payload.get('admin_id')
                session['admin_username'] = payload.get('username')
                return f(*args, **kwargs)
        
        return jsonify({
            'success': False,
            'error': 'Admin authentication required'
        }), 401
    
    return decorated_function
