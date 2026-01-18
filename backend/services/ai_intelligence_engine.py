"""
Advanced AI Intelligence Engine
Adds human-like conversation capabilities with NLP, sentiment analysis, and personality
"""

import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import random


class AIIntelligenceEngine:
    """Enhanced AI with human-like intelligence and personality"""
    
    def __init__(self):
        # Personality traits - Indian female assistant
        self.personality = {
            'name': 'Priya',
            'traits': ['warm', 'friendly', 'helpful', 'empathetic', 'cheerful', 'patient'],
            'mood': 'welcoming',
            'energy_level': 'balanced',
            'cultural_context': 'Indian',
            'gender': 'female',
            'speaking_style': 'natural_conversational'
        }
        
        # Conversation fillers for natural human-like flow
        self.fillers = {
            'acknowledgment': ['I see', 'Got it', 'Understood', 'Right', 'Alright', 'Sure', 'Okay'],
            'thinking': ['Let me think...', 'Hmm, let me check...', 'One moment please...', 'Let me see...'],
            'enthusiasm': ['Great!', 'Wonderful!', 'Perfect!', 'Excellent!', 'That\'s great!', 'Lovely!'],
            'empathy': ['I understand', 'I hear you', 'That makes sense', 'I completely get it', 'I know how you feel'],
            'apology': ['Sorry about that', 'I apologize', 'My apologies', 'Oops, sorry', 'I\'m sorry'],
            'encouragement': ['You\'re doing great!', 'Nice choice!', 'Good thinking!', 'Smart decision!'],
            'reassurance': ['Don\'t worry', 'No problem', 'That\'s perfectly fine', 'It happens', 'No worries at all'],
            'gratitude': ['Thank you!', 'Thanks for letting me know', 'I appreciate that', 'Thanks!']
        }
        
        # Emotion detection keywords
        self.emotions = {
            'excited': ['excited', 'can\'t wait', 'awesome', 'great', 'love', 'amazing', 'fantastic'],
            'frustrated': ['frustrated', 'annoying', 'difficult', 'problem', 'issue', 'wrong', 'not working'],
            'confused': ['confused', 'don\'t understand', 'unclear', 'what', 'how', '?', 'explain'],
            'happy': ['happy', 'good', 'nice', 'thanks', 'thank you', 'perfect', 'appreciate'],
            'urgent': ['urgent', 'asap', 'quickly', 'hurry', 'now', 'immediate', 'right away'],
            'disappointed': ['disappointed', 'sad', 'unfortunate', 'not good', 'bad'],
            'worried': ['worried', 'concerned', 'anxious', 'nervous', 'afraid']
        }
        
        # Intent patterns
        self.intents = {
            'greeting': [r'\b(hi|hello|hey|greetings|good morning|good evening|namaste)\b'],
            'booking': [r'\b(book|reserve|want|need|get)\b.*\b(ps5|gaming|driving|simulator)\b'],
            'availability': [r'\b(available|availability|check|when|free|open)\b'],
            'price': [r'\b(price|cost|how much|rate|fee|charge)\b'],
            'help': [r'\b(help|assist|guide|how|what|explain)\b'],
            'cancel': [r'\b(cancel|delete|remove|cancel booking)\b'],
            'complaint': [r'\b(problem|issue|complain|wrong|bad|not working)\b'],
            'thanks': [r'\b(thanks|thank you|appreciate|grateful)\b'],
            'goodbye': [r'\b(bye|goodbye|see you|later|exit|quit)\b']
        }
    
    def analyze_message(self, message: str, context: Dict = None) -> Dict:
        """Analyze message for intent, emotion, entities, and sentiment"""
        message_lower = message.lower()
        
        analysis = {
            'intent': self._detect_intent(message_lower),
            'emotion': self._detect_emotion(message_lower),
            'sentiment': self._analyze_sentiment(message_lower),
            'entities': self._extract_entities(message_lower),
            'urgency': self._detect_urgency(message_lower),
            'confidence': 0.85,
            'requires_empathy': False,
            'conversation_style': 'casual'
        }
        
        # Adjust based on emotion
        if analysis['emotion'] in ['frustrated', 'confused']:
            analysis['requires_empathy'] = True
        
        return analysis
    
    def _detect_intent(self, message: str) -> str:
        """Detect primary intent of the message"""
        for intent, patterns in self.intents.items():
            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    return intent
        return 'general'
    
    def _detect_emotion(self, message: str) -> str:
        """Detect user emotion from message"""
        scores = {}
        for emotion, keywords in self.emotions.items():
            score = sum(1 for keyword in keywords if keyword in message)
            if score > 0:
                scores[emotion] = score
        
        if scores:
            return max(scores, key=scores.get)
        return 'neutral'
    
    def _analyze_sentiment(self, message: str) -> str:
        """Analyze overall sentiment (positive, negative, neutral)"""
        positive_words = ['good', 'great', 'awesome', 'love', 'nice', 'perfect', 'excellent', 'happy', 'thanks']
        negative_words = ['bad', 'terrible', 'hate', 'awful', 'poor', 'worst', 'annoying', 'frustrated']
        
        pos_count = sum(1 for word in positive_words if word in message)
        neg_count = sum(1 for word in negative_words if word in message)
        
        if pos_count > neg_count:
            return 'positive'
        elif neg_count > pos_count:
            return 'negative'
        return 'neutral'
    
    def _extract_entities(self, message: str) -> Dict:
        """Extract key entities like dates, times, numbers, devices"""
        entities = {
            'device': None,
            'date': None,
            'time': None,
            'duration': None,
            'players': None,
            'price_mentioned': False
        }
        
        # Device detection
        if 'ps5' in message or 'playstation' in message or 'gaming' in message:
            entities['device'] = 'PS5'
        elif 'driving' in message or 'simulator' in message or 'racing' in message:
            entities['device'] = 'Driving Simulator'
        
        # Time detection
        time_patterns = [
            (r'\b(\d{1,2})\s*(am|pm)\b', 'specific'),
            (r'\bmorning\b', '10:00 AM'),
            (r'\bafternoon\b', '2:00 PM'),
            (r'\bevening\b', '6:00 PM'),
            (r'\bnight\b', '8:00 PM')
        ]
        for pattern, time_type in time_patterns:
            match = re.search(pattern, message)
            if match:
                entities['time'] = time_type if time_type != 'specific' else f"{match.group(1)} {match.group(2)}"
                break
        
        # Duration detection
        duration_match = re.search(r'\b(\d+)\s*hours?\b', message)
        if duration_match:
            entities['duration'] = int(duration_match.group(1))
        
        # Player count
        player_match = re.search(r'\b(\d+)\s*players?\b', message)
        if player_match:
            entities['players'] = int(player_match.group(1))
        
        # Price mention
        if any(word in message for word in ['price', 'cost', 'charge', 'fee', '₹', 'rupees']):
            entities['price_mentioned'] = True
        
        return entities
    
    def _detect_urgency(self, message: str) -> str:
        """Detect urgency level"""
        urgent_keywords = ['urgent', 'asap', 'quickly', 'hurry', 'now', 'immediate', 'today', 'right now']
        if any(keyword in message for keyword in urgent_keywords):
            return 'high'
        return 'normal'
    
    def generate_human_response(self, base_response: str, analysis: Dict, context: Dict = None) -> str:
        """Add human-like elements to response"""
        response_parts = []
        
        # Add conversational filler based on emotion
        if analysis['emotion'] == 'excited':
            response_parts.append(random.choice(self.fillers['enthusiasm']))
        elif analysis['emotion'] == 'frustrated':
            response_parts.append(random.choice(self.fillers['apology']))
            response_parts.append(random.choice(self.fillers['empathy']) + '.')
        elif analysis['emotion'] == 'confused':
            response_parts.append(random.choice(self.fillers['acknowledgment']) + '.')
        
        # Add natural human-like responses based on emotion and intent
        if analysis['emotion'] == 'excited':
            response_parts.append(random.choice(['Wonderful!', 'That\'s fantastic!', 'I love your enthusiasm!']))
        elif analysis['emotion'] == 'frustrated':
            response_parts.append(random.choice(['I completely understand your frustration.', 'I\'m really sorry you\'re having trouble.', 'Let me help you sort this out right away.']))
        elif analysis['emotion'] == 'confused':
            response_parts.append(random.choice(['No worries, let me explain clearly.', 'I\'ll make this simple for you.', 'Let me break it down step by step.']))
        elif analysis['emotion'] == 'worried':
            response_parts.append(random.choice(['Don\'t worry, everything will be fine.', 'I\'m here to help you.', 'Let me take care of this for you.']))
        elif analysis['emotion'] == 'disappointed':
            response_parts.append(random.choice(['I understand that\'s disappointing.', 'I\'m sorry to hear that.', 'Let me see what I can do to help.']))
        elif analysis['emotion'] == 'urgent' and analysis['urgency'] == 'high':
            response_parts.append(random.choice(['Of course!', 'Right away!', 'Let me help you immediately!']))
        
        # Add acknowledgment for specific intents with Indian warmth
        if analysis['intent'] == 'booking':
            response_parts.append(random.choice(['Perfect choice!', 'Great decision!', 'Wonderful!', 'Excellent!']))
        elif analysis['intent'] == 'thanks':
            return random.choice([
                "You're most welcome! Always happy to help! 😊",
                "It's my pleasure! Anytime you need me! �",
                "Happy to assist! Enjoy your gaming session! 🎮",
                "Glad I could help! Have a wonderful time! ✨",
                "You're welcome! Feel free to reach out anytime! �"
            ])
        elif analysis['intent'] == 'goodbye':
            return random.choice([
                "Goodbye! Have a lovely day ahead! 👋",
                "Take care! Looking forward to helping you again! �",
                "See you soon! Happy gaming! �",
                "Bye! Wishing you a great time! 😊",
                "Until next time! Stay awesome! ✨"
            ])
        
        # Add the main response with natural flow
        response_parts.append(base_response)
        
        # Add warm, encouraging closings for bookings
        if analysis['intent'] == 'booking' and analysis['sentiment'] != 'negative':
            response_parts.append(random.choice([
                "You're going to have such a great time! 🎮",
                "I'm excited for you! This will be amazing! 🚀",
                "Can't wait for you to enjoy this! 💫",
                "You'll absolutely love it! ✨"
            ]))
        
        # Add reassurance if user seems uncertain
        if analysis['emotion'] == 'confused' and analysis['intent'] in ['booking', 'help']:
            response_parts.append(random.choice([
                "Feel free to ask if you need anything else!",
                "I'm right here if you have more questions!",
                "Don't hesitate to reach out anytime!"
            ]))
        
        return ' '.join(response_parts)
    
    def add_conversational_markers(self, text: str, speaking: bool = True) -> Dict:
        """Add pause markers and emphasis for natural speech"""
        # Break into sentences
        sentences = re.split(r'([.!?]+)', text)
        
        speech_data = {
            'text': text,
            'sentences': [],
            'total_duration_estimate': 0,
            'pauses': []
        }
        
        current_pos = 0
        for i in range(0, len(sentences), 2):
            if i < len(sentences):
                sentence = sentences[i].strip()
                punctuation = sentences[i+1] if i+1 < len(sentences) else '.'
                
                if sentence:
                    # Estimate duration (rough: 140 words per minute for natural Indian English)
                    word_count = len(sentence.split())
                    duration = word_count / 2.3  # Slightly slower for warmth
                    
                    # Determine pause length based on punctuation - more natural pauses
                    if punctuation in ['.', '!']:
                        pause = 0.6  # Longer pause for natural flow
                    elif punctuation == '?':
                        pause = 0.7  # Slightly longer for questions
                    elif punctuation == ',':
                        pause = 0.4  # Natural breathing pause
                    else:
                        pause = 0.3
                    
                    speech_data['sentences'].append({
                        'text': sentence + punctuation,
                        'duration': duration,
                        'pause_after': pause,
                        'emphasis': '!' in punctuation or '?' in punctuation
                    })
                    
                    speech_data['total_duration_estimate'] += duration + pause
                    current_pos += len(sentence) + len(punctuation)
        
        return speech_data
    
    def generate_personality_response(self, situation: str) -> str:
        """Generate personality-driven responses for various situations"""
        responses = {
            'slot_full': [
                "Oh no! 😔 That slot's completely booked. But don't worry, I've got some great alternatives for you!",
                "Ah, that time's taken! 😕 Let me find you something even better though!",
                "Darn! That slot just filled up. 😅 But I have other awesome options!"
            ],
            'success': [
                "Woohoo! 🎉 Booking confirmed! You're all set!",
                "Perfect! ✅ Your session is booked! Get ready for some epic gaming!",
                "Done deal! 🎮 Your slot is reserved! Can't wait for you to enjoy it!"
            ],
            'confusion': [
                "Hmm, I'm not quite sure I understood that. 🤔 Could you rephrase?",
                "I want to help, but I need a bit more info! 😊 Can you clarify?",
                "Let me make sure I get this right... 🎯 What exactly do you need?"
            ],
            'waiting': [
                "One sec, checking that for you... ⏳",
                "Let me look that up real quick... 🔍",
                "Give me just a moment... 🕐"
            ]
        }
        
        return random.choice(responses.get(situation, [f"I'm here to help with {situation}!"]))
    
    def create_voice_metadata(self, text: str, analysis: Dict = None) -> Dict:
        """Create metadata for ULTRA REALISTIC, human-like male voice with multi-language support"""
        # Base voice settings for ultra-realistic human conversation
        voice_settings = {
            'rate': 0.92,  # Slower = more natural, conversational (like real person)
            'pitch': 0.86,  # Perfect natural male pitch (warm, friendly, human-like)
            'volume': 1.0,  # Full volume
            'voice': 'male',  # Male voice
            'language': 'en-US',  # American English by default
            'quality': 'natural'  # Natural, human-like quality
        }
        
        # VERY SUBTLE emotion adjustments (keep it human, not robotic)
        if analysis:
            emotion = analysis.get('emotion', 'neutral')
            urgency = analysis.get('urgency', 'normal')
            
            if emotion == 'excited':
                voice_settings['rate'] = 0.98  # Slightly faster
                voice_settings['pitch'] = 0.89  # Slightly higher
            elif emotion == 'frustrated' or emotion == 'disappointed':
                voice_settings['rate'] = 0.88  # Slower, empathetic
                voice_settings['pitch'] = 0.83  # Lower pitch, soothing
            elif emotion == 'confused' or emotion == 'worried':
                voice_settings['rate'] = 0.90  # Slower, thoughtful
                voice_settings['pitch'] = 0.85  # Gentle tone
            elif emotion == 'happy':
                voice_settings['rate'] = 0.95  # Slightly upbeat
                voice_settings['pitch'] = 0.88  # Bright tone
            elif urgency == 'high':
                voice_settings['rate'] = 1.00  # Slightly faster for urgency
                voice_settings['pitch'] = 0.87  # Focused tone
        
        return {
            'text': text,
            'voice_settings': voice_settings,
            'emphasis_words': self._find_emphasis_words(text),
            'pause_positions': self._find_pause_positions(text)
        }
    
    def _find_emphasis_words(self, text: str) -> List[str]:
        """Find words that should be emphasized for natural speech"""
        emphasis_patterns = [
            r'\*\*(.+?)\*\*',  # **bold**
            r'[A-Z]{2,}',  # ALL CAPS
            r'!(.+?)!',  # !emphasis!
        ]
        
        emphasized = []
        for pattern in emphasis_patterns:
            matches = re.findall(pattern, text)
            emphasized.extend(matches)
        
        # Also emphasize important words
        important_words = ['amazing', 'perfect', 'great', 'awesome', 'important', 'urgent', 'free', 'available']
        for word in important_words:
            if word in text.lower():
                emphasized.append(word)
        
        return emphasized
    
    def _find_pause_positions(self, text: str) -> List[int]:
        """Find character positions where pauses should occur"""
        pauses = []
        
        # Find punctuation positions
        for i, char in enumerate(text):
            if char in ['.', '!', '?']:
                pauses.append(i)
            elif char == ',':
                pauses.append(i)
        
        return pauses


# Singleton instance
intelligence_engine = AIIntelligenceEngine()
