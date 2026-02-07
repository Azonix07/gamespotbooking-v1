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
        
        # ============================================================
        # LINK PAST GUEST BOOKINGS TO THIS NEW USER
        # If they booked as a guest with this phone number before
        # signing up, claim those bookings and award retroactive points
        # ============================================================
        try:
            _link_guest_bookings_to_user(cursor, conn, user_id, phone)
        except Exception as link_err:
            import sys
            sys.stderr.write(f"[Signup] Non-critical: failed to link guest bookings: {link_err}\n")
        
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


def _link_guest_bookings_to_user(cursor, conn, user_id, phone):
    """
    Link all past guest bookings (user_id IS NULL) that match this
    phone number to the newly registered user. Also retroactively
    award points for those bookings.
    """
    import sys
    
    # Check if user_id column exists in bookings
    try:
        cursor.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'user_id'
        """)
        if not cursor.fetchone():
            sys.stderr.write("[Signup] bookings.user_id column not found, skipping guest linking\n")
            return
    except Exception:
        return
    
    # Find all guest bookings with this phone number
    try:
        cursor.execute("""
            SELECT id, total_price, points_awarded
            FROM bookings
            WHERE customer_phone = %s AND user_id IS NULL
        """, (phone,))
        guest_bookings = cursor.fetchall()
    except Exception:
        # points_awarded column might not exist — try without it
        cursor.execute("""
            SELECT id, total_price
            FROM bookings
            WHERE customer_phone = %s AND user_id IS NULL
        """, (phone,))
        guest_bookings = cursor.fetchall()
    
    if not guest_bookings:
        return
    
    # Link all guest bookings to this user
    cursor.execute("""
        UPDATE bookings
        SET user_id = %s
        WHERE customer_phone = %s AND user_id IS NULL
    """, (user_id, phone))
    
    linked_count = cursor.rowcount
    
    # Retroactively award points for un-awarded bookings
    total_points = 0
    for booking in guest_bookings:
        if not booking.get('points_awarded'):
            points = int(float(booking['total_price']) * 0.50)
            if points > 0:
                total_points += points
                
                # Record in points_history
                try:
                    cursor.execute("""
                        INSERT INTO points_history (user_id, booking_id, points_earned, points_type, booking_amount)
                        VALUES (%s, %s, %s, 'booking', %s)
                    """, (user_id, booking['id'], points, float(booking['total_price'])))
                except Exception:
                    pass  # points_history table might not exist
                
                # Mark booking as points_awarded
                try:
                    cursor.execute(
                        "UPDATE bookings SET points_awarded = TRUE WHERE id = %s",
                        (booking['id'],)
                    )
                except Exception:
                    pass  # points_awarded column might not exist
    
    # Add total points to user
    if total_points > 0:
        cursor.execute("""
            UPDATE users SET gamespot_points = gamespot_points + %s WHERE id = %s
        """, (total_points, user_id))
    
    conn.commit()
    
    sys.stderr.write(
        f"[Signup] Linked {linked_count} guest bookings to user {user_id} (phone: {phone}). "
        f"Retroactive points: {total_points}\n"
    )


def link_guest_bookings_on_login(user_id, phone):
    """
    Called on every login — link any NEW guest bookings (user_id IS NULL)
    that match this user's phone number. This catches bookings made
    when the user wasn't logged in (e.g., booked from a different device).
    Uses its own DB connection so it's independent from the login flow.
    """
    if not phone:
        return
    
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        _link_guest_bookings_to_user(cursor, conn, user_id, phone)
    except Exception as e:
        import sys
        sys.stderr.write(f"[Login Link] Error linking guest bookings: {e}\n")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def login_user(identifier: str, password: str) -> Dict[str, Any]:
    """
    Authenticate a user by email OR phone number and password
    
    Args:
        identifier: User's email or phone number
        password: Plain text password
        
    Returns:
        Dict with success status and user data or error message
    """
    conn = None
    cursor = None
    
    try:
        if not identifier or not password:
            return {'success': False, 'error': 'Email/phone and password are required'}
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Detect if identifier is a phone number or email
        # Phone: digits only (optionally with + prefix), at least 10 digits
        clean_identifier = identifier.strip()
        is_phone = clean_identifier.replace('+', '').replace(' ', '').replace('-', '').isdigit() and len(clean_identifier.replace('+', '').replace(' ', '').replace('-', '')) >= 10
        
        if is_phone:
            # Strip non-digit characters for matching (keep last 10 digits)
            phone_digits = clean_identifier.replace('+', '').replace(' ', '').replace('-', '')
            # Try exact match first, then last-10-digits match
            query = 'SELECT * FROM users WHERE phone = %s'
            cursor.execute(query, (phone_digits,))
            user = cursor.fetchone()
            
            if not user and len(phone_digits) > 10:
                # Try matching last 10 digits (e.g., +91 prefix)
                last10 = phone_digits[-10:]
                cursor.execute('SELECT * FROM users WHERE phone LIKE %s', (f'%{last10}',))
                user = cursor.fetchone()
        else:
            # Email-based lookup
            query = 'SELECT * FROM users WHERE email = %s'
            cursor.execute(query, (clean_identifier.lower(),))
            user = cursor.fetchone()
        
        if not user:
            return {'success': False, 'error': 'Invalid email/phone or password'}
        
        # Verify password
        if not verify_password(password, user['password_hash']):
            return {'success': False, 'error': 'Invalid email/phone or password'}
        
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
    'send_reset_email',
    'link_guest_bookings_on_login',
]
