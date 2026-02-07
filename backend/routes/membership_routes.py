"""
Membership API Routes
Handles membership plans, subscriptions, and status checks
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
    Subscribe to a membership plan
    
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
        existing = cursor.fetchone()
        
        if existing:
            return jsonify({
                'success': False,
                'error': 'You already have an active membership',
                'membership': {
                    'plan_type': existing['plan_type'],
                    'end_date': existing['end_date'].isoformat()
                }
            }), 400
        
        # Calculate dates
        start_date = date.today()
        duration_days = valid_plans[plan_type]['days']
        end_date = start_date + timedelta(days=duration_days)
        discount = valid_plans[plan_type]['discount']
        
        # Create membership
        insert_query = '''
            INSERT INTO memberships 
            (user_id, plan_type, start_date, end_date, status, discount_percentage)
            VALUES (%s, %s, %s, %s, 'active', %s)
        '''
        cursor.execute(insert_query, (user_id, plan_type, start_date, end_date, discount))
        conn.commit()
        
        membership_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': f'{plan_type.capitalize()} membership activated successfully',
            'membership': {
                'id': membership_id,
                'plan_type': plan_type,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'discount_percentage': discount
            }
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@membership_bp.route('/api/membership/status', methods=['GET', 'OPTIONS'])
@require_login
def get_status():
    """
    Get user's current membership status
    
    Returns:
    {
        "success": true,
        "has_membership": true,
        "membership": {
            "id": 1,
            "plan_type": "monthly",
            "start_date": "2025-01-01",
            "end_date": "2025-01-31",
            "status": "active",
            "discount_percentage": 10,
            "days_remaining": 15
        }
    }
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
        membership = cursor.fetchone()
        
        if membership:
            # Convert dates to ISO format
            membership['start_date'] = membership['start_date'].isoformat()
            membership['end_date'] = membership['end_date'].isoformat()
            
            return jsonify({
                'success': True,
                'has_membership': True,
                'membership': membership
            })
        else:
            return jsonify({
                'success': True,
                'has_membership': False,
                'membership': None
            })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
        
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
