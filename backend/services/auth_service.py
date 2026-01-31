"""
Authentication Service
Handles user registration, login, password management
"""

import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from config.database import get_db_connection


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a password against its hash
    
    Args:
        password: Plain text password to verify
        password_hash: Stored password hash
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        password_bytes = password.encode('utf-8')
        hash_bytes = password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def register_user(name: str, email: str, phone: str, password: str) -> Dict[str, Any]:
    """
    Register a new user
    
    Args:
        name: User's full name
        email: User's email (must be unique)
        phone: User's phone number
        password: Plain text password (will be hashed)
        
    Returns:
        Dict with success status and user data or error message
    """
    conn = None
    cursor = None
    
    try:
        # Validate inputs
        if not all([name, email, phone, password]):
            return {'success': False, 'error': 'All fields are required'}
        
        if len(password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters'}
        
        # Hash password
        password_hash = hash_password(password)
        
        # Insert user
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = '''
            INSERT INTO users (name, email, phone, password_hash)
            VALUES (%s, %s, %s, %s)
        '''
        cursor.execute(query, (name, email, phone, password_hash))
        conn.commit()
        
        user_id = cursor.lastrowid
        
        return {
            'success': True,
            'message': 'Registration successful',
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'phone': phone
            }
        }
        
    except Exception as e:
        error_msg = str(e)
        if 'Duplicate entry' in error_msg and 'email' in error_msg:
            return {'success': False, 'error': 'Email already registered'}
        return {'success': False, 'error': f'Registration failed: {error_msg}'}
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def login_user(email: str, password: str) -> Dict[str, Any]:
    """
    Authenticate a user by email and password
    
    Args:
        email: User's email
        password: Plain text password
        
    Returns:
        Dict with success status and user data or error message
    """
    conn = None
    cursor = None
    
    try:
        if not email or not password:
            return {'success': False, 'error': 'Email and password are required'}
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get user by email
        query = 'SELECT * FROM users WHERE email = %s'
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        if not user:
            return {'success': False, 'error': 'Invalid email or password'}
        
        # Verify password
        if not verify_password(password, user['password_hash']):
            return {'success': False, 'error': 'Invalid email or password'}
        
        # Remove password hash from response
        user_data = {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone']
        }
        
        return {
            'success': True,
            'message': 'Login successful',
            'user': user_data
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Login failed: {str(e)}'}
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Get user details by ID
    
    Args:
        user_id: User's ID
        
    Returns:
        User data dict or None if not found
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = 'SELECT id, name, email, phone, created_at FROM users WHERE id = %s'
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        return user
        
    except Exception as e:
        print(f"Error getting user: {e}")
        return None
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def generate_reset_token() -> str:
    """
    Generate a secure random token for password reset
    
    Returns:
        Secure random token string
    """
    return secrets.token_urlsafe(32)


def create_reset_token(email: str) -> Dict[str, Any]:
    """
    Create a password reset token for a user
    
    Args:
        email: User's email
        
    Returns:
        Dict with success status and token or error message
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if user exists
        query = 'SELECT id, email, name FROM users WHERE email = %s'
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        
        if not user:
            # Don't reveal if email exists or not (security)
            return {
                'success': True,
                'message': 'If the email exists, a reset link will be sent'
            }
        
        # Generate token
        token = generate_reset_token()
        expiry = datetime.now() + timedelta(hours=24)  # Token valid for 24 hours
        
        # Store token
        update_query = '''
            UPDATE users 
            SET reset_token = %s, reset_token_expiry = %s 
            WHERE email = %s
        '''
        cursor.execute(update_query, (token, expiry, email))
        conn.commit()
        
        return {
            'success': True,
            'message': 'If the email exists, a reset link will be sent',
            'token': token,
            'user': user  # For sending email
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Failed to create reset token: {str(e)}'}
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def reset_password_with_token(token: str, new_password: str) -> Dict[str, Any]:
    """
    Reset user password using a valid token
    
    Args:
        token: Password reset token
        new_password: New password (will be hashed)
        
    Returns:
        Dict with success status and message
    """
    conn = None
    cursor = None
    
    try:
        if not token or not new_password:
            return {'success': False, 'error': 'Token and new password are required'}
        
        if len(new_password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters'}
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Find user with valid token
        query = '''
            SELECT id FROM users 
            WHERE reset_token = %s 
            AND reset_token_expiry > NOW()
        '''
        cursor.execute(query, (token,))
        user = cursor.fetchone()
        
        if not user:
            return {'success': False, 'error': 'Invalid or expired reset token'}
        
        # Hash new password
        password_hash = hash_password(new_password)
        
        # Update password and clear reset token
        update_query = '''
            UPDATE users 
            SET password_hash = %s, 
                reset_token = NULL, 
                reset_token_expiry = NULL 
            WHERE id = %s
        '''
        cursor.execute(update_query, (password_hash, user['id']))
        conn.commit()
        
        return {
            'success': True,
            'message': 'Password reset successful'
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Password reset failed: {str(e)}'}
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def send_reset_email(email: str, token: str, user_name: str) -> bool:
    """
    Send password reset email to user
    
    NOTE: This is a placeholder. In production, integrate with:
    - SendGrid
    - Amazon SES
    - SMTP server
    
    Args:
        email: User's email
        token: Reset token
        user_name: User's name
        
    Returns:
        True if email sent successfully, False otherwise
    """
    # For now, just print to console (development mode)
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    
    print("\n" + "="*80)
    print("📧 PASSWORD RESET EMAIL (Development Mode)")
    print("="*80)
    print(f"To: {email}")
    print(f"Subject: Password Reset Request - GameSpot")
    print("-"*80)
    print(f"Hi {user_name},")
    print()
    print("You requested to reset your password. Click the link below to reset:")
    print()
    print(f"  {reset_link}")
    print()
    print("This link will expire in 24 hours.")
    print()
    print("If you didn't request this, please ignore this email.")
    print()
    print("GameSpot Team")
    print("="*80 + "\n")
    
    # TODO: Replace with actual email sending in production
    # import smtplib
    # from email.mime.text import MIMEText
    # ...
    
    return True


# Export functions
__all__ = [
    'hash_password',
    'verify_password',
    'register_user',
    'login_user',
    'get_user_by_id',
    'create_reset_token',
    'reset_password_with_token',
    'send_reset_email'
]
