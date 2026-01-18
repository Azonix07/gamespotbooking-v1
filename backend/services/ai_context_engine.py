"""
AI Context Engine
Provides smart context management for the booking assistant
Tracks conversation history, user preferences, and session state
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

class AIContextEngine:
    """
    Smart context layer that provides real-time website knowledge
    and conversation memory to the AI assistant
    """
    
    def __init__(self):
        # Conversation history per session
        self.conversation_history = {}
        
        # User preferences (session-level)
        self.user_preferences = {}
        
        # Booking progress tracking
        self.booking_progress = {}
        
        # Analytics for learning
        self.analytics = {
            'successful_bookings': [],
            'failed_attempts': [],
            'user_corrections': [],
            'popular_times': {},
            'popular_devices': {},
            'average_duration': {}
        }
    
    def get_context(self, session_id: str, message: str = None) -> Dict:
        """
        Get comprehensive context for AI decision making
        
        Returns:
            Dict with current_time, conversation_history, user_preferences,
            booking_progress, and suggested_actions
        """
        context = {
            # Temporal context
            'current_date': datetime.now().date().isoformat(),
            'current_time': datetime.now().strftime('%H:%M'),
            'current_day_of_week': datetime.now().strftime('%A'),
            
            # Conversation context
            'conversation_history': self.get_conversation_history(session_id),
            'messages_exchanged': len(self.conversation_history.get(session_id, [])),
            
            # User context
            'user_preferences': self.user_preferences.get(session_id, {}),
            
            # Booking progress
            'booking_progress': self.booking_progress.get(session_id, {}),
            'collected_info': self._get_collected_info(session_id),
            'missing_info': self._get_missing_info(session_id),
            
            # Smart recommendations based on analytics
            'recommended_actions': self._get_smart_recommendations(session_id),
        }
        
        # Add new message to history
        if message:
            self.add_to_history(session_id, 'user', message)
        
        return context
    
    def get_conversation_history(self, session_id: str, limit: int = 10) -> List[Dict]:
        """Get recent conversation history"""
        history = self.conversation_history.get(session_id, [])
        return history[-limit:]  # Return last N messages
    
    def add_to_history(self, session_id: str, role: str, message: str):
        """Add message to conversation history"""
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        
        self.conversation_history[session_id].append({
            'role': role,  # 'user' or 'ai'
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
    
    def update_booking_progress(self, session_id: str, field: str, value: any):
        """Update booking progress for a session"""
        if session_id not in self.booking_progress:
            self.booking_progress[session_id] = {}
        
        self.booking_progress[session_id][field] = value
        self.booking_progress[session_id]['last_updated'] = datetime.now().isoformat()
    
    def get_booking_progress(self, session_id: str) -> Dict:
        """Get current booking progress"""
        return self.booking_progress.get(session_id, {})
    
    def set_user_preference(self, session_id: str, key: str, value: any):
        """Store user preference for future recommendations"""
        if session_id not in self.user_preferences:
            self.user_preferences[session_id] = {}
        
        self.user_preferences[session_id][key] = value
    
    def has_asked_question(self, session_id: str, question_type: str) -> bool:
        """Check if AI already asked this question"""
        history = self.get_conversation_history(session_id)
        
        # Map question types to keywords
        question_keywords = {
            'device': ['what would you like to book', 'ps5 or driving'],
            'date': ['when would you like', 'which date'],
            'time': ['what time', 'when would you like'],
            'duration': ['how long', 'duration'],
            'players': ['how many players', 'player count']
        }
        
        keywords = question_keywords.get(question_type, [])
        
        for msg in history:
            if msg['role'] == 'ai':
                if any(keyword in msg['message'].lower() for keyword in keywords):
                    return True
        
        return False
    
    def get_user_answer(self, session_id: str, question_type: str) -> Optional[str]:
        """Get user's previous answer to a specific question"""
        progress = self.get_booking_progress(session_id)
        
        field_mapping = {
            'device': 'device',
            'date': 'date',
            'time': 'time',
            'duration': 'duration',
            'players': 'players'
        }
        
        field = field_mapping.get(question_type)
        return progress.get(field) if field else None
    
    def _get_collected_info(self, session_id: str) -> List[str]:
        """Get list of collected booking information"""
        progress = self.booking_progress.get(session_id, {})
        required_fields = ['device', 'date', 'time', 'duration']
        
        collected = []
        for field in required_fields:
            if field in progress and progress[field]:
                collected.append(field)
        
        return collected
    
    def _get_missing_info(self, session_id: str) -> List[str]:
        """Get list of missing booking information"""
        progress = self.booking_progress.get(session_id, {})
        required_fields = ['device', 'date', 'time', 'duration']
        
        # For PS5, also need player count
        if progress.get('device') == 'ps5':
            required_fields.append('players')
        
        missing = []
        for field in required_fields:
            if field not in progress or not progress[field]:
                missing.append(field)
        
        return missing
    
    def _get_smart_recommendations(self, session_id: str) -> Dict:
        """Generate smart recommendations based on analytics and context"""
        recommendations = {
            'suggested_device': None,
            'suggested_time': None,
            'suggested_duration': None,
            'reasoning': []
        }
        
        # Analyze popular choices
        if self.analytics['popular_devices']:
            most_popular = max(self.analytics['popular_devices'].items(), 
                             key=lambda x: x[1])
            recommendations['suggested_device'] = most_popular[0]
            recommendations['reasoning'].append(
                f"{most_popular[0]} is our most popular choice"
            )
        
        # Suggest less crowded times
        current_hour = datetime.now().hour
        if current_hour < 12:
            recommendations['suggested_time'] = 'afternoon'
            recommendations['reasoning'].append("Afternoon slots have best availability")
        elif current_hour < 17:
            recommendations['suggested_time'] = 'evening'
            recommendations['reasoning'].append("Evening slots are popular but book fast")
        else:
            recommendations['suggested_time'] = 'tomorrow morning'
            recommendations['reasoning'].append("Morning slots are usually quieter")
        
        # Suggest optimal duration based on device
        progress = self.booking_progress.get(session_id, {})
        if progress.get('device') == 'ps5':
            recommendations['suggested_duration'] = 120  # 2 hours
            recommendations['reasoning'].append("2 hours gives best gaming experience")
        elif progress.get('device') == 'driving_sim':
            recommendations['suggested_duration'] = 60  # 1 hour
            recommendations['reasoning'].append("1 hour is perfect for racing")
        
        return recommendations
    
    def track_successful_booking(self, session_id: str, booking_data: Dict):
        """Track successful booking for analytics"""
        self.analytics['successful_bookings'].append({
            'session_id': session_id,
            'booking_data': booking_data,
            'timestamp': datetime.now().isoformat()
        })
        
        # Update popularity metrics
        device = booking_data.get('device')
        if device:
            self.analytics['popular_devices'][device] = \
                self.analytics['popular_devices'].get(device, 0) + 1
    
    def track_failed_attempt(self, session_id: str, reason: str, attempted_data: Dict):
        """Track failed booking attempts for learning"""
        self.analytics['failed_attempts'].append({
            'session_id': session_id,
            'reason': reason,
            'attempted_data': attempted_data,
            'timestamp': datetime.now().isoformat()
        })
    
    def track_user_correction(self, session_id: str, field: str, old_value: any, new_value: any):
        """Track when user corrects AI understanding"""
        self.analytics['user_corrections'].append({
            'session_id': session_id,
            'field': field,
            'old_value': old_value,
            'new_value': new_value,
            'timestamp': datetime.now().isoformat()
        })
    
    def clear_session(self, session_id: str):
        """Clear all data for a session"""
        if session_id in self.conversation_history:
            del self.conversation_history[session_id]
        if session_id in self.user_preferences:
            del self.user_preferences[session_id]
        if session_id in self.booking_progress:
            del self.booking_progress[session_id]
    
    def get_smart_recommendations(self, session_id: str) -> List[str]:
        """Get smart recommendations based on user history and preferences"""
        recommendations = []
        
        # Get user preferences
        if session_id in self.user_preferences:
            prefs = self.user_preferences[session_id]
            
            # Recommend based on preferred device
            if prefs.get('preferred_device'):
                device = prefs['preferred_device']
                recommendations.append(f"You usually book the {device}")
            
            # Recommend based on preferred time
            if prefs.get('preferred_times'):
                times = prefs['preferred_times']
                if times:
                    recommendations.append(f"Your usual time slots: {', '.join(times[:2])}")
            
            # Recommend based on typical duration
            if prefs.get('typical_duration'):
                duration = prefs['typical_duration']
                recommendations.append(f"You typically book for {duration} hour(s)")
        
        # Add general recommendations if no history
        if not recommendations:
            recommendations = [
                "Morning slots (10 AM - 12 PM) are usually less crowded",
                "Weekday afternoons have better availability",
                "2-hour sessions are most popular"
            ]
        
        return recommendations[:3]  # Return top 3 recommendations
    
    def get_analytics_summary(self) -> Dict:
        """Get analytics summary for system improvement"""
        return {
            'total_successful_bookings': len(self.analytics['successful_bookings']),
            'total_failed_attempts': len(self.analytics['failed_attempts']),
            'total_corrections': len(self.analytics['user_corrections']),
            'popular_devices': self.analytics['popular_devices'],
            'common_failure_reasons': self._analyze_failure_reasons()
        }
    
    def _analyze_failure_reasons(self) -> Dict:
        """Analyze common reasons for booking failures"""
        reasons = {}
        for attempt in self.analytics['failed_attempts']:
            reason = attempt['reason']
            reasons[reason] = reasons.get(reason, 0) + 1
        return reasons
    
    def should_suggest_manual_booking(self, session_id: str) -> bool:
        """
        Determine if AI should suggest manual booking
        (too many failed attempts or user confusion)
        """
        history = self.get_conversation_history(session_id)
        
        # If conversation is too long (>15 messages), suggest manual
        if len(history) > 15:
            return True
        
        # If user keeps changing answers
        corrections = [c for c in self.analytics['user_corrections'] 
                      if c['session_id'] == session_id]
        if len(corrections) > 3:
            return True
        
        return False
