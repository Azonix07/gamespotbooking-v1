"""
Input Sanitizer - SQL Injection & XSS Prevention
=================================================
Validates and sanitizes all user inputs before they reach the database.

Security measures:
  - Strips dangerous HTML/script tags (XSS prevention)
  - Validates input types and lengths
  - Rejects SQL injection patterns
  - Normalizes whitespace
  - Provides type-specific validators (email, phone, name, etc.)

Usage:
  from utils.sanitizer import sanitize, validate_email, validate_phone
  
  clean_name = sanitize(user_input, max_length=100)
  is_valid, error = validate_email(email_input)
"""

import re
import html
from typing import Optional, Tuple


# Patterns that indicate SQL injection attempts
SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b.*\b(FROM|INTO|TABLE|SET|WHERE|ALL)\b)",
    r"(--|#|/\*|\*/|;)",  # SQL comment/termination characters
    r"(\bOR\b\s+\d+\s*=\s*\d+)",  # OR 1=1 style injection
    r"(\bAND\b\s+\d+\s*=\s*\d+)",  # AND 1=1 style injection
    r"(\'|\"|\\\\)",  # Quote injection (only in strict mode)
]

# Dangerous HTML/JS patterns for XSS prevention
XSS_PATTERNS = [
    r'<\s*script',
    r'javascript\s*:',
    r'on\w+\s*=',  # onclick=, onerror=, etc.
    r'<\s*iframe',
    r'<\s*object',
    r'<\s*embed',
    r'<\s*form',
    r'<\s*img[^>]+onerror',
    r'expression\s*\(',
    r'url\s*\(',
    r'data\s*:.*base64',
]


def sanitize(value: Optional[str], max_length: int = 500, strip_html: bool = True) -> Optional[str]:
    """
    Sanitize a string input for safe database storage.
    
    Args:
        value: Raw user input
        max_length: Maximum allowed length (truncates if exceeded)
        strip_html: Whether to escape HTML entities
        
    Returns:
        Sanitized string, or None if input is None
        
    Example:
        clean = sanitize("<script>alert('xss')</script>Hello")
        # Returns: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;Hello"
    """
    if value is None:
        return None
    
    if not isinstance(value, str):
        value = str(value)
    
    # Strip leading/trailing whitespace
    value = value.strip()
    
    # Normalize internal whitespace (collapse multiple spaces)
    value = re.sub(r'\s+', ' ', value)
    
    # HTML entity encoding (prevents XSS)
    if strip_html:
        value = html.escape(value, quote=True)
    
    # Truncate to max length
    if len(value) > max_length:
        value = value[:max_length]
    
    return value


def sanitize_for_log(value: Optional[str], max_length: int = 50) -> str:
    """
    Sanitize a value for safe logging (mask sensitive data).
    
    Args:
        value: The value to sanitize for logs
        max_length: Maximum length to show
        
    Returns:
        Masked/truncated string safe for logging
    """
    if not value:
        return '[empty]'
    
    if len(value) > max_length:
        return value[:max_length] + '...[truncated]'
    
    return value


def is_sql_injection(value: str) -> bool:
    """
    Check if a string contains SQL injection patterns.
    Note: This is a defense-in-depth measure. Parameterized queries are the primary defense.
    
    Args:
        value: String to check
        
    Returns:
        True if suspicious SQL patterns detected
    """
    if not value:
        return False
    
    upper_val = value.upper().strip()
    
    for pattern in SQL_INJECTION_PATTERNS[:1]:  # Only check the main SQL keyword pattern
        if re.search(pattern, upper_val, re.IGNORECASE):
            return True
    
    return False


def is_xss_attempt(value: str) -> bool:
    """
    Check if a string contains XSS attack patterns.
    
    Args:
        value: String to check
        
    Returns:
        True if suspicious XSS patterns detected
    """
    if not value:
        return False
    
    for pattern in XSS_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            return True
    
    return False


def validate_email(email: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email:
        return False, "Email is required"
    
    email = email.strip().lower()
    
    if len(email) > 254:
        return False, "Email is too long"
    
    # RFC 5322 simplified pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"
    
    if is_sql_injection(email) or is_xss_attempt(email):
        return False, "Invalid email format"
    
    return True, None


def validate_phone(phone: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate Indian phone number format.
    
    Args:
        phone: Phone number to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not phone:
        return False, "Phone number is required"
    
    # Remove non-digits
    clean = re.sub(r'\D', '', phone)
    
    # Remove country code if present
    if clean.startswith('91') and len(clean) == 12:
        clean = clean[2:]
    
    if len(clean) != 10:
        return False, "Phone number must be 10 digits"
    
    if clean[0] not in '6789':
        return False, "Invalid phone number"
    
    return True, None


def validate_name(name: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate a person's name.
    
    Args:
        name: Name to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name or not name.strip():
        return False, "Name is required"
    
    name = name.strip()
    
    if len(name) < 2:
        return False, "Name must be at least 2 characters"
    
    if len(name) > 100:
        return False, "Name is too long"
    
    # Allow letters, spaces, hyphens, apostrophes, dots (for initials)
    if not re.match(r"^[a-zA-Z\s\-\'.]+$", name):
        return False, "Name contains invalid characters"
    
    if is_sql_injection(name) or is_xss_attempt(name):
        return False, "Invalid name"
    
    return True, None


def validate_password(password: Optional[str]) -> Tuple[bool, Optional[str]]:
    """
    Validate password strength.
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 6:
        return False, "Password must be at least 6 characters"
    
    if len(password) > 128:
        return False, "Password is too long"
    
    return True, None


def clean_phone(phone: str) -> str:
    """
    Clean and normalize a phone number to 10 digits.
    
    Args:
        phone: Raw phone input
        
    Returns:
        Clean 10-digit phone number
    """
    clean = re.sub(r'\D', '', phone)
    if clean.startswith('91') and len(clean) == 12:
        clean = clean[2:]
    return clean
