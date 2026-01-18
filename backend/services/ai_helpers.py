"""
Helper functions for AI Assistant to interact with existing routes
These are internal functions that reuse the existing logic
"""

from routes.slots import get_slots as get_slots_route
from routes.pricing import calculate_pricing as calculate_pricing_route
from routes.bookings import handle_bookings as handle_bookings_route
from utils.helpers import calculate_ps5_price, calculate_driving_price
from flask import json
from werkzeug.test import EnvironBuilder
from werkzeug.wrappers import Request

def get_slot_availability(date):
    """
    Get slot availability for a given date
    Returns parsed JSON response
    """
    try:
        # Create a mock request
        with EnvironBuilder(method='GET', query_string={'date': date}).get_environ() as env:
            # Temporarily set request context
            from flask import current_app
            with current_app.test_request_context(f'/api/slots.php?date={date}'):
                response = get_slots_route()
                if isinstance(response, tuple):
                    data, status_code = response
                    if status_code == 200:
                        return data.get_json()
                elif hasattr(response, 'get_json'):
                    return response.get_json()
                return response
    except Exception as e:
        print(f"Error in get_slot_availability: {str(e)}")
        return None


def get_slot_details_info(date, time, duration):
    """
    Get detailed slot information including device availability
    """
    try:
        from flask import current_app
        with current_app.test_request_context(f'/api/slots.php?date={date}&time={time}&duration={duration}'):
            response = get_slots_route()
            if isinstance(response, tuple):
                data, status_code = response
                if status_code == 200:
                    return data.get_json()
            elif hasattr(response, 'get_json'):
                return response.get_json()
            return response
    except Exception as e:
        print(f"Error in get_slot_details_info: {str(e)}")
        return None


def calculate_slot_price(ps5_bookings, driving_sim, duration_minutes):
    """
    Calculate price for selected devices and duration
    """
    try:
        from flask import current_app
        data = {
            'ps5_bookings': ps5_bookings,
            'driving_sim': driving_sim,
            'duration_minutes': duration_minutes
        }
        
        with current_app.test_request_context(
            '/api/pricing.php',
            method='POST',
            json=data
        ):
            response = calculate_pricing_route()
            if isinstance(response, tuple):
                data, status_code = response
                if status_code == 200:
                    return data.get_json()
            elif hasattr(response, 'get_json'):
                return response.get_json()
            return response
    except Exception as e:
        print(f"Error in calculate_slot_price: {str(e)}")
        return None


def create_booking_internal(booking_data):
    """
    Create a booking directly using database operations
    """
    from config.database import get_db_connection
    import traceback
    
    conn = None
    cursor = None
    
    try:
        print(f"🔧 Creating booking with data: {booking_data}")
        
        # Extract data
        customer_name = booking_data.get('customer_name', '').strip()
        customer_phone = booking_data.get('customer_phone', '').strip()
        booking_date = booking_data.get('booking_date')
        start_time = booking_data.get('start_time')
        duration_minutes = int(booking_data.get('duration_minutes', 0))
        total_price = float(booking_data.get('total_price', 0))
        ps5_bookings = booking_data.get('ps5_bookings', [])
        driving_sim = booking_data.get('driving_sim', False)
        driving_after_ps5 = booking_data.get('driving_after_ps5', False)
        
        # Validate required fields
        if not all([customer_name, customer_phone, booking_date, start_time, duration_minutes]):
            print("❌ Missing required fields")
            return {'success': False, 'error': 'Missing required fields'}
        
        # Add seconds to start_time if not present
        if len(start_time.split(':')) == 2:
            start_time = start_time + ':00'
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Start transaction
        conn.start_transaction()
        
        print(f"✅ Connection established, creating booking...")
        
        # Insert booking
        query = """
            INSERT INTO bookings 
            (customer_name, customer_phone, booking_date, start_time, duration_minutes, total_price, driving_after_ps5)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(query, (
            customer_name,
            customer_phone,
            booking_date,
            start_time,
            duration_minutes,
            total_price,
            1 if driving_after_ps5 else 0
        ))
        
        booking_id = cursor.lastrowid
        print(f"✅ Booking created with ID: {booking_id}")
        
        # Insert PS5 bookings
        if ps5_bookings:
            query = """
                INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price)
                VALUES (%s, 'ps5', %s, %s, %s)
            """
            
            for ps5 in ps5_bookings:
                device_number = int(ps5.get('device_number', 1))
                player_count = int(ps5.get('player_count', 1))
                price = calculate_ps5_price(player_count, duration_minutes)
                
                cursor.execute(query, (
                    booking_id,
                    device_number,
                    player_count,
                    price
                ))
                print(f"✅ Added PS5 device {device_number} with {player_count} players")
        
        # Insert driving simulator booking
        if driving_sim:
            price = calculate_driving_price(duration_minutes)
            query = """
                INSERT INTO booking_devices (booking_id, device_type, device_number, player_count, price)
                VALUES (%s, 'driving_sim', NULL, 1, %s)
            """
            cursor.execute(query, (booking_id, price))
            print(f"✅ Added driving simulator")
        
        conn.commit()
        print(f"✅ Transaction committed successfully!")
        
        return {
            'success': True,
            'booking_id': booking_id,
            'message': 'Booking created successfully'
        }
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error in create_booking_internal: {str(e)}")
        print(traceback.format_exc())
        return {'success': False, 'error': str(e)}
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
