"""
AI Memory System - Super Intelligence Memory Management
Handles conversation history, user preferences, and contextual memory
"""

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from collections import defaultdict

class AIMemorySystem:
    """
    Advanced memory system that remembers:
    - Full conversation history
    - User preferences and patterns
    - Past bookings and interactions
    - Context across sessions
    """
    
    def __init__(self):
        # In-memory storage (in production, use Redis or database)
        self.conversation_history = defaultdict(list)  # session_id -> messages
        self.user_preferences = defaultdict(dict)  # session_id -> preferences
        self.user_bookings = defaultdict(list)  # session_id -> bookings
        self.context_memory = defaultdict(dict)  # session_id -> current context
        self.user_patterns = defaultdict(lambda: {
            'favorite_device': None,
            'usual_duration': None,
            'preferred_time': None,
            'typical_players': None,
            'booking_frequency': 0
        })
    
    def add_message(self, session_id: str, role: str, message: str, metadata: Dict = None):
        """Add a message to conversation history"""
        self.conversation_history[session_id].append({
            'role': role,  # 'user' or 'assistant'
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'metadata': metadata or {}
        })
        
        # Keep only last 50 messages per session
        if len(self.conversation_history[session_id]) > 50:
            self.conversation_history[session_id] = self.conversation_history[session_id][-50:]
    
    def get_conversation_history(self, session_id: str, limit: int = 10) -> List[Dict]:
        """Get recent conversation history"""
        history = self.conversation_history.get(session_id, [])
        return history[-limit:] if history else []
    
    def get_full_context(self, session_id: str) -> str:
        """Get formatted conversation context for AI"""
        history = self.get_conversation_history(session_id, limit=10)
        if not history:
            return ""
        
        context_lines = []
        for msg in history:
            role_label = "User" if msg['role'] == 'user' else "Priya"
            context_lines.append(f"{role_label}: {msg['message']}")
        
        return "\n".join(context_lines)
    
    def remember_preference(self, session_id: str, key: str, value: any):
        """Store user preference"""
        self.user_preferences[session_id][key] = value
    
    def get_preference(self, session_id: str, key: str) -> Optional[any]:
        """Retrieve user preference"""
        return self.user_preferences.get(session_id, {}).get(key)
    
    def add_booking(self, session_id: str, booking_details: Dict):
        """Remember a booking"""
        booking_details['timestamp'] = datetime.now().isoformat()
        self.user_bookings[session_id].append(booking_details)
        
        # Update user patterns
        self._update_patterns(session_id, booking_details)
    
    def get_past_bookings(self, session_id: str, limit: int = 5) -> List[Dict]:
        """Get past bookings"""
        bookings = self.user_bookings.get(session_id, [])
        return bookings[-limit:] if bookings else []
    
    def _update_patterns(self, session_id: str, booking: Dict):
        """Analyze and update user patterns"""
        patterns = self.user_patterns[session_id]
        
        # Track favorite device
        device = booking.get('device')
        if device:
            if not patterns['favorite_device']:
                patterns['favorite_device'] = device
            # Could implement more sophisticated tracking
        
        # Track usual duration
        duration = booking.get('duration')
        if duration:
            if not patterns['usual_duration']:
                patterns['usual_duration'] = duration
            else:
                # Average duration
                patterns['usual_duration'] = (patterns['usual_duration'] + duration) / 2
        
        # Track preferred time (morning/afternoon/evening)
        booking_time = booking.get('time')
        if booking_time:
            try:
                hour = int(booking_time.split(':')[0])
                if 9 <= hour < 12:
                    time_slot = 'morning'
                elif 12 <= hour < 17:
                    time_slot = 'afternoon'
                else:
                    time_slot = 'evening'
                patterns['preferred_time'] = time_slot
            except:
                pass
        
        # Track player count
        players = booking.get('players')
        if players:
            patterns['typical_players'] = players
        
        # Increment booking frequency
        patterns['booking_frequency'] += 1
    
    def get_user_patterns(self, session_id: str) -> Dict:
        """Get analyzed user patterns"""
        return self.user_patterns.get(session_id, {})
    
    def set_context(self, session_id: str, context_data: Dict):
        """Set current context"""
        self.context_memory[session_id].update(context_data)
    
    def get_context(self, session_id: str) -> Dict:
        """Get current context"""
        return self.context_memory.get(session_id, {})
    
    def clear_context(self, session_id: str):
        """Clear context (e.g., after booking complete)"""
        self.context_memory[session_id] = {}
    
    def generate_personalized_greeting(self, session_id: str) -> str:
        """Generate personalized greeting based on history"""
        history = self.get_conversation_history(session_id, limit=1)
        patterns = self.get_user_patterns(session_id)
        bookings = self.get_past_bookings(session_id, limit=1)
        
        # Returning user
        if history or bookings:
            if patterns.get('booking_frequency', 0) > 0:
                device = patterns.get('favorite_device', 'gaming')
                return f"Hey! Welcome back! 😊 Ready for another {device} session?"
            return "Hey! Good to see you again! 😊 How can I help you today?"
        
        # First time user
        return "Hey! How can I help you? 😊"
    
    def get_smart_recommendations(self, session_id: str, current_context: Dict = None) -> List[str]:
        """Generate personalized recommendations based on user history and patterns"""
        patterns = self.get_user_patterns(session_id)
        history = self.get_conversation_history(session_id, limit=5)
        current_hour = datetime.now().hour
        
        recommendations = []
        
        # If user has patterns, personalize recommendations
        if patterns.get('booking_frequency', 0) > 0:
            fav_device = patterns.get('favorite_device')
            usual_duration = patterns.get('usual_duration')
            preferred_time = patterns.get('preferred_time')
            
            if fav_device == 'ps5':
                if usual_duration:
                    recommendations.append(f"🎮 Your usual: PS5 for {int(usual_duration)} minutes")
                else:
                    recommendations.append("🎮 Book your favorite PS5 again")
                recommendations.append("🏎️ Try something new - Driving Simulator")
                recommendations.append("📅 Check weekend availability")
            
            elif fav_device == 'driving_sim':
                if usual_duration:
                    recommendations.append(f"🏎️ Your usual: Driving Sim for {int(usual_duration)} minutes")
                else:
                    recommendations.append("🏎️ Book your favorite Driving Simulator")
                recommendations.append("🎮 Try PS5 gaming")
                recommendations.append("⚡ Quick session - 30 minutes")
            
            else:
                # General recommendations for returning users
                recommendations.append("🎮 PS5 gaming session")
                recommendations.append("🏎️ Driving simulator experience")
                recommendations.append("📅 See today's availability")
        
        # Context-aware recommendations (if user just clicked something)
        elif current_context and 'last_recommendation' in current_context:
            last_rec = current_context['last_recommendation']
            
            # Deep recommendations based on what was clicked
            if 'PS5' in last_rec or 'gaming' in last_rec.lower():
                recommendations = [
                    "⏱️ 2-hour PS5 session for ₹600",
                    "👥 Group session - 4 players for ₹1200",
                    "🌟 Premium evening slot available",
                    "📅 See all PS5 availability"
                ]
            elif 'driving' in last_rec.lower() or 'simulator' in last_rec.lower():
                recommendations = [
                    "⏱️ 1-hour racing experience for ₹400",
                    "🏆 Extended 2-hour session for ₹800",
                    "🌃 Evening slot - Best time for racing",
                    "📅 See all simulator slots"
                ]
            elif 'availability' in last_rec.lower() or 'check' in last_rec.lower():
                recommendations = [
                    "📅 Today's available slots",
                    "🗓️ Tomorrow's schedule",
                    "📆 Weekend bookings",
                    "⚡ Next available slot"
                ]
            elif 'group' in last_rec.lower() or 'players' in last_rec.lower():
                recommendations = [
                    "🎮 4-player PS5 package",
                    "👥 6-player extended session",
                    "🎉 Party booking - Up to 10 players",
                    "💰 Group discount available"
                ]
            elif 'deals' in last_rec.lower() or 'best' in last_rec.lower():
                recommendations = [
                    "💰 Morning special - 20% off",
                    "🌙 Evening bundle - 3 hours for ₹850",
                    "📅 Weekend packages",
                    "🎁 Loyalty rewards"
                ]
            else:
                recommendations = self._get_time_based_recommendations(current_hour)
        
        # Default: Time-based recommendations for new users
        else:
            recommendations = self._get_time_based_recommendations(current_hour)
        
        return recommendations
    
    def _get_time_based_recommendations(self, current_hour: int) -> List[str]:
        """Get recommendations based on time of day"""
        if 9 <= current_hour < 12:
            return [
                "🎮 Morning PS5 session - 2 hours for ₹600",
                "🏎️ Try our driving simulator - ₹400/hour",
                "⚡ Check availability for today"
            ]
        elif 12 <= current_hour < 17:
            return [
                "🎮 Afternoon gaming - Best rates available",
                "👥 Group booking for 4 players",
                "📅 See evening availability"
            ]
        elif 17 <= current_hour < 22:
            return [
                "🌙 Evening slot - Prime gaming time",
                "🎮 PS5 + Friends - Book for 4 players",
                "💰 Check our best deals"
            ]
        else:
            return [
                "🌅 Book for tomorrow morning",
                "📅 Weekend availability",
                "🎮 Plan your next gaming session"
            ]
    
    def should_show_recommendations(self, session_id: str) -> bool:
        """Determine if recommendations should be shown"""
        history = self.get_conversation_history(session_id, limit=3)
        
        # Always show on first message
        if len(history) <= 1:
            return True
        
        # Show after greeting or general query
        if history:
            last_msg = history[-1]
            if last_msg.get('metadata', {}).get('action') in ['greeting', 'general_query']:
                return True
        
        return False

# Global memory instance
memory_system = AIMemorySystem()
