"""
Promo Codes API Routes
Handles generation, validation, and application of promo codes
"""

from flask import Blueprint, request, jsonify
from config.database import get_db_connection
from middleware.auth import require_auth
import random
import string
from datetime import datetime, timedelta

promo_bp = Blueprint('promo', __name__)

def generate_code(prefix='PROMO', length=8):
    """Generate a unique promo code"""
    chars = string.ascii_uppercase + string.digits
    code = prefix + ''.join(random.choices(chars, k=length))
    return code

def check_code_exists(code, cursor):
    """Check if promo code already exists"""
    cursor.execute('SELECT id FROM promo_codes WHERE code = %s', (code,))
    return cursor.fetchone() is not None

@promo_bp.route('/api/promo/generate', methods=['POST'])
@require_auth
def generate_promo_code(user):
    """Generate a new promo code (authenticated users only)"""
    conn = None
    cursor = None
    
    try:
        print(f'[Promo Code] Generate request from user: {user}')
        
        data = request.get_json() or {}
        code_type = data.get('type', 'invite')
        bonus_minutes = data.get('bonus_minutes', 30)
        max_uses = data.get('max_uses', 1)
        expires_days = data.get('expires_days', 90)
        
        print(f'[Promo Code] Type: {code_type}, Bonus: {bonus_minutes}, Max uses: {max_uses}')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Generate unique code
        attempts = 0
        while attempts < 10:
            code = generate_code()
            if not check_code_exists(code, cursor):
                break
            attempts += 1
        
        if attempts >= 10:
            return jsonify({'success': False, 'error': 'Failed to generate unique code'}), 500
        
        # Calculate expiry date
        expires_at = datetime.now() + timedelta(days=expires_days)
        
        # Insert promo code
        cursor.execute('''
            INSERT INTO promo_codes (
                code, code_type, bonus_minutes, max_uses, 
                current_uses, is_active, expires_at, created_by_user_id
            ) VALUES (%s, %s, %s, %s, 0, TRUE, %s, %s)
        ''', (code, code_type, bonus_minutes, max_uses, expires_at, user['id']))
        
        conn.commit()
        code_id = cursor.lastrowid
        
        print(f'[Promo Code] Successfully generated: {code} (ID: {code_id})')
        
        return jsonify({
            'success': True,
            'promo_code': {
                'id': code_id,
                'code': code,
                'type': code_type,
                'bonus_minutes': bonus_minutes,
                'max_uses': max_uses,
                'expires_at': expires_at.isoformat()
            }
        })
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f'[Promo Code] Error generating promo code: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'error': f'Failed to generate promo code: {str(e)}'
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@promo_bp.route('/api/promo/validate', methods=['POST'])
def validate_promo_code():
    """Validate a promo code"""
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        code = data.get('code', '').strip().upper()
        
        if not code:
            return jsonify({'success': False, 'error': 'Promo code is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Find promo code
        cursor.execute('''
            SELECT 
                id, code, code_type, bonus_minutes, 
                max_uses, current_uses, is_active, expires_at
            FROM promo_codes
            WHERE code = %s
        ''', (code,))
        
        promo = cursor.fetchone()
        
        if not promo:
            return jsonify({
                'success': False,
                'valid': False,
                'error': 'Invalid promo code'
            })
        
        # Check if active
        if not promo['is_active']:
            return jsonify({
                'success': False,
                'valid': False,
                'error': 'This promo code is no longer active'
            })
        
        # Check if expired
        if promo['expires_at'] and datetime.now() > promo['expires_at']:
            return jsonify({
                'success': False,
                'valid': False,
                'error': 'This promo code has expired'
            })
        
        # Check usage limit
        if promo['current_uses'] >= promo['max_uses']:
            return jsonify({
                'success': False,
                'valid': False,
                'error': 'This promo code has reached its usage limit'
            })
        
        return jsonify({
            'success': True,
            'valid': True,
            'promo_code': {
                'id': promo['id'],
                'code': promo['code'],
                'type': promo['code_type'],
                'bonus_minutes': promo['bonus_minutes']
            }
        })
        
    except Exception as e:
        print(f'Error validating promo code: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@promo_bp.route('/api/promo/apply', methods=['POST'])
def apply_promo_code():
    """
    Mark a promo code as used
    Called when booking is confirmed with a promo code
    """
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        promo_code_id = data.get('promo_code_id')
        booking_id = data.get('booking_id')
        
        if not promo_code_id:
            return jsonify({'success': False, 'error': 'Promo code ID is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Increment usage count
        cursor.execute('''
            UPDATE promo_codes
            SET current_uses = current_uses + 1
            WHERE id = %s
        ''', (promo_code_id,))
        
        # Update booking with promo code
        if booking_id:
            cursor.execute('''
                UPDATE bookings
                SET promo_code_id = %s
                WHERE id = %s
            ''', (promo_code_id, booking_id))
        
        conn.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f'Error applying promo code: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@promo_bp.route('/api/promo/my-codes', methods=['GET'])
@require_auth
def get_my_promo_codes(user):
    """Get promo codes created by the current user"""
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT 
                id, code, code_type, bonus_minutes, 
                max_uses, current_uses, is_active, 
                expires_at, created_at
            FROM promo_codes
            WHERE created_by_user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        ''', (user['id'],))
        
        codes = cursor.fetchall()
        
        # Format dates
        for code in codes:
            if code['expires_at']:
                code['expires_at'] = code['expires_at'].isoformat()
            if code['created_at']:
                code['created_at'] = code['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'promo_codes': codes
        })
        
    except Exception as e:
        print(f'Error fetching promo codes: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
