# 🎓 AI TRAINING & IMPROVEMENT GUIDE

## Complete Guide to Training Your GameSpot AI Assistant

This guide will show you exactly how to train and improve your AI to handle any scenario, understand new patterns, and provide better responses.

---

## 📚 Table of Contents

1. [Understanding Your AI System](#understanding-your-ai-system)
2. [How to Add New Knowledge](#how-to-add-new-knowledge)
3. [Training for New Scenarios](#training-for-new-scenarios)
4. [Improving Response Quality](#improving-response-quality)
5. [Adding New Features](#adding-new-features)
6. [Testing Your Changes](#testing-your-changes)
7. [Common Training Scenarios](#common-training-scenarios)

---

## 1. Understanding Your AI System

### 🏗️ Architecture

Your AI uses a **rule-based system** (not LLM) located in:
```
backend_python/services/fast_ai_booking.py
```

**Why Rule-Based?**
- ⚡ **Instant responses** (<0.5 seconds)
- 💰 **Free** (no API costs)
- 🎯 **Predictable** (consistent behavior)
- 🔧 **Easy to train** (just edit Python code)

### 📦 Main Components

```python
class FastAIBooking:
    def __init__(self):
        # 1. KNOWLEDGE BASE (Lines 20-80)
        self.pricing = {...}          # All prices
        self.business_hours = {...}   # Hours & slots
        self.devices = {...}          # Games & features
        self.rules = {...}            # Business rules
        self.location = {...}         # Location info
    
    # 2. INFORMATION HANDLER (Lines 100-200)
    def _handle_info_request(...)    # Answers questions
    
    # 3. EXTRACTOR (Lines 250-350)
    def _extract_info(...)           # Extracts booking data
    
    # 4. VALIDATOR (Lines 360-420)
    def _validate_state(...)         # Enforces rules
    
    # 5. RESPONSE GENERATOR (Lines 450-600)
    def _get_reply(...)              # Creates responses
    
    # 6. BUTTON GENERATOR (Lines 610-650)
    def _get_buttons(...)            # Creates suggestion buttons
```

---

## 2. How to Add New Knowledge

### 📖 Step-by-Step: Adding New Information

#### **Example 1: Add a New Game**

**Goal**: Add "VR Racing" to available games

**Steps**:

1. **Open the file**:
   ```bash
   cd /Users/abhijithca/Documents/GitHub/gamespotweb/backend_python/services
   code fast_ai_booking.py  # or nano/vim
   ```

2. **Find the devices section** (around Line 46):
   ```python
   self.devices = {
       'ps5': {
           'count': 3,
           'max_players': 4,
           'games': ['FIFA', 'Call of Duty', 'GTA V', 'Fortnite', 'Apex Legends']
       },
   ```

3. **Add your new game**:
   ```python
   self.devices = {
       'ps5': {
           'count': 3,
           'max_players': 4,
           'games': ['FIFA', 'Call of Duty', 'GTA V', 'Fortnite', 'Apex Legends', 'VR Racing']  # ADDED
       },
   ```

4. **Save and restart backend**:
   ```bash
   # Stop backend (Ctrl+C in terminal)
   python3 app.py
   ```

5. **Test**:
   ```
   User: "What games do you have?"
   AI: Lists all games including VR Racing
   ```

---

#### **Example 2: Change Pricing**

**Goal**: Increase PS5 1-hour rate for 2 players from ₹150 to ₹160

**Steps**:

1. **Find pricing section** (Line 20):
   ```python
   self.pricing = {
       'ps5': {
           1: {'30min': 80, '1hour': 120, '1.5hour': 150, '2hour': 180},
           2: {'30min': 100, '1hour': 150, '1.5hour': 190, '2hour': 230},  # FIND THIS
   ```

2. **Change the price**:
   ```python
           2: {'30min': 100, '1hour': 160, '1.5hour': 190, '2hour': 230},  # CHANGED 150 → 160
   ```

3. **Save and restart**

4. **AI will automatically use new price** in all responses!

---

#### **Example 3: Add New Business Rule**

**Goal**: Don't allow bookings on Mondays

**Steps**:

1. **Find validation section** (Line 360):
   ```python
   def _validate_state(self, state: Dict) -> str:
       """Validate booking information against business rules"""
   ```

2. **Add your rule**:
   ```python
   def _validate_state(self, state: Dict) -> str:
       """Validate booking information against business rules"""
       
       # NEW RULE: No Monday bookings
       if state.get('date'):
           try:
               booking_date = datetime.strptime(state['date'], '%Y-%m-%d')
               if booking_date.weekday() == 0:  # Monday = 0
                   return "⚠️ Sorry, we're closed on Mondays. Please choose another day."
           except:
               pass
       
       # ... existing validation code below ...
   ```

3. **Save, restart, test**:
   ```
   User: "Book for Monday"
   AI: "Sorry, we're closed on Mondays..."
   ```

---

## 3. Training for New Scenarios

### 🎯 Scenario 1: Recognize New Phrases

**Goal**: Understand "2 pax" as "2 players"

**Location**: `_extract_info()` method (Line 250)

**Add code**:
```python
# Players
if not state.get('players'):
    # EXISTING CODE
    for i in range(1, 5):
        if f'{i} player' in msg_lower or f'{i}player' in msg_lower:
            state['players'] = i
            break
    
    # NEW: Recognize "pax" (passenger/person)
    for i in range(1, 5):
        if f'{i} pax' in msg_lower or f'{i}pax' in msg_lower:
            state['players'] = i
            break
```

**Result**:
```
User: "2 pax"
AI: Understands as 2 players ✅
```

---

### 🎯 Scenario 2: Handle Special Requests

**Goal**: Recognize "birthday party" and offer special package

**Location**: `_extract_info()` method

**Add code**:
```python
# Special requests
if 'birthday' in msg_lower or 'party' in msg_lower:
    state['special_request'] = 'birthday_party'
```

**Location**: `_get_reply()` method (Line 450)

**Add response**:
```python
# Birthday party detection
if state.get('special_request') == 'birthday_party' and step == 'players':
    return "🎉 Birthday party! Awesome! We have special packages. How many people will be celebrating?"
```

**Result**:
```
User: "I want to book for birthday party"
AI: "🎉 Birthday party! Awesome! We have special packages..."
```

---

### 🎯 Scenario 3: Smart Date Understanding

**Goal**: Understand "this Saturday" or "next Friday"

**Location**: `_extract_info()` method

**Add code**:
```python
# Smart date parsing
if 'saturday' in msg_lower or 'sunday' in msg_lower or 'friday' in msg_lower:
    from datetime import datetime, timedelta
    
    today = datetime.now()
    target_day = None
    
    if 'saturday' in msg_lower:
        target_day = 5  # Saturday
    elif 'sunday' in msg_lower:
        target_day = 6  # Sunday
    elif 'friday' in msg_lower:
        target_day = 4  # Friday
    
    if target_day is not None:
        days_ahead = target_day - today.weekday()
        if days_ahead <= 0 or 'next' in msg_lower:
            days_ahead += 7
        
        target_date = today + timedelta(days=days_ahead)
        state['date'] = target_date.strftime('%Y-%m-%d')
```

**Result**:
```
User: "Book for this Saturday"
AI: Automatically calculates correct Saturday date ✅
```

---

## 4. Improving Response Quality

### ✍️ Making Responses More Natural

**Location**: `_get_reply()` method (Line 450)

#### **Before**:
```python
'players': "Great choice! How many players will be joining?",
```

#### **After** (More engaging):
```python
'players': "Awesome! 🎮 How many players are joining the fun?",
```

#### **Make it conversational**:
```python
if step == 'players':
    game = state.get('game')
    if game == 'PS5':
        # Different responses for variety
        responses = [
            "Awesome! 🎮 PS5 supports 1-4 players. How many are joining?",
            "Great choice! 🎮 How many players for your PS5 session?",
            "Perfect! PS5 is ready! How many players? (1-4)"
        ]
        import random
        return random.choice(responses)
```

---

### 💡 Adding Helpful Tips

**Add in responses**:
```python
if step == 'duration' and state.get('game') == 'PS5':
    reply = f"💡 **Pro Tip**: Most players enjoy 1-1.5 hours for PS5!\n\n"
    reply += "Your pricing options:\n"
    # ... pricing display
    return reply
```

---

## 5. Adding New Features

### 🆕 Feature 1: Group Discount

**Goal**: 10% discount for 4 players

**Step 1**: Add to pricing calculation

**Location**: `_get_reply()` in confirmation step (Line 520)

```python
# Calculate price
game_type = 'ps5' if game == 'PS5' else 'driving'
duration_key = '30min' if duration == 30 else f"{duration/60}hour"
price = self.pricing[game_type][players].get(duration_key, 0)

# NEW: Apply group discount
discount = 0
if players == 4:
    discount = price * 0.10  # 10% discount
    price = price - discount

# Add to summary
if discount > 0:
    reply += f"💰 **Base Price:** ₹{price + discount}\n"
    reply += f"🎉 **Group Discount (10%):** -₹{int(discount)}\n"
    reply += f"💰 **Total Price:** ₹{int(price)}\n\n"
else:
    reply += f"💰 **Total Price:** ₹{price}\n\n"
```

---

### 🆕 Feature 2: Peak Hour Pricing

**Goal**: +20% during 6-9 PM

**Add to pricing calculation**:
```python
# Calculate price
base_price = self.pricing[game_type][players].get(duration_key, 0)

# NEW: Check peak hours
if state.get('time'):
    hour = int(state['time'].split(':')[0])
    if 18 <= hour <= 21:  # 6 PM - 9 PM
        peak_surcharge = base_price * 0.20
        price = base_price + peak_surcharge
        
        reply += f"💰 **Base Price:** ₹{base_price}\n"
        reply += f"⏰ **Peak Hour Surcharge (20%):** +₹{int(peak_surcharge)}\n"
        reply += f"💰 **Total Price:** ₹{int(price)}\n\n"
    else:
        price = base_price
```

---

### 🆕 Feature 3: Combo Packages

**Goal**: PS5 + Driving combo discount

**Add new combo pricing**:
```python
# In __init__ method
self.combo_offers = {
    'ps5_driving': {
        'discount': 50,  # ₹50 off
        'description': 'PS5 + Driving Simulator combo'
    }
}
```

**Detect combo**:
```python
# In _extract_info
if 'combo' in msg_lower or ('ps5' in msg_lower and 'driving' in msg_lower):
    state['combo'] = 'ps5_driving'
```

**Apply discount in reply**:
```python
if state.get('combo') == 'ps5_driving':
    reply += f"🎁 **Combo Offer!** Save ₹50 when booking PS5 + Driving!\n\n"
```

---

## 6. Testing Your Changes

### 🧪 Step-by-Step Testing

#### **Method 1: Terminal Testing**

```bash
# Test a specific scenario
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "2 pax for PS5", "session_id": "test123"}' \
  | python3 -m json.tool
```

#### **Method 2: Create Test Script**

Create `test_ai_training.py`:
```python
import requests
import json

def test_scenario(message, session_id="test"):
    response = requests.post(
        'http://localhost:8000/api/ai/chat',
        json={'message': message, 'session_id': session_id}
    )
    data = response.json()
    print(f"\n🔵 User: {message}")
    print(f"🤖 AI: {data['reply']}")
    print(f"🔘 Buttons: {data.get('buttons', [])}")
    return data

# Test new phrase recognition
print("=== Testing '2 pax' recognition ===")
test_scenario("Hi")
test_scenario("PS5")
test_scenario("2 pax")  # Should recognize as 2 players

# Test price changes
print("\n=== Testing pricing ===")
test_scenario("How much?", "price_test")
```

Run:
```bash
python3 test_ai_training.py
```

#### **Method 3: Frontend Testing**

1. Open your website
2. Click AI chat
3. Try the new phrases/features
4. Check if AI responds correctly

---

## 7. Common Training Scenarios

### 📋 Quick Reference Table

| Scenario | File Location | What to Edit |
|----------|---------------|--------------|
| **Add new game** | `fast_ai_booking.py` Line 46 | `self.devices['ps5']['games']` |
| **Change price** | Line 20 | `self.pricing` dictionary |
| **New business rule** | Line 360 | `_validate_state()` method |
| **Recognize new phrase** | Line 250 | `_extract_info()` method |
| **Better responses** | Line 450 | `_get_reply()` method |
| **New buttons** | Line 610 | `_get_buttons()` method |
| **Add discount logic** | Line 520 | Price calculation in `_get_reply()` |

---

### 🎯 Training Templates

#### **Template 1: Recognize New Keyword**

```python
# In _extract_info() method
if 'YOUR_KEYWORD' in msg_lower:
    state['YOUR_FIELD'] = 'YOUR_VALUE'
```

#### **Template 2: Add New Validation**

```python
# In _validate_state() method
if state.get('YOUR_FIELD'):
    if YOUR_CONDITION:
        return "⚠️ Your error message"
```

#### **Template 3: Add New Response**

```python
# In _get_reply() method
if step == 'YOUR_STEP':
    return "Your custom response with context"
```

#### **Template 4: Add New Button**

```python
# In _get_buttons() method
button_map = {
    'YOUR_STEP': ['Button 1', 'Button 2', 'Button 3'],
    # ... existing buttons
}
```

---

## 8. Advanced Training Techniques

### 🚀 Multi-Language Support

**Add language detection**:
```python
def _detect_language(self, message: str) -> str:
    """Detect message language"""
    # Simple keyword detection
    hindi_keywords = ['नमस्ते', 'धन्यवाद', 'बुक']
    malayalam_keywords = ['ഹലോ', 'ബുക്ക്']
    
    if any(word in message for word in hindi_keywords):
        return 'hindi'
    elif any(word in message for word in malayalam_keywords):
        return 'malayalam'
    return 'english'
```

**Use in responses**:
```python
language = self._detect_language(user_message)
if language == 'hindi':
    return "नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?"
else:
    return "Hi! How can I help you?"
```

---

### 🧠 Context-Aware Responses

**Remember previous interactions**:
```python
# Track conversation context
if len(conversation_history) > 0:
    last_message = conversation_history[-1]
    
    if 'thanks' in user_message.lower():
        return "You're welcome! Anything else I can help with?"
    
    if state.get('game') and not state.get('players'):
        # User already selected game, be brief
        return "How many players?"
    else:
        # First time, be detailed
        return "Great! How many players will be joining?"
```

---

### 📊 Analytics-Based Training

**Track common patterns**:
```python
# Add to __init__
self.analytics = {
    'popular_games': {'PS5': 0, 'Driving Simulator': 0},
    'popular_durations': {30: 0, 60: 0, 90: 0, 120: 0},
    'popular_times': {}
}

# Track in _extract_info
if state.get('game'):
    self.analytics['popular_games'][state['game']] += 1

# Use in responses
most_popular = max(self.analytics['popular_games'], 
                   key=self.analytics['popular_games'].get)
reply = f"Our most popular choice is {most_popular}! Want to try it?"
```

---

## 9. Deployment Checklist

After training, before going live:

- [ ] Test all new phrases
- [ ] Test all new validation rules
- [ ] Test pricing calculations
- [ ] Test error messages
- [ ] Test with real conversations
- [ ] Check backend logs for errors
- [ ] Test on mobile (if applicable)
- [ ] Document your changes
- [ ] Backup old version
- [ ] Restart backend

---

## 10. Troubleshooting Training Issues

### ❌ Problem: AI not recognizing new phrase

**Solution**: Check case sensitivity
```python
# WRONG
if '2 Pax' in message:  # Won't match "2 pax"

# RIGHT
if '2 pax' in msg_lower:  # Matches any case
```

### ❌ Problem: Validation not working

**Solution**: Check order of validation
```python
# Validation runs BEFORE extraction
# Make sure you're checking the right state
if state.get('players'):  # Not state['players']
```

### ❌ Problem: Prices not updating

**Solution**: Restart backend
```bash
# Stop backend (Ctrl+C)
cd /Users/abhijithca/Documents/GitHub/gamespotweb/backend_python
python3 app.py
```

### ❌ Problem: Buttons not showing

**Solution**: Check button_map keys match steps
```python
button_map = {
    'game': [...],       # Step must be 'game'
    'players': [...],    # Step must be 'players'
}
```

---

## 11. Best Practices

### ✅ DO:
- ✅ Test changes immediately
- ✅ Keep responses short and clear
- ✅ Use emojis for friendliness
- ✅ Validate all user inputs
- ✅ Add helpful error messages
- ✅ Document your changes
- ✅ Keep pricing updated

### ❌ DON'T:
- ❌ Make responses too long
- ❌ Skip validation
- ❌ Forget to restart backend
- ❌ Hard-code dates/times
- ❌ Ignore edge cases
- ❌ Remove existing features without testing

---

## 12. Quick Commands Reference

```bash
# Edit AI file
cd /Users/abhijithca/Documents/GitHub/gamespotweb/backend_python/services
nano fast_ai_booking.py

# Restart backend
cd ../
python3 app.py

# Test AI
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "session_id": "test"}' \
  | python3 -m json.tool

# Check logs
tail -f backend.log
```

---

## 🎓 Summary

**Your AI learns by**:
1. Editing `fast_ai_booking.py`
2. Adding/modifying knowledge in `__init__()`
3. Adding patterns in `_extract_info()`
4. Adding rules in `_validate_state()`
5. Improving responses in `_get_reply()`

**Training is just**:
- ✏️ Edit Python code
- 💾 Save file
- 🔄 Restart backend
- ✅ Test changes

**No complicated ML training needed!** Your AI is rule-based, so training = editing rules! 🎉

---

**Need help?** Check the file at:
`/Users/abhijithca/Documents/GitHub/gamespotweb/backend_python/services/fast_ai_booking.py`

**Current Status**: ✅ AI trained with full GameSpot knowledge and ready to learn more!
