"""
Authentication Middleware (Production-Hardened)
===============================================
Provides JWT token-based authentication with:
  - Short-lived access tokens (1 hour)
  - Longer-lived refresh tokens (7 days)
  - Role-based access control (admin, customer, guest)
  - Session fallback for desktop browsers
  - Secure token validation with claims verification
  - Security event logging

Token Flow:
  1. Login → returns access_token (1hr) + refresh_token (7d)
  2. API calls → Bearer access_token in Authorization header
  3. Token expired → POST /api/auth/refresh with refresh_token
  4. Refresh expired → re-login required

Security:
  - Tokens are signed with HS256 using JWT_SECRET
  - Access tokens have short lifetime (1 hour)
  - Refresh tokens stored HttpOnly cookie (not accessible to JS)
  - All token errors are logged for monitoring
  - Admin tokens have separate claim validation
"""

import jwt
import os
import secrets
from datetime import datetime, timedelta
from flask import request, session, jsonify
from functools import wraps

# ============================================================
# JWT Configuration
# ============================================================

# JWT_SECRET MUST be set in production. Random fallback for development only.
_jwt_secret = os.getenv('JWT_SECRET') or os.getenv('SECRET_KEY')
if not _jwt_secret or _jwt_secret == 'gamespot-secret-key-change-in-production':
    _jwt_secret = secrets.token_hex(32)
    if os.getenv('RAILWAY_ENVIRONMENT'):
        import sys
        sys.stderr.write("⚠️  CRITICAL: JWT_SECRET not set in production! Using random key.\n")

JWT_SECRET = _jwt_secret
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_HOURS = 1        # Access token lifetime (short-lived)
REFRESH_TOKEN_DAYS = 7        # Refresh token lifetime
LEGACY_TOKEN_HOURS = 24       # Legacy support for existing tokens


# ============================================================
# Token Generation
# ============================================================

