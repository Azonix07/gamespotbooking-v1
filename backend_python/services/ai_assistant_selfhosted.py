"""
AI Booking Assistant Service - SELF-HOSTED EDITION
Handles conversation understanding and booking assistance
🚀 POWERED BY: Mistral-7B-Instruct (Self-hosted, Unlimited, Free)
🎤 VOICE: Whisper STT + Coqui TTS (Open-source, No quotas)
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

# Import Self-Hosted LLM service (UNLIMITED!)
try:
    from services.selfhosted_llm_service import get_llm_service
    SELFHOSTED_LLM_ENABLED = True
    selfhosted_llm = get_llm_service()
    print("✅ Self-Hosted LLM initialized (UNLIMITED)")
except Exception as e:
    SELFHOSTED_LLM_ENABLED = False
    selfhosted_llm = None
    print(f"⚠️  Self-Hosted LLM not available: {e}")

# Import Self-Hosted Voice service
try:
    from services.selfhosted_voice_service import get_voice_service, get_fallback_voice_service
    SELFHOSTED_VOICE_ENABLED = True
    selfhosted_voice = get_voice_service()
    fallback_voice = get_fallback_voice_service()
    print("✅ Self-Hosted Voice initialized (UNLIMITED)")
except Exception as e:
    SELFHOSTED_VOICE_ENABLED = False
    selfhosted_voice = None
    fallback_voice = None
    print(f"⚠️  Self-Hosted Voice not available: {e}")

# Import context engine and other modules
try:
    from services.ai_context_engine import AIContextEngine
    from services.ai_intelligence_engine import intelligence_engine
    from services.ai_memory_system import memory_system
    from services.ps5_booking_state_machine import PS5BookingStateMachine
    from services.malayalam_translator import malayalam_translator
    CONTEXT_ENABLED = True
    INTELLIGENCE_ENABLED = True
    MEMORY_ENABLED = True
    STATE_MACHINE_ENABLED = True
    MALAYALAM_ENABLED = True
except ImportError as e:
    CONTEXT_ENABLED = False
    INTELLIGENCE_ENABLED = False
    MEMORY_ENABLED = False
    STATE_MACHINE_ENABLED = False
    MALAYALAM_ENABLED = False
    print(f"Warning: Some AI modules not available: {e}")


class SelfHostedAIAssistant:
    """
    Self-hosted AI-powered booking assistant
    - NO quotas, NO limits, NO API costs
    - Preserves all booking intelligence
    - Same conversation quality as Gemini
    - Runs locally or on your server
    """
    
    def __init__(self, context_engine=None):
        self.business_rules = {
            'ps5_stations': 3,
            'max_players_per_ps5': 4,
            'max_total_players': 10,
            'driving_sim_count': 1,
            'slot_durations': [30, 60, 90, 120],
            'operating_hours': {'start': '09:00', 'end': '22:00'}
        }
        
        self.pricing_rules = {
            'ps5_per_hour': 300,
            'driving_sim_per_hour': 400
        }
        
        # Context engine for smart conversation
        if CONTEXT_ENABLED:
            self.context_engine = context_engine or AIContextEngine()
        else:
            self.context_engine = None
        
        # State machine instances per session (fallback)
        self.session_state_machines = {}
    
    def process_message(self, message: str, context: Dict = None, session_id: str = None) -> Dict:
        """
        Process user message with self-hosted AI
        
        Args:
            message: User's message
            context: Conversation context
            session_id: Session ID for memory
        
        Returns:
            Dict with reply, action, booking_data, voice_audio
        """
        context = context or {}
        
        # ============================================
        # 🚀 SELF-HOSTED LLM MODE (PRIMARY)
        # ============================================
        if SELFHOSTED_LLM_ENABLED and selfhosted_llm and session_id:
            print(f"🤖 Using Self-Hosted LLM for session: {session_id}")
            
            # Step 1: Store user message in memory
            if MEMORY_ENABLED:
                memory_system.add_message(session_id, 'user', message)
            
            # Step 2: Get current booking progress
            booking_progress = {}
            if self.context_engine:
                ctx = self.context_engine.get_context(session_id, message)
                booking_progress = ctx.get('booking_data', {})
            else:
                booking_progress = context.get('booking_progress', {})
            
            # Step 3: Generate AI response with Self-Hosted LLM
            ai_reply = selfhosted_llm.generate_response(
                user_message=message,
                session_id=session_id,
                booking_context={'booking_progress': booking_progress}
            )
            
            if ai_reply:
                # Step 4: Extract booking info from message
                extracted_info = self._extract_booking_info_simple(message, booking_progress)
                
                # Step 5: Update booking progress
                if self.context_engine and extracted_info:
                    for key, value in extracted_info.items():
                        if value:
                            self.context_engine.update_booking_progress(session_id, key, value)
                            booking_progress[key] = value
                
                # Step 6: Store AI response in memory
                if MEMORY_ENABLED:
                    memory_system.add_message(session_id, 'assistant', ai_reply, {
                        'selfhosted_powered': True,
                        'extracted_info': extracted_info
                    })
                
                # Step 7: Determine next action
                action = self._determine_action_from_progress(booking_progress)
                
                # Step 8: Generate voice (if requested)
                voice_audio = None
                if context.get('voice_enabled', False):
                    voice_audio = self._generate_voice(ai_reply, context.get('language', 'en'))
                
                # Return self-hosted response
                return {
                    'reply': ai_reply,
                    'action': action,
                    'booking_data': booking_progress,
                    'selfhosted_powered': True,
                    'voice_audio': voice_audio,
                    'extracted_info': extracted_info,
                    'quotas': 'UNLIMITED',
                    'cost': 'FREE'
                }
        
        # ============================================
        # 📋 FALLBACK: State Machine
        # ============================================
        if STATE_MACHINE_ENABLED and session_id:
            # Get or create state machine for this session
            if session_id not in self.session_state_machines:
                self.session_state_machines[session_id] = PS5BookingStateMachine()
            
            state_machine = self.session_state_machines[session_id]
            
            # Process message through state machine
            sm_response = state_machine.process_message(message, context)
            
            # Translate if needed
            reply_text = sm_response['reply']
            if MALAYALAM_ENABLED and malayalam_translator.needs_translation(context):
                reply_text = malayalam_translator.translate(reply_text)
            
            # Generate voice if requested
            voice_audio = None
            if context.get('voice_enabled', False):
                voice_audio = self._generate_voice(reply_text, context.get('language', 'en'))
            
            return {
                'reply': reply_text,
                'action': sm_response.get('action', sm_response['state']),
                'next_step': sm_response['next_state'],
                'booking_data': sm_response['booking_data'],
                'state_machine_active': True,
                'voice_audio': voice_audio,
                'quotas': 'UNLIMITED',
                'cost': 'FREE'
            }
        
        # Basic fallback
        return {
            'reply': "Could you tell me what you'd like to book?",
            'action': 'initial_inquiry',
            'booking_data': {},
            'quotas': 'UNLIMITED',
            'cost': 'FREE'
        }
    
    def _generate_voice(self, text: str, language: str = "en") -> Optional[Dict]:
        """Generate voice audio from text"""
        if not SELFHOSTED_VOICE_ENABLED:
            return None
        
        try:
            # Try Coqui TTS first
            if selfhosted_voice and selfhosted_voice.tts_available:
                return selfhosted_voice.text_to_speech(text, language)
            
            # Fallback to gTTS
            if fallback_voice:
                return fallback_voice.text_to_speech(text, language)
        
        except Exception as e:
            print(f"Voice generation error: {e}")
        
        return None
    
    def _extract_booking_info_simple(self, message: str, current_progress: Dict) -> Dict:
        """Extract booking information from message (simple pattern matching)"""
        extracted = {}
        message_lower = message.lower()
        
        # Extract game type
        if 'ps5' in message_lower or 'playstation' in message_lower:
            extracted['game'] = 'ps5'
        elif 'driving' in message_lower or 'simulator' in message_lower:
            extracted['game'] = 'driving'
        
        # Extract player count
        player_match = re.search(r'(\d+)\s*(people|players?|persons?)', message_lower)
        if player_match:
            extracted['player_count'] = int(player_match.group(1))
        
        # Extract duration
        if '30 min' in message_lower or 'half hour' in message_lower:
            extracted['duration'] = 30
        elif '1 hour' in message_lower or 'one hour' in message_lower:
            extracted['duration'] = 60
        elif '1.5 hour' in message_lower or '90 min' in message_lower:
            extracted['duration'] = 90
        elif '2 hour' in message_lower or 'two hour' in message_lower:
            extracted['duration'] = 120
        
        # Extract date keywords
        if 'today' in message_lower:
            extracted['date'] = datetime.now().strftime('%Y-%m-%d')
        elif 'tomorrow' in message_lower:
            extracted['date'] = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Extract time
        time_match = re.search(r'(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)?', message_lower)
        if time_match:
            hour = int(time_match.group(1))
            minute = time_match.group(2) or '00'
            period = time_match.group(3)
            
            if period == 'pm' and hour < 12:
                hour += 12
            elif period == 'am' and hour == 12:
                hour = 0
            
            extracted['time'] = f"{hour:02d}:{minute}"
        
        # Extract phone
        phone_match = re.search(r'\b\d{10}\b', message)
        if phone_match:
            extracted['phone'] = phone_match.group(0)
        
        return extracted
    
    def _determine_action_from_progress(self, booking_progress: Dict) -> str:
        """Determine next action based on booking completion"""
        required_fields = ['device', 'date', 'time', 'duration', 'players', 'phone']
        filled = [f for f in required_fields if booking_progress.get(f)]
        
        if len(filled) == 0:
            return 'initial_inquiry'
        elif len(filled) < 3:
            return 'collecting_details'
        elif len(filled) < len(required_fields):
            return 'almost_complete'
        else:
            return 'ready_to_book'
    
    def clear_session(self, session_id: str):
        """Clear session data"""
        if SELFHOSTED_LLM_ENABLED and selfhosted_llm:
            selfhosted_llm.clear_session(session_id)
        
        if session_id in self.session_state_machines:
            del self.session_state_machines[session_id]
        
        if MEMORY_ENABLED:
            memory_system.clear_session(session_id)


# Global instance
ai_assistant = SelfHostedAIAssistant()

# Export for backwards compatibility
AIBookingAssistant = SelfHostedAIAssistant
