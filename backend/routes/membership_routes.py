"""
Membership API Routes
Handles membership plans, subscriptions (request-based), and status checks
Admin approval required before activation — pay in-person at shop

STORY PASS (Single Player) — 3 tiers: Solo Quest, Legend Mode, God Mode
DRIVING PASS (Racing Sim) — 3 tiers: Ignition, Turbo, Apex
"""

from flask import Blueprint, request, jsonify, session
from datetime import date, timedelta
from config.database import get_db_connection
from middleware.auth import require_login

membership_bp = Blueprint('membership', __name__)

# ─── All valid plans with metadata ───
VALID_PLANS = {
    # Story Pass tiers
    'solo_quest': {
        'days': 30, 'discount': 0, 'rank': 1, 'category': 'story',
        'price': 500, 'hours': 10, 'rate': 50
    },
    'legend_mode': {
        'days': 30, 'discount': 0, 'rank': 2, 'category': 'story',
        'price': 800, 'hours': 20, 'rate': 40
    },
    'god_mode': {
        'days': 30, 'discount': 0, 'rank': 3, 'category': 'story',
        'price': 1400, 'hours': 40, 'rate': 35
    },
    # Driving Pass tiers
    'ignition': {
        'days': 30, 'discount': 0, 'rank': 1, 'category': 'driving',
        'price': 600, 'hours': 10, 'rate': 60
    },
    'turbo': {
        'days': 30, 'discount': 0, 'rank': 2, 'category': 'driving',
        'price': 1000, 'hours': 20, 'rate': 50
    },
    'apex': {
        'days': 30, 'discount': 0, 'rank': 3, 'category': 'driving',
        'price': 1600, 'hours': 40, 'rate': 40
    },
}


@membership_bp.route('/api/membership/plans', methods=['GET', 'OPTIONS'])
def get_plans():
    """Get available membership plans grouped by category"""
    if request.method == 'OPTIONS':
        return '', 200

    plans = {
        'story_pass': {
            'title': 'Story Pass',
            'subtitle': 'Single Player',
            'icon': '🎮',
            'plans': [
                {
                    'type': 'solo_quest',
                    'name': 'Solo Quest',
                    'tier': 'basic',
                    'price': 500,
                    'duration_days': 30,
                    'hours': 10,
                    'rate_per_hour': 50,
                    'max_daily': '2 hrs/day',
                    'tagline': 'Start Your Journey',
                    'features': [
                        '10 Hours / Month',
                        'Anytime Access',
                        'Max 2 hrs/day',
                        'Single Player Only',
                        '₹50/hour effective rate'
                    ],
                    'accent': '#3b82f6',
                    'gradient': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    'chip_icon': '⚔️',
                    'font_color': '#ffffff'
                },
                {
                    'type': 'legend_mode',
                    'name': 'Legend Mode',
                    'tier': 'standard',
                    'price': 800,
                    'duration_days': 30,
                    'hours': 20,
                    'rate_per_hour': 40,
                    'max_daily': '2 hrs/day',
                    'tagline': 'Level Up Your Game',
                    'features': [
                        '20 Hours / Month',
                        'Anytime Access',
                        'Max 2 hrs/day',
                        'Single Player Only',
                        '₹40/hour effective rate',
                        'Save ₹200 vs Solo Quest'
                    ],
                    'popular': True,
                    'accent': '#b8860b',
                    'gradient': 'linear-gradient(135deg, #f0c85a, #b8860b)',
                    'chip_icon': '🛡️',
                    'font_color': '#1a1a2e'
                },
                {
                    'type': 'god_mode',
                    'name': 'God Mode',
                    'tier': 'premium',
                    'price': 1400,
                    'duration_days': 30,
                    'hours': 40,
                    'rate_per_hour': 35,
                    'max_daily': '2 hrs/day',
                    'tagline': 'Unlimited Power',
                    'features': [
                        '40 Hours / Month',
                        'Anytime Access',
                        'Max 2 hrs/day',
                        '1 Guest Hour Included',
                        '₹35/hour effective rate',
                        'Best Value — Save ₹600'
                    ],
                    'accent': '#d4a017',
                    'gradient': 'linear-gradient(135deg, #1a1a2e, #0a0a14)',
                    'chip_icon': '👑',
                    'font_color': '#d4a017'
                }
            ]
        },
        'driving_pass': {
            'title': 'Driving Pass',
            'subtitle': 'Racing Simulator',
            'icon': '🏎️',
            'plans': [
                {
                    'type': 'ignition',
                    'name': 'Ignition',
                    'tier': 'basic',
                    'price': 600,
                    'duration_days': 30,
                    'hours': 10,
                    'rate_per_hour': 60,
                    'max_daily': '2 hrs/day',
                    'tagline': 'Start Your Engines',
                    'features': [
                        '10 Hours / Month',
                        'Max 2 hrs/day',
                        '₹60/hour effective rate',
                        'Full Racing Sim Access'
                    ],
                    'accent': '#3b82f6',
                    'gradient': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    'chip_icon': '🔑',
                    'font_color': '#ffffff'
                },
                {
                    'type': 'turbo',
                    'name': 'Turbo',
                    'tier': 'standard',
                    'price': 1000,
                    'duration_days': 30,
                    'hours': 20,
                    'rate_per_hour': 50,
                    'max_daily': '2 hrs/day',
                    'tagline': 'Feel the Speed',
                    'features': [
                        '20 Hours / Month',
                        'Anytime Access',
                        'Max 2 hrs/day',
                        '₹50/hour effective rate',
                        'Save ₹200 vs Ignition'
                    ],
                    'popular': True,
                    'accent': '#b8860b',
                    'gradient': 'linear-gradient(135deg, #f0c85a, #b8860b)',
                    'chip_icon': '⚡',
                    'font_color': '#1a1a2e'
                },
                {
                    'type': 'apex',
                    'name': 'Apex',
                    'tier': 'premium',
                    'price': 1600,
                    'duration_days': 30,
                    'hours': 40,
                    'rate_per_hour': 40,
                    'max_daily': '2 hrs/day',
                    'tagline': 'Born to Race',
                    'features': [
                        '40 Hours / Month',
                        'Max 2 hrs/day',
                        '₹40/hour effective rate',
                        'Best Value — Save ₹800',
                        'Leaderboard Priority'
                    ],
                    'accent': '#d4a017',
                    'gradient': 'linear-gradient(135deg, #1a1a2e, #0a0a14)',
                    'chip_icon': '🏆',
                    'font_color': '#d4a017'
                }
            ]
        }
    }

    return jsonify({
        'success': True,
        'categories': plans
    })


