"""
Slots API Route
Handles time slot availability checking
"""

from flask import Blueprint, request, jsonify
from config.database import get_db_connection
from utils.helpers import generate_time_slots
from datetime import datetime, timedelta

slots_bp = Blueprint('slots', __name__)

@slots_bp.route('/api/slots.php', methods=['GET', 'OPTIONS'])
def get_slots():
    """Get available slots for a date"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    date = request.args.get('date')
    duration = request.args.get('duration', type=int)
    time = request.args.get('time')
    
    # Validate date
    try:
        datetime.strptime(date, '%Y-%m-%d')
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Invalid date format'}), 400
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # If specific time and duration provided, return detailed availability
        if time is not None and duration is not None:
            # Calculate the end time of the requested booking
            requested_start_time = time + ':00'
            time_obj = datetime.strptime(requested_start_time, '%H:%M:%S')
            requested_end_time = (time_obj + timedelta(minutes=duration)).strftime('%H:%M:%S')
            
            # Get all bookings that overlap with the requested time range
            query = """
                SELECT 
                    b.id,
                    b.start_time,
                    b.duration_minutes,
                    bd.device_type,
                    bd.device_number,
                    bd.player_count,
                    ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) as end_time
                FROM bookings b
                JOIN booking_devices bd ON b.id = bd.booking_id
                WHERE b.booking_date = %s
                AND b.start_time < %s
                AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
            """
            
            cursor.execute(query, (date, requested_end_time, requested_start_time))
            overlapping_bookings = cursor.fetchall()
            
            # Calculate availability
            booked_ps5_units = []
            total_ps5_players = 0
            driving_booked = False
            
            for booking in overlapping_bookings:
                if booking['device_type'] == 'ps5':
                    booked_ps5_units.append(int(booking['device_number']))
                    total_ps5_players += int(booking['player_count'])
                elif booking['device_type'] == 'driving_sim':
                    driving_booked = True
            
            # Available PS5 units (1, 2, 3 minus booked)
            all_ps5_units = [1, 2, 3]
            available_ps5_units = list(set(all_ps5_units) - set(booked_ps5_units))
            available_ps5_units.sort()
            
            return jsonify({
                'success': True,
                'available_ps5_units': available_ps5_units,
                'available_driving': not driving_booked,
                'total_ps5_players_booked': total_ps5_players
            })
        
        # Get all slots for the date
        time_slots = generate_time_slots()
        slots_data = []
        
        for slot in time_slots:
            # Get bookings for this specific slot
            query = """
                SELECT 
                    bd.device_type,
                    bd.device_number,
                    bd.player_count
                FROM bookings b
                JOIN booking_devices bd ON b.id = bd.booking_id
                WHERE b.booking_date = %s
                AND b.start_time <= %s
                AND ADDTIME(b.start_time, SEC_TO_TIME(b.duration_minutes * 60)) > %s
            """
            
            slot_time = slot + ':00'
            cursor.execute(query, (date, slot_time, slot_time))
            bookings = cursor.fetchall()
            
            # Calculate availability
            booked_ps5_count = 0
            booked_ps5_units = []
            total_ps5_players = 0
            driving_booked = False
            
            for booking in bookings:
                if booking['device_type'] == 'ps5':
                    booked_ps5_count += 1
                    booked_ps5_units.append(int(booking['device_number']))
                    total_ps5_players += int(booking['player_count'])
                elif booking['device_type'] == 'driving_sim':
                    driving_booked = True
            
            available_ps5 = 3 - booked_ps5_count
            
            # Determine status
            if booked_ps5_count == 3 and driving_booked:
                status = 'full'  # Red
            elif booked_ps5_count > 0 or driving_booked:
                status = 'partial'  # Yellow
            else:
                status = 'available'  # Green
            
            slots_data.append({
                'time': slot,
                'status': status,
                'available_ps5': available_ps5,
                'available_driving': not driving_booked,
                'total_ps5_players': total_ps5_players,
                'booked_ps5_units': sorted(list(set(booked_ps5_units)))
            })
        
        return jsonify({
            'success': True,
            'date': date,
            'slots': slots_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
