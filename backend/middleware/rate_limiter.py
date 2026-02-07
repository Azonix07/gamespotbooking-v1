"""
Rate Limiter Middleware
Prevents spam and abuse of API endpoints
"""

from flask import request, jsonify
from functools import wraps
from datetime import datetime, timedelta
import hashlib
from collections import defaultdict

# In-memory rate limit stores (use Redis in production for scalability)
rate_limit_store = defaultdict(list)
ip_rate_limit_store = defaultdict(list)
auth_rate_limit_store = defaultdict(list)  # Separate store for auth endpoints
general_rate_limit_store = defaultdict(list)  # General API rate limiting


def auth_rate_limit(max_attempts=5, window_seconds=300):
    """
    Rate limiter specifically for auth endpoints (login, signup, password reset)
    More strict to prevent brute-force attacks.
    
    Args:
        max_attempts (int): Max attempts per IP within window (default 5)
        window_seconds (int): Time window in seconds (default 5 minutes)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Skip rate limiting for OPTIONS preflight
            if request.method == 'OPTIONS':
                return f(*args, **kwargs)
            
            client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            if client_ip and ',' in client_ip:
                client_ip = client_ip.split(',')[0].strip()
            
            current_time = datetime.now()
            cutoff_time = current_time - timedelta(seconds=window_seconds)
            
            # Clean old entries
            auth_rate_limit_store[client_ip] = [
                t for t in auth_rate_limit_store[client_ip] if t > cutoff_time
            ]
            
            if len(auth_rate_limit_store[client_ip]) >= max_attempts:
                return jsonify({
                    'success': False,
                    'error': 'Too many attempts. Please try again later.',
                    'retry_after': window_seconds
                }), 429
            
            auth_rate_limit_store[client_ip].append(current_time)
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


def general_api_rate_limit(max_requests=60, window_seconds=60):
    """
    General rate limiter for all API endpoints.
    Prevents abuse from a single IP.
    
    Args:
        max_requests (int): Max requests per IP within window (default 60/min)
        window_seconds (int): Time window in seconds (default 60)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method == 'OPTIONS':
                return f(*args, **kwargs)
            
            client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            if client_ip and ',' in client_ip:
                client_ip = client_ip.split(',')[0].strip()
            
            current_time = datetime.now()
            cutoff_time = current_time - timedelta(seconds=window_seconds)
            
            general_rate_limit_store[client_ip] = [
                t for t in general_rate_limit_store[client_ip] if t > cutoff_time
            ]
            
            if len(general_rate_limit_store[client_ip]) >= max_requests:
                return jsonify({
                    'success': False,
                    'error': 'Rate limit exceeded. Please slow down.',
                    'retry_after': window_seconds
                }), 429
            
            general_rate_limit_store[client_ip].append(current_time)
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def rate_limit(max_requests=20, window_seconds=60, per_ip_limit=100, per_ip_window=3600):
    """
    Rate limiter decorator for Flask routes
    
    Implements two-tier rate limiting:
    1. Per-session limit: Prevents individual session spam
    2. Per-IP limit: Prevents IP-level abuse
    
    Args:
        max_requests (int): Maximum requests allowed per session in window
        window_seconds (int): Time window for session rate limiting (seconds)
        per_ip_limit (int): Maximum requests allowed per IP in window
        per_ip_window (int): Time window for IP rate limiting (seconds)
        
    Returns:
        Decorator function that wraps Flask route handlers
        
    Usage:
        @app.route('/api/ai/chat')
        @rate_limit(max_requests=20, window_seconds=60)
        def chat():
            return jsonify({'reply': 'Hello'})
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_time = datetime.now()
            
            # Get client identifiers
            client_ip = request.remote_addr or '0.0.0.0'
            user_agent = request.headers.get('User-Agent', '')
            
            # Create session identifier (IP + User Agent hash)
            session_identifier = hashlib.md5(f"{client_ip}{user_agent}".encode()).hexdigest()
            
            # Use IP-based identifier for rate limiting (don't read request body here)
            session_id = session_identifier
            
            # --- Session-level rate limiting ---
            # Clean old session requests outside window
            if session_id in rate_limit_store:
                rate_limit_store[session_id] = [
                    req_time for req_time in rate_limit_store[session_id]
                    if current_time - req_time < timedelta(seconds=window_seconds)
                ]
            else:
                rate_limit_store[session_id] = []
            
            # Check session rate limit
            if len(rate_limit_store[session_id]) >= max_requests:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'reply': '⏳ Whoa there! You\'re sending messages too quickly. Please wait a moment and try again.',
                    'action': 'rate_limited',
                    'retry_after': window_seconds,
                    'limit_type': 'session'
                }), 429
            
            # --- IP-level rate limiting ---
            # Clean old IP requests outside window
            if client_ip in ip_rate_limit_store:
                ip_rate_limit_store[client_ip] = [
                    req_time for req_time in ip_rate_limit_store[client_ip]
                    if current_time - req_time < timedelta(seconds=per_ip_window)
                ]
            else:
                ip_rate_limit_store[client_ip] = []
            
            # Check IP rate limit
            if len(ip_rate_limit_store[client_ip]) >= per_ip_limit:
                return jsonify({
                    'error': 'IP rate limit exceeded',
                    'reply': '🚫 Too many requests from your network. Please try again later or contact support if this persists.',
                    'action': 'rate_limited',
                    'retry_after': per_ip_window,
                    'limit_type': 'ip'
                }), 429
            
            # Add current request timestamps
            rate_limit_store[session_id].append(current_time)
            ip_rate_limit_store[client_ip].append(current_time)
            
            # Call the actual route handler
            result = f(*args, **kwargs)
            
            # Handle both Response objects and tuples (response, status_code)
            if isinstance(result, tuple):
                response, status_code = result[0], result[1] if len(result) > 1 else 200
            else:
                response, status_code = result, 200
            
            # Add rate limit headers if response has headers attribute
            if hasattr(response, 'headers'):
                remaining_session = max_requests - len(rate_limit_store[session_id])
                remaining_ip = per_ip_limit - len(ip_rate_limit_store[client_ip])
                
                response.headers['X-RateLimit-Session-Limit'] = str(max_requests)
                response.headers['X-RateLimit-Session-Remaining'] = str(remaining_session)
                response.headers['X-RateLimit-IP-Limit'] = str(per_ip_limit)
                response.headers['X-RateLimit-IP-Remaining'] = str(remaining_ip)
            
            # Return in the same format as received
            if isinstance(result, tuple):
                return response, status_code
            else:
                return response
        
        return decorated_function
    return decorator


def get_rate_limit_stats():
    """
    Get current rate limit statistics (for monitoring/debugging)
    
    Returns:
        dict: Statistics about current rate limiting state
    """
    return {
        'total_sessions': len(rate_limit_store),
        'total_ips': len(ip_rate_limit_store),
        'active_sessions': sum(1 for v in rate_limit_store.values() if v),
        'active_ips': sum(1 for v in ip_rate_limit_store.values() if v)
    }


def clear_rate_limits():
    """
    Clear all rate limit data (for testing/admin purposes)
    Use with caution in production!
    """
    rate_limit_store.clear()
    ip_rate_limit_store.clear()
    return {'status': 'Rate limits cleared'}
