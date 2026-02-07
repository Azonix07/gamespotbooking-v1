"""
FAST AI BOOKING - GameSpot Booking Assistant (PERFECTED VERSION)
Complete knowledge of website logic, pricing, and booking rules
- Instant responses (no LLM delays)
- Clear suggestion buttons
- Step-by-step minimal questions
- Full pricing information
- Business rules enforcement
- Advanced conversational understanding with FUZZY MATCHING
- Comprehensive FAQ system
- Smart state management
- 12-hour time format support
- Misspelling tolerance
"""

from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta, date, time
import re
import random

# Fuzzy matching helper for misspellings
def fuzzy_match(text: str, patterns: List[str], threshold: float = 0.7) -> Optional[str]:
    """Simple fuzzy matching for misspellings"""
    text_lower = text.lower().strip()
    
    # Direct match first
    for pattern in patterns:
        if pattern.lower() in text_lower or text_lower in pattern.lower():
            return pattern
    
    # Character-level similarity for typos
    for pattern in patterns:
        pattern_lower = pattern.lower()
        # Simple Jaccard similarity on characters
        text_set = set(text_lower.replace(' ', ''))
        pattern_set = set(pattern_lower.replace(' ', ''))
        if text_set and pattern_set:
            intersection = len(text_set & pattern_set)
            union = len(text_set | pattern_set)
            similarity = intersection / union
            if similarity >= threshold:
                return pattern
    
    return None

# Common misspelling corrections
CORRECTIONS = {
    # PS5 variations
    'ps5': 'PS5', 'ps 5': 'PS5', 'playstation': 'PS5', 'playstation5': 'PS5',
    'playstation 5': 'PS5', 'ps-5': 'PS5', 'psfive': 'PS5', 'ps five': 'PS5',
    'play station': 'PS5', 'game': 'PS5', 'gaming': 'PS5', 'console': 'PS5',
    
    # Driving simulator variations  
    'driving': 'Driving Simulator', 'driving sim': 'Driving Simulator',
    'simulator': 'Driving Simulator', 'sim': 'Driving Simulator',
    'racing': 'Driving Simulator', 'car': 'Driving Simulator',
    'drving': 'Driving Simulator', 'drivng': 'Driving Simulator',
    'simulater': 'Driving Simulator', 'simualtor': 'Driving Simulator',
    'race': 'Driving Simulator', 'racer': 'Driving Simulator',
    
    # Player count words
    'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'single': '1', 'solo': '1', 'alone': '1', 'just me': '1', 'myself': '1',
    'couple': '2', 'pair': '2', 'duo': '2',
    
    # Duration words
    'half': '30', 'half hour': '30', 'thirty': '30', 'halfhour': '30',
    'sixty': '60', 'one hour': '60', 'onehour': '60', 'anhour': '60',
    'ninety': '90', 'hour and half': '90', 'hourandhalf': '90',
    'oneandhalf': '90', 'oneandahalf': '90', '1.5': '90', '1:30': '90',
    'two hours': '120', 'twohours': '120', 'twohour': '120',
    
    # Time periods
    'morning': 'morning', 'mornin': 'morning', 'mrning': 'morning',
    'afternoon': 'afternoon', 'afernoon': 'afternoon', 'aftrnoon': 'afternoon',
    'evening': 'evening', 'evning': 'evening', 'evenin': 'evening',
    'night': 'night', 'nite': 'night', 'tonite': 'tonight', 'tonight': 'tonight',
    
    # Date words
    'today': 'today', 'tday': 'today', 'todya': 'today', 'todat': 'today',
    'tomorrow': 'tomorrow', 'tommorow': 'tomorrow', 'tommorrow': 'tomorrow',
    'tomorow': 'tomorrow', 'tmrw': 'tomorrow', 'tmrow': 'tomorrow',
}

def correct_spelling(text: str) -> str:
    """Apply spelling corrections"""
    text_lower = text.lower().strip()
    for wrong, correct in CORRECTIONS.items():
        if wrong in text_lower:
            return correct
    return text

