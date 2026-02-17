"""
Instagram Promotion API Routes
Handles Instagram follow/share promotions, redemptions, and verification
"""

from flask import Blueprint, request, jsonify, session
from config.database import get_db_connection
from middleware.auth import require_login, require_admin_decorator as require_admin
from datetime import datetime, timedelta
import secrets
import string

instagram_promo_bp = Blueprint('instagram_promo', __name__)

def generate_redemption_code():
    """Generate unique redemption code"""
    # Format: INSTA-XXXX-XXXX (e.g., INSTA-AB3K-9F2L)
    part1 = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    part2 = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    return f"INSTA-{part1}-{part2}"

# ============================================================================
# Public Endpoints - Get Active Promotions
# ============================================================================

@instagram_promo_bp.route('/api/instagram-promo/active', methods=['GET', 'OPTIONS'])
def get_active_promotions():
    """Get all active Instagram promotions (public endpoint)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get active promotions
        query = '''
            SELECT 
                id,
                campaign_name,
                instagram_handle,
                discount_type,
                discount_value,
                required_friends_count,
                max_redemptions_per_user,
                start_date,
                end_date,
                terms_conditions
            FROM instagram_promotions
            WHERE is_active = TRUE
              AND start_date <= CURDATE()
              AND (end_date IS NULL OR end_date >= CURDATE())
            ORDER BY created_at DESC
        '''
        
        cursor.execute(query)
        promotions = cursor.fetchall()
        
        # Format dates
        for promo in promotions:
            promo['start_date'] = promo['start_date'].isoformat() if promo['start_date'] else None
            promo['end_date'] = promo['end_date'].isoformat() if promo['end_date'] else None
        
        return jsonify({
            'success': True,
            'promotions': promotions
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ============================================================================
# User Endpoints - Require Login
# ============================================================================

@instagram_promo_bp.route('/api/instagram-promo/check-eligibility', methods=['GET', 'OPTIONS'])
@require_login
def check_eligibility():
    """Check if user is eligible for Instagram promotion"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        user_id = session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get active promotion
        cursor.execute('''
            SELECT 
                id,
                campaign_name,
                instagram_handle,
                discount_type,
                discount_value,
                required_friends_count,
                max_redemptions_per_user,
                terms_conditions
            FROM instagram_promotions
            WHERE is_active = TRUE
              AND start_date <= CURDATE()
              AND (end_date IS NULL OR end_date >= CURDATE())
            ORDER BY created_at DESC
            LIMIT 1
        ''')
        
        promotion = cursor.fetchone()
        
        if not promotion:
            return jsonify({
                'success': False,
                'error': 'No active Instagram promotion available',
                'eligible': False
            })
        
        # Check if user has already claimed this promotion
        cursor.execute('''
            SELECT COUNT(*) as claim_count
            FROM user_instagram_redemptions
            WHERE user_id = %s 
              AND promotion_id = %s
        ''', (user_id, promotion['id']))
        
        result = cursor.fetchone()
        claims = result['claim_count']
        
        eligible = claims < promotion['max_redemptions_per_user']
        
        # Get user's redemption status if exists
        cursor.execute('''
            SELECT 
                id,
                redemption_code,
                verification_status,
                is_used,
                used_at,
                expires_at,
                created_at
            FROM user_instagram_redemptions
            WHERE user_id = %s 
              AND promotion_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        ''', (user_id, promotion['id']))
        
        redemption = cursor.fetchone()
        
        if redemption:
            # Format dates
            for date_field in ['used_at', 'expires_at', 'created_at']:
                if redemption.get(date_field):
                    redemption[date_field] = redemption[date_field].isoformat()
        
        return jsonify({
            'success': True,
            'eligible': eligible,
            'promotion': promotion,
            'redemption': redemption,
            'claims_used': claims,
            'max_claims': promotion['max_redemptions_per_user']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@instagram_promo_bp.route('/api/instagram-promo/claim', methods=['POST', 'OPTIONS'])
@require_login
def claim_promotion():
    """Claim Instagram promotion (requires login)"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        user_id = session.get('user_id')
        data = request.get_json()
        
        promotion_id = data.get('promotion_id')
        instagram_username = data.get('instagram_username', '').strip()
        shared_with_friends = data.get('shared_with_friends', [])
        
        # Validate inputs
        if not promotion_id:
            return jsonify({'success': False, 'error': 'Promotion ID is required'}), 400
        
        if not instagram_username:
            return jsonify({'success': False, 'error': 'Instagram username is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get promotion details
        cursor.execute('''
            SELECT * FROM instagram_promotions
            WHERE id = %s 
              AND is_active = TRUE
              AND start_date <= CURDATE()
              AND (end_date IS NULL OR end_date >= CURDATE())
        ''', (promotion_id,))
        
        promotion = cursor.fetchone()
        
        if not promotion:
            return jsonify({'success': False, 'error': 'Invalid or expired promotion'}), 400
        
        # Check if user already claimed
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM user_instagram_redemptions
            WHERE user_id = %s AND promotion_id = %s
        ''', (user_id, promotion_id))
        
        if cursor.fetchone()['count'] >= promotion['max_redemptions_per_user']:
            return jsonify({
                'success': False,
                'error': 'You have already claimed this promotion'
            }), 400
        
        # Validate shared_with_friends count
        if len(shared_with_friends) < promotion['required_friends_count']:
            return jsonify({
                'success': False,
                'error': f'You must share with at least {promotion["required_friends_count"]} friends'
            }), 400
        
        # Generate unique redemption code
        redemption_code = generate_redemption_code()
        
        # Set expiry (30 days from now)
        expires_at = datetime.now() + timedelta(days=30)
        
        # Create redemption record as PENDING (admin must approve)
        cursor.execute('''
            INSERT INTO user_instagram_redemptions (
                user_id,
                promotion_id,
                instagram_username,
                shared_with_friends,
                verification_status,
                redemption_code,
                expires_at
            ) VALUES (%s, %s, %s, %s, 'pending', %s, %s)
        ''', (
            user_id,
            promotion_id,
            instagram_username,
            ','.join(shared_with_friends),
            redemption_code,
            expires_at
        ))
        
        conn.commit()
        redemption_id = cursor.lastrowid
        
        # Notify admin about the new claim
        try:
            from services.admin_notify import notify_new_offer_claim
            cursor.execute("SELECT name, phone FROM users WHERE id = %s", (user_id,))
            user_row = cursor.fetchone()
            notify_new_offer_claim(
                claim_id=redemption_id,
                user_name=user_row['name'] if user_row else 'Unknown',
                user_phone=user_row['phone'] if user_row else '',
                offer_name=promotion.get('title', 'Instagram Promo')
            )
        except Exception as notify_err:
            import sys
            sys.stderr.write(f"[InstaPromo] Admin notification failed (non-critical): {notify_err}\n")
        
        return jsonify({
            'success': True,
            'message': 'Your claim request has been submitted! The admin will review and approve it shortly.',
            'redemption': {
                'id': redemption_id,
                'redemption_code': redemption_code,
                'discount_type': promotion['discount_type'],
                'discount_value': float(promotion['discount_value']),
                'expires_at': expires_at.isoformat(),
                'verification_status': 'pending'
            }
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@instagram_promo_bp.route('/api/instagram-promo/my-redemptions', methods=['GET', 'OPTIONS'])
@require_login
def get_my_redemptions():
    """Get user's Instagram promotion redemptions"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        user_id = session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get user's redemptions with promotion details
        cursor.execute('''
            SELECT 
                r.*,
                p.campaign_name,
                p.instagram_handle,
                p.discount_type,
                p.discount_value
            FROM user_instagram_redemptions r
            JOIN instagram_promotions p ON r.promotion_id = p.id
            WHERE r.user_id = %s
            ORDER BY r.created_at DESC
        ''', (user_id,))
        
        redemptions = cursor.fetchall()
        
        # Format dates
        for redemption in redemptions:
            for date_field in ['verified_at', 'used_at', 'expires_at', 'created_at', 'updated_at']:
                if redemption.get(date_field):
                    redemption[date_field] = redemption[date_field].isoformat()
        
        return jsonify({
            'success': True,
            'redemptions': redemptions
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@instagram_promo_bp.route('/api/instagram-promo/validate-code', methods=['POST', 'OPTIONS'])
@require_login
def validate_redemption_code():
    """Validate a redemption code for booking discount"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        user_id = session.get('user_id')
        data = request.get_json()
        
        redemption_code = data.get('redemption_code', '').strip().upper()
        
        if not redemption_code:
            return jsonify({'success': False, 'error': 'Redemption code is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Validate redemption code
        cursor.execute('''
            SELECT 
                r.*,
                p.discount_type,
                p.discount_value,
                p.campaign_name
            FROM user_instagram_redemptions r
            JOIN instagram_promotions p ON r.promotion_id = p.id
            WHERE r.user_id = %s 
              AND r.redemption_code = %s
              AND r.verification_status = 'verified'
              AND r.is_used = FALSE
              AND (r.expires_at IS NULL OR r.expires_at > NOW())
        ''', (user_id, redemption_code))
        
        redemption = cursor.fetchone()
        
        if not redemption:
            return jsonify({
                'success': False,
                'error': 'Invalid, expired, or already used redemption code',
                'valid': False
            }), 400
        
        return jsonify({
            'success': True,
            'valid': True,
            'redemption': {
                'id': redemption['id'],
                'redemption_code': redemption['redemption_code'],
                'discount_type': redemption['discount_type'],
                'discount_value': float(redemption['discount_value']),
                'campaign_name': redemption['campaign_name']
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ============================================================================
# Admin Endpoints - Require Admin Login
# ============================================================================

@instagram_promo_bp.route('/api/admin/instagram-promo/redemptions', methods=['GET', 'OPTIONS'])
@require_admin
def admin_get_redemptions():
    """Admin: Get all Instagram promotion redemptions"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        # Get query parameters
        status = request.args.get('status')  # pending, verified, rejected
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = '''
            SELECT 
                r.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                p.campaign_name,
                p.discount_type,
                p.discount_value
            FROM user_instagram_redemptions r
            JOIN users u ON r.user_id = u.id
            JOIN instagram_promotions p ON r.promotion_id = p.id
        '''
        
        params = []
        if status:
            query += ' WHERE r.verification_status = %s'
            params.append(status)
        
        query += ' ORDER BY r.created_at DESC'
        
        cursor.execute(query, params if params else None)
        redemptions = cursor.fetchall()
        
        # Format dates
        for redemption in redemptions:
            for date_field in ['verified_at', 'used_at', 'expires_at', 'created_at', 'updated_at']:
                if redemption.get(date_field):
                    redemption[date_field] = redemption[date_field].isoformat()
        
        # Get statistics
        cursor.execute('''
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used
            FROM user_instagram_redemptions
        ''')
        
        stats = cursor.fetchone()
        
        return jsonify({
            'success': True,
            'redemptions': redemptions,
            'statistics': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@instagram_promo_bp.route('/api/admin/instagram-promo/verify/<int:redemption_id>', methods=['PUT', 'OPTIONS'])
@require_admin
def admin_verify_redemption(redemption_id):
    """Admin: Verify or reject a redemption"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        admin_id = session.get('admin_id')
        data = request.get_json()
        
        status = data.get('status')  # 'verified' or 'rejected'
        notes = data.get('notes', '')
        
        if status not in ['verified', 'rejected']:
            return jsonify({'success': False, 'error': 'Invalid status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get the redemption with promotion info
        cursor.execute('''
            SELECT r.*, p.discount_value, p.discount_type
            FROM user_instagram_redemptions r
            JOIN instagram_promotions p ON r.promotion_id = p.id
            WHERE r.id = %s
        ''', (redemption_id,))
        redemption = cursor.fetchone()
        
        if not redemption:
            return jsonify({'success': False, 'error': 'Redemption not found'}), 404
        
        if redemption['verification_status'] != 'pending':
            return jsonify({'success': False, 'error': f'Redemption already {redemption["verification_status"]}'}), 400
        
        # Update the redemption status
        if status == 'verified':
            # Refresh expiry to 30 days from approval
            new_expires = datetime.now() + timedelta(days=30)
            cursor.execute('''
                UPDATE user_instagram_redemptions
                SET verification_status = 'verified',
                    verification_notes = %s,
                    verified_by = %s,
                    verified_at = NOW(),
                    expires_at = %s
                WHERE id = %s
            ''', (notes, admin_id, new_expires, redemption_id))
            
            # Also try to generate a promo_code entry for 30 free minutes
            try:
                promo_code = redemption['redemption_code']
                cursor.execute('''
                    INSERT INTO promo_codes (code, bonus_minutes, max_uses, current_uses, expires_at, created_by)
                    VALUES (%s, 30, 1, 0, %s, %s)
                ''', (promo_code, new_expires, admin_id or 0))
            except Exception as promo_err:
                # promo_codes table might not exist or code already exists — non-critical
                import sys
                sys.stderr.write(f"[InstaPromo] Promo code creation note: {promo_err}\n")
        else:
            cursor.execute('''
                UPDATE user_instagram_redemptions
                SET verification_status = 'rejected',
                    verification_notes = %s,
                    verified_by = %s,
                    verified_at = NOW()
                WHERE id = %s
            ''', (notes, admin_id, redemption_id))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Redemption {status} successfully'
        })
        
    except Exception as e:
        if conn:
            conn.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Export blueprint
__all__ = ['instagram_promo_bp']
