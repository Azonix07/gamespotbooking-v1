"""
AI Recommendation Engine - Smart Contextual Recommendations
Generates intelligent suggestions based on conversation flow
"""

from typing import Dict, List, Optional
from datetime import datetime

class AIRecommendationEngine:
    """
    Generates smart, contextual recommendations that:
    - Adapt to conversation flow
    - Get deeper with each interaction
    - Predict user needs
    - Suggest relevant next steps
    """
    
    def __init__(self):
        # Recommendation trees for deep navigation
        self.recommendation_trees = {
            'ps5_gaming': {
                'root': [
                    "🎮 Quick session - 30 minutes for ₹150",
                    "⏱️ Standard session - 2 hours for ₹600",
                    "👥 Group booking - 4 players",
                    "📅 Check all PS5 availability"
                ],
                'quick_session': [
                    "⚡ Book now for next available slot",
                    "📅 Reserve for specific time",
                    "💰 Add extra 30 mins for ₹150",
                    "👥 Add more players"
                ],
                'standard_session': [
                    "⚡ Book 2-hour slot now",
                    "🌙 Evening slot (5 PM - 7 PM)",
                    "🌅 Morning slot (9 AM - 11 AM)",
                    "➕ Extend to 3 hours for ₹900"
                ],
                'group_booking': [
                    "👥 4 players - ₹1200 for 2 hours",
                    "👨‍👩‍👧‍👦 6 players - ₹1800 for 2 hours",
                    "🎉 10 players - Full venue ₹3000",
                    "📅 Check group availability"
                ],
                'availability': [
                    "📅 Today's open slots",
                    "🗓️ Tomorrow's schedule",
                    "📆 This weekend",
                    "🔍 Search specific date"
                ]
            },
            'driving_sim': {
                'root': [
                    "🏎️ 1-hour racing - ₹400",
                    "🏁 Extended 2-hour session - ₹800",
                    "🌙 Evening prime time slot",
                    "📅 Check simulator availability"
                ],
                'one_hour': [
                    "⚡ Book next available",
                    "🕐 Choose specific time",
                    "➕ Add extra hour for ₹400",
                    "🎮 Combine with PS5 session"
                ],
                'extended_session': [
                    "⚡ Reserve 2-hour slot now",
                    "🌃 Evening session (6 PM - 8 PM)",
                    "🌅 Morning session (10 AM - 12 PM)",
                    "🏆 Pro driver experience - 3 hours"
                ],
                'prime_time': [
                    "🌙 5 PM - 6 PM available",
                    "🌃 7 PM - 8 PM available",
                    "🌆 6 PM - 7 PM available",
                    "📅 See all evening slots"
                ]
            },
            'availability': {
                'root': [
                    "📅 Today's slots",
                    "🗓️ Tomorrow",
                    "📆 This weekend",
                    "🔍 Specific date"
                ],
                'today': [
                    "⚡ Next available slot (30 mins)",
                    "🌅 Morning slots remaining",
                    "🌞 Afternoon availability",
                    "🌙 Evening slots left"
                ],
                'tomorrow': [
                    "🌅 9 AM - 12 PM slots",
                    "🌞 12 PM - 5 PM slots",
                    "🌙 5 PM - 9 PM slots",
                    "⚡ First available tomorrow"
                ],
                'weekend': [
                    "📅 Saturday schedule",
                    "📅 Sunday schedule",
                    "🎉 Weekend packages",
                    "⚡ Best weekend slots"
                ]
            },
            'pricing': {
                'root': [
                    "💰 PS5 - ₹300/hour",
                    "💰 Driving Sim - ₹400/hour",
                    "🎁 Group discounts available",
                    "⏰ Time-based special offers"
                ],
                'ps5_pricing': [
                    "⏱️ 30 mins - ₹150",
                    "⏱️ 1 hour - ₹300",
                    "⏱️ 2 hours - ₹600",
                    "⏱️ 3 hours - ₹900"
                ],
                'sim_pricing': [
                    "⏱️ 1 hour - ₹400",
                    "⏱️ 2 hours - ₹800",
                    "⏱️ 3 hours - ₹1200",
                    "🏆 Full day - Special rate"
                ],
                'discounts': [
                    "👥 4+ players - 10% off",
                    "📅 Advance booking - 15% off",
                    "🌅 Morning slots - 20% off",
                    "🎉 Loyalty program"
                ]
            },
            'group_bookings': {
                'root': [
                    "👥 Small group (2-4 players)",
                    "👨‍👩‍👧‍👦 Medium group (5-7 players)",
                    "🎉 Large group (8-10 players)",
                    "🎊 Private event booking"
                ],
                'small_group': [
                    "🎮 2 players - ₹600 for 2 hours",
                    "🎮 4 players - ₹1200 for 2 hours",
                    "📅 Check availability",
                    "💰 View package options"
                ],
                'medium_group': [
                    "🎮 6 players - ₹1800 for 2 hours",
                    "🎮 7 players - ₹2100 for 2 hours",
                    "🎉 Party package available",
                    "📅 Reserve time slot"
                ],
                'large_group': [
                    "🎉 Full venue - 10 players ₹3000",
                    "🎊 Event package with snacks",
                    "🏆 Tournament setup available",
                    "📞 Contact for custom package"
                ]
            }
        }
    
    def get_recommendations(self, 
                          context: str = 'greeting',
                          user_intent: Optional[str] = None,
                          conversation_depth: int = 0,
                          last_clicked: Optional[str] = None,
                          user_patterns: Optional[Dict] = None) -> List[str]:
        """
        Generate contextual recommendations
        
        Args:
            context: Current conversation context
            user_intent: Detected user intent
            conversation_depth: How many interactions deep
            last_clicked: Last recommendation clicked
            user_patterns: User's historical patterns
        """
        
        # First interaction - show main options
        if conversation_depth == 0:
            if user_patterns and user_patterns.get('booking_frequency', 0) > 0:
                return self._get_personalized_recommendations(user_patterns)
            return self._get_main_recommendations()
        
        # User clicked a recommendation - show deeper options
        if last_clicked:
            return self._get_deep_recommendations(last_clicked)
        
        # Based on detected intent
        if user_intent:
            return self._get_intent_based_recommendations(user_intent)
        
        # Fallback to main recommendations
        return self._get_main_recommendations()
    
    def _get_main_recommendations(self) -> List[str]:
        """Get main menu recommendations"""
        current_hour = datetime.now().hour
        
        if 9 <= current_hour < 12:
            return [
                "🎮 Book PS5 gaming session",
                "🏎️ Try driving simulator",
                "📅 Check today's availability",
                "💰 View pricing & packages"
            ]
        elif 12 <= current_hour < 17:
            return [
                "🎮 PS5 afternoon session",
                "👥 Group booking (2-10 players)",
                "📅 Evening availability",
                "🏎️ Driving simulator"
            ]
        else:
            return [
                "🌙 Evening gaming session",
                "🎮 PS5 - Last spots available",
                "📅 Book for tomorrow",
                "👥 Group session tonight"
            ]
    
    def _get_personalized_recommendations(self, patterns: Dict) -> List[str]:
        """Generate personalized recommendations based on user history"""
        recommendations = []
        
        fav_device = patterns.get('favorite_device')
        usual_duration = patterns.get('usual_duration', 60)
        
        if fav_device == 'ps5':
            recommendations.append(f"🎮 Your usual: PS5 for {int(usual_duration)} mins")
            recommendations.append("📅 Check PS5 availability")
            recommendations.append("🏎️ Try driving simulator")
            recommendations.append("👥 Invite friends - Group booking")
        elif fav_device == 'driving_sim':
            recommendations.append(f"🏎️ Your usual: Simulator for {int(usual_duration)} mins")
            recommendations.append("📅 Check simulator availability")
            recommendations.append("🎮 Try PS5 gaming")
            recommendations.append("⏱️ Extended racing session")
        else:
            recommendations = self._get_main_recommendations()
        
        return recommendations
    
    def _get_deep_recommendations(self, clicked_text: str) -> List[str]:
        """Get deeper recommendations based on what user clicked"""
        clicked_lower = clicked_text.lower()
        
        # PS5 related
        if 'ps5' in clicked_lower or 'gaming' in clicked_lower:
            if 'quick' in clicked_lower or '30' in clicked_lower:
                return self.recommendation_trees['ps5_gaming']['quick_session']
            elif 'standard' in clicked_lower or '2 hour' in clicked_lower:
                return self.recommendation_trees['ps5_gaming']['standard_session']
            elif 'group' in clicked_lower or 'players' in clicked_lower:
                return self.recommendation_trees['ps5_gaming']['group_booking']
            elif 'availability' in clicked_lower or 'check' in clicked_lower:
                return self.recommendation_trees['ps5_gaming']['availability']
            else:
                return self.recommendation_trees['ps5_gaming']['root']
        
        # Driving simulator related
        elif 'driving' in clicked_lower or 'simulator' in clicked_lower or 'racing' in clicked_lower:
            if '1 hour' in clicked_lower or '1-hour' in clicked_lower:
                return self.recommendation_trees['driving_sim']['one_hour']
            elif '2 hour' in clicked_lower or 'extended' in clicked_lower:
                return self.recommendation_trees['driving_sim']['extended_session']
            elif 'evening' in clicked_lower or 'prime' in clicked_lower:
                return self.recommendation_trees['driving_sim']['prime_time']
            else:
                return self.recommendation_trees['driving_sim']['root']
        
        # Availability related
        elif 'availability' in clicked_lower or 'check' in clicked_lower or 'schedule' in clicked_lower:
            if 'today' in clicked_lower:
                return self.recommendation_trees['availability']['today']
            elif 'tomorrow' in clicked_lower:
                return self.recommendation_trees['availability']['tomorrow']
            elif 'weekend' in clicked_lower:
                return self.recommendation_trees['availability']['weekend']
            else:
                return self.recommendation_trees['availability']['root']
        
        # Pricing related
        elif 'price' in clicked_lower or 'cost' in clicked_lower or 'deals' in clicked_lower:
            if 'ps5' in clicked_lower:
                return self.recommendation_trees['pricing']['ps5_pricing']
            elif 'simulator' in clicked_lower or 'driving' in clicked_lower:
                return self.recommendation_trees['pricing']['sim_pricing']
            elif 'discount' in clicked_lower or 'special' in clicked_lower:
                return self.recommendation_trees['pricing']['discounts']
            else:
                return self.recommendation_trees['pricing']['root']
        
        # Group bookings
        elif 'group' in clicked_lower or 'players' in clicked_lower or 'party' in clicked_lower:
            if 'small' in clicked_lower or '2' in clicked_lower or '4' in clicked_lower:
                return self.recommendation_trees['group_bookings']['small_group']
            elif 'medium' in clicked_lower or '5' in clicked_lower or '6' in clicked_lower:
                return self.recommendation_trees['group_bookings']['medium_group']
            elif 'large' in clicked_lower or '8' in clicked_lower or '10' in clicked_lower:
                return self.recommendation_trees['group_bookings']['large_group']
            else:
                return self.recommendation_trees['group_bookings']['root']
        
        # Default: return contextual recommendations
        return self._get_main_recommendations()
    
    def _get_intent_based_recommendations(self, intent: str) -> List[str]:
        """Get recommendations based on detected intent"""
        intent_map = {
            'booking': self.recommendation_trees['ps5_gaming']['root'],
            'availability': self.recommendation_trees['availability']['root'],
            'pricing': self.recommendation_trees['pricing']['root'],
            'group_booking': self.recommendation_trees['group_bookings']['root']
        }
        
        return intent_map.get(intent, self._get_main_recommendations())

# Global recommendation engine
recommendation_engine = AIRecommendationEngine()