def generate_admin_token(admin_id, username):
    """
    Generate a JWT access token for admin authentication.
    Contains role claim for authorization checks.
    """
    now = datetime.utcnow()
    payload = {
        'admin_id': admin_id,
        'username': username,
        'user_type': 'admin',
        'role': 'admin',
        'exp': now + timedelta(hours=ACCESS_TOKEN_HOURS),
        'iat': now,
        'nbf': now,  # Not valid before issued time
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_user_token(user_id, email, name):
    """
    Generate a JWT access token for customer authentication.
    """
    now = datetime.utcnow()
    payload = {
        'user_id': user_id,
        'email': email,
        'name': name,
        'user_type': 'customer',
        'role': 'customer',
        'exp': now + timedelta(hours=ACCESS_TOKEN_HOURS),
        'iat': now,
        'nbf': now,
        'type': 'access'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_refresh_token(user_id, user_type='customer'):
    """
    Generate a long-lived refresh token.
    Should be stored in HttpOnly cookie, NOT in localStorage.
    """
    now = datetime.utcnow()
    payload = {
        'sub': user_id,
        'user_type': user_type,
        'exp': now + timedelta(days=REFRESH_TOKEN_DAYS),
        'iat': now,
        'nbf': now,
        'type': 'refresh'
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ============================================================
# Token Verification
# ============================================================

def verify_token(token):
    """
    Verify and decode a JWT token with full validation.
    
    Returns:
        Decoded payload dict if valid, None if invalid/expired.
    """
    try:
        payload = jwt.decode(
            token, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM],
            options={
                'verify_exp': True,
                'verify_iat': True,
                'verify_nbf': True,
                'require': ['exp', 'iat']
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        # Log but don't expose details to caller
        try:
            from utils.security_logger import log_token_error
            log_token_error('expired')
        except Exception:
            pass
        return None
    except jwt.InvalidTokenError as e:
        try:
            from utils.security_logger import log_token_error
            log_token_error(f'invalid: {type(e).__name__}')
        except Exception:
            pass
        return None


def _extract_token_from_request():
    """
    Extract JWT token from the Authorization header.
    Format: Authorization: Bearer <token>
    
    Returns:
        Token string or None
    """
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer ') and len(auth_header) > 7:
        return auth_header[7:].strip()
    return None


# ============================================================
# Authentication Decorators
# ============================================================

def require_login(f):
    """
    Decorator: Require authenticated user (customer).
    Checks session first, then JWT token.
    
    PUBLIC ROUTES should NOT use this decorator.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow CORS preflight
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
        
        # Try session-based auth
        if session.get('user_logged_in') and session.get('user_id'):
            return f(*args, **kwargs)
        
        # Try JWT auth
        token = _extract_token_from_request()
        if token:
            payload = verify_token(token)
            if payload and payload.get('user_type') == 'customer' and payload.get('type') != 'refresh':
                # Restore session from JWT
                session['user_logged_in'] = True
                session['user_id'] = payload.get('user_id')
                session['user_email'] = payload.get('email')
                session['user_name'] = payload.get('name')
                return f(*args, **kwargs)
        
        # Log unauthorized attempt
        try:
            from utils.security_logger import log_unauthorized_access
            log_unauthorized_access(request.path)
        except Exception:
            pass
        
        return jsonify({
            'success': False,
            'error': 'Authentication required. Please login.',
            'redirect': '/login'
        }), 401
    
    return decorated_function


def require_auth(f):
    """
    Decorator: Require authenticated user and pass user info to handler.
    The decorated function receives a `user` dict as its first argument.
    
    Usage:
        @require_auth
        def my_route(user):
            print(user['id'], user['email'])
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 200
        
        user = None
        
        # Try session-based auth
        if session.get('user_logged_in') and session.get('user_id'):
            user = {
                'id': session.get('user_id'),
                'email': session.get('user_email'),
                'name': session.get('user_name'),
                'user_type': 'customer'
            }
        else:
            # Try JWT auth
            token = _extract_token_from_request()
            if token:
                payload = verify_token(token)
                if payload and payload.get('user_type') == 'customer' and payload.get('type') != 'refresh':
                    user = {
                        'id': payload.get('user_id'),
                        'email': payload.get('email'),
                        'name': payload.get('name'),
                        'user_type': 'customer'
                    }
                    session['user_logged_in'] = True
                    session['user_id'] = payload.get('user_id')
                    session['user_email'] = payload.get('email')
                    session['user_name'] = payload.get('name')
        
        if not user:
            try:
                from utils.security_logger import log_unauthorized_access
                log_unauthorized_access(request.path)
            except Exception:
                pass
            return jsonify({
                'success': False,
                'error': 'Authentication required. Please login.',
                'redirect': '/login'
            }), 401
        
        return f(user, *args, **kwargs)
    
    return decorated_function


# ============================================================
# Admin Authentication
# ============================================================

def check_admin_auth():
    """
    Check if the current request is from an authenticated admin.
    
    Returns:
        Tuple: (is_authenticated: bool, admin_info: dict or None)
    """
    # Try session-based auth
    if session.get('admin_logged_in') and session.get('admin_id'):
        return True, {
            'admin_id': session.get('admin_id'),
            'username': session.get('admin_username')
        }
    
    # Try JWT auth
    token = _extract_token_from_request()
    if token:
        payload = verify_token(token)
        if payload and payload.get('user_type') == 'admin' and payload.get('type') != 'refresh':
            return True, {
                'admin_id': payload.get('admin_id'),
                'username': payload.get('username')
            }
    
    return False, None


def require_admin():
    """
    Check admin auth in route handlers (non-decorator usage).
    Returns error response if not authenticated, None if OK.
    
    Usage:
        auth_error = require_admin()
        if auth_error:
            return auth_error
    """
    is_auth, admin_info = check_admin_auth()
    if not is_auth:
        try:
            from utils.security_logger import log_unauthorized_access
            log_unauthorized_access(f'ADMIN:{request.path}')
        except Exception:
            pass
        return jsonify({
            'success': False,
            'error': 'Admin authentication required'
        }), 401
    return None


def require_admin_decorator(f):
    """Decorator: Require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 200
        
        is_auth, admin_info = check_admin_auth()
        if not is_auth:
            try:
                from utils.security_logger import log_unauthorized_access
                log_unauthorized_access(f'ADMIN:{request.path}')
            except Exception:
                pass
            return jsonify({
                'success': False,
                'error': 'Admin authentication required'
            }), 401
        return f(*args, **kwargs)
    
    return decorated_function
