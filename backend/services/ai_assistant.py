"""
AI Booking Assistant Service - FAST AI
Instant responses, clear buttons, step-by-step process
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

# Import FAST AI - Instant responses, no LLM delays
try:
    from services.fast_ai_booking import fast_ai
    FAST_AI_ENABLED = True
    print("[OK] Fast AI active (INSTANT, SIMPLE, CLEAR BUTTONS)")
except ImportError:
    FAST_AI_ENABLED = False
    fast_ai = None
    print("[WARNING] Fast AI not found - system error")

# Import context and state management
try:
    from services.ai_context_engine import AIContextEngine
    from services.ai_memory_system import memory_system
    from services.ps5_booking_state_machine import BookingState
    CONTEXT_ENABLED = True
    MEMORY_ENABLED = True
    STATE_MACHINE_ENABLED = True
except ImportError as e:
    CONTEXT_ENABLED = False
    MEMORY_ENABLED = False
    STATE_MACHINE_ENABLED = False
    MALAYALAM_ENABLED = False
    print(f"Warning: Some AI modules not available: {e}")

class AIBookingAssistant:
    """
    AI-powered booking assistant that helps users book slots
    through natural language conversation
    
    ENHANCEMENTS:
    - Context-aware responses (remembers conversation)
    - Never asks repeated questions
    - Smart recommendations based on analytics
    - System prompt integration for complete knowledge
    - Fail-safe behaviors
    """
    
    def __init__(self, context_engine=None):
        self.business_rules = {
            'ps5_stations': 3,
            'max_players_per_ps5': 4,
            'max_total_players': 10,
            'driving_sim_count': 1,
            'slot_durations': [30, 60, 90, 120],  # minutes
            'operating_hours': {'start': '09:00', 'end': '00:00'}
        }
        
        self.pricing_rules = {
            'ps5_per_hour': 300,
            'driving_sim_per_hour': 400
        }
        
        # Context engine for smart conversation
        if CONTEXT_ENABLED:
            self.context_engine = context_engine or AIContextEngine()
            # self.system_prompts = AISystemPrompts()  # Disabled
        else:
            self.context_engine = None
            # self.system_prompts = None  # Disabled
        
        # State machine instances per session
        self.session_state_machines = {}
    
    def process_message(self, message: str, context: Dict = None, session_id: str = None) -> Dict:
        """
        Process user message and return AI response
        🚀 GEMINI AI: Uses real AI model if available (FREE)
        FALLBACK: Smart rule-based system
        
        Args:
            message: User's message
            context: Conversation context (previous state)
            session_id: Session ID for memory and state tracking
        """
        context = context or {}
        
        # ============================================
        # ⚡ FAST AI MODE (INSTANT, CLEAR BUTTONS)
        # ============================================
        if FAST_AI_ENABLED and fast_ai and session_id:
            print(f"⚡ Using Fast AI (INSTANT) for session: {session_id}")
            
            # Step 1: Store user message in memory
            if MEMORY_ENABLED:
                memory_system.add_message(session_id, 'user', message)
            
            # Step 2: Get current booking state (PRESERVE previous state!)
            booking_state = context.get('booking_state', {})
            
            # Also check context_engine as fallback
            if self.context_engine and not booking_state:
                ctx = self.context_engine.get_context(session_id, message)
                booking_state = ctx.get('booking_data', {})
            
            # Step 3: Get conversation history for context
            conversation_history = []
            if MEMORY_ENABLED:
                history = memory_system.get_conversation_history(session_id)
                conversation_history = [
                    {'role': msg.get('role', 'user'), 'content': msg.get('content', '')}
                    for msg in history
                ]
            
            # Step 4: Process message with Fast AI (INSTANT)
            ai_result = fast_ai.process_message(
                user_message=message,
                booking_state=booking_state,
                conversation_history=conversation_history,
                session_id=session_id
            )
            
            # Step 5: Store AI response in memory
            if MEMORY_ENABLED:
                memory_system.add_message(session_id, 'assistant', ai_result['reply'], {
                    'fast_ai_powered': True,
                    'step': ai_result['next_step'],
                    'buttons': ai_result['buttons']
                })
            
            # Step 6: Update context with new booking state
            if self.context_engine:
                for key, value in ai_result['booking_state'].items():
                    if value:
                        self.context_engine.update_booking_progress(session_id, key, value)
            
            # Step 7: Return response with BUTTONS
            response = {
                'reply': ai_result['reply'],
                'action': ai_result['action'],
                'context': {
                    'booking_state': ai_result['booking_state'],
                    'current_step': ai_result['next_step']
                },
                'buttons': ai_result['buttons'],  # ✅ QUICK ACTION BUTTONS
                'smart_suggestions': ai_result['buttons'],  # ✅ Also as suggestions
                'fast_ai_powered': True
            }
            
            # ✅ If Fast AI prepared booking_data, pass it through!
            if 'booking_data' in ai_result:
                response['booking_data'] = ai_result['booking_data']
            
            return response
        
        # ============================================
        # 📋 FALLBACK: State machine (if Fast AI not available)
        # ============================================
        
        # STEP 0: Use state machine for structured booking flow
        if STATE_MACHINE_ENABLED and session_id:
            # Get or create state machine for this session
            if session_id not in self.session_state_machines:
                from services.ps5_booking_state_machine import PS5BookingStateMachine
                self.session_state_machines[session_id] = PS5BookingStateMachine()
            
            state_machine = self.session_state_machines[session_id]
            
            # Process message through state machine
            sm_response = state_machine.process_message(message, context)
            
            # If state machine requires validation (availability check)
            if sm_response.get('requires_validation'):
                # Check availability with backend
                booking_data = sm_response['booking_data']
                # TODO: Call actual availability API
                # For now, assume available
                sm_response = state_machine._handle_availability_validation('available')
            
            # Convert state machine response to standard format
            reply_text = sm_response['reply']
            
            # Translate to Malayalam if requested (DISABLED)
            # if MALAYALAM_ENABLED and malayalam_translator.needs_translation(context):
            #     reply_text = malayalam_translator.translate(reply_text)
            
            response = {
                'reply': reply_text,
                'action': sm_response.get('action', sm_response['state']),
                'next_step': sm_response['next_state'],
                'booking_data': sm_response['booking_data'],
                'state_machine_active': True
            }
            
            # Add voice settings (DISABLED)
            # if INTELLIGENCE_ENABLED:
            #     analysis = intelligence_engine.analyze_message(message, context)
            #     if analysis and 'voice_metadata' in analysis:
            #         voice_metadata = analysis['voice_metadata']
            #         if MALAYALAM_ENABLED and malayalam_translator.needs_translation(context):
            #             voice_metadata['voice_settings'] = malayalam_translator.get_voice_settings_for_malayalam()
            #         response['voice_settings'] = voice_metadata
            
            # Store AI response in memory
            if MEMORY_ENABLED:
                memory_system.add_message(session_id, 'assistant', response['reply'],
                                        {'state': sm_response['state']})
            
            return response
        
        # FALLBACK: Original flow if state machine not available
        context = context or {}
        
        # STEP 1: Store user message in memory
        if MEMORY_ENABLED and session_id:
            memory_system.add_message(session_id, 'user', message)
            
            # Get conversation depth for recommendations
            conversation_depth = len(memory_system.get_conversation_history(session_id))
        else:
            conversation_depth = 0
        
        # STEP 2: Analyze message with intelligence engine (DISABLED)
        analysis = None
        # if INTELLIGENCE_ENABLED:
        #     analysis = intelligence_engine.analyze_message(message, context)
        
        # Get smart context if available
        smart_context = None
        if self.context_engine and session_id:
            smart_context = self.context_engine.get_context(session_id, message)
            
            # Check if we should suggest manual booking (only after many attempts)
            if self.context_engine.should_suggest_manual_booking(session_id):
                return self._create_intelligent_response(
                    "I notice we've been chatting for a while! 😊\n\n"
                    "Would you like to:\n"
                    "1. **Try the manual booking page** (might be faster)\n"
                    "2. **Call us directly** for personalized assistance\n"
                    "3. **Continue with me** - I'm here to help!\n\n"
                    "What would you prefer?",
                    'suggest_alternatives',
                    context,
                    analysis
                )
        
        # STEP 3: Get clicked recommendation context (if any)
        clicked_recommendation = context.get('clicked_recommendation')
        if clicked_recommendation and MEMORY_ENABLED and session_id:
            memory_system.set_context(session_id, {'last_recommendation': clicked_recommendation})
        
        # STEP 4: Detect intent
        message_lower = message.lower().strip()
        intent = self._detect_intent(message_lower, context, analysis)
        
        # STEP 5: Route to appropriate handler
        response = None
        if intent == 'greeting':
            response = self._handle_greeting(session_id, analysis)
        elif intent == 'booking':
            response = self._handle_booking_request(message_lower, context, smart_context, session_id, analysis)
        elif intent == 'availability_check':
            response = self._handle_availability_check(message_lower, context, smart_context, session_id)
        elif intent == 'pricing':
            response = self._handle_pricing_query(message_lower, context, analysis)
        elif intent == 'confirmation':
            response = self._handle_confirmation(message_lower, context)
        elif intent == 'user_details':
            response = self._handle_user_details(message, context)
        elif intent == 'best_time_query':
            response = self._handle_best_time_query(message_lower, context, analysis)
        elif intent == 'information_query':
            response = self._handle_information_query(message_lower, context)
        elif intent == 'general_query':
            response = self._handle_general_query(message_lower, context)
        else:
            response = self._handle_smart_clarification(message_lower, context)
        
        # Add AI response to conversation history
        if self.context_engine and session_id and response:
            self.context_engine.add_to_history(session_id, 'ai', response.get('reply', ''))
        
        # Add context metadata
        if response and smart_context:
            response['context_aware'] = True
            response['messages_exchanged'] = smart_context.get('messages_exchanged', 0)
        
        return response
    
    def _detect_intent(self, message: str, context: Dict = None, analysis: Dict = None) -> str:
        """Detect user's intent from message - Enhanced for all user queries"""
        greetings = ['hi', 'hello', 'hey', 'start']
        booking_keywords = ['book', 'reserve', 'want to book', 'schedule', 'i need', 'make a booking']
        availability_keywords = ['available', 'availability', 'free', 'open', 'check', 'what time', 'when can', 'any slots']
        pricing_keywords = ['price', 'cost', 'how much', 'charge', 'cheap', 'expensive', 'rate']
        confirmation_keywords = ['yes', 'confirm', 'proceed', 'ok', 'sure', 'correct', 'yeah', 'yep']
        best_time_keywords = ['best time', 'good time', 'recommend time', 'popular time', 'when should', 'optimal']
        info_keywords = ['what is', 'tell me about', 'info', 'information', 'details', 'explain', 'how does', 'what are']
        
        # Handle greetings
        if any(word in message for word in greetings) and len(message.split()) < 5:
            return 'greeting'
        
        # Handle confirmation
        elif any(word in message for word in confirmation_keywords) and len(message.split()) < 3:
            return 'confirmation'
        
        # Handle pricing queries
        elif any(word in message for word in pricing_keywords):
            return 'pricing'
        
        # Handle best time / recommendations
        elif any(phrase in message for phrase in best_time_keywords):
            return 'best_time_query'
        
        # Handle general information requests
        elif any(phrase in message for phrase in info_keywords):
            return 'information_query'
        
        # Handle availability checks (must come before booking to catch "check availability")
        elif any(word in message for word in availability_keywords):
            return 'availability_check'
        
        # Handle booking requests
        elif any(word in message for word in booking_keywords):
            return 'booking'
        
        # If no keyword match, try to understand context
        else:
            # Check if it contains time words (likely booking)
            if any(word in message for word in ['today', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'pm', 'am']):
                return 'booking'
            # Check if it mentions devices
            elif any(word in message for word in ['ps5', 'playstation', 'driv', 'simulator', 'gaming']):
                return 'booking'
            # Check if it contains numbers (likely player count or time)
            elif any(char.isdigit() for char in message):
                return 'booking'
            else:
                return 'general_query'
    
    def _handle_greeting(self, session_id: str = None, analysis: Dict = None) -> Dict:
        """Handle greeting and introduction"""
        return {
            'reply': "Hey! How can I help you? 😊",
            'action': 'greeting',
            'next_step': 'awaiting_request',
            'recommendations': [
                "🎮 Book PS5 gaming",
                "🏎️ Try driving simulator",
                "📅 Check availability"
            ],
            'show_recommendations': True
        }
    
    def _handle_booking_request(self, message: str, context: Dict, smart_context: Dict = None, session_id: str = None, analysis: Dict = None) -> Dict:
        """Extract booking details from message with enhanced recognition and context awareness"""
        # Extract device type
        device = context.get('device')
        if not device:
            if 'ps5' in message or 'playstation' in message or 'gaming' in message or 'game' in message:
                device = 'ps5'
            elif 'driv' in message or 'simulator' in message or 'sim' in message or 'racing' in message or 'race' in message:
                device = 'driving_sim'
        
        # Extract date
        date = self._extract_date(message)
        
        # Extract time
        time = self._extract_time(message)
        
        # Extract duration
        duration = self._extract_duration(message)
        
        # Extract player count
        players = self._extract_player_count(message)
        
        # Handle "for 4 players" queries - extract device preference
        if players and not device:
            # If they mention player count, likely want PS5
            device = 'ps5'
        
        # Update context with all extracted information
        if device:
            context['device'] = device
            # Track in context engine
            if self.context_engine and session_id:
                self.context_engine.update_booking_progress(session_id, 'device', device)
        if date:
            context['date'] = date
            if self.context_engine and session_id:
                self.context_engine.update_booking_progress(session_id, 'date', date)
        if time:
            context['time'] = time
            if self.context_engine and session_id:
                self.context_engine.update_booking_progress(session_id, 'time', time)
        if duration:
            context['duration'] = duration
            if self.context_engine and session_id:
                self.context_engine.update_booking_progress(session_id, 'duration', duration)
        if players:
            context['players'] = players
            if self.context_engine and session_id:
                self.context_engine.update_booking_progress(session_id, 'players', players)
        
        # Determine what to ask next (context-aware)
        return self._build_next_question(context, smart_context, session_id)

    
    def _extract_date(self, message: str) -> Optional[str]:
        """Extract date from message"""
        today = datetime.now().date()
        
        if 'today' in message:
            return today.isoformat()
        elif 'tomorrow' in message:
            return (today + timedelta(days=1)).isoformat()
        elif 'day after' in message:
            return (today + timedelta(days=2)).isoformat()
        
        # Try to find date pattern (YYYY-MM-DD or DD/MM/YYYY)
        date_pattern = r'\d{4}-\d{2}-\d{2}'
        match = re.search(date_pattern, message)
        if match:
            return match.group(0)
        
        return None
    
    def _extract_time(self, message: str) -> Optional[str]:
        """Extract time from message with enhanced pattern recognition"""
        # Check for time-of-day mentions first
        if 'morning' in message or 'morn' in message:
            return '10:00'
        elif 'afternoon' in message or 'lunch' in message or 'noon' in message:
            return '14:00'
        elif 'evening' in message or 'eve' in message:
            return '18:00'
        elif 'night' in message or 'late' in message:
            return '20:00'
        
        # Try to find exact time (e.g., "7 PM", "19:00", "7:30 PM")
        time_patterns = [
            r'(\d{1,2})\s*(?::|\.)\s*(\d{2})\s*(am|pm)?',  # 7:30 PM or 7:30
            r'(\d{1,2})\s*(am|pm)',  # 7 PM
            r'(\d{2}):(\d{2})',  # 19:00
            r'at\s+(\d{1,2})',  # at 7
        ]
        
        for pattern in time_patterns:
            match = re.search(pattern, message.lower())
            if match:
                parsed_time = self._parse_time_match(match)
                if parsed_time:
                    return parsed_time
        
        return None
    
    def _parse_time_match(self, match) -> str:
        """Parse time from regex match"""
        groups = match.groups()
        
        if len(groups) >= 2 and groups[1] in ('am', 'pm'):
            # 12-hour format
            hour = int(groups[0])
            if groups[1] == 'pm' and hour != 12:
                hour += 12
            elif groups[1] == 'am' and hour == 12:
                hour = 0
            return f"{hour:02d}:00"
        elif len(groups) == 2:
            # 24-hour format
            return f"{int(groups[0]):02d}:{groups[1]}"
        
        return None
    
    def _extract_duration(self, message: str) -> Optional[int]:
        """Extract duration from message"""
        # Look for "X hour(s)" or "X hr(s)"
        patterns = [
            r'(\d+)\s*(?:hour|hr)s?',
            r'(\d+)\s*h\b',
            r'(\d+)\s*minutes?',
            r'(\d+)\s*min\b'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                value = int(match.group(1))
                if 'min' in pattern or 'minute' in pattern:
                    return value
                else:
                    return value * 60  # Convert hours to minutes
        
        return None
    
    def _extract_player_count(self, message: str) -> Optional[int]:
        """Extract number of players from message"""
        patterns = [
            r'(\d+)\s*(?:player|person|people)',
            r'group of (\d+)',
            r'(\d+) of us'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                return int(match.group(1))
        
        return None
    
    def _build_next_question(self, context: Dict, smart_context: Dict = None, session_id: str = None) -> Dict:
        """Build next question based on missing information with smart suggestions and context awareness"""
        required_fields = ['device', 'date', 'time', 'duration', 'players']
        
        # Check context engine first - avoid asking questions already answered
        if self.context_engine and session_id:
            # Check if we already have answers from previous messages
            if 'device' not in context and not self.context_engine.has_asked_question(session_id, 'device'):
                stored_device = self.context_engine.get_user_answer(session_id, 'device')
                if stored_device:
                    context['device'] = stored_device
            
            if 'date' not in context:
                stored_date = self.context_engine.get_user_answer(session_id, 'date')
                if stored_date:
                    context['date'] = stored_date
                    
            if 'time' not in context:
                stored_time = self.context_engine.get_user_answer(session_id, 'time')
                if stored_time:
                    context['time'] = stored_time
                    
            if 'duration' not in context:
                stored_duration = self.context_engine.get_user_answer(session_id, 'duration')
                if stored_duration:
                    context['duration'] = stored_duration
                    
            if 'players' not in context:
                stored_players = self.context_engine.get_user_answer(session_id, 'players')
                if stored_players:
                    context['players'] = stored_players
        
        # Get smart recommendations if available
        recommendations = None
        if self.context_engine and session_id:
            recommendations = self.context_engine.get_smart_recommendations(session_id)
        
        # Check what's missing
        if 'device' not in context:
            # Check if already asked
            if self.context_engine and session_id and self.context_engine.has_asked_question(session_id, 'device'):
                # Already asked, but no answer yet - remind gently
                return {
                    'reply': "I still need to know which device you'd like to book. 😊\n\n"
                            "🎮 **PS5** or 🏎️ **Driving Simulator**?",
                    'action': 'ask_device',
                    'context': context,
                    'next_step': 'awaiting_device'
                }

            return {
                'reply': "What would you like to book?\n\n"
                        "🎮 **PS5 Gaming Station** (₹300/hour)\n"
                        "   • 3 stations available\n"
                        "   • Perfect for group gaming\n\n"
                        "🏎️ **Driving Simulator** (₹400/hour)\n"
                        "   • Premium racing experience\n\n"
                        "💡 **Popular choice:** Most users book PS5 for 2 hours!",
                'action': 'ask_device',
                'context': context,
                'next_step': 'awaiting_device'
            }
        
        device_name = context['device'].replace('_', ' ').title()
        
        if 'date' not in context:
            # Add smart recommendation if available
            date_suggestion = ""
            if recommendations and recommendations.get('reasoning'):
                date_suggestion = f"\n\n💡 {recommendations['reasoning']}"
            
            return {
                'reply': f"📅 When would you like to book the **{device_name}**?\n\n"
                        "You can say:\n"
                        "• Today\n"
                        "• Tomorrow\n"
                        "• A specific date (e.g., 'January 5')" + date_suggestion,
                'action': 'ask_date',
                'context': context,
                'next_step': 'awaiting_date'
            }
        
        if 'time' not in context:
            # Provide smart time suggestions based on recommendations
            time_suggestion = ""
            if recommendations and recommendations.get('suggested_time'):
                time_suggestion = f"\n\n💡 **Smart Suggestion:** {recommendations['suggested_time']} {recommendations.get('reasoning', '')}"
            
            return {
                'reply': f"⏰ What time works best for you?\n\n"
                        "**Our Hours:** 9 AM - 12 AM (Midnight)\n\n"
                        "**Popular Times:**\n"
                        "• 🌅 **Morning** (9 AM - 12 PM) - Usually quiet\n"
                        "• 🌞 **Afternoon** (1 PM - 5 PM) - Best availability\n"
                        "• 🌆 **Evening** (6 PM - 12 AM) - Most popular" + time_suggestion,
                'action': 'ask_time',
                'context': context,
                'next_step': 'awaiting_time',
                'data': {'need_availability_check': True}
            }
        
        if 'duration' not in context:
            durations = self.business_rules['slot_durations']
            duration_options = []
            for d in durations:
                if d >= 60:
                    duration_options.append(f"• **{d//60} hour{'s' if d > 60 else ''}**")
                else:
                    duration_options.append(f"• {d} minutes")
            
            # Add recommendations based on device and analytics
            recommendation = ""
            if recommendations and recommendations.get('suggested_duration'):
                recommendation = f"\n\n💡 **Smart Recommendation:** {recommendations['suggested_duration']} {recommendations.get('reasoning', '')}"
            elif context.get('device') == 'ps5':
                recommendation = "\n\n💡 **Popular:** Most users book 2 hours for gaming!"
            else:
                recommendation = "\n\n💡 **Popular:** Most users book 1 hour for racing!"
            
            return {
                'reply': f"⏱️ How long would you like to book?\n\n"
                        "**Available durations:**\n" + "\n".join(duration_options) + recommendation,
                'action': 'ask_duration',
                'context': context,
                'next_step': 'awaiting_duration'
            }
        
        if context['device'] == 'ps5' and 'players' not in context:
            max_players = self.business_rules['max_players_per_ps5']
            return {
                'reply': f"👥 How many players will be joining?\n\n"
                        f"**Capacity:** Up to {max_players} players per PS5 station\n"
                        f"**Total Max:** {self.business_rules['max_total_players']} players across all stations\n\n"
                        "💡 **Note:** Price is per station, not per player!",
                'action': 'ask_players',
                'context': context,
                'next_step': 'awaiting_players'
            }
        
        # All information collected - ready for confirmation
        return {
            'reply': "✨ Perfect! I have all the details. Let me check real-time availability for you...",
            'action': 'ready_for_availability_check',
            'context': context,
            'next_step': 'checking_availability'
        }
    
    def _handle_availability_check(self, message: str, context: Dict, smart_context: Dict = None, session_id: str = None, analysis: Dict = None) -> Dict:
        """Handle availability check request with smart detection and context awareness"""
        # Extract date and time from message
        date = self._extract_date(message) or context.get('date')
        time = self._extract_time(message) or context.get('time')
        
        # Update context with extracted info
        if date:
            context['date'] = date
            if self.context_engine and session_id:
                self.context_engine.update_booking_progress(session_id, 'date', date)
        if time:
            context['time'] = time
            if self.context_engine and session_id:
                self.context_engine.update_booking_progress(session_id, 'time', time)
        
        # If no date specified, assume today
        if not date:
            today = datetime.now().date()
            date = today.isoformat()
            context['date'] = date
        
        # Determine what kind of availability check
        if 'evening' in message and not time:
            time = '18:00'  # Default evening time
            context['time'] = time
            return {
                'reply': f"Let me check evening availability for {date}...",
                'action': 'fetch_availability',
                'context': context,
                'data': {'date': date, 'time': time},
                'next_step': 'showing_availability'
            }
        
        elif 'afternoon' in message and not time:
            time = '14:00'
            context['time'] = time
            return {
                'reply': f"Checking afternoon slots for {date}...",
                'action': 'fetch_availability',
                'context': context,
                'data': {'date': date, 'time': time},
                'next_step': 'showing_availability'
            }
        
        elif 'morning' in message and not time:
            time = '10:00'
            context['time'] = time
            return {
                'reply': f"Let me check morning availability for {date}...",
                'action': 'fetch_availability',
                'context': context,
                'data': {'date': date, 'time': time},
                'next_step': 'showing_availability'
            }
        
        elif time:
            return {
                'reply': f"Checking availability for {date} at {time}...",
                'action': 'fetch_availability',
                'context': context,
                'data': {'date': date, 'time': time},
                'next_step': 'showing_availability'
            }
        
        else:
            # Show all available slots for the date
            return {
                'reply': f"📅 Let me show you all available slots for {date}...",
                'action': 'fetch_availability',
                'context': context,
                'data': {'date': date, 'time': None},
                'next_step': 'showing_availability'
            }
    
    def _handle_pricing_query(self, message: str, context: Dict, analysis: Dict = None) -> Dict:
        """Handle pricing information request with detailed breakdown"""
        # Check if asking about specific device or cheapest option
        if 'cheap' in message or 'least expensive' in message or 'lowest' in message:
            return {
                'reply': "💰 **Most Affordable Options:**\n\n"
                        f"🎮 **PS5 Gaming - Cheapest:**\n"
                        f"   • ₹{self.pricing_rules['ps5_per_hour'] * 0.5:.0f} for 30 minutes\n"
                        f"   • ₹{self.pricing_rules['ps5_per_hour']:.0f} for 1 hour\n"
                        "   • **Best Value:** 2 hours for more playtime!\n\n"
                        "💡 **Money-Saving Tips:**\n"
                        "• Book PS5 instead of Driving Sim (₹100/hour cheaper)\n"
                        "• Longer sessions = better value per hour\n"
                        "• Split cost among friends (up to 4 players per station)\n\n"
                        "**Example:**\n"
                        f"4 friends playing PS5 for 2 hours = ₹{self.pricing_rules['ps5_per_hour'] * 2:.0f} total\n"
                        f"= Only ₹{self.pricing_rules['ps5_per_hour'] * 2 / 4:.0f} per person!\n\n"
                        "Ready to book the cheapest slot?",
                'action': 'show_cheapest_pricing',
                'context': context,
                'next_step': 'awaiting_booking_intent'
            }
        
        elif 'ps5' in message or 'playstation' in message or 'gaming' in message:
            return {
                'reply': "💰 **PS5 Gaming Pricing:**\n\n"
                        f"**Hourly Rate:** ₹{self.pricing_rules['ps5_per_hour']}/hour per station\n\n"
                        "**Duration Options & Pricing:**\n"
                        f"• 30 minutes = ₹{self.pricing_rules['ps5_per_hour'] * 0.5:.0f}\n"
                        f"• 1 hour = ₹{self.pricing_rules['ps5_per_hour']:.0f}\n"
                        f"• 1.5 hours = ₹{self.pricing_rules['ps5_per_hour'] * 1.5:.0f}\n"
                        f"• 2 hours = ₹{self.pricing_rules['ps5_per_hour'] * 2:.0f} ⭐ **Most Popular**\n\n"
                        "**Capacity & Pricing:**\n"
                        f"• Up to {self.business_rules['max_players_per_ps5']} players per station\n"
                        "• Price is per station, NOT per player\n"
                        "• No additional charges\n\n"
                        "**Group Discount:**\n"
                        "Bring 4 friends and split the cost!\n"
                        f"Example: 2 hours = ₹{self.pricing_rules['ps5_per_hour'] * 2 / 4:.0f} per person\n\n"
                        "Want to book a session?",
                'action': 'show_ps5_pricing',
                'context': context,
                'next_step': 'awaiting_booking_intent'
            }
        
        elif 'driv' in message or 'simulator' in message or 'racing' in message:
            return {
                'reply': "💰 **Driving Simulator Pricing:**\n\n"
                        f"**Hourly Rate:** ₹{self.pricing_rules['driving_sim_per_hour']}/hour\n\n"
                        "**Duration Options & Pricing:**\n"
                        f"• 30 minutes = ₹{self.pricing_rules['driving_sim_per_hour'] * 0.5:.0f}\n"
                        f"• 1 hour = ₹{self.pricing_rules['driving_sim_per_hour']:.0f} ⭐ **Recommended**\n"
                        f"• 1.5 hours = ₹{self.pricing_rules['driving_sim_per_hour'] * 1.5:.0f}\n"
                        f"• 2 hours = ₹{self.pricing_rules['driving_sim_per_hour'] * 2:.0f}\n\n"
                        "**What You Get:**\n"
                        "✅ Professional racing setup\n"
                        "✅ Realistic steering & pedals\n"
                        "✅ Multiple racing tracks\n"
                        "✅ Immersive experience\n\n"
                        "**Note:** Solo experience (1 person at a time)\n\n"
                        "Ready to feel the thrill?",
                'action': 'show_driving_pricing',
                'context': context,
                'next_step': 'awaiting_booking_intent'
            }
        
        else:
            # Show complete pricing
            pricing_info = (
                "💰 **GameSpot Complete Pricing Guide:**\n\n"
                f"🎮 **PS5 Gaming:**\n"
                f"   • ₹{self.pricing_rules['ps5_per_hour']}/hour per station\n"
                f"   • Up to {self.business_rules['max_players_per_ps5']} players per station\n"
                "   • Price is per station, not per player\n\n"
                f"🏎️ **Driving Simulator:**\n"
                f"   • ₹{self.pricing_rules['driving_sim_per_hour']}/hour\n"
                "   • Solo racing experience\n\n"
                f"📋 **Available Durations:**\n"
                f"   • 30 minutes, 1 hour, 1.5 hours, 2 hours\n\n"
                "**Quick Price Examples:**\n"
                f"• PS5 for 2 hours = ₹{self.pricing_rules['ps5_per_hour'] * 2:.0f}\n"
                f"• Driving Sim for 1 hour = ₹{self.pricing_rules['driving_sim_per_hour']:.0f}\n\n"
                "💡 **Pro Tip:**\n"
                "Book PS5 with friends and split the cost!\n"
                f"4 players × 2 hours = only ₹{self.pricing_rules['ps5_per_hour'] * 2 / 4:.0f}/person\n\n"
                "Would you like to make a booking?"
            )
            
            return {
                'reply': pricing_info,
                'action': 'show_complete_pricing',
                'context': context,
                'next_step': 'awaiting_booking_intent'
            }
    
    def _handle_confirmation(self, message: str, context: Dict) -> Dict:
        """Handle user confirmation"""
        if context.get('next_step') == 'awaiting_final_confirmation':
            return {
                'reply': "Perfect! Please provide your details:\n\n"
                        "👤 Name:\n"
                        "📱 Phone number:",
                'action': 'request_user_details',
                'context': context,
                'next_step': 'awaiting_user_details'
            }
        
        return self._handle_clarification(context)
    
    def _handle_user_details(self, message: str, context: Dict) -> Dict:
        """Extract and validate user details"""
        # Extract name (words that start with capital letters)
        name_pattern = r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*'
        name_match = re.search(name_pattern, message)
        
        # Extract phone number (10 digits)
        phone_pattern = r'\d{10}'
        phone_match = re.search(phone_pattern, message)
        
        if name_match and phone_match:
            context['customer_name'] = name_match.group(0)
            context['customer_phone'] = phone_match.group(0)
            
            return {
                'reply': "Got it! Creating your booking...",
                'action': 'create_booking',
                'context': context,
                'next_step': 'creating_booking'
            }
        elif not name_match:
            return {
                'reply': "I couldn't find a valid name. Please provide your full name:",
                'action': 'ask_name',
                'context': context,
                'next_step': 'awaiting_name'
            }
        elif not phone_match:
            return {
                'reply': "I couldn't find a valid phone number. Please provide a 10-digit phone number:",
                'action': 'ask_phone',
                'context': context,
                'next_step': 'awaiting_phone'
            }
    
    def _handle_clarification(self, context: Dict) -> Dict:
        """Ask for clarification when intent is unclear"""
        return {
            'reply': "I'm not sure I understood that. Could you rephrase?\n\n"
                    "You can say things like:\n"
                    "• 'Book PS5 for 2 hours today'\n"
                    "• 'Check availability for tomorrow evening'\n"
                    "• 'How much does it cost?'",
            'action': 'request_clarification',
            'context': context,
            'next_step': 'awaiting_clarification'
        }
    
    def _handle_best_time_query(self, message: str, context: Dict, analysis: Dict = None) -> Dict:
        """Handle queries about best time to book"""
        # Extract device if mentioned
        device = None
        if 'ps5' in message or 'playstation' in message or 'gaming' in message:
            device = 'PS5'
            context['device'] = 'ps5'
        elif 'driv' in message or 'simulator' in message:
            device = 'Driving Simulator'
            context['device'] = 'driving_sim'
        
        device_name = device if device else "any device"
        
        return {
            'reply': f"⏰ **Best Times to Book {device_name}:**\n\n"
                    "🌅 **Morning (9 AM - 12 PM)**\n"
                    "   • ✅ Usually least crowded\n"
                    "   • ✅ Best availability\n"
                    "   • ✅ Perfect for focused gaming\n\n"
                    "🌞 **Afternoon (1 PM - 5 PM)**\n"
                    "   • ✅ Great availability\n"
                    "   • ⚠️ Moderate crowd\n"
                    "   • ✅ Good balance\n\n"
                    "🌆 **Evening (6 PM - 12 AM)**\n"
                    "   • ⚠️ Most popular (books fast!)\n"
                    "   • ⚠️ Can be crowded\n"
                    "   • ✅ Great social atmosphere\n\n"
                    "💡 **Pro Tips:**\n"
                    "• **Weekdays** are less crowded than weekends\n"
                    "• **2-hour sessions** give the best experience\n"
                    "• **Book early** to secure your preferred slot\n\n"
                    "Would you like me to check today's availability?",
            'action': 'best_time_recommendation',
            'context': context,
            'next_step': 'awaiting_booking_decision'
        }
    
    def _handle_information_query(self, message: str, context: Dict) -> Dict:
        """Handle general information queries about the service"""
        # Detect what info they're asking about
        if 'ps5' in message or 'playstation' in message or 'gaming' in message:
            return {
                'reply': "🎮 **PS5 Gaming Stations - Complete Info:**\n\n"
                        "**What We Have:**\n"
                        "• 3 Premium PS5 stations\n"
                        "• Latest games library\n"
                        "• High-quality controllers\n"
                        "• Comfortable gaming chairs\n\n"
                        "**Capacity:**\n"
                        f"• Up to {self.business_rules['max_players_per_ps5']} players per station\n"
                        f"• Maximum {self.business_rules['max_total_players']} players total\n\n"
                        "**Pricing:**\n"
                        f"• ₹{self.pricing_rules['ps5_per_hour']}/hour per station\n"
                        "• Price is per station, NOT per player\n"
                        "• No hidden charges\n\n"
                        "**Available Durations:**\n"
                        "• 30 minutes, 1 hour, 1.5 hours, 2 hours\n\n"
                        "💡 **Recommended:** 2 hours for the best gaming experience!\n\n"
                        "Ready to book?",
                'action': 'show_ps5_info',
                'context': context,
                'next_step': 'awaiting_booking_intent'
            }
        
        elif 'driv' in message or 'simulator' in message or 'racing' in message:
            return {
                'reply': "🏎️ **Driving Simulator - Complete Info:**\n\n"
                        "**What We Have:**\n"
                        "• Professional racing simulator\n"
                        "• Realistic steering wheel & pedals\n"
                        "• Multiple racing tracks\n"
                        "• Immersive experience\n\n"
                        "**Capacity:**\n"
                        "• 1 person at a time\n"
                        "• Premium solo experience\n\n"
                        "**Pricing:**\n"
                        f"• ₹{self.pricing_rules['driving_sim_per_hour']}/hour\n"
                        "• Professional-grade equipment\n\n"
                        "**Available Durations:**\n"
                        "• 30 minutes, 1 hour, 1.5 hours, 2 hours\n\n"
                        "💡 **Recommended:** 1 hour for a perfect racing session!\n\n"
                        "Want to reserve a slot?",
                'action': 'show_driving_info',
                'context': context,
                'next_step': 'awaiting_booking_intent'
            }
        
        else:
            # General info about GameSpot
            return {
                'reply': "🎮 **Welcome to GameSpot!**\n\n"
                        "**What We Offer:**\n\n"
                        "🎮 **PS5 Gaming:**\n"
                        f"   • 3 premium stations (₹{self.pricing_rules['ps5_per_hour']}/hour)\n"
                        f"   • Up to {self.business_rules['max_total_players']} players\n"
                        "   • Latest games\n\n"
                        "🏎️ **Driving Simulator:**\n"
                        f"   • Professional setup (₹{self.pricing_rules['driving_sim_per_hour']}/hour)\n"
                        "   • Realistic racing experience\n\n"
                        "**Operating Hours:**\n"
                        f"   • {self.business_rules['operating_hours']['start']} - "
                        f"{self.business_rules['operating_hours']['end']} daily\n\n"
                        "**Available Durations:**\n"
                        "   • 30 min, 1 hour, 1.5 hours, 2 hours\n\n"
                        "**Why Choose Us:**\n"
                        "✅ Premium equipment\n"
                        "✅ Comfortable environment\n"
                        "✅ Easy booking process\n"
                        "✅ Real-time availability\n"
                        "✅ Flexible time slots\n\n"
                        "What would you like to book?",
                'action': 'show_general_info',
                'context': context,
                'next_step': 'awaiting_booking_intent'
            }
    
    def _handle_general_query(self, message: str, context: Dict) -> Dict:
        """Handle general queries with intelligent responses"""
        # Try to extract any useful information
        device = None
        date = self._extract_date(message)
        time = self._extract_time(message)
        
        if 'ps5' in message or 'playstation' in message or 'gaming' in message:
            device = 'ps5'
            context['device'] = 'ps5'
        elif 'driv' in message or 'simulator' in message:
            device = 'driving_sim'
            context['device'] = 'driving_sim'
        
        # If we found some info, guide them
        if device or date or time:
            if device:
                device_name = "PS5" if device == 'ps5' else "Driving Simulator"
                return {
                    'reply': f"Great! I see you're interested in the **{device_name}**.\n\n"
                            "To help you book, I need:\n"
                            "📅 What date?\n"
                            "⏰ What time?\n"
                            "⏱️ How long (duration)?\n\n"
                            "You can tell me everything at once, like:\n"
                            "• 'Tomorrow at 7 PM for 2 hours'\n"
                            "• 'Today evening for 1 hour'\n\n"
                            "Or I can guide you step by step! What works for you?",
                    'action': 'guide_booking',
                    'context': context,
                    'next_step': 'collecting_details'
                }
        
        # If no useful info, provide helpful guidance
        return {
            'reply': "I'm here to help you book gaming sessions! 🎮\n\n"
                    "**I can help you with:**\n"
                    "✅ Booking PS5 or Driving Simulator\n"
                    "✅ Checking real-time availability\n"
                    "✅ Finding the best time slots\n"
                    "✅ Getting pricing information\n\n"
                    "**Quick Examples:**\n"
                    "💬 'Book PS5 for 2 hours today evening'\n"
                    "💬 'Check availability tomorrow afternoon'\n"
                    "💬 'What's the cheapest option?'\n"
                    "💬 'Show me today's available slots'\n\n"
                    "What would you like to do?",
            'action': 'provide_guidance',
            'context': context,
            'next_step': 'awaiting_intent'
        }
    
    def _handle_smart_clarification(self, message: str, context: Dict) -> Dict:
        """Smart clarification that tries to understand and guide"""
        # Try one more time to extract any information
        device = None
        if 'ps5' in message or 'playstation' in message or 'gaming' in message:
            device = 'ps5'
        elif 'driv' in message or 'simulator' in message:
            device = 'driving_sim'
        
        if device:
            context['device'] = device
            return self._build_next_question(context)
        
        # If still unclear, provide comprehensive help
        return {
            'reply': "I want to make sure I understand you correctly! 🤔\n\n"
                    "**I can help you:**\n\n"
                    "🎮 **Book Gaming Sessions:**\n"
                    "   • 'Book PS5 today at 7 PM'\n"
                    "   • 'Reserve driving sim for tomorrow'\n\n"
                    "📅 **Check Availability:**\n"
                    "   • 'Show available slots today'\n"
                    "   • 'Is evening free?'\n\n"
                    "💰 **Get Pricing Info:**\n"
                    "   • 'How much does PS5 cost?'\n"
                    "   • 'Cheapest option'\n\n"
                    "💡 **Get Recommendations:**\n"
                    "   • 'Best time to book'\n"
                    "   • 'What do you recommend?'\n\n"
                    "Just tell me what you need, and I'll take care of it! 😊",
            'action': 'smart_guidance',
            'context': context,
            'next_step': 'awaiting_clear_intent'
        }
    
    
    def format_booking_summary(self, context: Dict, price: float = None) -> str:
        """Format booking summary for confirmation"""
        device_name = "PS5 Gaming Station" if context['device'] == 'ps5' else "Driving Simulator"
        duration_str = f"{context['duration']//60} hour{'s' if context['duration'] > 60 else ''}" \
                      if context['duration'] >= 60 else f"{context['duration']} minutes"
        
        summary = (
            f"📋 **Booking Summary:**\n\n"
            f"🎮 Device: {device_name}\n"
            f"📅 Date: {context['date']}\n"
            f"⏰ Time: {context['time']}\n"
            f"⏱️ Duration: {duration_str}\n"
        )
        
        if context['device'] == 'ps5' and context.get('players'):
            summary += f"👥 Players: {context['players']}\n"
        
        if price:
            summary += f"💰 Total: ₹{price:.0f}\n"
        
        summary += "\nIs this correct? (Yes/No)"
        
        return summary
    
    def _create_intelligent_response(self, base_reply: str, action: str, context: Dict, 
                                    analysis: Dict = None, **kwargs) -> Dict:
        """Create response with intelligence and voice support"""
        # Enhance reply with human-like elements (DISABLED)
        # if INTELLIGENCE_ENABLED and analysis:
        #     reply = intelligence_engine.generate_human_response(base_reply, analysis, context)
        # else:
        reply = base_reply
        
        # Create voice metadata (DISABLED)
        voice_data = None
        # if INTELLIGENCE_ENABLED:
        #     voice_data = intelligence_engine.create_voice_metadata(reply)
        #     speech_data = intelligence_engine.add_conversational_markers(reply)
        #     voice_data['speech_data'] = speech_data
        
        response = {
            'reply': reply,
            'action': action,
            'context': context,
            'voice_data': voice_data,
            'enable_voice': True,
            **kwargs
        }
        
        # Add analysis data if available
        if analysis:
            response['analysis'] = {
                'emotion': analysis.get('emotion'),
                'intent': analysis.get('intent'),
                'sentiment': analysis.get('sentiment'),
                'urgency': analysis.get('urgency')
            }
        
        return response
    
    def _determine_action_from_progress(self, booking_progress: Dict) -> str:
        """Determine next action based on booking progress"""
        required_fields = ['device', 'date', 'time', 'duration', 'players', 'phone']
        filled_fields = [field for field in required_fields if booking_progress.get(field)]
        
        if len(filled_fields) == 0:
            return 'initial_inquiry'
        elif len(filled_fields) < 3:
            return 'collecting_details'
        elif len(filled_fields) < len(required_fields):
            return 'almost_complete'
        else:
            return 'ready_to_book'
    
    def _extract_booking_info_simple(self, message: str, current_progress: Dict) -> Dict:
        """
        Enhanced pattern-based extraction of booking info
        Extracts: device, players, date, time, duration, customer name, phone
        """
        message_lower = message.lower()
        extracted = {}
        
        # Extract device type
        if not current_progress.get('device'):
            if any(word in message_lower for word in ['ps5', 'playstation', 'play station', 'gaming console', 'console']):
                extracted['device'] = 'ps5'
            elif any(word in message_lower for word in ['driving', 'simulator', 'racing', 'drive', 'sim']):
                extracted['device'] = 'driving_sim'
        
        # Extract number of players
        if not current_progress.get('players'):
            # Look for patterns like "4 players", "for 3", "3 people", "party of 5"
            player_patterns = [
                r'(\d+)\s*(?:players?|people|persons?|ppl)',
                r'(?:for|party of)\s*(\d+)',
                r'(\d+)\s*(?:of us|friends?)'
            ]
            for pattern in player_patterns:
                match = re.search(pattern, message_lower)
                if match:
                    players = int(match.group(1))
                    if 1 <= players <= 10:  # Validate range
                        extracted['players'] = players
                        break
        
        # Extract date
        if not current_progress.get('date'):
            # Handle relative dates
            if 'today' in message_lower:
                extracted['date'] = datetime.now().strftime('%Y-%m-%d')
            elif 'tomorrow' in message_lower:
                extracted['date'] = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            else:
                # Look for specific dates (YYYY-MM-DD, DD/MM/YYYY, etc.)
                date_patterns = [
                    r'(\d{4}-\d{2}-\d{2})',  # 2026-01-05
                    r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',  # 05/01/2026 or 5-1-2026
                    r'(\d{1,2})[/-](\d{1,2})',  # 05/01 (assume current year)
                ]
                for pattern in date_patterns:
                    match = re.search(pattern, message)
                    if match:
                        try:
                            if pattern == date_patterns[0]:  # YYYY-MM-DD
                                extracted['date'] = match.group(1)
                            elif pattern == date_patterns[1]:  # DD/MM/YYYY
                                day, month, year = match.groups()
                                extracted['date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                            elif pattern == date_patterns[2]:  # DD/MM (current year)
                                day, month = match.groups()
                                year = datetime.now().year
                                extracted['date'] = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                        except:
                            pass
                        break
        
        # Extract time
        if not current_progress.get('time'):
            # Handle various time formats
            time_patterns = [
                r'(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)',  # 6 PM, 6:30 PM
                r'(\d{1,2}):(\d{2})',  # 18:00, 14:30
                r'at\s*(\d{1,2})',  # at 6
            ]
            
            for pattern in time_patterns:
                match = re.search(pattern, message_lower)
                if match:
                    try:
                        if 'am' in match.group(0) or 'pm' in match.group(0):
                            # 12-hour format
                            hour = int(match.group(1))
                            minute = int(match.group(2)) if match.group(2) else 0
                            is_pm = 'pm' in match.group(0)
                            
                            if is_pm and hour != 12:
                                hour += 12
                            elif not is_pm and hour == 12:
                                hour = 0
                            
                            extracted['time'] = f"{hour:02d}:{minute:02d}"
                        else:
                            # 24-hour format
                            hour = int(match.group(1))
                            minute = int(match.group(2)) if len(match.groups()) > 1 and match.group(2) else 0
                            
                            # If hour is reasonable (9-22), use it
                            if 9 <= hour <= 22:
                                extracted['time'] = f"{hour:02d}:{minute:02d}"
                    except:
                        pass
                    break
            
            # Handle relative times
            if not extracted.get('time'):
                if any(word in message_lower for word in ['morning', 'am']):
                    extracted['time'] = '10:00'  # Default morning
                elif any(word in message_lower for word in ['afternoon', 'lunch']):
                    extracted['time'] = '14:00'  # Default afternoon
                elif any(word in message_lower for word in ['evening', 'night']):
                    extracted['time'] = '18:00'  # Default evening
        
        # Extract duration
        if not current_progress.get('duration'):
            duration_patterns = [
                (r'(\d+)\s*hours?', 60),  # "2 hours" -> 120 min
                (r'(\d+)\s*h', 60),  # "2h" -> 120 min
                (r'(\d+)\s*minutes?', 1),  # "90 minutes" -> 90 min
                (r'(\d+)\s*min', 1),  # "90 min" -> 90 min
                (r'half\s*hour', None),  # "half hour" -> 30 min
                (r'one\s*hour', None),  # "one hour" -> 60 min
            ]
            
            for pattern, multiplier in duration_patterns:
                match = re.search(pattern, message_lower)
                if match:
                    if multiplier is None:
                        # Handle special cases
                        if 'half' in pattern:
                            extracted['duration'] = 30
                        elif 'one' in pattern:
                            extracted['duration'] = 60
                    else:
                        duration = int(match.group(1)) * multiplier
                        # Validate duration (30, 60, 90, 120)
                        if duration in [30, 60, 90, 120]:
                            extracted['duration'] = duration
                        elif duration > 0:
                            # Round to nearest valid duration
                            valid_durations = [30, 60, 90, 120]
                            extracted['duration'] = min(valid_durations, key=lambda x: abs(x - duration))
                    break
        
        # Extract customer name
        if not current_progress.get('customer_name'):
            # Look for name patterns like "I'm John", "my name is Sarah", "name: Alex"
            name_patterns = [
                r"(?:i'm|i am|my name is|name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
                r"(?:name:|Name:)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, message)
                if match:
                    name = match.group(1).strip()
                    if len(name) >= 2:  # Minimum 2 characters
                        extracted['customer_name'] = name
                        break
        
        # Extract phone number
        if not current_progress.get('customer_phone'):
            # Look for 10-digit phone numbers
            phone_patterns = [
                r'\b(\d{10})\b',  # 1234567890
                r'\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b',  # 123-456-7890 or 123.456.7890
                r'\+91\s*(\d{10})',  # +91 1234567890
            ]
            
            for pattern in phone_patterns:
                match = re.search(pattern, message)
                if match:
                    phone = match.group(1).replace('-', '').replace('.', '').replace(' ', '')
                    if len(phone) >= 10:  # Valid phone number
                        extracted['customer_phone'] = phone[-10:]  # Last 10 digits
                        break
        
        return extracted

