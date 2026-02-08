"""
Membership API Routes
Handles membership plans, subscriptions (request-based), and status checks
Admin approval required before activation — pay in-person at shop
"""

from flask import Blueprint, request, jsonify, session
from datetime import date, timedelta
from config.database import get_db_connection
from middleware.auth import require_login

membership_bp = Blueprint('membership', __name__)


@membership_bp.route('/api/membership/plans', methods=['GET', 'OPTIONS'])
def get_plans():
    """
    Get available membership plans
    
    Returns:
    {
        "success": true,
        "plans": [
            {
                "type": "monthly",
                "name": "Monthly Plan",
                "duration_days": 30,
                "price": 299,
                "discount_percentage": 10,
                "features": [...]
            }
        ]
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    # Define membership plans
    plans = [
        {
            'type': 'monthly',
            'name': 'Monthly Membership',
            'duration_days': 30,
            'price': 299,
            'discount_percentage': 10,
            'features': [
                '10% discount on all bookings',
                'Priority booking slots',
                'No booking fees',
                'Valid for 30 days',
                'Cancel anytime'
            ]
        },
        {
            'type': 'quarterly',
            'name': 'Quarterly Membership',
            'duration_days': 90,
            'price': 799,
            'discount_percentage': 15,
            'features': [
                '15% discount on all bookings',
                'Priority booking slots',
                'No booking fees',
                'Valid for 90 days',
                'Free 1 hour driving sim session',
                'Cancel anytime'
            ],
            'popular': True
        },
        {
            'type': 'annual',
            'name': 'Annual Membership',
            'duration_days': 365,
            'price': 2499,
            'discount_percentage': 20,
            'features': [
                '20% discount on all bookings',
                'VIP priority booking',
                'No booking fees',
                'Valid for 365 days',
                'Free 5 hour PS5/Driving sessions',
                '1 free birthday party booking',
                'Cancel anytime'
            ]
        }
    ]
    
    return jsonify({
        'success': True,
        'plans': plans
    })


@membership_bp.route('/api/membership/subscribe', methods=['POST', 'OPTIONS'])
@require_login
def subscribe():
    """
    Request a membership plan (pending admin approval)
    
    POST body:
    {
        "plan_type": "monthly" | "quarterly" | "annual"
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        plan_type = data.get('plan_type', '').strip().lower()
        user_id = session.get('user_id')
        
        # Validate plan type
        valid_plans = {
            'monthly': {'days': 30, 'discount': 10},
            'quarterly': {'days': 90, 'discount': 15},
            'annual': {'days': 365, 'discount': 20}
        }
        
        if plan_type not in valid_plans:
            return jsonify({'success': False, 'error': 'Invalid plan type'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if user already has an active membership
        check_query = '''
            SELECT * FROM memberships 
            WHERE user_id = %s 
            AND status = 'active' 
            AND end_date > CURDATE()
        '''
        cursor.execute(check_query, (user_id,))
        existing_active = cursor.fetchone()
        
        if existing_active:
            return jsonify({
                'success': False,
                'error': 'You already have an active membership',
                'membership': {
                    'plan_type': existing_active['plan_type'],
                    'end_date': existing_active['end_date'].isoformat()
                }
            }), 400
        
        # Check if user already has a pending request
        pending_query = '''
            SELECT * FROM memberships 
            WHERE user_id = %s 
            AND status = 'pending'
        '''
        cursor.execute(pending_query, (user_id,))
        existing_pending = cursor.fetchone()
        
        if existing_pending:
            return jsonify({
                'success': False,
                'error': 'You already have a pending membership request. Please wait for admin approval.'
            }), 400
        
        # Calculate dates (will be recalculated on admin approval)
        start_date = date.today()
        duration_days = valid_plans[plan_type]['days']
        end_date = start_date + timedelta(days=duration_days)
        discount = valid_plans[plan_type]['discount']
        
        # Create membership request with PENDING status
        insert_query = '''
            INSERT INTO memberships 
            (user_id, plan_type, start_date, end_date, status, discount_percentage)
            VALUES (%s, %s, %s, %s, 'pending', %s)
        '''
        cursor.execute(insert_query, (user_id, plan_type, start_date, end_date, discount))
        conn.commit()
        
        membership_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': f'{plan_type.capitalize()} membership request submitted! Please visit the shop to pay and get it activated.',
            'membership': {
                'id': membership_id,
                'plan_type': plan_type,
                'status': 'pending',
                'discount_percentage': discount
            }
        }), 201
        
    except Exception as e:
        print(f"Error in subscribe: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@membership_bp.route('/api/membership/status', methods=['GET', 'OPTIONS'])
@require_login
def get_status():
    """
    Get user's current membership status (active or pending)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        user_id = session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get active membership
        query = '''
            SELECT 
                id,
                plan_type,
                start_date,
                end_date,
                status,
                discount_percentage,
                DATEDIFF(end_date, CURDATE()) as days_remaining
            FROM memberships 
            WHERE user_id = %s 
            AND status = 'active'
            AND end_date >= CURDATE()
            ORDER BY end_date DESC
            LIMIT 1
        '''
        cursor.execute(query, (user_id,))
        active_membership = cursor.fetchone()
        
        # Also check for pending request
        pending_query = '''
            SELECT 
                id,
                plan_type,
                status,
                discount_percentage,
                created_at
            FROM memberships 
            WHERE user_id = %s 
            AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1
        '''
        cursor.execute(pending_query, (user_id,))
        pending_membership = cursor.fetchone()
        
        result = {
            'success': True,
            'has_membership': False,
            'membership': None,
            'has_pending': False,
            'pending_membership': None
        }
        
        if active_membership:
            active_membership['start_date'] = active_membership['start_date'].isoformat()
            active_membership['end_date'] = active_membership['end_date'].isoformat()
            result['has_membership'] = True
            result['membership'] = active_membership
        
        if pending_membership:
            if pending_membership.get('created_at'):
                pending_membership['created_at'] = pending_membership['created_at'].isoformat()
            result['has_pending'] = True
            result['pending_membership'] = pending_membership
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in get_status: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@membership_bp.route('/api/membership/cancel', methods=['POST', 'OPTIONS'])
@require_login
def cancel_membership():
    """
    Cancel user's active membership
    
    Note: Cancellation is immediate. User loses access and remaining days.
    For grace period, modify status logic.
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        user_id = session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Find active membership
        query = '''
            SELECT * FROM memberships 
            WHERE user_id = %s 
            AND status = 'active'
            ORDER BY end_date DESC
            LIMIT 1
        '''
        cursor.execute(query, (user_id,))
        membership = cursor.fetchone()
        
        if not membership:
            return jsonify({
                'success': False,
                'error': 'No active membership found'
            }), 404
        
        # Cancel membership
        update_query = '''
            UPDATE memberships 
            SET status = 'cancelled',
                end_date = CURDATE()
            WHERE id = %s
        '''
        cursor.execute(update_query, (membership['id'],))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Membership cancelled successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@membership_bp.route('/api/membership/history', methods=['GET', 'OPTIONS'])
@require_login
def get_history():
    """
    Get user's membership history (all past and current memberships)
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        user_id = session.get('user_id')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = '''
            SELECT 
                id,
                plan_type,
                start_date,
                end_date,
                status,
                discount_percentage,
                created_at
            FROM memberships 
            WHERE user_id = %s
            ORDER BY created_at DESC
        '''
        cursor.execute(query, (user_id,))
        memberships = cursor.fetchall()
        
        # Convert dates to ISO format
        for m in memberships:
            m['start_date'] = m['start_date'].isoformat()
            m['end_date'] = m['end_date'].isoformat()
            m['created_at'] = m['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'memberships': memberships,
            'count': len(memberships)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@membership_bp.route('/api/membership/upgrade', methods=['POST', 'OPTIONS'])
@require_login
def request_upgrade():
    """
    Request an upgrade to a higher membership plan.
    Creates a new pending request.
    
    POST body:
    {
        "plan_type": "quarterly" | "annual"
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    conn = None
    cursor = None
    
    try:
        data = request.get_json()
        new_plan_type = data.get('plan_type', '').strip().lower()
        user_id = session.get('user_id')
        
        valid_plans = {
            'monthly': {'days': 30, 'discount': 10, 'rank': 1},
            'quarterly': {'days': 90, 'discount': 15, 'rank': 2},
            'annual': {'days': 365, 'discount': 20, 'rank': 3}
        }
        
        if new_plan_type not in valid_plans:
            return jsonify({'success': False, 'error': 'Invalid plan type'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check current active membership
        check_query = '''
            SELECT * FROM memberships 
            WHERE user_id = %s 
            AND status = 'active' 
            AND end_date > CURDATE()
        '''
        cursor.execute(check_query, (user_id,))
        current = cursor.fetchone()
        
        if not current:
            return jsonify({
                'success': False,
                'error': 'You don\'t have an active membership to upgrade'
            }), 400
        
        # Verify it's actually an upgrade (higher rank)
        current_rank = valid_plans.get(current['plan_type'], {}).get('rank', 0)
        new_rank = valid_plans[new_plan_type]['rank']
        
        if new_rank <= current_rank:
            return jsonify({
                'success': False,
                'error': 'You can only upgrade to a higher plan'
            }), 400
        
        # Check if already has a pending upgrade
        pending_query = '''
            SELECT * FROM memberships 
            WHERE user_id = %s 
            AND status = 'pending'
        '''
        cursor.execute(pending_query, (user_id,))
        existing_pending = cursor.fetchone()
        
        if existing_pending:
            return jsonify({
                'success': False,
                'error': 'You already have a pending upgrade request'
            }), 400
        
        # Create upgrade request
        start_date = date.today()
        duration_days = valid_plans[new_plan_type]['days']
        end_date = start_date + timedelta(days=duration_days)
        discount = valid_plans[new_plan_type]['discount']
        
        insert_query = '''
            INSERT INTO memberships 
            (user_id, plan_type, start_date, end_date, status, discount_percentage)
            VALUES (%s, %s, %s, %s, 'pending', %s)
        '''
        cursor.execute(insert_query, (user_id, new_plan_type, start_date, end_date, discount))
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': f'Upgrade request to {new_plan_type.capitalize()} plan submitted! Please visit the shop to pay.'
        }), 201
        
    except Exception as e:
        print(f"Error in request_upgrade: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()