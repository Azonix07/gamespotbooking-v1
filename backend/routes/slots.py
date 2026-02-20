"""
Slots API Route
Handles time slot availability checking
Optimized: single DB query for all slots instead of N+1
"""

from flask import Blueprint, request, jsonify
from config.database import get_db_connection
from utils.helpers import generate_time_slots
from datetime import datetime, timedelta
import sys
import traceback

slots_bp = Blueprint('slots', __name__)

def get_closures_for_date(cursor, date):
    """Get closures for a given date, returns (is_full_day_closed, blocked_ranges).
    Note: The shop_closures table is created at startup via create_missing_tables() in app.py.
    """
    try:
        cursor.execute('SELECT * FROM shop_closures WHERE closure_date = %s', (date,))
        closures = cursor.fetchall()
        
        is_full_day = any(c['closure_type'] == 'full_day' for c in closures)
        
        blocked_ranges = []
        for c in closures:
            if c['closure_type'] == 'time_range' and c['start_time'] and c['end_time']:
                st = c['start_time']
                et = c['end_time']
                if hasattr(st, 'total_seconds'):
                    start_min = int(st.total_seconds()) // 60
                else:
                    parts = str(st).split(':')
                    start_min = int(parts[0]) * 60 + int(parts[1])
                if hasattr(et, 'total_seconds'):
                    end_min = int(et.total_seconds()) // 60
                else:
                    parts = str(et).split(':')
                    end_min = int(parts[0]) * 60 + int(parts[1])
                blocked_ranges.append((start_min, end_min, c.get('reason', 'Closed')))
        
        return is_full_day, blocked_ranges
    except Exception:
        return False, []

@slots_bp.route('/api/slots.php', methods=['GET'])
def get_slots():
    """Get available slots for a date"""
    
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
                    bd.device_type,
                    bd.device_number,
                    bd.player_count
                FROM bookings b
                JOIN booking_devices bd ON b.id = bd.booking_id
                WHERE b.booking_date = %s
                AND COALESCE(b.status, 'confirmed') != 'cancelled'
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
                    dev_num = booking['device_number']
                    if dev_num is not None:
                        booked_ps5_units.append(int(dev_num))
                    total_ps5_players += int(booking['player_count'] or 0)
                elif booking['device_type'] == 'driving_sim':
                    driving_booked = True
            
            # Available PS5 units (1, 2, 3 minus booked)
            all_ps5_units = [1, 2, 3]
            available_ps5_units = sorted(set(all_ps5_units) - set(booked_ps5_units))
            
            return jsonify({
                'success': True,
                'available_ps5_units': available_ps5_units,
                'available_driving': not driving_booked,
                'total_ps5_players_booked': total_ps5_players
            })
        
        # ─── Check shop closures for this date ───
        is_full_day_closed, blocked_ranges = get_closures_for_date(cursor, date)
        
        if is_full_day_closed:
            # Return all slots as closed
            time_slots = generate_time_slots()
            slots_data = []
            for slot in time_slots:
                slots_data.append({
                    'time': slot,
                    'status': 'closed',
                    'available_ps5': 0,
                    'available_driving': False,
                    'total_ps5_players': 0,
                    'booked_ps5_units': [],
                    'closure_reason': 'Shop closed for the day'
                })
            return jsonify({
                'success': True,
                'date': date,
                'slots': slots_data,
                'is_closed': True,
                'closure_reason': 'Shop closed for the day'
            })
        
        # ─── OPTIMIZED: Single query for ALL bookings on this date ───
        # Instead of querying N times (once per slot), fetch everything once
        # and compute availability in Python.
        query = """
            SELECT 
                b.start_time,
                b.duration_minutes,
                bd.device_type,
                bd.device_number,
                bd.player_count
            FROM bookings b
            JOIN booking_devices bd ON b.id = bd.booking_id
            WHERE b.booking_date = %s
            AND COALESCE(b.status, 'confirmed') != 'cancelled'
        """
        cursor.execute(query, (date,))
        all_bookings = cursor.fetchall()

        # Pre-convert booking times to minutes for fast overlap checks
        booking_ranges = []
        for b in all_bookings:
            st = b['start_time']
            # start_time could be timedelta or string
            if hasattr(st, 'total_seconds'):
                start_min = int(st.total_seconds()) // 60
            else:
                parts = str(st).split(':')
                start_min = int(parts[0]) * 60 + int(parts[1])
            end_min = start_min + int(b['duration_minutes'])
            # device_number is NULL for driving_sim bookings — default to 0
            dev_num = b['device_number']
            booking_ranges.append({
                'start': start_min,
                'end': end_min,
                'device_type': b['device_type'],
                'device_number': int(dev_num) if dev_num is not None else 0,
                'player_count': int(b['player_count']) if b['player_count'] is not None else 1
            })

        # Generate all time slots and compute availability from cached data
        time_slots = generate_time_slots()
        slots_data = []
        
        for slot in time_slots:
            slot_parts = slot.split(':')
            slot_min = int(slot_parts[0]) * 60 + int(slot_parts[1])

            # Find overlapping bookings: booking that started before this
            # slot minute AND ends after it
            booked_ps5_count = 0
            booked_ps5_units = set()
            total_ps5_players = 0
            driving_booked = False

            for br in booking_ranges:
                if br['start'] <= slot_min < br['end']:
                    if br['device_type'] == 'ps5':
                        booked_ps5_count += 1
                        booked_ps5_units.add(br['device_number'])
                        total_ps5_players += br['player_count']
                    elif br['device_type'] == 'driving_sim':
                        driving_booked = True

            available_ps5 = 3 - len(booked_ps5_units)
            
            # Check if this slot falls within a time-range closure
            slot_closed = False
            closure_reason = ''
            for (bl_start, bl_end, bl_reason) in blocked_ranges:
                if bl_start <= slot_min < bl_end:
                    slot_closed = True
                    closure_reason = bl_reason
                    break
            
            # Determine status
            if slot_closed:
                status = 'closed'
            elif len(booked_ps5_units) == 3 and driving_booked:
                status = 'full'
            elif booked_ps5_units or driving_booked:
                status = 'partial'
            else:
                status = 'available'
            
            slot_entry = {
                'time': slot,
                'status': status,
                'available_ps5': 0 if slot_closed else available_ps5,
                'available_driving': False if slot_closed else (not driving_booked),
                'total_ps5_players': total_ps5_players,
                'booked_ps5_units': sorted(booked_ps5_units)
            }
            if slot_closed:
                slot_entry['closure_reason'] = closure_reason or 'Shop closed'
            
            slots_data.append(slot_entry)
        
        return jsonify({
            'success': True,
            'date': date,
            'slots': slots_data
        })
        
    except Exception as e:
        sys.stderr.write(f"❌ SLOTS ERROR: {str(e)}\n")
        traceback.print_exc(file=sys.stderr)
        sys.stderr.flush()
        return jsonify({'success': False, 'error': 'An error occurred'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
