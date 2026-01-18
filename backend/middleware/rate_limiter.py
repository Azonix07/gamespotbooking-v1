"""
Rate Limiter Middleware for AI Endpoints
Prevents spam and abuse of AI chat service
"""

from flask import request, jsonify
from functools import wraps
from datetime import datetime, timedelta
import hashlib
from collections import defaultdict

# In-memory rate limit store (use Redis in production for scalability)
rate_limit_store = defaultdict(list)
ip_rate_limit_store = defaultdict(list)

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