@membership_bp.route('/api/membership/subscribe', methods=['POST', 'OPTIONS'])
@require_login
def subscribe():
    """
    Request a membership plan (pending admin approval)
    POST body: { "plan_type": "solo_quest" | "legend_mode" | ... }
    """
    if request.method == 'OPTIONS':
        return '', 200

    conn = None
    cursor = None

    try:
        data = request.get_json()
        plan_type = data.get('plan_type', '').strip().lower()
        user_id = session.get('user_id')

        if plan_type not in VALID_PLANS:
            return jsonify({'success': False, 'error': 'Invalid plan type'}), 400

        plan_info = VALID_PLANS[plan_type]

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if user already has an active membership in the same category
        check_query = '''
            SELECT * FROM memberships
            WHERE user_id = %s
            AND status = 'active'
            AND end_date > CURDATE()
        '''
        cursor.execute(check_query, (user_id,))
        existing_actives = cursor.fetchall()

        for existing_active in existing_actives:
            existing_plan_info = VALID_PLANS.get(existing_active['plan_type'])
            if not existing_plan_info:
                # Old/invalid plan type — auto-expire it so it doesn't block new subscriptions
                cursor.execute(
                    "UPDATE memberships SET status = 'expired' WHERE id = %s",
                    (existing_active['id'],)
                )
                conn.commit()
                continue
            existing_cat = existing_plan_info.get('category', '')
            new_cat = plan_info['category']
            if existing_cat == new_cat:
                return jsonify({
                    'success': False,
                    'error': f'You already have an active {new_cat} pass. Use upgrade instead.',
                    'membership': {
                        'plan_type': existing_active['plan_type'],
                        'end_date': existing_active['end_date'].isoformat()
                    }
                }), 400

        # Check if user already has a pending request (only for valid new plans)
        pending_query = '''
            SELECT * FROM memberships
            WHERE user_id = %s
            AND status = 'pending'
            AND plan_type IN ('solo_quest','legend_mode','god_mode','ignition','turbo','apex')
        '''
        cursor.execute(pending_query, (user_id,))
        existing_pending = cursor.fetchone()

        if existing_pending:
            return jsonify({
                'success': False,
                'error': 'You already have a pending membership request. Please wait for admin approval.'
            }), 400

        start_date = date.today()
        duration_days = plan_info['days']
        end_date = start_date + timedelta(days=duration_days)
        discount = plan_info['discount']
        total_hours = plan_info['hours']

        insert_query = '''
            INSERT INTO memberships
            (user_id, plan_type, start_date, end_date, status, discount_percentage, total_hours, hours_used)
            VALUES (%s, %s, %s, %s, 'pending', %s, %s, 0)
        '''
        cursor.execute(insert_query, (user_id, plan_type, start_date, end_date, discount, total_hours))
        conn.commit()

        membership_id = cursor.lastrowid
        nice_name = plan_type.replace('_', ' ').title()

        return jsonify({
            'success': True,
            'message': f'{nice_name} pass request submitted! Please visit the shop to pay ₹{plan_info["price"]} and get it activated.',
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
    """Get user's current membership status (active or pending)"""
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
                id, plan_type, start_date, end_date,
                status, discount_percentage,
                COALESCE(total_hours, 0) as total_hours,
                COALESCE(hours_used, 0) as hours_used,
                DATEDIFF(end_date, CURDATE()) as days_remaining
            FROM memberships
            WHERE user_id = %s
            AND status = 'active'
            AND end_date >= CURDATE()
            AND plan_type IN ('solo_quest','legend_mode','god_mode','ignition','turbo','apex')
            ORDER BY end_date DESC
            LIMIT 1
        '''
        cursor.execute(query, (user_id,))
        active_membership = cursor.fetchone()

        pending_query = '''
            SELECT
                id, plan_type, status,
                discount_percentage, created_at
            FROM memberships
            WHERE user_id = %s
            AND status = 'pending'
            AND plan_type IN ('solo_quest','legend_mode','god_mode','ignition','turbo','apex')
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
            # Add computed hours info
            total_h = float(active_membership.get('total_hours', 0))
            used_h = float(active_membership.get('hours_used', 0))
            active_membership['hours_remaining'] = max(0, total_h - used_h)
            # Add plan metadata (rate, category) from VALID_PLANS
            plan_meta = VALID_PLANS.get(active_membership['plan_type'], {})
            active_membership['rate_per_hour'] = plan_meta.get('rate', 0)
            active_membership['category'] = plan_meta.get('category', '')
            active_membership['plan_price'] = plan_meta.get('price', 0)
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
    """Cancel user's active membership"""
    if request.method == 'OPTIONS':
        return '', 200

    conn = None
    cursor = None

    try:
        user_id = session.get('user_id')

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

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
            return jsonify({'success': False, 'error': 'No active membership found'}), 404

        update_query = '''
            UPDATE memberships
            SET status = 'cancelled', end_date = CURDATE()
            WHERE id = %s
        '''
        cursor.execute(update_query, (membership['id'],))
        conn.commit()

        return jsonify({'success': True, 'message': 'Membership cancelled successfully'})

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
    """Get user's membership history"""
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
                id, plan_type, start_date, end_date,
                status, discount_percentage, created_at
            FROM memberships
            WHERE user_id = %s
            ORDER BY created_at DESC
        '''
        cursor.execute(query, (user_id,))
        memberships = cursor.fetchall()

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
    Request an upgrade to a higher membership plan within the same category.
    POST body: { "plan_type": "legend_mode" | "god_mode" | "turbo" | "apex" }
    """
    if request.method == 'OPTIONS':
        return '', 200

    conn = None
    cursor = None

    try:
        data = request.get_json()
        new_plan_type = data.get('plan_type', '').strip().lower()
        user_id = session.get('user_id')

        if new_plan_type not in VALID_PLANS:
            return jsonify({'success': False, 'error': 'Invalid plan type'}), 400

        new_plan_info = VALID_PLANS[new_plan_type]

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        check_query = '''
            SELECT * FROM memberships
            WHERE user_id = %s
            AND status = 'active'
            AND end_date > CURDATE()
            AND plan_type IN ('solo_quest','legend_mode','god_mode','ignition','turbo','apex')
        '''
        cursor.execute(check_query, (user_id,))
        current = cursor.fetchone()

        if not current:
            return jsonify({
                'success': False,
                'error': "You don't have an active membership to upgrade"
            }), 400

        current_info = VALID_PLANS.get(current['plan_type'], {})
        if current_info.get('category') != new_plan_info['category']:
            return jsonify({
                'success': False,
                'error': 'You can only upgrade within the same pass category'
            }), 400

        if new_plan_info['rank'] <= current_info.get('rank', 0):
            return jsonify({
                'success': False,
                'error': 'You can only upgrade to a higher tier'
            }), 400

        pending_query = '''
            SELECT * FROM memberships
            WHERE user_id = %s AND status = 'pending'
            AND plan_type IN ('solo_quest','legend_mode','god_mode','ignition','turbo','apex')
        '''
        cursor.execute(pending_query, (user_id,))
        existing_pending = cursor.fetchone()

        if existing_pending:
            return jsonify({
                'success': False,
                'error': 'You already have a pending upgrade request'
            }), 400

        start_date = date.today()
        duration_days = new_plan_info['days']
        end_date = start_date + timedelta(days=duration_days)
        discount = new_plan_info['discount']
        total_hours = new_plan_info['hours']

        insert_query = '''
            INSERT INTO memberships
            (user_id, plan_type, start_date, end_date, status, discount_percentage, total_hours, hours_used)
            VALUES (%s, %s, %s, %s, 'pending', %s, %s, 0)
        '''
        cursor.execute(insert_query, (user_id, new_plan_type, start_date, end_date, discount, total_hours))
        conn.commit()

        nice_name = new_plan_type.replace('_', ' ').title()

        return jsonify({
            'success': True,
            'message': f'Upgrade request to {nice_name} submitted! Visit the shop to pay ₹{new_plan_info["price"]}.'
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
