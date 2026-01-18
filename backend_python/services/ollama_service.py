"""
Ollama Local LLM Service - FREE, UNLIMITED AI
Uses Ollama running locally - no quotas, no API keys needed
Install: brew install ollama && ollama pull llama3.2
"""

import requests
import json
from typing import Dict, Optional

class OllamaService:
    """Local AI using Ollama - completely FREE"""
    
    def __init__(self):
        self.base_url = "http://localhost:11434"
        self.model = "llama3.2:latest"  # Fast, free, smart
        self.available = self._check_ollama()
        
    def _check_ollama(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def generate_response(
        self, 
        user_message: str, 
        conversation_context: Optional[list] = None,
        booking_state: Optional[Dict] = None
    ) -> str:
        """
        Generate AI response using local Ollama
        
        Args:
            user_message: User's message
            conversation_context: Previous conversation
            booking_state: Current booking state
            
        Returns:
            AI response string
        """
        if not self.available:
            return self._fallback_response(user_message, booking_state)
        
        # Build system prompt with booking intelligence
        system_prompt = self._build_system_prompt(booking_state)
        
        # Build conversation history
        messages = [{"role": "system", "content": system_prompt}]
        
        if conversation_context:
            for msg in conversation_context[-6:]:  # Last 6 messages for context
                role = "user" if msg.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("text", "")})
        
        messages.append({"role": "user", "content": user_message})
        
        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_tokens": 150
                    }
                },
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result.get("message", {}).get("content", "")
                cleaned_response = self._clean_response(ai_response)
                
                # Add smart suggestions for next user input
                suggestions = self._generate_smart_suggestions(booking_state, user_message)
                
                return {
                    'response': cleaned_response,
                    'suggestions': suggestions
                }
            else:
                print(f"⚠️ Ollama error: {response.status_code}")
                fallback = self._fallback_response(user_message, booking_state)
                suggestions = self._generate_smart_suggestions(booking_state, user_message)
                return {
                    'response': fallback,
                    'suggestions': suggestions
                }
                
        except Exception as e:
            print(f"⚠️ Ollama exception: {e}")
            fallback = self._fallback_response(user_message, booking_state)
            suggestions = self._generate_smart_suggestions(booking_state, user_message)
            return {
                'response': fallback,
                'suggestions': suggestions
            }
    
    def _build_system_prompt(self, booking_state: Optional[Dict] = None) -> str:
        """Build system prompt - BUTTON-DRIVEN BOOKING FLOW"""
        
        base_prompt = """You are Priya, an AI Booking Assistant at GameSpot gaming center.

🎯 MISSION: Guide users through booking using QUICK ACTION BUTTONS - ONE STEP AT A TIME.

=====================================================
CORE PRINCIPLES
=====================================================

1. ONE STEP AT A TIME - Never skip ahead
2. REMEMBER EVERYTHING - Never ask again what user already selected
3. ALWAYS MOVE FORWARD - Never restart unless user says so
4. BE FRIENDLY & BRIEF - 1-2 sentences max
5. USER CLICKS BUTTONS - They don't type much, they click

=====================================================
STEP-BY-STEP FLOW (BUTTON-DRIVEN)
=====================================================

STEP 1: OPENING (Only once at start)
You say: "Hey! I can help you book a slot. What would you like to play — PS5 or Driving Simulator? 😊"

STEP 2: PLAYER COUNT (After game selected)
You say: "Great choice! 🎮 How many people will be playing with the PS5 today? 👥"

STEP 3: DURATION (After player count selected)  
You say: "Perfect 👍 How long would you like to play with [X] players on the PS5?"

STEP 4: DATE (After duration selected)
You say: "Got it 😊 Is this booking for today? 📅"

STEP 5: TIME (After date selected)
You say: "What time would you like to start playing?"

STEP 6: AVAILABILITY CHECK (Automatic - system handles this)
- Available: "Awesome! 🎉 The slot is available."
- Partial: "This slot is partially booked but still available."
- Booked: "That slot is fully booked 😕 Please choose another time."

STEP 7: NAME (After slot confirmed)
You say: "Please tell me your name."

STEP 8: PHONE (After name entered)
You say: "Please tell me your phone number."

STEP 9: SUMMARY (After all details collected)
You say:
"Let me confirm your booking:

🎮 Game: PS5
👥 Players: [count]
⏱ Duration: [duration]  
📅 Date: [date]
⏰ Time: [time]
👤 Name: [name]
📞 Phone: [phone]

Please confirm if you want to place this booking."

STEP 10: CONFIRMATION (After user confirms)
You say: "🎉 Your booking has been successfully confirmed! Have a great time playing 😄"

=====================================================
CRITICAL RULES
=====================================================

- If game is already selected → Move to player count
- If players already selected → Move to duration
- If duration already selected → Move to date
- NEVER repeat a step that's complete
- ALWAYS check booking_state before asking
- Move to the NEXT unanswered step ONLY
- Keep responses SHORT (1-2 sentences max)

=====================================================
CHANGE HANDLING
=====================================================

If user says "change time" / "change details":
- Update ONLY what they want to change
- Keep everything else
- Continue from that specific step

Example:
User: "Change the time"
You: "No problem! What time would you like instead?"

=====================================================
TONE & STYLE
=====================================================

✅ Use: "Great choice!", "Perfect!", "Awesome!", "Got it 😊"
❌ Avoid: "Processing", "System", "Acknowledged", "Input received"
✅ Use emojis: 🎮 👥 ⏰ 📅 😊 🎉
✅ Be warm, friendly, helpful, natural
✅ Think: Helpful friend, not a robot

🎯 YOUR MISSION: Help customers COMPLETE A BOOKING step-by-step, naturally, like a real person.

=====================================================
ABSOLUTE BEHAVIOR RULES (NON-NEGOTIABLE)
=====================================================

1. NEVER reset conversation unless user says "start over"
2. NEVER repeat questions already answered
3. ALWAYS move forward step-by-step
4. ALWAYS remember everything user said in this session
5. SOUND friendly, calm, and HUMAN (not robotic)
6. Keep responses SHORT (1-2 sentences max)
7. Use emojis naturally: 🎮 👥 ⏰ 📅 😊 🎉

=====================================================
STEP-BY-STEP BOOKING FLOW
=====================================================

STEP 1: GREETING & INTENT
User: "Hi" / "Hey" / "I need to book"
You: "Hey 👋 I can help you book a slot. What would you like to play — PS5 or Driving Simulator?"

STEP 2: GAME SELECTION
User: "PS5"
You: "Great choice! 🎮 How many people will be playing?"

STEP 3: PLAYER COUNT
User: "2 players" / "We are 3"
You: "Perfect 👍 How long would you like to play? You can choose 30 minutes, 1 hour, 1.5 hours, or 2 hours."

STEP 4: DURATION
User: "2 hours"
You: "Got it 😊 Is this booking for today?"

STEP 5: DATE CONFIRMATION
User: "Yes" → You: "What time would you like to start playing?"
User: "No" → You: "Alright 🙂 Which date would you like to book?"

STEP 6: TIME SELECTION
User: "7 PM"
You: "Let me check availability for that slot…"

STEP 7: AFTER AVAILABILITY CHECK
(System will check, then you respond)
Available: "Awesome! 🎉 That slot is available. May I have your name, please?"
Partial: "This slot is partially booked, but there's still space. Would you like to continue?"
Booked: "That slot is fully booked 😕 I can suggest the nearest available times if you want."

STEP 8: CUSTOMER DETAILS
You: "May I have your name, please?"
User: [name]
You: "And your phone number?"

STEP 9: BOOKING SUMMARY
You display:
"Let me confirm your booking:
🎮 Game: [game]
👥 Players: [count]
⏱ Duration: [duration]
📅 Date: [date]
⏰ Time: [time]
👤 Name: [name]
📞 Phone: [phone]

Please confirm if you want me to place this booking."

STEP 10: CONFIRMATION
User: "Yes" / "Confirm"
You: "🎉 Your booking is confirmed! Have an amazing time playing 😄"

=====================================================
CHANGE HANDLING
=====================================================

If user says "Change time" / "Change date" / "Change players":
- Reset ONLY that specific detail
- KEEP everything else
- Continue from that step (don't restart)

Example:
User: "Actually change the time to 8 PM"
You: "No problem! Let me check availability for 8 PM…"

=====================================================
VOICE STYLE (gTTS)
=====================================================

✅ GOOD PHRASES:
"Great choice!"
"Let me check that for you."
"All set!"
"Perfect!"
"Awesome!"

❌ BAD PHRASES (Never use):
"Processing request."
"Input received."
"System processing."
"Acknowledged."

=====================================================
EXAMPLES OF NATURAL CONVERSATION
=====================================================

Example 1:
User: "Hi"
You: "Hey 👋 I can help you book a slot. What would you like to play — PS5 or Driving Simulator?"
User: "PS5"
You: "Great choice! 🎮 How many people will be playing?"
User: "4 people"
You: "Perfect 👍 How long would you like to play? You can choose 30 minutes, 1 hour, 1.5 hours, or 2 hours."
User: "2 hours"
You: "Got it � Is this booking for today?"
User: "Yes"
You: "What time would you like to start playing?"

Example 2 (User gives multiple details):
User: "I want PS5 for 3 people for 2 hours at 7pm today"
You: "Awesome! 🎮 PS5 for 3 people, 2 hours at 7pm today. Let me check availability for that slot…"
(Don't ask what they already told you!)

Example 3 (Change request):
User: "Actually make it 8pm instead"
You: "No problem! Let me check availability for 8 PM instead…"
(Keep game, players, duration - only update time)

=====================================================
PERSONALITY TRAITS
=====================================================

- Warm and welcoming
- Patient and understanding
- Efficient but not rushed
- Helpful without being pushy
- Human, not robotic
- Friendly professional

Think of yourself as a helpful friend who works at GameSpot, not as an AI chatbot.
"""
        
        # Add current state context
        if booking_state:
            context = "\n\n📊 CURRENT BOOKING STATE (What you already know):\n"
            known_items = []
            
            if booking_state.get("device_type"):
                known_items.append(f"✅ Game: {booking_state['device_type']}")
            if booking_state.get("num_players"):
                known_items.append(f"✅ Players: {booking_state['num_players']}")
            if booking_state.get("duration"):
                known_items.append(f"✅ Duration: {booking_state['duration']} hours")
            if booking_state.get("date"):
                known_items.append(f"✅ Date: {booking_state['date']}")
            if booking_state.get("time"):
                known_items.append(f"✅ Time: {booking_state['time']}")
            if booking_state.get("customer_name"):
                known_items.append(f"✅ Name: {booking_state['customer_name']}")
            if booking_state.get("customer_phone"):
                known_items.append(f"✅ Phone: {booking_state['customer_phone']}")
            
            if known_items:
                context += "\n".join(known_items)
                context += "\n\n⚠️ CRITICAL: DO NOT ask again for any information marked with ✅"
                context += "\nMove to the NEXT step in the booking flow."
            else:
                context += "Nothing known yet - Start with greeting and game selection."
            
            base_prompt += context
        
        return base_prompt
    
    def _clean_response(self, response: str) -> str:
        """Clean AI response"""
        # Remove common AI artifacts
        response = response.strip()
        
        # Remove "As Priya," or similar
        if response.lower().startswith("as priya"):
            response = response.split(":", 1)[-1].strip()
        
        # Remove excessive punctuation
        response = response.replace("!!!", "!")
        response = response.replace("???", "?")
        
        # Limit length
        if len(response) > 200:
            sentences = response.split(". ")
            response = ". ".join(sentences[:2]) + "."
        
        return response
    
    def _fallback_response(self, user_message: str, booking_state: Optional[Dict]) -> str:
        """Fallback responses if Ollama unavailable - TRAINED FOR HUMAN-LIKE FLOW"""
        
        msg_lower = user_message.lower()
        
        # Check what we already know
        has_game = booking_state and booking_state.get("device_type")
        has_players = booking_state and booking_state.get("num_players")
        has_duration = booking_state and booking_state.get("duration")
        has_date = booking_state and booking_state.get("date")
        has_time = booking_state and booking_state.get("time")
        has_name = booking_state and booking_state.get("customer_name")
        
        # STEP 1: GREETING & INTENT
        if any(word in msg_lower for word in ["hi", "hey", "hello", "hlo", "start", "book"]):
            if not has_game:
                return "Hey 👋 I can help you book a slot. What would you like to play — PS5 or Driving Simulator?"
        
        # STEP 2: GAME SELECTION
        if ("ps5" in msg_lower or "playstation 5" in msg_lower) and not has_game:
            if not has_players:
                return "Great choice! 🎮 How many people will be playing?"
            return "PS5 selected! 🎮"
        
        if ("driving" in msg_lower or "simulator" in msg_lower) and not has_game:
            return "Awesome! 🏎️ Driving Simulator is so much fun! How many people?"
        
        # STEP 3: PLAYER COUNT
        numbers = ["one", "two", "three", "four", "five", "six", "seven", "eight", "1", "2", "3", "4", "5", "6", "7", "8"]
        if any(num in msg_lower for num in numbers) or "player" in msg_lower or "people" in msg_lower:
            if has_game and not has_duration:
                return "Perfect 👍 How long would you like to play? You can choose 30 minutes, 1 hour, 1.5 hours, or 2 hours."
            if not has_game:
                return "Got it! 👥 What would you like to play — PS5 or Driving Simulator?"
        
        # STEP 4: DURATION
        if any(word in msg_lower for word in ["hour", "hrs", "h", "minute", "min", "30", "60", "90", "120"]):
            if has_game and has_players and not has_date:
                return "Got it � Is this booking for today?"
            if not has_game:
                return "Great! What game would you like to play?"
        
        # STEP 5: DATE CONFIRMATION
        if any(word in msg_lower for word in ["yes", "today", "yeah", "yup"]):
            if has_duration and not has_time:
                return "What time would you like to start playing?"
        
        if any(word in msg_lower for word in ["no", "tomorrow", "date"]):
            if has_duration and not has_date:
                return "Alright 🙂 Which date would you like to book?"
        
        # STEP 6: TIME SELECTION
        if any(word in msg_lower for word in ["pm", "am", "o'clock", ":"]) or \
           any(word in msg_lower for word in ["morning", "afternoon", "evening", "night"]):
            if has_game and has_players and has_duration and not has_time:
                return "Let me check availability for that slot…"
        
        # STEP 7: CUSTOMER DETAILS
        if has_game and has_players and has_duration and has_time and not has_name:
            # Likely giving their name
            return "Thank you! And your phone number?"
        
        # CHANGE HANDLING
        if "change" in msg_lower:
            if "time" in msg_lower:
                return "No problem! What time would you prefer instead?"
            if "date" in msg_lower:
                return "Sure! Which date would you like?"
            if "player" in msg_lower or "people" in msg_lower:
                return "Alright! How many players should I update it to?"
            return "Sure! What would you like to change?"
        
        # CONFUSED STATE - Guide them
        if not has_game:
            return "Hey 👋 I can help you book a slot. What would you like to play — PS5 or Driving Simulator?"
        elif not has_players:
            return "How many people will be playing?"
        elif not has_duration:
            return "How long would you like to play? You can choose 30 minutes, 1 hour, 1.5 hours, or 2 hours."
        elif not has_date:
            return "Is this booking for today?"
        elif not has_time:
            return "What time would you like to start playing?"
        elif not has_name:
            return "May I have your name, please?"
        else:
            return "I'm here to help! What would you like to know? 😊"
    
    def _generate_smart_suggestions(self, booking_state: Optional[Dict], last_message: str) -> list:
        """
        Generate BUTTON OPTIONS for the next step
        Returns quick-action buttons based on booking state
        """
        
        # Check what we already know
        has_game = booking_state and booking_state.get("device_type")
        has_players = booking_state and booking_state.get("num_players")
        has_duration = booking_state and booking_state.get("duration")
        has_date = booking_state and booking_state.get("date")
        has_time = booking_state and booking_state.get("time")
        has_name = booking_state and booking_state.get("customer_name")
        
        suggestions = []
        
        # STEP 1: Game Selection Buttons
        if not has_game:
            suggestions = [
                "PS5",
                "Driving Simulator"
            ]
        
        # STEP 2: Player Count Buttons
        elif has_game and not has_players:
            suggestions = [
                "1 player",
                "2 players",
                "3 players",
                "4 players"
            ]
        
        # STEP 3: Duration Buttons
        elif has_game and has_players and not has_duration:
            suggestions = [
                "30 mins",
                "1 hour",
                "1:30 hours",
                "2 hours"
            ]
        
        # STEP 4: Date Buttons
        elif has_game and has_players and has_duration and not has_date:
            suggestions = [
                "Yes",
                "No"
            ]
        
        # STEP 5: Time Buttons (will be replaced with actual available slots)
        elif has_game and has_players and has_duration and has_date and not has_time:
            from datetime import datetime
            current_hour = datetime.now().hour
            
            # Time slot suggestions based on current time
            if current_hour < 12:  # Morning
                suggestions = [
                    "2 PM",
                    "4 PM",
                    "6 PM",
                    "8 PM"
                ]
            elif current_hour < 17:  # Afternoon
                suggestions = [
                    "5 PM",
                    "7 PM",
                    "8 PM",
                    "9 PM"
                ]
            else:  # Evening
                suggestions = [
                    "8 PM",
                    "9 PM",
                    "10 PM",
                    "Tomorrow"
                ]
        
        # STEP 6: After slot selection (no buttons - user types name/phone)
        elif has_game and has_players and has_duration and has_time and not has_name:
            suggestions = []  # User types name
        
        # STEP 7: After name, user types phone number
        elif has_name and not booking_state.get("customer_phone"):
            suggestions = []  # User types phone
        
        # STEP 8: Confirmation Buttons
        elif has_name and booking_state.get("customer_phone"):
            suggestions = [
                "Confirm Booking",
                "Change Details"
            ]
        
        # DEFAULT: Always show helpful options if nothing else
        if not suggestions:
            suggestions = [
                "Start Over",
                "Help"
            ]
        
        return suggestions

# Global instance
ollama_service = OllamaService()
