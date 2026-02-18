"""
AI Input Validator Middleware
Validates and sanitizes all AI booking inputs to prevent errors and ensure data quality
"""

import re
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional

class AIValidator:
    """
    Validates AI booking requests to ensure data quality and prevent errors
    
    Provides validation for:
    - Phone numbers (10 digits)
    - Dates (not in past, within reasonable range)
    - Times (within operating hours)
    - Durations (from allowed list)
    - Player counts (within device limits)
    - Device types (valid devices only)
    """
    
    # Business rules
    OPERATING_HOURS = {'start': 9, 'end': 24}  # 9 AM to 12 AM (Midnight)
    ALLOWED_DURATIONS = [30, 60, 90, 120]  # minutes
    VALID_DEVICES = ['ps5', 'driving_sim']
    MAX_BOOKING_DAYS_AHEAD = 30
    
    # PS5 limits
    PS5_MAX_PLAYERS_PER_STATION = 4
    PS5_TOTAL_MAX_PLAYERS = 10
    PS5_STATIONS = 3
    
    # Driving Sim limits
    DRIVING_SIM_MAX_PLAYERS = 1
    
    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, Optional[str]]:
        """
        Validate phone number
        
        Args:
            phone (str): Phone number to validate
            
        Returns:
            tuple: (is_valid, error_message)
            
        Examples:
            validate_phone("9876543210") → (True, None)
            validate_phone("123") → (False, "Phone number must be exactly 10 digits")
        """
        if not phone:
            return False, "📞 Phone number is required"
        
        # Remove any spaces, dashes, or special characters
        clean_phone = re.sub(r'[^\d]', '', phone)
        
        if len(clean_phone) != 10:
            return False, f"📞 Phone number must be exactly 10 digits (you provided {len(clean_phone)} digits)"
        
        if not clean_phone.isdigit():
            return False, "📞 Phone number must contain only digits"
        
        # Check if starts with valid Indian mobile prefix (6-9)
        if clean_phone[0] not in ['6', '7', '8', '9']:
            return False, "📞 Phone number must start with 6, 7, 8, or 9"
        
        return True, None
    
    @staticmethod
    def validate_date(date_str: str) -> Tuple[bool, Optional[str]]:
        """
        Validate booking date
        
        Args:
            date_str (str): Date in ISO format (YYYY-MM-DD)
            
        Returns:
            tuple: (is_valid, error_message)
            
        Examples:
            validate_date("2026-01-05") → (True, None)
            validate_date("2025-12-31") → (False, "Cannot book in the past")
        """
        if not date_str:
            return False, "📅 Date is required"
        
        try:
            booking_date = datetime.fromisoformat(date_str).date()
            today = datetime.now().date()
            max_date = today + timedelta(days=AIValidator.MAX_BOOKING_DAYS_AHEAD)
            
            if booking_date < today:
                return False, f"📅 Cannot book in the past. Today is {today.strftime('%B %d, %Y')}"
            
            if booking_date > max_date:
                return False, f"📅 Can only book up to {AIValidator.MAX_BOOKING_DAYS_AHEAD} days in advance (until {max_date.strftime('%B %d, %Y')})"
            
            return True, None
            
        except (ValueError, AttributeError):
            return False, f"📅 Invalid date format. Please use YYYY-MM-DD format (e.g., 2026-01-15)"
    
    @staticmethod
    def validate_time(time_str: str, date_str: str = None) -> Tuple[bool, Optional[str]]:
        """
        Validate booking time
        
        Args:
            time_str (str): Time in HH:MM format (24-hour)
            date_str (str, optional): Date to check if time has passed
            
        Returns:
            tuple: (is_valid, error_message)
            
        Examples:
            validate_time("14:00") → (True, None)
            validate_time("08:00") → (False, "Time must be between 09:00 and 22:00")
        """
        if not time_str:
            return False, "⏰ Time is required"
        
        try:
            # Parse time
            hour, minute = map(int, time_str.split(':'))
            
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                return False, "⏰ Invalid time format. Use HH:MM (e.g., 14:30)"
            
            # Check operating hours
            if hour < AIValidator.OPERATING_HOURS['start']:
                return False, f"⏰ We open at {AIValidator.OPERATING_HOURS['start']}:00 AM. Please choose a time between 9 AM and 12 AM (Midnight)"
            
            # Midnight (00:00) or later is not a valid start time
            time_in_minutes = hour * 60 + minute
            if time_in_minutes >= 24 * 60 or (hour == 0 and minute == 0):
                return False, "⏰ We close at 12:00 AM (Midnight). Last booking slot is 11:30 PM. Please choose an earlier time"
            
            if hour >= 23 and minute > 30:
                return False, "⏰ Last booking slot is 11:30 PM. Bookings must be at least 30 minutes before midnight"
            
            # If date is today, check if time has passed
            if date_str:
                try:
                    booking_date = datetime.fromisoformat(date_str).date()
                    today = datetime.now().date()
                    
                    if booking_date == today:
                        current_time = datetime.now().time()
                        booking_time = datetime.strptime(time_str, '%H:%M').time()
                        
                        if booking_time <= current_time:
                            return False, f"⏰ This time has already passed today. Current time is {current_time.strftime('%I:%M %p')}"
                except:
                    pass  # If date parsing fails, skip time-passed check
            
            return True, None
            
        except (ValueError, AttributeError):
            return False, "⏰ Invalid time format. Please use HH:MM format (e.g., 14:30 or 7:30 PM)"
    
    @staticmethod
    def validate_duration(duration: int) -> Tuple[bool, Optional[str]]:
        """
        Validate booking duration
        
        Args:
            duration (int): Duration in minutes
            
        Returns:
            tuple: (is_valid, error_message)
            
        Examples:
            validate_duration(120) → (True, None)
            validate_duration(45) → (False, "Duration must be one of: 30, 60, 90, or 120 minutes")
        """
        if not duration:
            return False, "⏱️ Duration is required"
        
        try:
            duration_int = int(duration)
            
            if duration_int not in AIValidator.ALLOWED_DURATIONS:
                allowed_str = ', '.join([f"{d} min" if d < 60 else f"{d//60} hour{'s' if d > 60 else ''}" 
                                        for d in AIValidator.ALLOWED_DURATIONS])
                return False, f"⏱️ Duration must be one of: {allowed_str}"
            
            return True, None
            
        except (ValueError, TypeError):
            return False, "⏱️ Duration must be a number in minutes"
    
    @staticmethod
    def validate_player_count(count: int, device: str) -> Tuple[bool, Optional[str]]:
        """
        Validate player count for device type
        
        Args:
            count (int): Number of players
            device (str): Device type ('ps5' or 'driving_sim')
            
        Returns:
            tuple: (is_valid, error_message)
            
        Examples:
            validate_player_count(4, 'ps5') → (True, None)
            validate_player_count(2, 'driving_sim') → (False, "Driving simulator is for 1 player only")
        """
        if not count:
            return False, "👥 Player count is required"
        
        try:
            player_count = int(count)
            
            if player_count <= 0:
                return False, "👥 Player count must be at least 1"
            
            if device == 'ps5':
                if player_count > AIValidator.PS5_TOTAL_MAX_PLAYERS:
                    return False, f"👥 PS5 booking supports maximum {AIValidator.PS5_TOTAL_MAX_PLAYERS} players total (across all 3 stations)"
                return True, None
                
            elif device == 'driving_sim':
                if player_count > AIValidator.DRIVING_SIM_MAX_PLAYERS:
                    return False, f"👥 Driving simulator is for {AIValidator.DRIVING_SIM_MAX_PLAYERS} player only"
                return True, None
            else:
                return False, f"❌ Unknown device type: {device}"
                
        except (ValueError, TypeError):
            return False, "👥 Player count must be a number"
    
    @staticmethod
    def validate_device(device: str) -> Tuple[bool, Optional[str]]:
        """
        Validate device type
        
        Args:
            device (str): Device identifier
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if not device:
            return False, "🎮 Device selection is required"
        
        device_lower = device.lower().strip()
        
        if device_lower not in AIValidator.VALID_DEVICES:
            return False, f"🎮 Invalid device. Please choose 'ps5' or 'driving_sim'"
        
        return True, None
    
    @staticmethod
    def validate_booking_data(booking_data: Dict) -> Tuple[bool, Dict[str, str]]:
        """
        Validate complete booking data
        
        Args:
            booking_data (dict): Dictionary with booking fields
            
        Returns:
            tuple: (all_valid, {field: error_message})
            
        Example:
            validate_booking_data({
                'phone': '9876543210',
                'date': '2026-01-15',
                'time': '14:00',
                'duration': 120,
                'players': 4,
                'device': 'ps5'
            })
        """
        errors = {}
        
        # Validate each field
        if 'phone' in booking_data:
            valid, error = AIValidator.validate_phone(booking_data['phone'])
            if not valid:
                errors['phone'] = error
        
        if 'device' in booking_data:
            valid, error = AIValidator.validate_device(booking_data['device'])
            if not valid:
                errors['device'] = error
        
        if 'date' in booking_data:
            valid, error = AIValidator.validate_date(booking_data['date'])
            if not valid:
                errors['date'] = error
        
        if 'time' in booking_data:
            date_str = booking_data.get('date')
            valid, error = AIValidator.validate_time(booking_data['time'], date_str)
            if not valid:
                errors['time'] = error
        
        if 'duration' in booking_data:
            valid, error = AIValidator.validate_duration(booking_data['duration'])
            if not valid:
                errors['duration'] = error
        
        if 'players' in booking_data and 'device' in booking_data:
            valid, error = AIValidator.validate_player_count(
                booking_data['players'],
                booking_data['device']
            )
            if not valid:
                errors['players'] = error
        
        return len(errors) == 0, errors
    
    @staticmethod
    def sanitize_phone(phone: str) -> str:
        """Remove non-digit characters from phone number"""
        return re.sub(r'[^\d]', '', phone)
    
    @staticmethod
    def format_validation_errors(errors: Dict[str, str]) -> str:
        """
        Format validation errors into a user-friendly message
        
        Args:
            errors (dict): {field: error_message}
            
        Returns:
            str: Formatted error message
        """
        if not errors:
            return ""
        
        error_list = "\n".join([f"• {error}" for error in errors.values()])
        return f"⚠️ **Please fix the following issues:**\n\n{error_list}"
