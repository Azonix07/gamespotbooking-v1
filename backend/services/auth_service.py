"""
Authentication Service
Handles user registration, login, password management
"""

import bcrypt
import secrets
import sys
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
    Register a new user with email verification token.
    Does NOT auto-login — user must verify email first.
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
        
        # Generate email verification token
        verification_token = secrets.token_urlsafe(32)
        
        # Insert user with is_verified=FALSE
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = '''
            INSERT INTO users (name, email, phone, password_hash, is_verified, verification_token)
            VALUES (%s, %s, %s, %s, FALSE, %s)
        '''
        cursor.execute(query, (name, email, phone, password_hash, verification_token))
        conn.commit()
        
        user_id = cursor.lastrowid
        
        # Link past guest bookings
        try:
            _link_guest_bookings_to_user(cursor, conn, user_id, phone)
        except Exception as link_err:
            import sys
            sys.stderr.write(f"[Signup] Non-critical: failed to link guest bookings: {link_err}\n")
        
        # Send verification email (best-effort)
        email_sent = False
        try:
            from services.email_service import email_service
            if email_service.enabled:
                success_email, msg = email_service.send_verification_email(email, verification_token, name)
                if success_email:
                    email_sent = True
                    sys.stderr.write(f"[Signup] ✅ Verification email sent to {email}\n")
                else:
                    sys.stderr.write(f"[Signup] ⚠️ Verification email failed: {msg}\n")
            else:
                sys.stderr.write(f"[Signup] ⚠️ SMTP not configured — auto-verifying user\n")
        except Exception as email_err:
            sys.stderr.write(f"[Signup] ⚠️ Email send error: {email_err}\n")
        
        # If email couldn't be sent, auto-verify the user so they aren't stuck
        if not email_sent:
            try:
                cursor.execute("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = %s", (user_id,))
                conn.commit()
                sys.stderr.write(f"[Signup] ✅ Auto-verified user {user_id} (email delivery unavailable)\n")
            except Exception:
                pass
        
        return {
            'success': True,
            'message': 'Registration successful.' + (' Please check your email to verify your account.' if email_sent else ''),
            'needs_verification': email_sent,  # Only require verification if email was actually sent
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
    Authenticate a user by email OR phone number and password.
    Enforces: email verification, account blocking, failed attempt limits (8/day).
    """
    conn = None
    cursor = None
    
    try:
        if not identifier or not password:
            return {'success': False, 'error': 'Email/phone and password are required'}
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Detect if identifier is a phone number or email
        clean_identifier = identifier.strip()
        is_phone = clean_identifier.replace('+', '').replace(' ', '').replace('-', '').isdigit() and len(clean_identifier.replace('+', '').replace(' ', '').replace('-', '')) >= 10
        
        if is_phone:
            phone_digits = clean_identifier.replace('+', '').replace(' ', '').replace('-', '')
            query = 'SELECT * FROM users WHERE phone = %s'
            cursor.execute(query, (phone_digits,))
            user = cursor.fetchone()
            
            if not user and len(phone_digits) > 10:
                last10 = phone_digits[-10:]
                cursor.execute('SELECT * FROM users WHERE phone LIKE %s', (f'%{last10}',))
                user = cursor.fetchone()
        else:
            query = 'SELECT * FROM users WHERE email = %s'
            cursor.execute(query, (clean_identifier.lower(),))
            user = cursor.fetchone()
        
        if not user:
            return {'success': False, 'error': 'Email is not registered.'}
        
        # ── Check if account is blocked ──
        is_blocked = user.get('is_blocked', False)
        if is_blocked:
            return {'success': False, 'error': 'Your account is blocked. Contact admin.'}
        
        # ── Check email verification (skip for OAuth/OTP users) ──
        is_verified = user.get('is_verified')
        pw_hash = user.get('password_hash', '')
        is_oauth_user = pw_hash in ('GOOGLE_OAUTH', 'APPLE_OAUTH', 'OTP_LOGIN')
        # is_verified may be None if column doesn't exist yet — treat as verified
        if is_verified is not None and not is_verified and not is_oauth_user:
            return {'success': False, 'error': 'Your email is not verified. Please verify before logging in.'}
        
        # ── Verify password ──
        if not verify_password(password, pw_hash):
            # Failed login — update attempt counters
            try:
                from datetime import date
                today = date.today()
                last_failed = user.get('last_failed_attempt')
                current_attempts = user.get('failed_attempts', 0) or 0
                
                # Reset counter if last failure was not today
                if last_failed is None or (hasattr(last_failed, 'date') and last_failed.date() != today):
                    current_attempts = 0
                
                current_attempts += 1
                
                if current_attempts >= 8:
                    # Block the account
                    cursor.execute(
                        "UPDATE users SET failed_attempts = %s, last_failed_attempt = NOW(), is_blocked = TRUE WHERE id = %s",
                        (current_attempts, user['id'])
                    )
                    conn.commit()
                    return {'success': False, 'error': 'Account blocked due to multiple failed login attempts.'}
                else:
                    cursor.execute(
                        "UPDATE users SET failed_attempts = %s, last_failed_attempt = NOW() WHERE id = %s",
                        (current_attempts, user['id'])
                    )
                    conn.commit()
            except Exception as fa_err:
                import sys
                sys.stderr.write(f"[Login] Failed attempt tracking error: {fa_err}\n")
            
            return {'success': False, 'error': 'Invalid email/phone or password'}
        
        # ── Password correct — reset failed attempts ──
        try:
            cursor.execute(
                "UPDATE users SET failed_attempts = 0 WHERE id = %s",
                (user['id'],)
            )
            conn.commit()
        except Exception:
            pass
        
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


# ============================================================
# CRYPTOGRAPHIC UTILITIES FOR RESET TOKENS & OTP
# ============================================================
import hashlib

def _hash_token(token: str) -> str:
    """SHA-256 hash a token/OTP before storing in DB. Never store plaintext."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def _generate_secure_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP using secrets module."""
    return f"{secrets.randbelow(900000) + 100000}"


def generate_reset_token() -> str:
    """Generate a cryptographically secure URL-safe token (43 chars, 256 bits)."""
    return secrets.token_urlsafe(32)


def _invalidate_existing_resets(cursor, conn, user_id: int, reset_type: str = None):
    """Invalidate all pending resets for a user (prevents OTP flooding)."""
    if reset_type:
        cursor.execute(
            "UPDATE password_resets SET used = TRUE WHERE user_id = %s AND reset_type = %s AND used = FALSE",
            (user_id, reset_type)
        )
    else:
        cursor.execute(
            "UPDATE password_resets SET used = TRUE WHERE user_id = %s AND used = FALSE",
            (user_id,)
        )
    conn.commit()


def _cleanup_expired_resets(cursor, conn):
    """Purge expired reset rows (housekeeping)."""
    try:
        cursor.execute("DELETE FROM password_resets WHERE expires_at < NOW() AND used = TRUE")
        conn.commit()
    except Exception:
        pass


# ============================================================
# EMAIL RESET: create token → store hashed in DB → send link
# ============================================================

def create_reset_token(email: str) -> Dict[str, Any]:
    """
    Create a password reset token for a user.
    - Generates a secure 43-char URL-safe token
    - Stores SHA-256 hash in password_resets table (never plaintext)
    - Invalidates any previous pending resets for this user
    - Returns the raw token for emailing (NOT the hash)
    """
    import sys
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        sys.stderr.write(f"[ResetToken] Looking up email: {email}\n")
        
        cursor.execute('SELECT id, email, name FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()
        
        if not user:
            sys.stderr.write(f"[ResetToken] No user found for email (not revealing to client)\n")
            return {
                'success': True,
                'message': 'If the email exists, a reset link will be sent'
            }
        
        sys.stderr.write(f"[ResetToken] User found: id={user['id']}, generating token\n")
        
        # Invalidate any previous pending resets for this user
        _invalidate_existing_resets(cursor, conn, user['id'], 'email')
        
        # Generate token & hash
        raw_token = generate_reset_token()
        token_hash = _hash_token(raw_token)
        expiry_hours = 24
        
        # Store hashed token in password_resets table
        cursor.execute("""
            INSERT INTO password_resets (user_id, reset_type, token_hash, expires_at)
            VALUES (%s, 'email', %s, DATE_ADD(NOW(), INTERVAL %s HOUR))
        """, (user['id'], token_hash, expiry_hours))
        conn.commit()
        
        sys.stderr.write(f"[ResetToken] ✅ Token stored in DB for user {user['id']}, expires in {expiry_hours}h\n")
        
        # Also update legacy reset_token column for backward compat
        try:
            cursor.execute(
                "UPDATE users SET reset_token = %s, reset_token_expiry = DATE_ADD(NOW(), INTERVAL %s HOUR) WHERE id = %s",
                (token_hash, expiry_hours, user['id'])
            )
            conn.commit()
        except Exception:
            pass
        
        _cleanup_expired_resets(cursor, conn)
        
        return {
            'success': True,
            'message': 'If the email exists, a reset link will be sent',
            'token': raw_token,  # Raw token for email link — NOT stored in DB
            'user': user
        }
        
    except Exception as e:
        sys.stderr.write(f"[ResetToken] ❌ Error: {e}\n")
        return {'success': False, 'error': f'Failed to create reset token: {str(e)}'}
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# EMAIL RESET: verify token hash → reset password
# ============================================================

def reset_password_with_token(token: str, new_password: str) -> Dict[str, Any]:
    """
    Reset user password using a valid email reset token.
    - Hashes the incoming token with SHA-256
    - Looks up matching row in password_resets
    - Checks expiry, used flag
    - Hashes new password with bcrypt, updates users table
    - Marks reset row as used (single-use)
    """
    import sys
    conn = None
    cursor = None
    
    try:
        if not token or not new_password:
            return {'success': False, 'error': 'Token and new password are required'}
        
        if len(new_password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters'}
        
        token_hash = _hash_token(token)
        sys.stderr.write(f"[ResetPassword] Verifying token hash...\n")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Look up token in password_resets table
        cursor.execute("""
            SELECT id, user_id FROM password_resets
            WHERE token_hash = %s
              AND reset_type = 'email'
              AND used = FALSE
              AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        """, (token_hash,))
        reset_row = cursor.fetchone()
        
        if not reset_row:
            sys.stderr.write("[ResetPassword] ❌ No matching valid token found\n")
            return {'success': False, 'error': 'Invalid or expired reset link. Please request a new one.'}
        
        # Hash new password with bcrypt
        password_hash_new = hash_password(new_password)
        
        # Update user password & clear legacy reset fields
        cursor.execute("""
            UPDATE users 
            SET password_hash = %s, reset_token = NULL, reset_token_expiry = NULL 
            WHERE id = %s
        """, (password_hash_new, reset_row['user_id']))
        
        # Mark this reset as used (single-use)
        cursor.execute(
            "UPDATE password_resets SET used = TRUE WHERE id = %s",
            (reset_row['id'],)
        )
        
        # Invalidate ALL pending resets for this user (security)
        _invalidate_existing_resets(cursor, conn, reset_row['user_id'])
        
        conn.commit()
        sys.stderr.write(f"[ResetPassword] ✅ Password reset successful for user {reset_row['user_id']}\n")
        
        return {
            'success': True,
            'message': 'Password reset successful'
        }
        
    except Exception as e:
        sys.stderr.write(f"[ResetPassword] ❌ Error: {e}\n")
        return {'success': False, 'error': 'Password reset failed. Please try again.'}
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ============================================================
# PHONE OTP: generate → store hashed in DB → return for sending
# ============================================================

def create_phone_otp(phone: str) -> Dict[str, Any]:
    """
    Generate a secure 6-digit OTP for phone-based password reset.
    - Finds user by phone number
    - Generates cryptographically secure OTP
    - Stores SHA-256 hash in password_resets table
    - Returns the raw OTP (for SMS/email sending — never stored)
    """
    import sys
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        phone_digits = phone.replace('+', '').replace(' ', '').replace('-', '')
        sys.stderr.write(f"[PhoneOTP] Looking up phone: ***{phone_digits[-4:]}\n")

        cursor.execute('SELECT id, name, phone, email FROM users WHERE phone = %s', (phone_digits,))
        user = cursor.fetchone()

        # Fallback: try last-10-digit match
        if not user and len(phone_digits) > 10:
            last10 = phone_digits[-10:]
            cursor.execute('SELECT id, name, phone, email FROM users WHERE phone LIKE %s', (f'%{last10}',))
            user = cursor.fetchone()

        if not user:
            sys.stderr.write("[PhoneOTP] No user found (not revealing to client)\n")
            return {'success': True, 'found': False}

        sys.stderr.write(f"[PhoneOTP] User found: id={user['id']}, generating OTP\n")

        # Invalidate previous phone resets for this user
        _invalidate_existing_resets(cursor, conn, user['id'], 'phone')

        # Generate secure OTP & hash it
        raw_otp = _generate_secure_otp()
        otp_hash = _hash_token(raw_otp)
        expiry_minutes = 5

        # Store hashed OTP in DB
        cursor.execute("""
            INSERT INTO password_resets (user_id, reset_type, token_hash, expires_at)
            VALUES (%s, 'phone', %s, DATE_ADD(NOW(), INTERVAL %s MINUTE))
        """, (user['id'], otp_hash, expiry_minutes))
        conn.commit()

        sys.stderr.write(f"[PhoneOTP] ✅ OTP stored in DB for user {user['id']}, expires in {expiry_minutes}m\n")

        _cleanup_expired_resets(cursor, conn)

        return {
            'success': True,
            'found': True,
            'otp': raw_otp,  # Raw OTP for sending — NOT stored in DB
            'user': user
        }

    except Exception as e:
        sys.stderr.write(f"[PhoneOTP] ❌ Error: {e}\n")
        return {'success': False, 'error': str(e)}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def verify_phone_otp_and_reset(phone: str, otp: str, new_password: str) -> Dict[str, Any]:
    """
    Verify a phone OTP and reset the password.
    - Hashes the incoming OTP with SHA-256
    - Looks up matching row in password_resets for this user's phone
    - Checks expiry, attempts (max 3), used flag
    - On success: hashes new password, updates DB, marks OTP used
    - On failure: increments attempt counter, returns generic error
    """
    import sys
    conn = None
    cursor = None

    try:
        if len(new_password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters'}

        phone_digits = phone.replace('+', '').replace(' ', '').replace('-', '')
        otp_hash = _hash_token(otp)

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Find user by phone
        cursor.execute('SELECT id FROM users WHERE phone = %s', (phone_digits,))
        user = cursor.fetchone()
        if not user and len(phone_digits) > 10:
            last10 = phone_digits[-10:]
            cursor.execute('SELECT id FROM users WHERE phone LIKE %s', (f'%{last10}',))
            user = cursor.fetchone()

        if not user:
            return {'success': False, 'error': 'Invalid OTP. Please try again.'}

        # Find the latest valid OTP for this user
        cursor.execute("""
            SELECT id, token_hash, attempts FROM password_resets
            WHERE user_id = %s
              AND reset_type = 'phone'
              AND used = FALSE
              AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        """, (user['id'],))
        reset_row = cursor.fetchone()

        if not reset_row:
            sys.stderr.write(f"[VerifyOTP] ❌ No valid OTP found for user {user['id']}\n")
            return {'success': False, 'error': 'OTP expired or not found. Please request a new one.'}

        # Check max attempts (brute-force protection)
        if reset_row['attempts'] >= 3:
            # Invalidate this OTP
            cursor.execute("UPDATE password_resets SET used = TRUE WHERE id = %s", (reset_row['id'],))
            conn.commit()
            sys.stderr.write(f"[VerifyOTP] ❌ Max attempts reached for user {user['id']}\n")
            return {'success': False, 'error': 'Too many failed attempts. Please request a new OTP.'}

        # Compare hashed OTP
        if reset_row['token_hash'] != otp_hash:
            # Increment attempt counter
            cursor.execute(
                "UPDATE password_resets SET attempts = attempts + 1 WHERE id = %s",
                (reset_row['id'],)
            )
            conn.commit()
            remaining = 3 - (reset_row['attempts'] + 1)
            sys.stderr.write(f"[VerifyOTP] ❌ Wrong OTP for user {user['id']}, {remaining} attempts left\n")
            return {'success': False, 'error': f'Invalid OTP. {remaining} attempt(s) remaining.'}

        # ✅ OTP verified — reset the password
        password_hash_new = hash_password(new_password)

        cursor.execute("""
            UPDATE users
            SET password_hash = %s, reset_token = NULL, reset_token_expiry = NULL
            WHERE id = %s
        """, (password_hash_new, user['id']))

        # Mark OTP as used (single-use)
        cursor.execute("UPDATE password_resets SET used = TRUE WHERE id = %s", (reset_row['id'],))

        # Invalidate ALL pending resets for this user
        _invalidate_existing_resets(cursor, conn, user['id'])

        conn.commit()
        sys.stderr.write(f"[VerifyOTP] ✅ Password reset successful for user {user['id']}\n")

        return {
            'success': True,
            'message': 'Password reset successful! You can now login with your new password.'
        }

    except Exception as e:
        sys.stderr.write(f"[VerifyOTP] ❌ Error: {e}\n")
        return {'success': False, 'error': 'Password reset failed. Please try again.'}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def send_reset_email(email: str, token: str, user_name: str) -> bool:
    """
    Send password reset email to user via SMTP.
    Falls back to console logging if SMTP is not configured.
    
    Args:
        email: User's email
        token: Reset token
        user_name: User's name
        
    Returns:
        True if email sent successfully, False otherwise
    """
    import sys

    try:
        from services.email_service import email_service

        if email_service.enabled:
            success, message = email_service.send_password_reset(email, token, user_name)
            if success:
                return True
            else:
                sys.stderr.write(f"[ResetEmail] SMTP failed: {message}, falling back to console\n")
        else:
            sys.stderr.write("[ResetEmail] SMTP not configured, logging to console\n")
    except Exception as e:
        sys.stderr.write(f"[ResetEmail] Email service error: {e}\n")

    # Fallback: log to console (visible in Railway logs)
    import os
    frontend_url = os.getenv('FRONTEND_URL', 'https://gamespotkdlr.com')
    reset_link = f"{frontend_url}/reset-password?token={token}"

    sys.stderr.write("\n" + "="*80 + "\n")
    sys.stderr.write("📧 PASSWORD RESET EMAIL (Console Fallback)\n")
    sys.stderr.write("="*80 + "\n")
    sys.stderr.write(f"To: {email}\n")
    sys.stderr.write(f"Reset Link: {reset_link}\n")
    sys.stderr.write("="*80 + "\n\n")

    return False


# ─── Email Verification ─────────────────────────────────────────────────
def verify_email_token(token: str) -> Dict[str, Any]:
    """
    Verify a user's email via the verification token sent during signup.
    Sets is_verified=TRUE and clears the token.
    """
    conn = None
    cursor = None
    try:
        if not token:
            return {'success': False, 'error': 'Verification token is required.'}

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, name, email, is_verified FROM users WHERE verification_token = %s",
            (token,)
        )
        user = cursor.fetchone()

        if not user:
            return {'success': False, 'error': 'Invalid or expired verification link.'}

        if user.get('is_verified'):
            return {'success': True, 'message': 'Email is already verified. You can login.'}

        cursor.execute(
            "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = %s",
            (user['id'],)
        )
        conn.commit()

        sys.stderr.write(f"[VerifyEmail] ✅ Email verified for user {user['id']} ({user['email']})\n")
        return {'success': True, 'message': 'Email verified successfully! You can now login.'}

    except Exception as e:
        sys.stderr.write(f"[VerifyEmail] ❌ Error: {e}\n")
        return {'success': False, 'error': 'Verification failed. Please try again.'}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


# ─── Forgot Password Email OTP ─────────────────────────────────────────
def create_email_otp(email: str) -> Dict[str, Any]:
    """
    Generate a 6-digit OTP for forgot-password, store it on the user row,
    and send it via email. OTP expires in 10 minutes.
    """
    conn = None
    cursor = None
    try:
        if not email:
            return {'success': False, 'error': 'Email is required.'}

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, name, email FROM users WHERE email = %s", (email.strip().lower(),))
        user = cursor.fetchone()

        if not user:
            # Don't reveal whether the email exists
            return {'success': True, 'message': 'If the email is registered, an OTP has been sent.'}

        import random
        otp = str(random.randint(100000, 999999))

        cursor.execute(
            "UPDATE users SET reset_otp = %s, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = %s",
            (otp, user['id'])
        )
        conn.commit()

        # Send OTP email
        email_sent = False
        try:
            from services.email_service import email_service
            if email_service.enabled:
                success, msg = email_service.send_forgot_password_otp(user['email'], otp, user['name'])
                if success:
                    email_sent = True
                    sys.stderr.write(f"[ForgotPW] ✅ OTP email sent to {user['email']}\n")
                else:
                    sys.stderr.write(f"[ForgotPW] ⚠️ Email send failed: {msg}\n")
            else:
                sys.stderr.write(f"[ForgotPW] ⚠️ SMTP not configured — cannot send OTP email\n")
        except Exception as mail_err:
            sys.stderr.write(f"[ForgotPW] ⚠️ Email error: {mail_err}\n")

        if email_sent:
            return {'success': True, 'message': 'If the email is registered, an OTP has been sent. Check your inbox!'}
        else:
            # SMTP not working — tell user email service is down (never expose OTP to client)
            return {'success': False, 'error': 'Email service is temporarily unavailable. Please try again later or contact support.'}

    except Exception as e:
        sys.stderr.write(f"[ForgotPW] ❌ Error: {e}\n")
        return {'success': False, 'error': 'Failed to send OTP. Please try again.'}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def verify_reset_otp(email: str, otp: str) -> Dict[str, Any]:
    """
    Verify the 6-digit OTP for a forgot-password request.
    Does NOT reset the password — just confirms OTP is correct.
    """
    conn = None
    cursor = None
    try:
        if not email or not otp:
            return {'success': False, 'error': 'Email and OTP are required.'}

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, reset_otp, otp_expiry FROM users WHERE email = %s",
            (email.strip().lower(),)
        )
        user = cursor.fetchone()

        if not user:
            return {'success': False, 'error': 'Invalid email or OTP.'}

        stored_otp = user.get('reset_otp')
        otp_expiry = user.get('otp_expiry')

        if not stored_otp or not otp_expiry:
            return {'success': False, 'error': 'No OTP found. Please request a new one.'}

        from datetime import datetime
        now = datetime.now()
        if hasattr(otp_expiry, 'timestamp'):
            if now > otp_expiry:
                return {'success': False, 'error': 'OTP has expired. Please request a new one.'}

        if stored_otp != otp.strip():
            return {'success': False, 'error': 'Invalid OTP. Please try again.'}

        sys.stderr.write(f"[VerifyOTP] ✅ OTP verified for {email}\n")
        return {'success': True, 'message': 'OTP verified. You can now reset your password.'}

    except Exception as e:
        sys.stderr.write(f"[VerifyOTP] ❌ Error: {e}\n")
        return {'success': False, 'error': 'Verification failed. Please try again.'}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def reset_password_after_otp(email: str, otp: str, new_password: str) -> Dict[str, Any]:
    """
    Reset password after OTP is verified.
    Re-verifies OTP, hashes new password, updates DB, clears OTP fields.
    """
    conn = None
    cursor = None
    try:
        if not email or not otp or not new_password:
            return {'success': False, 'error': 'Email, OTP, and new password are required.'}

        if len(new_password) < 6:
            return {'success': False, 'error': 'Password must be at least 6 characters.'}

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, reset_otp, otp_expiry FROM users WHERE email = %s",
            (email.strip().lower(),)
        )
        user = cursor.fetchone()

        if not user:
            return {'success': False, 'error': 'Invalid request.'}

        stored_otp = user.get('reset_otp')
        otp_expiry = user.get('otp_expiry')

        if not stored_otp or not otp_expiry:
            return {'success': False, 'error': 'No OTP found. Please request a new one.'}

        from datetime import datetime
        now = datetime.now()
        if hasattr(otp_expiry, 'timestamp') and now > otp_expiry:
            return {'success': False, 'error': 'OTP has expired. Please request a new one.'}

        if stored_otp != otp.strip():
            return {'success': False, 'error': 'Invalid OTP.'}

        # ✅ OTP valid — reset password
        new_hash = hash_password(new_password)

        cursor.execute(
            "UPDATE users SET password_hash = %s, reset_otp = NULL, otp_expiry = NULL WHERE id = %s",
            (new_hash, user['id'])
        )
        conn.commit()

        sys.stderr.write(f"[ResetPW] ✅ Password reset for user {user['id']} ({email})\n")
        return {'success': True, 'message': 'Password reset successful! You can now login with your new password.'}

    except Exception as e:
        sys.stderr.write(f"[ResetPW] ❌ Error: {e}\n")
        return {'success': False, 'error': 'Password reset failed. Please try again.'}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def resend_verification_email(email: str) -> Dict[str, Any]:
    """
    Resend the verification email for a user who hasn't verified yet.
    """
    conn = None
    cursor = None
    try:
        if not email:
            return {'success': False, 'error': 'Email is required.'}

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, name, email, is_verified, verification_token FROM users WHERE email = %s",
            (email.strip().lower(),)
        )
        user = cursor.fetchone()

        if not user:
            return {'success': True, 'message': 'If the email is registered, a verification email has been sent.'}

        if user.get('is_verified'):
            return {'success': False, 'error': 'Email is already verified. You can login.'}

        # Generate new token if missing
        token = user.get('verification_token')
        if not token:
            token = secrets.token_urlsafe(32)
            cursor.execute(
                "UPDATE users SET verification_token = %s WHERE id = %s",
                (token, user['id'])
            )
            conn.commit()

        # Send email
        email_sent = False
        try:
            from services.email_service import email_service
            if email_service.enabled:
                success, msg = email_service.send_verification_email(user['email'], token, user['name'])
                if success:
                    email_sent = True
                    sys.stderr.write(f"[ResendVerify] ✅ Verification email resent to {user['email']}\n")
                else:
                    sys.stderr.write(f"[ResendVerify] ⚠️ Email failed: {msg}\n")
            else:
                sys.stderr.write(f"[ResendVerify] ⚠️ SMTP not configured — auto-verifying user\n")
        except Exception as mail_err:
            sys.stderr.write(f"[ResendVerify] ⚠️ Email error: {mail_err}\n")

        # If email couldn't be sent, auto-verify the user so they aren't stuck
        if not email_sent:
            try:
                cursor.execute("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = %s", (user['id'],))
                conn.commit()
                sys.stderr.write(f"[ResendVerify] ✅ Auto-verified user {user['id']} (email delivery unavailable)\n")
                return {'success': True, 'message': 'Your account has been verified. You can now login.', 'auto_verified': True}
            except Exception:
                pass

        return {'success': True, 'message': 'If the email is registered, a verification email has been sent.'}

    except Exception as e:
        sys.stderr.write(f"[ResendVerify] ❌ Error: {e}\n")
        return {'success': False, 'error': 'Failed to resend. Please try again.'}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


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
    'create_phone_otp',
    'verify_phone_otp_and_reset',
    'verify_email_token',
    'create_email_otp',
    'verify_reset_otp',
    'reset_password_after_otp',
    'resend_verification_email',
]