class FastAIBooking:
    """Lightning fast rule-based booking assistant with complete GameSpot knowledge"""
    
    def __init__(self):
        """Initialize with complete GameSpot business knowledge"""
        
        # ====================
        # GAMESPOT PRICING (₹) - Matches backend/utils/helpers.py
        # ====================
        self.pricing = {
            'ps5': {
                1: {'30min': 70, '1hour': 130, '1.5hour': 170, '2hour': 210},   # 1 player
                2: {'30min': 90, '1hour': 150, '1.5hour': 200, '2hour': 240},   # 2 players
                3: {'30min': 90, '1hour': 150, '1.5hour': 200, '2hour': 240},   # 3 players (same as 2)
                4: {'30min': 150, '1hour': 210, '1.5hour': 270, '2hour': 300}   # 4 players (max)
            },
            'driving': {
                1: {'30min': 100, '1hour': 170, '1.5hour': 200, '2hour': 200}   # Solo only
            }
        }
        
        # ====================
        # BUSINESS HOURS
        # ====================
        self.business_hours = {
            'open': '09:00',
            'close': '22:00',
            'slots': ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
                      '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']
        }
        
        # ====================
        # AVAILABLE DEVICES
        # ====================
        self.devices = {
            'ps5': {
                'count': 3,  # 3 PS5 stations
                'max_players': 4,
                'games': [
                    {'name': 'EA Sports FC 24', 'genre': 'Sports', 'players': '1-4'},
                    {'name':  'Call of Duty: Modern Warfare III', 'genre': 'FPS', 'players': '1-4'},
                    {'name': "Marvel's Spider-Man 2", 'genre': 'Action', 'players': '1'},
                    {'name': 'GTA V', 'genre': 'Action-Adventure', 'players': '1-4'},
                    {'name': 'Fortnite', 'genre': 'Battle Royale', 'players': '1-4'},
                    {'name': 'Apex Legends', 'genre': 'Battle Royale', 'players': '1-4'},
                    {'name': 'FIFA 23', 'genre': 'Sports', 'players': '1-4'},
                    {'name': 'Mortal Kombat 11', 'genre': 'Fighting', 'players': '1-4'},
                    {'name': 'Gran Turismo 7', 'genre': 'Racing', 'players': '1-2'},
                    {'name': 'Tekken 8', 'genre': 'Fighting', 'players': '1-4'}
                ]
            },
            'driving': {
                'count': 1,  # 1 Driving simulator
                'max_players': 1,  # Solo only
                'features': [
                    'Professional racing wheel with force feedback',
                    'Hydraulic pedals (brake, throttle, clutch)',
                    'VR headset support for immersive experience',
                    'Multiple international race tracks',
                    'Realistic car physics and damage model',
                    'Choice of supercars and racing vehicles'
                ]
            }
        }
        
        # ====================
        # BOOKING RULES
        # ====================
        self.rules = {
            'min_duration': 30,  # minutes
            'max_duration': 120,  # minutes
            'allowed_durations': [30, 60, 90, 120],
            'advance_booking_days': 30,
            'min_phone_length': 10,
            'ps5_driving_combo': True,  # Can book PS5 + Driving in sequence
            'cancellation_hours': 2,  # Must cancel 2 hours before
            'late_arrival_grace':  15,  # 15 minute grace period
        }
        
        # ====================
        # LOCATION & CONTACT
        # ====================
        self.location = {
            'name': 'GameSpot Gaming Arena',
            'address': 'Kodungallur, Thrissur, Kerala',
            'phone': '+91-9645136006',
            'email': 'admin@gamespot.in',
            'landmark': 'Kodungallur, Thrissur District',
            'coordinates': {'lat': 10.2167, 'lng': 76.2000},
            'features': [
                'Fully Air Conditioned gaming zones',
                'Premium ergonomic gaming chairs',
                'High-speed fiber internet (1 Gbps)',
                'Snacks and beverages counter',
                'Free WiFi for customers',
                'Clean restrooms',
                'Secure parking (2-wheeler & 4-wheeler)',
                'CCTV security'
            ]
        }
        
        # ====================
        # SNACKS & BEVERAGES MENU
        # ====================
        self.menu = {
            'snacks':  [
                {'item': 'Lays Chips', 'price': 30},
                {'item': 'Kurkure', 'price': 30},
                {'item': 'Chocolate Bar', 'price': 40},
                {'item': 'Cookies Pack', 'price': 35},
                {'item': 'Samosa (2 pcs)', 'price': 40},
                {'item': 'Sandwich', 'price': 60}
            ],
            'beverages': [
                {'item': 'Water Bottle', 'price': 20},
                {'item': 'Soft Drink (300ml)', 'price': 25},
                {'item': 'Energy Drink', 'price': 120},
                {'item': 'Coffee', 'price': 40},
                {'item': 'Tea', 'price': 30}
            ]
        }
        
        # ====================
        # FAQS DATABASE
        # ====================
        self.faqs = {
            'payment': {
                'question': 'What payment methods do you accept?',
                'answer': '💳 We accept multiple payment methods:\n• Cash\n• UPI (GPay, PhonePe, Paytm)\n• Credit/Debit Cards\n• Net Banking',
                'keywords': ['payment', 'pay', 'card', 'upi', 'cash', 'online']
            },
            'parking': {
                'question': 'Is parking available?',
                'answer': '🅿️ Yes! We have free parking for both 2-wheelers and 4-wheelers. Our parking is secure with CCTV surveillance.',
                'keywords': ['parking', 'park', 'vehicle', 'bike', 'car parking']
            },
            'cancellation': {
                'question': 'What is your cancellation policy?',
                'answer': '🔄 You can cancel or reschedule your booking up to 2 hours before your slot. Call us at +91-9645136006 for cancellations. No-shows will not be refunded.',
                'keywords': ['cancel', 'reschedule', 'refund', 'change booking']
            },
            'age': {
                'question': 'Is there an age limit?',
                'answer': '👶 All ages welcome! Children under 12 must be accompanied by an adult. We recommend age 8+ for comfortable gameplay.',
                'keywords': ['age', 'kid', 'child', 'children', 'minor']
            },
            'group': {
                'question': 'Do you offer group packages?',
                'answer': '🎉 Yes! For groups of 6+ people, birthday parties, or corporate events, we offer special packages. Call us at +91-9645136006 for custom pricing!',
                'keywords': ['group', 'party', 'birthday', 'corporate', 'event', 'bulk', 'team']
            },
            'outside_food': {
                'question': 'Can we bring outside food?',
                'answer': '🍕 Outside food is not allowed in gaming zones to keep equipment clean. However, we have a great snacks menu available!',
                'keywords': ['food', 'outside food', 'eat', 'bring food']
            },
            'membership': {
                'question': 'Do you have membership plans?',
                'answer': '⭐ **GameSpot Membership Plans:**\n\n'
                         '🥉 **Monthly Plan** - ₹299/month\n'
                         '   • 30 days validity\n'
                         '   • **10% discount** on all bookings\n\n'
                         '🥈 **Quarterly Plan** - ₹799/quarter ⭐ Most Popular!\n'
                         '   • 90 days validity\n'
                         '   • **15% discount** on all bookings\n\n'
                         '🥇 **Annual Plan** - ₹2,499/year\n'
                         '   • 365 days validity\n'
                         '   • **20% discount** on all bookings\n\n'
                         'Sign up on our website at the Membership page! Discounts apply automatically to all your bookings.',
                'keywords': ['membership', 'member', 'discount', 'offer', 'deal', 'plan', 'subscribe', 'subscription', 'annual', 'monthly', 'quarterly']
            },
            'rental': {
                'question': 'Do you offer rental services?',
                'answer': '🎮 **GameSpot Rental Service:**\n\n'
                         '**PS5 Console Rental:**\n'
                         '• Daily: ₹400/day\n'
                         '• Weekly: ₹2,400/week (₹343/day)\n\n'
                         '**VR Headset Rental (Meta Quest 3):**\n'
                         '• Daily: ₹350/day\n'
                         '• Weekly: ₹2,100/week (₹300/day)\n'
                         '• Monthly: ₹7,500/month (₹250/day)\n\n'
                         '**Extra Controllers:** ₹50/day each\n\n'
                         '📦 Home delivery available! Visit our Rental page on the website to book.',
                'keywords': ['rental', 'rent', 'borrow', 'take home', 'home delivery', 'deliver', 'vr rent', 'ps5 rent', 'quest', 'meta quest']
            },
            'college': {
                'question': 'Do you provide gaming setup for college events?',
                'answer': '🎓 **College Event Gaming Setup:**\n\n'
                         'We bring the gaming experience to your college!\n\n'
                         '**Equipment Available:**\n'
                         '• PS5 Gaming Station: ₹400/day (max 4 units)\n'
                         '• VR Headset Zone: ₹800/day (max 2 units)\n'
                         '• Driving Simulator: ₹1,500/day (1 unit)\n\n'
                         '**What\'s Included:**\n'
                         '• Full setup and teardown\n'
                         '• Technical support throughout the event\n'
                         '• Transport (₹15/km from Kodungallur)\n\n'
                         'Book through our College Setup page on the website!',
                'keywords': ['college', 'university', 'campus', 'fest', 'college event', 'setup', 'college setup', 'techfest', 'cultural fest']
            },
            'website': {
                'question': 'What can I do on the website?',
                'answer': '🌐 **GameSpot Website Features:**\n\n'
                         '• 🎮 **Book Sessions** - Reserve PS5 or Driving Simulator slots\n'
                         '• 📦 **Rent Equipment** - Rent PS5 or VR headset for home\n'
                         '• 🎓 **College Setup** - Book gaming setup for college events\n'
                         '• ⭐ **Membership** - Join for discounts up to 20%\n'
                         '• 🎲 **Games Catalog** - Browse all available games\n'
                         '• 📰 **Updates** - Latest news and announcements\n'
                         '• 📞 **Contact Us** - Get in touch with us\n'
                         '• 💬 **Feedback** - Share your experience\n'
                         '• 👤 **Profile** - Manage your account and bookings\n'
                         '• 🎁 **Offers** - Check out ongoing promotions',
                'keywords': ['website', 'features', 'what can', 'pages', 'navigate', 'sections', 'options']
            },
            'offers': {
                'question': 'Are there any current offers?',
                'answer': '🎁 **Current GameSpot Offers:**\n\n'
                         '• 🏷️ **Membership Discounts** - Up to 20% off on all bookings\n'
                         '• 📸 **Instagram Promo** - Follow us for special promo codes\n'
                         '• 🎮 **Discount Game** - Play our spin wheel to win discounts!\n'
                         '• 👥 **Invite Friends** - Earn rewards by inviting friends\n\n'
                         'Check the Offers page on our website for the latest deals!',
                'keywords': ['offer', 'promo', 'promotion', 'coupon', 'code', 'instagram', 'invite', 'referral', 'discount code', 'spin wheel']
            },
            'contact': {
                'question': 'How can I contact GameSpot?',
                'answer': '📞 **Contact GameSpot:**\n\n'
                         '• 📱 Phone: +91-9645136006\n'
                         '• 📧 Email: admin@gamespot.in\n'
                         '• 📍 Location: Kodungallur, Thrissur, Kerala\n'
                         '• 🕒 Hours: 9:00 AM - 10:00 PM (7 days a week)\n\n'
                         'You can also use the Contact page on our website or chat with me here!',
                'keywords': ['contact', 'phone', 'call', 'email', 'reach', 'number', 'whatsapp']
            },
            'devices': {
                'question': 'What gaming equipment do you have?',
                'answer': '🎮 **GameSpot Equipment:**\n\n'
                         '**PS5 Gaming Stations (3 units):**\n'
                         '• Latest PlayStation 5 consoles\n'
                         '• Up to 4 players per station\n'
                         '• 10+ popular game titles\n'
                         '• Premium controllers and headsets\n\n'
                         '**Driving Simulator (1 unit):**\n'
                         '• Professional racing wheel with force feedback\n'
                         '• Hydraulic pedals (brake, throttle, clutch)\n'
                         '• VR headset support for immersive experience\n'
                         '• Multiple international race tracks\n'
                         '• Realistic car physics and damage model\n'
                         '• Choice of supercars and racing vehicles\n\n'
                         '**VR Equipment (for rental):**\n'
                         '• Meta Quest 3 standalone VR headset',
                'keywords': ['device', 'equipment', 'station', 'console', 'vr', 'headset', 'meta quest', 'controller', 'wheel', 'pedal', 'setup']
            },
            'feedback': {
                'question': 'How can I give feedback?',
                'answer': '💬 We love hearing from our customers! You can share your feedback through:\n\n'
                         '• Our **Feedback page** on the website\n'
                         '• Call us at +91-9645136006\n'
                         '• Email us at admin@gamespot.in\n\n'
                         'Your feedback helps us improve! ⭐',
                'keywords': ['feedback', 'review', 'complaint', 'suggest', 'suggestion', 'improve', 'experience', 'rate', 'rating']
            }
        }
        
        # ====================
        # CONVERSATIONAL TEMPLATES
        # ====================
        self.dialogue = {
            'greetings': [
                "Hi there! 😊 Welcome to GameSpot! ",
                "Hello! Ready to book an amazing gaming session?",
                "Welcome to GameSpot Gaming Arena! 🎮"
            ],
            'confirmations': [
                "Got it! ",
                "Perfect! ",
                "Excellent choice! ",
                "Awesome!",
                "Great!"
            ],
            'availability_confirmed': [
                "Great news! ✅ That slot is available.",
                "Perfect! ✅ That time slot is open.",
                "Excellent! ✅ We have that slot available."
            ],
            'booking_complete': [
                "🎉 **Booking Confirmed!**\n\nYour gaming session is all set! We'll see you at GameSpot.  Get ready for an amazing experience! 🎮",
                "🎉 **All Done!**\n\nYour booking is confirmed!  Looking forward to seeing you at GameSpot. Have an epic gaming session! 🎮"
            ]
        }
    
    def process_message(
        self,
        user_message: str,
        booking_state: Dict,
        conversation_history: List[Dict],
        session_id: str
    ) -> Dict:
        """Process message instantly with rule-based logic and full GameSpot knowledge"""
        
        # Pre-process message: Handle button clicks (remove emojis for cleaner extraction)
        cleaned_message = self._clean_button_input(user_message)
        
        # Handle cancellation request
        if self._is_cancel_request(cleaned_message, booking_state):
            return self._handle_cancellation(booking_state)
        
        # Handle help/info requests (allow at any step before confirmation)
        current_step = self._get_step(booking_state)
        if self._is_info_request(cleaned_message) and current_step in ['game', 'players', 'duration', 'date', 'time']:
            return self._handle_info_request(cleaned_message, booking_state)
        
        # Handle state change requests (user wants to modify previous input)
        if self._is_change_request(cleaned_message, booking_state):
            return self._handle_change_request(cleaned_message, booking_state)
        
        # Update state from message
        state = self._extract_info(cleaned_message, booking_state)
        
        # Validate extracted information
        validation_error = self._validate_state(state)
        if validation_error:
            return {
                'reply': validation_error,
                'buttons':  self._get_buttons(self._get_step(state), state),
                'next_step': self._get_step(state),
                'booking_state': state,
                'action': 'validation_error'
            }
        
        # Determine next step
        step = self._get_step(state)
        
        # Generate response with pricing info when relevant
        reply = self._get_reply(step, state, cleaned_message)
        
        # Generate buttons
        buttons = self._get_buttons(step, state)
        
        action = self._get_action(step, state)
        
        # Prepare response
        response = {
            'reply': reply,
            'buttons': buttons,
            'next_step': step,
            'booking_state': state,
            'action': action,
            'pricing_info': self._get_pricing_for_state(state) if state.get('game') and state.get('players') else None
        }
        
        # If booking is confirmed, add booking data for backend
        if action == 'create_booking' and state.get('confirmed'):
            response['booking_data'] = self._prepare_booking_data(state)
            response['context'] = self._prepare_booking_data(state)  # Also add as context
        
        return response
    
    def _clean_button_input(self, message: str) -> str:
        """Clean button input by removing emojis and formatting"""
        # Remove common button emojis
        emoji_patterns = ['🎮', '🏎️', '💰', '📅', '❓', '⏱️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', 
                        '🕐', '📍', '✅', '❌', '🔄', '📋', '👥', '🌅', '🌞', '🌆', '🎉']
        cleaned = message
        for emoji in emoji_patterns:
            cleaned = cleaned.replace(emoji, '')
        return cleaned.strip()
    
    def _is_cancel_request(self, message: str, state: Dict) -> bool:
        """Check if user wants to cancel the booking"""
        msg_lower = message.lower()
        cancel_keywords = ['cancel', 'stop', 'nevermind', 'forget it', 'quit booking']
        # Only treat as cancellation if not at confirmation step
        return any(keyword in msg_lower for keyword in cancel_keywords) and not state.get('confirmed')
    
    def _handle_cancellation(self, state: Dict) -> Dict:
        """Handle booking cancellation"""
        state = {'cancelled': True}
        return {
            'reply': "No problem! I've cancelled this booking. If you change your mind, just let me know! 😊",
            'buttons': ['🔄 Start New Booking', '💰 Check Pricing', '❓ FAQs'],
            'next_step': 'cancelled',
            'booking_state':  state,
            'action': 'cancelled'
        }
    
    def _is_change_request(self, message: str, state: Dict) -> bool:
        """Check if user wants to change previous input"""
        msg_lower = message.lower()
        change_keywords = ['change', 'actually', 'wait', 'modify', 'edit', 'different']
        return any(keyword in msg_lower for keyword in change_keywords) and len(state) > 0
    
    def _handle_change_request(self, message:  str, state: Dict) -> Dict:
        """Handle request to change previous booking details"""
        msg_lower = message.lower()
        
        # Determine what user wants to change
        if any(word in msg_lower for word in ['game', 'ps5', 'driving']):
            state = {}
            return {
                'reply': "Sure! Let's start fresh. Which game would you like to book? ",
                'buttons': ['PS5', 'Driving Simulator'],
                'next_step': 'game',
                'booking_state': state,
                'action': 'change_game'
            }
        elif 'player' in msg_lower or 'people' in msg_lower:
            state. pop('players', None)
            state.pop('duration', None)
            state.pop('date', None)
            state.pop('time', None)
            return {
                'reply': f"No problem! How many players for {state.get('game')}?",
                'buttons': self._get_buttons('players', state),
                'next_step': 'players',
                'booking_state': state,
                'action': 'change_players'
            }
        elif 'duration' in msg_lower or 'time' in msg_lower or 'long' in msg_lower:
            state.pop('duration', None)
            state.pop('date', None)
            state.pop('time', None)
            return {
                'reply': "Got it! How long would you like to play?",
                'buttons': ['30 mins', '1 hour', '1: 30 hours', '2 hours'],
                'next_step': 'duration',
                'booking_state': state,
                'action': 'change_duration'
            }
        else:
            return {
                'reply': "What would you like to change? (game, number of players, duration, date, or time? )",
                'buttons': ['Change Game', 'Change Players', 'Change Duration', 'Start Over'],
                'next_step':  self._get_step(state),
                'booking_state': state,
                'action': 'clarify_change'
            }
    
    def _is_info_request(self, message: str) -> bool:
        """Check if user is asking for information"""
        msg_lower = message.lower()
        info_keywords = [
            'price', 'cost', 'how much', 'rate', 'charge', 'fee',
            'timing', 'hours', 'open', 'close', 'schedule',
            'location', 'address', 'where',
            'games', 'what games', 'available',
            'help', 'info', 'information',
            'faq', 'question', 'snacks', 'menu',
            'parking', 'payment', 'cancel policy',
            'membership', 'member', 'subscribe', 'plan',
            'rental', 'rent', 'borrow', 'take home', 'deliver',
            'college', 'campus', 'fest', 'college event', 'college setup',
            'offer', 'promo', 'promotion', 'coupon', 'discount code',
            'contact', 'phone', 'call', 'email', 'number',
            'device', 'equipment', 'station', 'console', 'vr', 'headset', 'meta quest',
            'feedback', 'review', 'complaint', 'suggest',
            'website', 'features', 'pages', 'navigate'
        ]
        return any(keyword in msg_lower for keyword in info_keywords)
    
    def _handle_info_request(self, message: str, state:  Dict) -> Dict:
        """Handle information/help requests"""
        msg_lower = message.lower()
        
        # Check FAQs first
        for faq_key, faq_data in self.faqs.items():
            if any(keyword in msg_lower for keyword in faq_data['keywords']):
                return {
                    'reply': faq_data['answer'],
                    'buttons': ['🎮 Book Now', '❓ More FAQs', '💰 Check Pricing'],
                    'next_step': 'game',
                    'booking_state': state,
                    'action': 'faq_answered'
                }
        
        # Pricing inquiry
        if any(word in msg_lower for word in ['price', 'cost', 'how much', 'rate', 'charge', 'fee']):
            reply = "💰 **GameSpot Pricing:**\n\n"
            reply += "**PS5 Gaming:**\n"
            reply += "• 1 Player: ₹70 (30min) | ₹130 (1hr) | ₹170 (1.5hr) | ₹210 (2hr)\n"
            reply += "• 2 Players: ₹90 (30min) | ₹150 (1hr) | ₹200 (1.5hr) | ₹240 (2hr)\n"
            reply += "• 3 Players: ₹90 (30min) | ₹150 (1hr) | ₹200 (1.5hr) | ₹240 (2hr)\n"
            reply += "• 4 Players: ₹150 (30min) | ₹210 (1hr) | ₹270 (1.5hr) | ₹300 (2hr)\n\n"
            reply += "**Driving Simulator:**\n"
            reply += "• Solo: ₹100 (30min) | ₹170 (1hr) | ₹200 (1.5hr) | ₹200 (2hr)\n\n"
            reply += "⭐ **Membership discounts:** 10% (Monthly ₹299) | 15% (Quarterly ₹799) | 20% (Annual ₹2,499)\n\n"
            reply += "Ready to book? Which game would you like?"
            
            return {
                'reply':  reply,
                'buttons': ['🎮 PS5', '🏎️ Driving Simulator', '🍕 View Menu'],
                'next_step': 'game',
                'booking_state': state,
                'action': 'info_provided'
            }
        
        # Timing inquiry
        if any(word in msg_lower for word in ['timing', 'hours', 'open', 'close', 'schedule']):
            reply = "🕒 **Business Hours:**\n\n"
            reply += "Open: 9:00 AM - 10:00 PM\n"
            reply += "Open 7 days a week!\n\n"
            reply += "Time slots available every 30 minutes:\n"
            reply += "9 AM, 9:30 AM, 10 AM, 10:30 AM, 11 AM, 11:30 AM,\n"
            reply += "12 PM, 12:30 PM, 1 PM, 1:30 PM, 2 PM, 2:30 PM,\n"
            reply += "3 PM, 3:30 PM, 4 PM, 4:30 PM, 5 PM, 5:30 PM,\n"
            reply += "6 PM, 6:30 PM, 7 PM, 7:30 PM, 8 PM, 8:30 PM, 9 PM, 9:30 PM\n\n"
            reply += "Would you like to book a slot?"
            
            return {
                'reply': reply,
                'buttons': ['🎮 Book Now', '💰 Check Pricing', '📍 View Location'],
                'next_step': 'game',
                'booking_state': state,
                'action': 'info_provided'
            }
        
        # Games inquiry
        if any(word in msg_lower for word in ['games', 'what games', 'play', 'available games']):
            reply = "🎮 **Available Games & Activities:**\n\n"
            reply += "**PS5 Gaming** (Up to 4 players):\n"
            for game in self.devices['ps5']['games'][:5]:  # Show first 5
                reply += f"• {game['name']} ({game['genre']})\n"
            reply += f"...  and {len(self.devices['ps5']['games']) - 5} more titles!\n\n"
            reply += "**Driving Simulator** (Solo):\n"
            for feature in self.devices['driving']['features'][:3]:  # Show first 3
                reply += f"• {feature}\n"
            reply += "\nWhich would you like to try?"
            
            return {
                'reply': reply,
                'buttons': ['🎮 PS5', '🏎️ Driving Simulator', '📋 Full Game List'],
                'next_step': 'game',
                'booking_state': state,
                'action': 'info_provided'
            }
        
        # Snacks/Menu inquiry
        if any(word in msg_lower for word in ['snack', 'menu', 'food', 'beverage', 'drink']):
            reply = "🍕 **Snacks & Beverages Menu:**\n\n"
            reply += "**Snacks:**\n"
            for item in self.menu['snacks']:
                reply += f"• {item['item']} - ₹{item['price']}\n"
            reply += "\n**Beverages:**\n"
            for item in self.menu['beverages']:
                reply += f"• {item['item']} - ₹{item['price']}\n"
            reply += "\nReady to book your gaming session?"
            
            return {
                'reply': reply,
                'buttons': ['🎮 Book Now', '💰 Check Pricing'],
                'next_step': 'game',
                'booking_state': state,
                'action': 'info_provided'
            }
        
        # Location inquiry
        if any(word in msg_lower for word in ['location', 'address', 'where', 'directions']):
            reply = "📍 **Location:**\n\n"
            reply += f"**{self.location['name']}**\n"
            reply += f"{self.location['address']}\n"
            reply += f"Landmark: {self.location['landmark']}\n\n"
            reply += f"📞 Phone: {self.location['phone']}\n"
            reply += f"📧 Email: {self.location['email']}\n\n"
            reply += "**Amenities:**\n"
            for feature in self.location['features'][:4]:
                reply += f"• {feature}\n"
            reply += "\n🕒 Open 9:00 AM - 10:00 PM, 7 days a week\n\nReady to book your session?"
            
            return {
                'reply': reply,
                'buttons': ['🎮 Book Now', '💰 Check Pricing', '🅿️ View Parking'],
                'next_step':  'game',
                'booking_state': state,
                'action': 'info_provided'
            }
        
        # General help
        reply = "👋 **Welcome to GameSpot!**\n\n"
        reply += "I can help you with:\n"
        reply += "• 🎮 Book PS5 gaming sessions (1-4 players)\n"
        reply += "• 🏎️ Book Driving Simulator (solo)\n"
        reply += "• 💰 Check pricing and availability\n"
        reply += "• 📦 Learn about rental services (PS5/VR for home)\n"
        reply += "• 🎓 College event gaming setup info\n"
        reply += "• ⭐ Membership plans and discounts\n"
        reply += "• 🎁 Current offers and promotions\n"
        reply += "• 📍 Location, hours, and contact info\n"
        reply += "• ❓ Answer any other questions\n\n"
        reply += "What would you like to know?"
        
        return {
            'reply': reply,
            'buttons': ['🎮 Book PS5', '🏎️ Book Driving', '💰 Pricing', '📦 Rentals', '⭐ Membership', '❓ FAQs'],
            'next_step': 'game',
            'booking_state': state,
            'action': 'help_provided'
        }
    
    def _validate_state(self, state: Dict) -> Optional[str]:
        """Validate booking information against business rules"""
        
        # Validate players for game type
        if state.get('game') and state.get('players'):
            if state['game'] == 'Driving Simulator' and state['players'] > 1:
                return "⚠️ Sorry, the Driving Simulator is for solo play only. It's designed for one person to get the full immersive racing experience!  🏎️"
            
            if state['game'] == 'PS5' and state['players'] > 4:
                return "⚠️ PS5 supports a maximum of 4 players. Please choose between 1-4 players."
            
            if state['players'] < 1:
                return "⚠️ Please select at least 1 player."
        
        # Validate duration
        if state.get('duration') and state['duration'] not in self.rules['allowed_durations']:
            return f"⚠️ Please choose from:  30 mins, 1 hour, 1.5 hours, or 2 hours."
        
        # Validate date (not too far in future)
        if state.get('date'):
            try:
                booking_date = datetime.strptime(state['date'], '%Y-%m-%d')
                max_date = datetime.now() + timedelta(days=self. rules['advance_booking_days'])
                if booking_date > max_date:
                    return f"⚠️ Bookings can be made up to {self.rules['advance_booking_days']} days in advance."
                if booking_date < datetime.now().replace(hour=0, minute=0, second=0, microsecond=0):
                    return "⚠️ Cannot book for past dates.  Please choose today or a future date."
            except:
                pass
        
        # Validate time slot
        if state.get('time'):
            try:
                time_obj = datetime.strptime(state['time'], '%H:%M').time()
                open_time = datetime.strptime(self.business_hours['open'], '%H:%M').time()
                close_time = datetime.strptime(self.business_hours['close'], '%H:%M').time()
                
                if time_obj < open_time or time_obj >= close_time:
                    return f"⚠️ Please select a time between 9 AM and 10 PM."
                
                # Check if booking will finish before closing time
                if state.get('duration'):
                    booking_end = (datetime.combine(datetime.today(), time_obj) + timedelta(minutes=state['duration'])).time()
                    if booking_end > close_time:
                        # Calculate latest start time and format in 12-hour
                        latest_start = (datetime.combine(datetime.today(), close_time) - timedelta(minutes=state['duration'])).time()
                        hour = latest_start.hour
                        if hour < 12:
                            time_str = f"{hour}:{latest_start.strftime('%M')} AM"
                        elif hour == 12:
                            time_str = f"12:{latest_start.strftime('%M')} PM"
                        else:
                            time_str = f"{hour - 12}:{latest_start.strftime('%M')} PM"
                        return f"⚠️ That slot would end after closing time. For {state['duration']} minutes, latest start time is {time_str}."
            except:
                pass
        
        # Validate phone
        if state.get('phone'):
            phone_clean = re.sub(r'\D', '', state['phone'])
            if len(phone_clean) != 10:
                return "⚠️ Please provide a valid 10-digit phone number."
            state['phone'] = phone_clean  # Store cleaned version
        
        return None  # No validation errors
    
    def _get_pricing_for_state(self, state: Dict) -> Dict:
        """Get pricing information for current booking state"""
        if not state.get('game') or not state.get('players'):
            return None
        
        game_type = 'ps5' if state['game'] == 'PS5' else 'driving'
        players = state. get('players', 1)
        
        if game_type not in self.pricing or players not in self.pricing[game_type]:
            return None
        
        pricing_tier = self.pricing[game_type][players]
        
        return {
            'game': state['game'],
            'players':  players,
            'prices': {
                '30 mins': pricing_tier['30min'],
                '1 hour':  pricing_tier['1hour'],
                '1.5 hours': pricing_tier['1.5hour'],
                '2 hours': pricing_tier['2hour']
            },
            'current_selection': pricing_tier. get(f"{state. get('duration', 60)}min" if state.get('duration') == 30 else f"{state.get('duration', 60)/60}hour")
        }
    
    def _extract_info(self, message: str, current_state: Dict) -> Dict:
        """Extract booking info from message with advanced NLP and fuzzy matching"""
        state = current_state.copy()
        msg_lower = message.lower().strip()
        
        # Apply spelling corrections
        corrected_msg = correct_spelling(msg_lower)
        
        # Get current step to apply context-aware extraction
        current_step = self._get_step(state)
        
        # ============================================
        # GAME EXTRACTION (with fuzzy matching)
        # ============================================
        if current_step == 'game':
            # PS5 detection with misspellings
            ps5_patterns = ['ps5', 'ps 5', 'playstation', 'play station', 'ps-5', 
                          'psfive', 'ps five', 'game', 'gaming', 'console',
                          'playstion', 'playstaion', 'playstasion']
            driving_patterns = ['driving', 'driv', 'simulator', 'sim', 'racing', 
                              'race', 'car', 'drving', 'simulater', 'simualtor',
                              'drivng', 'racer', 'racing sim']
            
            if any(p in msg_lower for p in ps5_patterns) or fuzzy_match(msg_lower, ps5_patterns, 0.6):
                state['game'] = 'PS5'
            elif any(p in msg_lower for p in driving_patterns) or fuzzy_match(msg_lower, driving_patterns, 0.6):
                state['game'] = 'Driving Simulator'
        
        # ============================================
        # PLAYERS EXTRACTION (with natural language)
        # ============================================
        if current_step == 'players' and not state.get('players'):
            # Natural language patterns
            if any(p in msg_lower for p in ['just me', 'solo', 'alone', 'myself', 'only me', 'single', 'one person']):
                state['players'] = 1
            elif any(p in msg_lower for p in ['couple', 'two of us', 'me and 1', 'me and one', 'pair', 'duo']):
                state['players'] = 2
            elif any(p in msg_lower for p in ['three of us', 'me and 2', 'me and two', 'trio']):
                state['players'] = 3
            elif any(p in msg_lower for p in ['four of us', 'me and 3', 'me and three']):
                state['players'] = 4
            
            # "X players" or "X people" patterns
            player_match = re.search(r'(\d+)\s*(player|people|person|ppl|players|persons)', msg_lower)
            if player_match:
                num = int(player_match.group(1))
                if 1 <= num <= 4:
                    state['players'] = num
            
            # Just a number
            if message.strip() in ['1', '2', '3', '4']:
                state['players'] = int(message.strip())
            
            # Word numbers
            word_to_num = {'one': 1, 'two': 2, 'three': 3, 'four': 4,
                         'first': 1, 'second': 2, 'third': 3, 'fourth': 4}
            for word, num in word_to_num.items():
                if word in msg_lower and not state.get('players'):
                    state['players'] = num
                    break
        
        # ============================================
        # DURATION EXTRACTION (with natural language)
        # ============================================
        if current_step == 'duration' and not state.get('duration'):
            # Pattern matching for duration
            duration_patterns = {
                30: ['30 min', '30min', 'half hour', 'half an hour', 'halfhour', 
                     'thirty minute', '30 minute', 'half hr'],
                60: ['1 hour', '1hour', 'one hour', 'an hour', 'onehour', 
                     '60 min', '60min', 'sixty minute', 'single hour'],
                90: ['1.5 hour', '1:30 hour', 'ninety', 'hour and a half', 
                     '1 and half', '90 min', '90min', 'one and half', 
                     'oneandahalf', '1.5', '1:30'],
                120: ['2 hour', '2hour', 'two hour', 'twohour', 'couple hour',
                      '120 min', '120min', 'two hours']
            }
            
            for duration, patterns in duration_patterns.items():
                if any(p in msg_lower for p in patterns):
                    state['duration'] = duration
                    break
        
        # ============================================
        # DATE EXTRACTION (enhanced for natural language)
        # ============================================
        if current_step == 'date' and not state.get('date'):
            today_patterns = ['today', 'tday', 'todya', 'todat', 'now', 'right now', 'this day']
            tomorrow_patterns = ['tomorrow', 'tommorow', 'tommorrow', 'tomorow', 'tmrw', 'tmrow', 'next day']
            day_after_patterns = ['day after tomorrow', 'day after tmrw', 'overmorrow']
            weekday_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            
            if any(p in msg_lower for p in today_patterns):
                state['date'] = datetime.now().strftime('%Y-%m-%d')
            elif any(p in msg_lower for p in tomorrow_patterns):
                state['date'] = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            elif any(p in msg_lower for p in day_after_patterns):
                state['date'] = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
            else:
                # Handle 'this week friday', 'next friday', 'friday', etc.
                week_match = re.search(r'(this|next)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)', msg_lower)
                if week_match:
                    ref = week_match.group(1)
                    day_name = week_match.group(2)
                    today_idx = datetime.now().weekday()
                    target_idx = weekday_names.index(day_name)
                    days_ahead = (target_idx - today_idx) % 7
                    if ref == 'next' or (ref is None and days_ahead == 0):
                        days_ahead += 7
                    state['date'] = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
                # Handle '9th friday', '9 jan', 'jan 9', '9-01-2025', '9/1/2025', etc.
                else:
                    # Numeric date with year
                    date_match = re.search(r'(\d{1,2})[\-/](\d{1,2})[\-/](\d{2,4})', msg_lower)
                    if date_match:
                        day = int(date_match.group(1))
                        month = int(date_match.group(2))
                        year = int(date_match.group(3))
                        if year < 100:
                            year += 2000
                        try:
                            state['date'] = datetime(year, month, day).strftime('%Y-%m-%d')
                        except:
                            pass
                    else:
                        # Numeric date without year (assume this year)
                        date_match2 = re.search(r'(\d{1,2})[\-/](\d{1,2})', msg_lower)
                        if date_match2:
                            day = int(date_match2.group(1))
                            month = int(date_match2.group(2))
                            year = datetime.now().year
                            try:
                                state['date'] = datetime(year, month, day).strftime('%Y-%m-%d')
                            except:
                                pass
                        else:
                            # '9th friday', '9 jan', 'jan 9', etc.
                            month_map = {m: i+1 for i, m in enumerate(['january','february','march','april','may','june','july','august','september','october','november','december'])}
                            # '9 jan', 'jan 9', '9th jan', etc.
                            month_regex = r'(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|'
                            month_regex += r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2})(?:st|nd|rd|th)?'
                            month_match = re.search(month_regex, msg_lower)
                            if month_match:
                                if month_match.group(1) and month_match.group(2):
                                    day = int(month_match.group(1))
                                    month_str = month_match.group(2)
                                elif month_match.group(3) and month_match.group(4):
                                    month_str = month_match.group(3)
                                    day = int(month_match.group(4))
                                else:
                                    day = None
                                    month_str = None
                                if day and month_str:
                                    month_str_full = [m for m in month_map if m.startswith(month_str)]
                                    if month_str_full:
                                        month = month_map[month_str_full[0]]
                                        year = datetime.now().year
                                        try:
                                            state['date'] = datetime(year, month, day).strftime('%Y-%m-%d')
                                        except:
                                            pass
        
        # ============================================
        # TIME EXTRACTION (enhanced for natural language)
        # ============================================
        if current_step == 'time' and not state.get('time'):
            # Time period detection
            morning_times = {'morning': 9, 'mornin': 9, 'mrning': 9}
            afternoon_times = {'afternoon': 14, 'afernoon': 14, 'noon': 12, 'lunch': 13}
            evening_times = {'evening': 18, 'evning': 18, 'evenin': 18}
            night_times = {'night': 20, 'nite': 20, 'tonight': 20}
            
            for pattern, hour in {**morning_times, **afternoon_times, **evening_times, **night_times}.items():
                if pattern in msg_lower:
                    state['time'] = f"{hour:02d}:00"
                    break
            
            if not state.get('time'):
                # 12-hour format with AM/PM: "2pm", "2 pm", "2:00 pm", "2:00pm", "3am", "3:30pm"
                time_12hr = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)', msg_lower, re.IGNORECASE)
                if time_12hr:
                    hour = int(time_12hr.group(1))
                    minutes = int(time_12hr.group(2)) if time_12hr.group(2) else 0
                    period = time_12hr.group(3).lower().replace('.', '')
                    if period == 'pm' and hour != 12:
                        hour += 12
                    elif period == 'am' and hour == 12:
                        hour = 0
                    if 9 <= hour < 22:
                        state['time'] = f"{hour:02d}:{minutes:02d}"
                # 24-hour format: "14:00", "18:00"
                if not state.get('time'):
                    time_24hr = re.search(r'(\d{1,2}):(\d{2})', msg_lower)
                    if time_24hr:
                        hour = int(time_24hr.group(1))
                        minutes = int(time_24hr.group(2))
                        if 9 <= hour < 22:
                            state['time'] = f"{hour:02d}:{minutes:02d}"
                # Just a number (assume PM for 1-9, as-is for 9-21)
                if not state.get('time'):
                    simple_time = re.search(r'^(\d{1,2})(?::(\d{2}))?$', message.strip())
                    if simple_time:
                        hour = int(simple_time.group(1))
                        minutes = int(simple_time.group(2)) if simple_time.group(2) else 0
                        # Smart inference: 1-8 likely means PM (1PM-8PM), 9 could be AM
                        if 1 <= hour <= 8:
                            hour += 12
                        if 9 <= hour < 22:
                            state['time'] = f"{hour:02d}:{minutes:02d}"
        
        # ============================================
        # NAME EXTRACTION (smarter detection)
        # ============================================
        if current_step == 'name' and not state.get('name'):
            # Clean the message
            cleaned_msg = message.strip()
            
            # Remove common prefixes
            name_prefixes = ['my name is', 'i am', "i'm", 'this is', 'name:', 'name is', 'call me']
            for prefix in name_prefixes:
                if cleaned_msg.lower().startswith(prefix):
                    cleaned_msg = cleaned_msg[len(prefix):].strip()
                    break
            
            # Check if it's a valid name (not a command/keyword)
            invalid_words = ['hi', 'hello', 'yes', 'no', 'ps5', 'driving', 'hour', 
                           'today', 'tomorrow', 'help', 'book', 'cancel', 'ok',
                           'pm', 'am', 'player', 'minute', 'price', 'cost']
            
            if len(cleaned_msg.split()) <= 4:  # Names are usually 1-4 words
                if not any(word in cleaned_msg.lower() for word in invalid_words):
                    if any(c.isalpha() for c in cleaned_msg):
                        # Capitalize properly
                        state['name'] = ' '.join(word.capitalize() for word in cleaned_msg.split())
        
        # ============================================
        # PHONE EXTRACTION
        # ============================================
        if current_step == 'phone' and not state.get('phone'):
            # Remove all non-digits and check length
            phone_clean = re.sub(r'\D', '', message)
            if len(phone_clean) == 10:
                state['phone'] = phone_clean
            elif len(phone_clean) == 12 and phone_clean.startswith('91'):
                state['phone'] = phone_clean[2:]  # Remove country code
        
        # ============================================
        # CONFIRMATION EXTRACTION
        # ============================================
        if current_step == 'confirm':
            confirm_words = ['yes', 'y', 'ok', 'okay', 'sure', 'correct', 'confirm', 
                           'proceed', 'yep', 'yeah', 'yea', 'right', 'good', 'perfect',
                           'book it', 'do it', 'go ahead']
            cancel_words = ['no', 'n', 'cancel', 'stop', 'wrong', 'nope', 'nah',
                          'change', 'wait', 'hold', 'restart']
            
            if '✅' in message or any(w in msg_lower for w in confirm_words):
                if all([state.get('game'), state.get('players'), state.get('duration'),
                       state.get('date'), state.get('time'), state.get('name'), state.get('phone')]):
                    state['confirmed'] = True
            
            if '❌' in message or any(w in msg_lower for w in cancel_words):
                state['cancelled'] = True
        
        return state
    
    def _get_step(self, state: Dict) -> str:
        """Determine current step"""
        if not state.get('game'):
            return 'game'
        if not state.get('players'):
            return 'players'
        if not state.get('duration'):
            return 'duration'
        if not state.get('date'):
            return 'date'
        if not state.get('time'):
            return 'time'
        # Check availability after time is selected
        if state.get('time') and not state.get('availability_checked'):
            state['availability_checked'] = True
            # Set default PS5 device if PS5 is selected (will be checked by backend)
            if state.get('game') == 'PS5' and not state.get('selected_ps5'):
                state['selected_ps5'] = 1  # Default to PS5 station 1
            return 'check_availability'
        if not state.get('name'):
            return 'name'
        if not state.get('phone'):
            return 'phone'
        if not state.get('confirmed'):
            return 'confirm'
        return 'create'
    
    def _get_reply(self, step: str, state: Dict, user_msg: str) -> str:
        """Generate natural, conversational replies with pricing info"""
        
        msg_lower = user_msg.lower()
        
        # First message - Natural greeting
        if step == 'game' and not state.get('game') and any(word in msg_lower for word in ['hi', 'hello', 'hey']):
            return random.choice(self.dialogue['greetings']) + " I'm here to help you book your gaming session.  What would you like to play today?"
        
        # User asks a question or just says hi without specifying game
        if step == 'game' and not state.get('game'):
            if '?' in user_msg or len(user_msg.split()) > 5:
                return "I can help you book either PS5 (1-4 players) or our Driving Simulator (solo experience). Which one interests you?"
            return "We have PS5 and Driving Simulator available. Which would you prefer?"
        
        # After game selection - ask players with context
        if step == 'players': 
            game = state.get('game')
            if game == 'PS5': 
                return f"{random.choice(self.dialogue['confirmations'])} 🎮 PS5 supports 1-4 players. How many will be playing?"
            else: 
                return f"{random.choice(self.dialogue['confirmations'])} 🏎️ The Driving Simulator is a solo experience. Just you, right?"
        
        # After players - show pricing and ask duration
        if step == 'duration':
            game_type = 'ps5' if state.get('game') == 'PS5' else 'driving'
            players = state.get('players', 1)
            
            if game_type in self.pricing and players in self. pricing[game_type]:
                prices = self.pricing[game_type][players]
                reply = f"{random.choice(self.dialogue['confirmations'])} 💰 Pricing for {state.get('game')} with {players} player(s):\n\n"
                reply += f"• 30 mins - ₹{prices['30min']}\n"
                reply += f"• 1 hour - ₹{prices['1hour']}\n"
                reply += f"• 1.5 hours - ₹{prices['1.5hour']}\n"
                reply += f"• 2 hours - ₹{prices['2hour']}\n\n"
                reply += "How long would you like to play?"
                return reply
            return "Perfect! How long would you like to play?"
        
        # After duration - confirm pricing and ask date
        if step == 'date': 
            duration = state.get('duration')
            game_type = 'ps5' if state.get('game') == 'PS5' else 'driving'
            players = state. get('players', 1)
            
            if game_type in self.pricing and players in self. pricing[game_type]:
                prices = self.pricing[game_type][players]
                # Fix duration key mapping
                duration_key_map = {30: '30min', 60: '1hour', 90: '1.5hour', 120: '2hour'}
                duration_key = duration_key_map.get(duration, '1hour')
                price = prices.get(duration_key, 0)
                
                duration_text = "30 minutes" if duration == 30 else f"{int(duration/60)} hour{'s' if duration > 60 else ''}"
                return f"{random.choice(self. dialogue['confirmations'])} Your {duration_text} session will be ₹{price}. 📅 When would you like to come?"
            
            return "Excellent! When would you like to come?"
        
        # After date - ask time with 12-hour format display
        if step == 'time':
            date = state.get('date')
            if date:
                try:
                    date_obj = datetime.strptime(date, '%Y-%m-%d')
                    if date_obj.date() == datetime.now().date():
                        date_text = "today"
                    elif date_obj.date() == (datetime.now() + timedelta(days=1)).date():
                        date_text = "tomorrow"
                    else:
                        date_text = date_obj.strftime('%B %d')
                    return f"Perfect! 🕒 What time works for you {date_text}?\n\n(We're open 9 AM - 10 PM)"
                except: 
                    pass
            return f"Got it! What time works best for you?\n\n(Open 9 AM - 10 PM)"
        
        # After time check - availability confirmed - THIS WAS THE BUG!
        if step == 'check_availability':
            return random.choice(self.dialogue['availability_confirmed']) + " May I have your name to complete the booking?"
        
        # After name - ask for phone
        if step == 'phone':
            name = state.get('name', '')
            return f"Thank you, {name}! 📱 Please share your 10-digit phone number."
        
        # Confirmation with full summary and pricing
        if step == 'confirm':
            game = state.get('game')
            players = state.get('players')
            duration = state.get('duration')
            date = state.get('date')
            time = state.get('time')
            name = state.get('name')
            phone = state.get('phone')
            
            # Calculate price
            game_type = 'ps5' if game == 'PS5' else 'driving'
            duration_key_map = {30: '30min', 60: '1hour', 90: '1.5hour', 120: '2hour'}
            duration_key = duration_key_map.get(duration, '1hour')
            price = self.pricing[game_type][players].get(duration_key, 0)
            
            # Format date nicely
            try:
                date_obj = datetime.strptime(date, '%Y-%m-%d')
                date_text = date_obj.strftime('%A, %B %d, %Y')
            except:
                date_text = date
            
            # Format time nicely (24hr to 12hr format)
            try:
                time_obj = datetime.strptime(time, '%H:%M')
                hour = time_obj.hour
                # Convert to 12-hour format
                if hour == 0:
                    time_text = "12:00 AM"
                elif hour < 12:
                    time_text = f"{hour}:{time_obj.strftime('%M')} AM"
                elif hour == 12:
                    time_text = f"12:{time_obj.strftime('%M')} PM"
                else:
                    time_text = f"{hour - 12}:{time_obj.strftime('%M')} PM"
            except:
                time_text = time
            
            duration_text = "30 minutes" if duration == 30 else f"{int(duration/60)} hour{'s' if duration > 60 else ''}"
            
            reply = "📋 **Booking Summary**\n\n"
            reply += f"🎮 **Game:** {game}\n"
            reply += f"👥 **Players:** {players}\n"
            reply += f"⏱️ **Duration:** {duration_text}\n"
            reply += f"📅 **Date:** {date_text}\n"
            reply += f"🕒 **Time:** {time_text}\n"
            reply += f"👤 **Name:** {name}\n"
            reply += f"📱 **Phone:** {phone}\n"
            reply += f"💰 **Total Price:** ₹{price}\n\n"
            reply += "Everything look good?  Shall I confirm this booking?"
            
            return reply
        
        # Booking created
        if step == 'create':
            return random.choice(self.dialogue['booking_complete']) + "\n\nNeed anything else?"
        
        # Default (should rarely be reached)
        # If we are at the phone step, always ask for phone number directly
        if step == 'phone':
            name = state.get('name', '')
            return f"Thank you, {name}! 📱 Please share your 10-digit phone number."
        # Otherwise, fallback
        return "Could you please provide the next required detail for your booking?"
    
    def _get_buttons(self, step: str, state: Dict) -> List[str]:
        """Generate suggestion buttons with 12-hour format for times"""
        
        button_map = {
            'game': ['🎮 PS5', '🏎️ Driving Simulator'],
            'players': ['1️⃣ 1 player', '2️⃣ 2 players', '3️⃣ 3 players', '4️⃣ 4 players'] if state.get('game') == 'PS5' else ['1️⃣ 1 player'],
            'duration': ['⏱️ 30 mins', '⏱️ 1 hour', '⏱️ 1.5 hours', '⏱️ 2 hours'],
            'date': ['📅 Today', '📅 Tomorrow'],
            'time': ['🕐 9 AM', '🕐 11 AM', '🕐 1 PM', '🕐 3 PM', '🕐 5 PM', '🕐 7 PM', '🕐 9 PM'],
            'check_availability': [],
            'name': [],
            'phone': [],
            'confirm': ['✅ Confirm Booking', '❌ Cancel'],
            'create': ['🔄 Book Another', '📋 View Menu', '❓ FAQs']
        }
        
        return button_map.get(step, [])
    
    def _get_action(self, step: str, state: Dict) -> str:
        """Determine backend action"""
        
        if step == 'check_availability':
            return 'check_availability'
        elif step == 'create' or state.get('confirmed'):
            return 'create_booking'
        else:
            return 'continue'
    
    def _prepare_booking_data(self, state: Dict) -> Dict:
        """Prepare booking data in the format expected by the backend"""
        game = state.get('game')
        game_type = 'ps5' if game == 'PS5' else 'driving'
        players = state.get('players', 1)
        duration = state.get('duration', 60)
        
        # Calculate price - fix duration key format
        if duration == 30:
            duration_key = '30min'
        elif duration == 60:
            duration_key = '1hour'
        elif duration == 90:
            duration_key = '1.5hour'
        elif duration == 120:
            duration_key = '2hour'
        else:
            duration_key = '1hour'  # default
        
        price = self.pricing[game_type][players].get(duration_key, 0)
        
        # Prepare booking data matching backend expectations
        booking_data = {
            'customer_name': state.get('name', ''),
            'customer_phone': state.get('phone', ''),
            'booking_date': state.get('date', ''),
            'start_time': state.get('time', ''),
            'duration_minutes': duration,
            'total_price': price,
            'device': game_type,
            'device_type': game_type,
            'game': game,
            'players': players,
            'num_players': players,
            'player_count': players,
            'price': price
        }
        
        # Add device-specific data
        if game_type == 'ps5':
            booking_data['selected_ps5'] = state.get('selected_ps5', 1)
            booking_data['device_number'] = state.get('selected_ps5', 1)
        
        return booking_data


# Global instance
fast_ai = FastAIBooking()


# ====================
# TESTING & DEMO
# ====================
if __name__ == "__main__": 
    print("="*60)
    print("GameSpot AI Booking Assistant - Test Mode")
    print("="*60)
    
    # Simulate a booking conversation
    state = {}
    session_id = "test_123"
    history = []
    
    def chat(message):
        global state
        response = fast_ai.process_message(message, state, history, session_id)
        state = response['booking_state']
        print(f"\n🤖 AI: {response['reply']}")
        if response['buttons']:
            print(f"   Buttons: {response['buttons']}")
        print(f"   Step: {response['next_step']}")
        return response
    
    # Test conversation
    print("\n--- Test Booking Flow ---")
    chat("hi")
    chat("PS5")
    chat("4 players")
    chat("1 hour")
    chat("today")
    chat("6 PM")
    chat("John Doe")
    chat("9876543210")
    chat("yes")
    
    print("\n" + "="*60)
    print("Test complete!")