"""
PS5 Booking State Machine - Complete Conversation Flow
Implements professional booking executive behavior with state tracking
"""

from enum import Enum
from typing import Dict, Optional, List, Tuple
from datetime import datetime, timedelta
import re

class BookingState(Enum):
    """All possible conversation states"""
    GREETING = "greeting"
    BOOKING_INTENT = "booking_intent"
    GAME_SELECTION = "game_selection"
    PS5_PLAYER_COUNT = "ps5_player_count"
    PS5_DURATION = "ps5_duration"
    DATE_CONFIRMATION = "date_confirmation"
    TIME_CONFIRMATION = "time_confirmation"
    AVAILABILITY_VALIDATION = "availability_validation"
    CUSTOMER_NAME = "customer_name"
    CUSTOMER_PHONE = "customer_phone"
    BOOKING_SUMMARY = "booking_summary"
    CONFIRMATION = "confirmation"
    COMPLETION = "completion"
    MODIFICATION = "modification"
    FAILURE = "failure"

class PS5BookingStateMachine:
    """
    Professional PS5 Booking Assistant State Machine
    Follows exact conversation rules and never skips steps
    """
    
    # PS5 Configuration
    PS5_UNITS = 3
    MAX_PLAYERS_PER_PS5 = 4
    MAX_TOTAL_PLAYERS = 10
    VALID_DURATIONS = [30, 60, 90, 120]  # minutes
    
    def __init__(self):
        self.reset_conversation()
    
    def reset_conversation(self):
        """Reset conversation state"""
        self.state = BookingState.GREETING
        self.booking_data = {
            'game': None,
            'player_count': None,
            'ps5_allocation': None,
            'duration': None,
            'date': None,
            'time': None,
            'name': None,
            'phone': None,
            'availability_confirmed': False
        }
        self.conversation_history = []
    
    def process_message(self, user_message: str, context: Dict = None) -> Dict:
        """
        Process user message based on current state
        NEVER goes backward unless user explicitly requests change
        Returns: {
            'reply': str,
            'state': str,
            'next_state': str,
            'booking_data': dict,
            'requires_validation': bool
        }
        """
        user_message = user_message.lower().strip()
        self.conversation_history.append({'role': 'user', 'message': user_message})
        
        # Route to appropriate state handler
        handler = self._get_state_handler()
        response = handler(user_message)
        
        self.conversation_history.append({'role': 'ai', 'message': response['reply']})
        
        return response
    
    def _get_state_handler(self):
        """Get handler function for current state"""
        handlers = {
            BookingState.GREETING: self._handle_greeting,
            BookingState.BOOKING_INTENT: self._handle_booking_intent,
            BookingState.GAME_SELECTION: self._handle_game_selection,
            BookingState.PS5_PLAYER_COUNT: self._handle_ps5_player_count,
            BookingState.PS5_DURATION: self._handle_ps5_duration,
            BookingState.DATE_CONFIRMATION: self._handle_date_confirmation,
            BookingState.TIME_CONFIRMATION: self._handle_time_confirmation,
            BookingState.AVAILABILITY_VALIDATION: self._handle_availability_validation,
            BookingState.CUSTOMER_NAME: self._handle_customer_name,
            BookingState.CUSTOMER_PHONE: self._handle_customer_phone,
            BookingState.BOOKING_SUMMARY: self._handle_booking_summary,
            BookingState.CONFIRMATION: self._handle_confirmation,
        }
        return handlers.get(self.state, self._handle_fallback)
    
    # ==================== STATE HANDLERS ====================
    
    def _handle_greeting(self, message: str) -> Dict:
        """STATE 1: GREETING - Human-like, friendly"""
        greetings = ['hi', 'hello', 'hey', 'start', 'begin']
        
        if any(word in message for word in greetings):
            self.state = BookingState.BOOKING_INTENT
            return {
                'reply': "Hey! 👋 What would you like to play — PS5 or Driving Simulator?",
                'state': 'greeting',
                'next_state': 'booking_intent',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        # User might directly say booking intent
        if any(word in message for word in ['book', 'reserve', 'play', 'ps5', 'simulator']):
            return self._handle_booking_intent(message)
        
        return {
            'reply': "Hey! 👋 What would you like to play — PS5 or Driving Simulator?",
            'state': 'greeting',
            'next_state': 'booking_intent',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_booking_intent(self, message: str) -> Dict:
        """STATE 2: BOOKING INTENT - Extract info, don't ask what we already know"""
        booking_words = ['book', 'reserve', 'need', 'want', 'play']
        
        # Extract game type from message
        if 'ps5' in message or 'playstation' in message:
            self.booking_data['game'] = 'ps5'
        elif 'driving' in message or 'simulator' in message:
            self.booking_data['game'] = 'driving'
        
        # Extract player count if mentioned
        player_match = re.search(r'(\d+)\s*(people|players|persons|player|person)', message)
        if player_match:
            self.booking_data['player_count'] = int(player_match.group(1))
        
        # Extract duration if mentioned
        if '30 min' in message or 'half hour' in message or 'thirty min' in message:
            self.booking_data['duration'] = 30
        elif '1 hour' in message or 'one hour' in message or '60 min' in message:
            self.booking_data['duration'] = 60
        elif '1.5 hour' in message or '90 min' in message:
            self.booking_data['duration'] = 90
        elif '2 hour' in message or 'two hour' in message or '120 min' in message:
            self.booking_data['duration'] = 120
        
        # ⚠️ CRITICAL: If game is already selected, DON'T ask about it again!
        if self.booking_data['game']:
            # Game already known - ask for NEXT missing info
            if self.booking_data['game'] == 'ps5' and not self.booking_data['player_count']:
                self.state = BookingState.PS5_PLAYER_COUNT
                return {
                    'reply': "Great choice! 🎮 How many people will be playing?",
                    'state': 'booking_intent',
                    'next_state': 'ps5_player_count',
                    'booking_data': self.booking_data,
                    'requires_validation': False
                }
            elif self.booking_data['player_count'] and not self.booking_data['duration']:
                self.state = BookingState.PS5_DURATION
                return {
                    'reply': "Perfect 👍 How long? 30 min, 1 hour, 1.5 hours, or 2 hours?",
                    'state': 'booking_intent',
                    'next_state': 'ps5_duration',
                    'booking_data': self.booking_data,
                    'requires_validation': False
                }
        
        # Check if user mentioned game directly
        if 'ps5' in message or 'playstation' in message:
            self.booking_data['game'] = 'ps5'
            self.state = BookingState.PS5_PLAYER_COUNT
            return {
                'reply': "Great choice! 🎮 How many people will be playing?",
                'state': 'booking_intent',
                'next_state': 'ps5_player_count',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        if 'driving' in message or 'simulator' in message or 'driv' in message:
            self.booking_data['game'] = 'driving_sim'
            self.state = BookingState.PS5_DURATION  # Jump to duration for simulator
            return {
                'reply': "Great choice! 🏎️ How long do you want to race?",
                'state': 'booking_intent',
                'next_state': 'ps5_duration',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        # Ask for game selection
        if any(word in message for word in booking_words):
            self.state = BookingState.GAME_SELECTION
            return {
                'reply': "What would you like to play — PS5 or Driving Simulator?",
                'state': 'booking_intent',
                'next_state': 'game_selection',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        return {
            'reply': "What would you like to play — PS5 or Driving Simulator?",
            'state': 'booking_intent',
            'next_state': 'game_selection',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_game_selection(self, message: str) -> Dict:
        """STATE 3: GAME SELECTION - Natural, don't repeat"""
        # CRITICAL: Never go backwards - if game already selected, ask for next step
        if self.booking_data['game']:
            if self.booking_data['game'] == 'ps5' and not self.booking_data['player_count']:
                self.state = BookingState.PS5_PLAYER_COUNT
                return {
                    'reply': "Great choice! 🎮 How many people will be playing?",
                    'state': 'game_selection',
                    'next_state': 'ps5_player_count',
                    'booking_data': self.booking_data,
                    'requires_validation': False
                }
            elif self.booking_data['game'] and not self.booking_data['duration']:
                self.state = BookingState.PS5_DURATION
                return {
                    'reply': "Perfect 👍 How long? 30 min, 1 hour, 1.5 hours, or 2 hours?",
                    'state': 'game_selection',
                    'next_state': 'ps5_duration',
                    'booking_data': self.booking_data,
                    'requires_validation': False
                }
        
        if 'ps5' in message or 'playstation' in message:
            self.booking_data['game'] = 'ps5'
            self.state = BookingState.PS5_PLAYER_COUNT
            return {
                'reply': "Great choice! 🎮 How many people will be playing?",
                'state': 'game_selection',
                'next_state': 'ps5_player_count',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        if 'driving' in message or 'simulator' in message or 'driv' in message:
            self.booking_data['game'] = 'driving_sim'
            self.state = BookingState.PS5_DURATION
            return {
                'reply': "Great choice! Driving Simulator! 🏎️\n\nHow long do you want to play?",
                'state': 'game_selection',
                'next_state': 'ps5_duration',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        return {
            'reply': "Please choose either PS5 or Driving Simulator.",
            'state': 'game_selection',
            'next_state': 'game_selection',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_ps5_player_count(self, message: str) -> Dict:
        """STATE 4A: PS5 PLAYER COUNT"""
        # Extract player count - prioritize numbers near "people/players" to avoid "PS5"
        player_match = re.search(r'(\d+)\s*(people|players|persons|player|person)', message)
        if player_match:
            numbers = [player_match.group(1)]
        else:
            # Fallback: get all numbers
            numbers = re.findall(r'\d+', message)
        
        if not numbers:
            return {
                'reply': "Please tell me the number of players (for example: 2, 4, or 6).",
                'state': 'ps5_player_count',
                'next_state': 'ps5_player_count',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        player_count = int(numbers[0])
        
        # Validate player count
        if player_count <= 0:
            return {
                'reply': "Please enter a valid number of players (at least 1).",
                'state': 'ps5_player_count',
                'next_state': 'ps5_player_count',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        if player_count > self.MAX_TOTAL_PLAYERS:
            return {
                'reply': f"PS5 allows a maximum of {self.MAX_TOTAL_PLAYERS} players in total. Please tell me a valid number.",
                'state': 'ps5_player_count',
                'next_state': 'ps5_player_count',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        # Calculate PS5 allocation
        ps5_needed = (player_count + self.MAX_PLAYERS_PER_PS5 - 1) // self.MAX_PLAYERS_PER_PS5
        
        self.booking_data['player_count'] = player_count
        self.booking_data['ps5_allocation'] = ps5_needed
        self.state = BookingState.PS5_DURATION
        # Always move forward: ask for duration
        return {
            'reply': f"Got it! {player_count} player{'s' if player_count > 1 else ''} 👥\n\nHow long would you like to play? You can choose 30 minutes, 1 hour, 1.5 hours, or 2 hours.",
            'state': 'ps5_player_count',
            'next_state': 'ps5_duration',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_ps5_duration(self, message: str) -> Dict:
        """STATE 4C: PS5 DURATION"""
        duration = None
        
        # Parse duration from message
        if '30' in message or 'half' in message or 'thirty' in message:
            duration = 30
        elif '1.5' in message or '90' in message or 'ninety' in message or 'hour and half' in message:
            duration = 90
        elif '2' in message or 'two' in message or '120' in message:
            duration = 120
        elif '1' in message or 'one' in message or '60' in message or 'hour' in message:
            duration = 60
        
        if duration not in self.VALID_DURATIONS:
            return {
                'reply': "Please choose a duration:\n• 30 minutes\n• 1 hour\n• 1.5 hours\n• 2 hours",
                'state': 'ps5_duration',
                'next_state': 'ps5_duration',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        self.booking_data['duration'] = duration
        self.state = BookingState.DATE_CONFIRMATION
        duration_text = f"{duration} minutes" if duration < 60 else f"{duration//60} hour{'s' if duration > 60 else ''}"
        # Always move forward: ask if booking is for today
        return {
            'reply': f"Perfect! {duration_text} ⏱️\n\nIs this booking for today? (yes or no)",
            'state': 'ps5_duration',
            'next_state': 'date_confirmation',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_date_confirmation(self, message: str) -> Dict:
        """STATE 5: DATE CONFIRMATION"""
        if any(word in message for word in ['yes', 'yeah', 'yep', 'today', 'now']):
            self.booking_data['date'] = datetime.now().strftime('%Y-%m-%d')
            self.state = BookingState.TIME_CONFIRMATION
            return {
                'reply': "Great! Booking for today 📅\n\nWhat time would you like to start playing? (e.g., 6:00 PM)",
                'state': 'date_confirmation',
                'next_state': 'time_confirmation',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        if any(word in message for word in ['no', 'nope', 'different', 'another', 'tomorrow']):
            if 'tomorrow' in message:
                tomorrow = datetime.now() + timedelta(days=1)
                self.booking_data['date'] = tomorrow.strftime('%Y-%m-%d')
                self.state = BookingState.TIME_CONFIRMATION
                return {
                    'reply': "Got it! Booking for tomorrow 📅\n\nWhat time would you like to start playing? (e.g., 6:00 PM)",
                    'state': 'date_confirmation',
                    'next_state': 'time_confirmation',
                    'booking_data': self.booking_data,
                    'requires_validation': False
                }
            return {
                'reply': "What date would you like to book? (Please say 'tomorrow' or tell me the specific date in YYYY-MM-DD format)",
                'state': 'date_confirmation',
                'next_state': 'date_confirmation',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        return {
            'reply': "Is this booking for today? Please answer yes or no.",
            'state': 'date_confirmation',
            'next_state': 'date_confirmation',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_time_confirmation(self, message: str) -> Dict:
        """STATE 6: TIME CONFIRMATION"""
        # Check for vague time references
        vague_times = ['evening', 'night', 'morning', 'afternoon', 'noon']
        if any(word in message for word in vague_times):
            return {
                'reply': "Please tell me an exact time like 6:00 PM or 7:30 PM.",
                'state': 'time_confirmation',
                'next_state': 'time_confirmation',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        # Extract time (simplified - should use more robust parsing)
        time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)?', message.lower())
        
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            period = time_match.group(3)
            
            # Convert to 24-hour format
            if period == 'pm' and hour < 12:
                hour += 12
            elif period == 'am' and hour == 12:
                hour = 0
            
            self.booking_data['time'] = f"{hour:02d}:{minute:02d}"
            self.state = BookingState.AVAILABILITY_VALIDATION
            
            time_display = time_match.group(0).upper()
            
            return {
                'reply': f"Checking availability for {time_display}... ⏳",
                'state': 'time_confirmation',
                'next_state': 'availability_validation',
                'booking_data': self.booking_data,
                'requires_validation': True  # MUST check with backend
            }
        
        return {
            'reply': "Please provide a time in format like 6:00 PM or 18:00.",
            'state': 'time_confirmation',
            'next_state': 'time_confirmation',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_availability_validation(self, message: str) -> Dict:
        """STATE 7: AVAILABILITY VALIDATION - This is called AFTER backend check"""
        # This handler is special - it's called AFTER external validation
        # The message here would be the availability status from backend
        
        # For now, assume available and move to customer details
        self.booking_data['availability_confirmed'] = True
        self.state = BookingState.CUSTOMER_NAME
        
        return {
            'reply': "Great news! That slot is available! ✅\n\nPlease tell me your name.",
            'state': 'availability_validation',
            'next_state': 'customer_name',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_customer_name(self, message: str) -> Dict:
        """STATE 8: CUSTOMER NAME"""
        name = message.strip().title()
        
        if len(name) < 2:
            return {
                'reply': "Please tell me your full name.",
                'state': 'customer_name',
                'next_state': 'customer_name',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        self.booking_data['name'] = name
        self.state = BookingState.CUSTOMER_PHONE
        
        return {
            'reply': f"Thank you, {name}! 😊\n\nPlease tell me your phone number.",
            'state': 'customer_name',
            'next_state': 'customer_phone',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_customer_phone(self, message: str) -> Dict:
        """STATE 8: CUSTOMER PHONE"""
        # Extract phone number
        phone = re.sub(r'[^\d+]', '', message)
        
        if len(phone) < 10:
            return {
                'reply': "Please provide a valid 10-digit phone number.",
                'state': 'customer_phone',
                'next_state': 'customer_phone',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        self.booking_data['phone'] = phone
        self.state = BookingState.BOOKING_SUMMARY
        
        # Generate booking summary
        return self._generate_booking_summary()
    
    def _generate_booking_summary(self) -> Dict:
        """STATE 9: BOOKING SUMMARY"""
        data = self.booking_data
        
        # Format duration
        duration_text = f"{data['duration']} minutes" if data['duration'] < 60 else f"{data['duration']//60} hour{'s' if data['duration'] > 60 else ''}"
        
        # Format date
        date_obj = datetime.strptime(data['date'], '%Y-%m-%d')
        date_text = "Today" if date_obj.date() == datetime.now().date() else date_obj.strftime('%B %d, %Y')
        
        # Format time
        time_obj = datetime.strptime(data['time'], '%H:%M')
        time_text = time_obj.strftime('%I:%M %p')
        
        summary = f"""
📋 **Booking Summary**

Game: {data['game'].upper().replace('_', ' ')}
Players: {data['player_count']}
Duration: {duration_text}
Date: {date_text}
Start Time: {time_text}
Name: {data['name']}
Phone: {data['phone']}

Please confirm if you want to place this booking.
"""
        
        return {
            'reply': summary,
            'state': 'booking_summary',
            'next_state': 'confirmation',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_booking_summary(self, message: str) -> Dict:
        """Handle response to booking summary"""
        if any(word in message for word in ['yes', 'confirm', 'correct', 'proceed', 'book']):
            self.state = BookingState.CONFIRMATION
            return self._handle_confirmation(message)
        
        if any(word in message for word in ['no', 'change', 'modify', 'wrong']):
            return {
                'reply': "What would you like to change? (players, duration, time, date, name, or phone)",
                'state': 'booking_summary',
                'next_state': 'modification',
                'booking_data': self.booking_data,
                'requires_validation': False
            }
        
        return {
            'reply': "Please confirm: Type 'yes' to proceed or 'no' to make changes.",
            'state': 'booking_summary',
            'next_state': 'confirmation',
            'booking_data': self.booking_data,
            'requires_validation': False
        }
    
    def _handle_confirmation(self, message: str) -> Dict:
        """STATE 10: CONFIRMATION"""
        # This would call the actual booking API
        self.state = BookingState.COMPLETION
        
        game_emoji = "🎮" if self.booking_data['game'] == 'ps5' else "🏎️"
        
        return {
            'reply': f"Your {self.booking_data['game'].upper().replace('_', ' ')} booking has been successfully confirmed {game_emoji}\n\nYou'll receive a confirmation message shortly. See you soon!",
            'state': 'confirmation',
            'next_state': 'completion',
            'booking_data': self.booking_data,
            'requires_validation': False,
            'action': 'create_booking'  # Signal to create actual booking
        }
    
    def _handle_fallback(self, message: str) -> Dict:
        """Fallback handler"""
        return {
            'reply': "I'm not sure I understand. Would you like to start over or continue?",
            'state': 'fallback',
            'next_state': 'fallback',
            'booking_data': self.booking_data,
            'requires_validation': False
        }

# DO NOT USE GLOBAL INSTANCE - Each session needs its own state machine
# Global instance causes state collision between users
# ps5_state_machine = PS5BookingStateMachine()  # REMOVED - causes bugs!
