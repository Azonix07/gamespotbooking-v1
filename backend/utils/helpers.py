"""
Utility Helper Functions
Pricing, validation, time slot generation, and formatting functions
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any

def generate_time_slots() -> List[str]:
    """Generate time slots for a day (9:00 AM to 12:00 AM midnight, 30-min intervals).
    Last selectable slot is 23:30.  Closing time is 00:00 (midnight).
    """
    slots = []
    start = 9 * 60    # 9:00 AM in minutes
    end = 24 * 60     # 12:00 AM midnight in minutes (= 1440)
    
    for time_minutes in range(start, end, 30):
        hours = time_minutes // 60
        minutes = time_minutes % 60
        # 24:00 is represented as 00:00 but we stop before it (last slot = 23:30)
        slots.append(f"{hours:02d}:{minutes:02d}")
    
    return slots

def calculate_end_time(start_time: str, duration_minutes: int) -> str:
    """Calculate end time based on start time and duration"""
    time_obj = datetime.strptime(start_time, '%H:%M:%S')
    end_time = time_obj + timedelta(minutes=duration_minutes)
    return end_time.strftime('%H:%M:%S')

def get_affected_slots(start_time: str, duration_minutes: int) -> List[str]:
    """Get all affected time slots for a booking"""
    slots = []
    
    # Handle both HH:MM and HH:MM:SS formats
    if len(start_time) == 5:
        start_time = start_time + ':00'
    
    time_obj = datetime.strptime(start_time, '%H:%M:%S')
    
    for i in range(0, duration_minutes, 30):
        slot_time = time_obj + timedelta(minutes=i)
        slots.append(slot_time.strftime('%H:%M'))
    
    return slots

def calculate_ps5_price(player_count: int, duration_minutes: int) -> float:
    """Calculate PS5 price based on player count and duration"""
    prices = {
        1: {30: 70, 60: 130, 90: 170, 120: 210},
        2: {30: 90, 60: 150, 90: 200, 120: 240},
        3: {30: 90, 60: 150, 90: 200, 120: 240},
        4: {30: 150, 60: 210, 90: 270, 120: 300}
    }
    
    return prices.get(player_count, {}).get(duration_minutes, 0)

def calculate_driving_price(duration_minutes: int) -> float:
    """Calculate Driving Simulator price based on duration"""
    prices = {
        30: 100,
        60: 170,
        90: 200,
        120: 200
    }
    
    return prices.get(duration_minutes, 0)

def validate_booking_data(data: Dict[str, Any]) -> List[str]:
    """Validate booking data and return list of errors"""
    errors = []
    
    # Customer name
    if not data.get('customer_name') or len(data.get('customer_name', '').strip()) < 2:
        errors.append('Customer name is required (minimum 2 characters)')
    
    # Customer phone
    if not data.get('customer_phone') or len(data.get('customer_phone', '').strip()) < 10:
        errors.append('Valid phone number is required (minimum 10 digits)')
    
    # Booking date
    if not data.get('booking_date'):
        errors.append('Booking date is required')
    else:
        try:
            booking_date = datetime.strptime(data['booking_date'], '%Y-%m-%d').date()
            if booking_date < datetime.now().date():
                errors.append('Booking date must be today or in the future')
        except ValueError:
            errors.append('Invalid date format')
    
    # Start time
    if not data.get('start_time'):
        errors.append('Start time is required')
    
    # Duration
    try:
        duration_val = int(data.get('duration_minutes', 0))
    except (TypeError, ValueError):
        duration_val = 0
    if duration_val not in [30, 60, 90, 120]:
        errors.append('Invalid duration. Must be 30, 60, 90, or 120 minutes')
    
    # ── Validate that booking ends by midnight (00:00) ──
    if data.get('start_time') and duration_val > 0:
        try:
            st = data['start_time']
            if len(st) == 5:
                st = st + ':00'
            start_obj = datetime.strptime(st, '%H:%M:%S')
            start_minutes = start_obj.hour * 60 + start_obj.minute
            end_minutes = start_minutes + duration_val
            closing_minutes = 24 * 60  # midnight = 1440
            if end_minutes > closing_minutes:
                errors.append('Booking must end by 12:00 AM (midnight). Please choose an earlier time or shorter duration.')
            # Ensure start time is within business hours (9:00 AM – 11:30 PM)
            if start_minutes < 9 * 60:
                errors.append('Bookings start from 9:00 AM.')
            if start_minutes >= closing_minutes:
                errors.append('Cannot start a booking at midnight. We close at 12:00 AM.')
        except Exception:
            pass
    
    # At least one device must be booked
    has_ps5 = data.get('ps5_bookings') and isinstance(data.get('ps5_bookings'), list) and len(data.get('ps5_bookings', [])) > 0
    has_driving = data.get('driving_sim', False)
    
    if not has_ps5 and not has_driving:
        errors.append('At least one device (PS5 or Driving Sim) must be selected')
    
    # Validate PS5 bookings
    if has_ps5:
        for ps5 in data.get('ps5_bookings', []):
            if ps5.get('device_number') not in [1, 2, 3]:
                errors.append('Invalid PS5 device number')
            if not ps5.get('player_count') or ps5.get('player_count') < 1 or ps5.get('player_count') > 4:
                errors.append('PS5 player count must be between 1 and 4')
    
    return errors

def format_booking(booking: Dict[str, Any], devices: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Format booking for API response"""
    return {
        'id': int(booking['id']),
        'customer_name': booking['customer_name'],
        'customer_phone': booking['customer_phone'],
        'booking_date': str(booking['booking_date']),
        'start_time': str(booking['start_time'])[:5],  # HH:MM format
        'duration_minutes': int(booking['duration_minutes']),
        'total_price': float(booking['total_price']),
        'driving_after_ps5': bool(booking['driving_after_ps5']),
        'created_at': str(booking['created_at']),
        'devices': devices
    }

def format_time_12hour(time_24: str) -> str:
    """Convert 24-hour time to 12-hour format"""
    time_obj = datetime.strptime(time_24, '%H:%M')
    return time_obj.strftime('%I:%M %p')
