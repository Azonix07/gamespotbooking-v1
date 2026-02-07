"""
Security Logger - Suspicious Activity Detection & Logging
==========================================================
Logs security-relevant events for audit and monitoring.

Logged events:
  - Failed login attempts (brute-force detection)
  - Rate limit violations
  - SQL injection / XSS attempts
  - Unauthorized access attempts
  - Admin actions (login, data access)
  - Token validation failures

Log format: JSON-structured for easy parsing by log aggregators.

IMPORTANT: Never log passwords, tokens, or encryption keys.
"""

import os
import sys
import json
from datetime import datetime
from flask import request


# Log level: 'info', 'warn', 'error', 'critical'
IS_PRODUCTION = bool(os.getenv('RAILWAY_ENVIRONMENT'))


def _get_client_ip() -> str:
    """Get real client IP (handles proxy/load balancer)"""
    try:
        forwarded = request.headers.get('X-Forwarded-For', '')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.remote_addr or 'unknown'
    except RuntimeError:
        return 'unknown'


def _log(level: str, event_type: str, message: str, details: dict = None):
    """
    Write structured security log entry.
    
    Args:
        level: Log level (info, warn, error, critical)
        event_type: Category of security event
        message: Human-readable description
        details: Additional context (never include secrets!)
    """
    entry = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'level': level.upper(),
        'event': event_type,
        'message': message,
        'ip': _get_client_ip(),
    }
    
    if details:
        # Strip any accidentally included sensitive fields
        safe_details = {k: v for k, v in details.items() 
                       if k.lower() not in ('password', 'token', 'secret', 'key', 'hash', 'credential')}
        entry['details'] = safe_details
    
    try:
        path = request.path
        method = request.method
        entry['path'] = path
        entry['method'] = method
    except RuntimeError:
        pass
    
    # Output as JSON to stderr (captured by Railway/Docker logs)
    sys.stderr.write(f"[SECURITY] {json.dumps(entry)}\n")
    sys.stderr.flush()


# ============================================================
# Public logging functions
# ============================================================

def log_failed_login(identifier: str, reason: str = 'invalid_credentials'):
    """Log a failed login attempt (brute-force detection)"""
    _log('warn', 'AUTH_FAILED', f'Failed login for: {identifier}', {
        'identifier': identifier,
        'reason': reason
    })


def log_successful_login(identifier: str, user_type: str = 'customer'):
    """Log a successful login"""
    _log('info', 'AUTH_SUCCESS', f'Login: {identifier} ({user_type})', {
        'identifier': identifier,
        'user_type': user_type
    })


def log_unauthorized_access(resource: str):
    """Log an unauthorized access attempt"""
    _log('warn', 'UNAUTHORIZED', f'Unauthorized access attempt: {resource}', {
        'resource': resource
    })


def log_rate_limit(endpoint: str):
    """Log a rate limit violation"""
    _log('warn', 'RATE_LIMITED', f'Rate limit hit: {endpoint}', {
        'endpoint': endpoint
    })


def log_injection_attempt(input_type: str, value_preview: str):
    """Log a suspected injection attempt (SQL/XSS)"""
    # Only log first 50 chars to avoid log injection
    safe_preview = value_preview[:50].replace('\n', ' ').replace('\r', '')
    _log('critical', 'INJECTION_ATTEMPT', f'{input_type} injection suspected', {
        'input_type': input_type,
        'preview': safe_preview
    })


def log_admin_action(admin_user: str, action: str, target: str = ''):
    """Log an admin action for audit trail"""
    _log('info', 'ADMIN_ACTION', f'Admin {admin_user}: {action}', {
        'admin': admin_user,
        'action': action,
        'target': target
    })


def log_token_error(error_type: str):
    """Log a token validation error"""
    _log('warn', 'TOKEN_ERROR', f'Token error: {error_type}', {
        'error_type': error_type
    })


def log_suspicious_request(reason: str):
    """Log a suspicious request pattern"""
    _log('warn', 'SUSPICIOUS', f'Suspicious request: {reason}', {
        'reason': reason
    })
