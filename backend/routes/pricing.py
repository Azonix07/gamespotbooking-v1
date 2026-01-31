"""
Pricing API Route
Handles price calculations with membership discount support
"""

from flask import Blueprint, request, jsonify, session
from utils.helpers import calculate_ps5_price, calculate_driving_price
from config.database import get_db_connection

pricing_bp = Blueprint('pricing', __name__)

def get_user_membership_discount(user_id):
    """Get active membership discount for a user"""
    if not user_id:
        return 0, None
    
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = '''
            SELECT 
                id,
                plan_type,
                discount_percentage,
                end_date,
                DATEDIFF(end_date, CURDATE()) as days_remaining
            FROM memberships 
            WHERE user_id = %s 
            AND status = 'active'
            AND end_date >= CURDATE()
            ORDER BY discount_percentage DESC
            LIMIT 1
        '''
        cursor.execute(query, (user_id,))
        membership = cursor.fetchone()
        
        if membership:
            return membership['discount_percentage'], membership
        return 0, None
        
    except Exception as e:
        print(f"Error fetching membership: {e}")
        return 0, None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@pricing_bp.route('/api/pricing.php', methods=['POST', 'OPTIONS'])
def calculate_pricing():
    """Calculate pricing for bookings with membership discount"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.get_json()
        
        ps5_bookings = data.get('ps5_bookings', [])
        driving_sim = data.get('driving_sim', False)
        duration_minutes = data.get('duration_minutes', 0)
        
        # Validate duration
        if duration_minutes not in [30, 60, 90, 120]:
            return jsonify({'success': False, 'error': 'Invalid duration'}), 400
        
        ps5_price = 0
        driving_price = 0
        breakdown = []
        
        # Calculate PS5 prices
        if isinstance(ps5_bookings, list):
            for ps5 in ps5_bookings:
                player_count = ps5.get('player_count', 0)
                device_number = ps5.get('device_number', 0)
                
                if 1 <= player_count <= 4:
                    price = calculate_ps5_price(player_count, duration_minutes)
                    ps5_price += price
                    
                    breakdown.append({
                        'device': f'PS5 Unit {device_number}',
                        'players': player_count,
                        'price': price
                    })
        
        # Calculate driving simulator price
        if driving_sim:
            driving_price = calculate_driving_price(duration_minutes)
            breakdown.append({
                'device': 'Driving Simulator',
                'players': 1,
                'price': driving_price
            })
        
        original_price = ps5_price + driving_price
        
        # Check for membership discount
        user_id = session.get('user_id')
        discount_percentage, membership = get_user_membership_discount(user_id)
        
        discount_amount = 0
        final_price = original_price
        
        if discount_percentage > 0:
            discount_amount = round(original_price * discount_percentage / 100, 2)
            final_price = original_price - discount_amount
        
        response_data = {
            'success': True,
            'ps5_price': ps5_price,
            'driving_price': driving_price,
            'original_price': original_price,
            'total_price': final_price,
            'breakdown': breakdown,
            'has_discount': discount_percentage > 0,
            'discount_percentage': discount_percentage,
            'discount_amount': discount_amount
        }
        
        if membership:
            response_data['membership'] = {
                'plan_type': membership['plan_type'],
                'discount_percentage': membership['discount_percentage'],
                'days_remaining': membership['days_remaining']
            }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
