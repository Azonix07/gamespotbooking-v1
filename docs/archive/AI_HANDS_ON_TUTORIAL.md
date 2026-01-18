# 🎯 HANDS-ON AI TRAINING TUTORIAL

## Step-by-Step Practical Examples

This is a **hands-on tutorial** where you'll actually train your AI with real examples.

---

## 🚀 Tutorial 1: Add "Weekend Special" Pricing

**Goal**: Offer 15% discount on weekends (Saturday & Sunday)

### Step 1: Open the AI file
```bash
cd /Users/abhijithca/Documents/GitHub/gamespotweb/backend_python/services
nano fast_ai_booking.py
```
*Or use VS Code: `code fast_ai_booking.py`*

### Step 2: Find the confirmation section
Look for `if step == 'confirm':` (around line 520)

### Step 3: Add weekend discount logic
Find where price is calculated:
```python
# Calculate price
game_type = 'ps5' if game == 'PS5' else 'driving'
duration_key = '30min' if duration == 30 else f"{duration/60}hour"
price = self.pricing[game_type][players].get(duration_key, 0)
```

### Step 4: Add this code right after:
```python
# Weekend Special - 15% discount
weekend_discount = 0
try:
    date_obj = datetime.strptime(date, '%Y-%m-%d')
    if date_obj.weekday() in [5, 6]:  # Saturday=5, Sunday=6
        weekend_discount = price * 0.15
        price = price - weekend_discount
except:
    pass
```

### Step 5: Update the display
Find the line that shows total price and change it to:
```python
if weekend_discount > 0:
    reply += f"💰 **Regular Price:** ₹{int(price + weekend_discount)}\n"
    reply += f"🎉 **Weekend Discount (15%):** -₹{int(weekend_discount)}\n"
    reply += f"💰 **Total Price:** ₹{int(price)}\n\n"
else:
    reply += f"💰 **Total Price:** ₹{int(price)}\n\n"
```

### Step 6: Save and restart
```bash
# Ctrl+X to exit nano (save: Y, Enter)
cd ..
python3 app.py
```

### Step 7: Test it!
```
Book for Saturday → See 15% discount ✅
Book for Monday → No discount ✅
```

---

## 🚀 Tutorial 2: Recognize "Couple Booking"

**Goal**: When someone says "me and my friend" or "couple", automatically set 2 players

### Step 1: Find the extraction section
Look for `def _extract_info(` (around line 250)

### Step 2: Find the Players section
Look for:
```python
# Players
if not state.get('players'):
```

### Step 3: Add this code inside that block:
```python
# Recognize couple/duo/pair phrases
couple_phrases = [
    'couple', 'duo', 'pair', 'two of us', 
    'me and my friend', 'me and my', 'both of us'
]
if any(phrase in msg_lower for phrase in couple_phrases):
    state['players'] = 2
    break  # Important: exit the loop
```

### Step 4: Save, restart, test
```
User: "Book PS5 for a couple"
AI: Automatically understands 2 players ✅
```

---

## 🚀 Tutorial 3: Add "Student Discount" Code

**Goal**: Apply 10% discount when user enters code "STUDENT10"

### Step 1: Add discount codes to knowledge base
In `__init__` method (around line 20), add:
```python
# Discount codes
self.discount_codes = {
    'STUDENT10': {'discount': 0.10, 'description': 'Student Discount'},
    'FIRST20': {'discount': 0.20, 'description': 'First Time Customer'},
    'GAMENIGHT': {'discount': 0.15, 'description': 'Game Night Special'}
}
```

### Step 2: Detect discount codes in extraction
In `_extract_info` method, add:
```python
# Discount code detection
for code in self.discount_codes.keys():
    if code.lower() in msg_lower:
        state['discount_code'] = code
        break
```

### Step 3: Apply discount in pricing
In the confirmation step where price is calculated, add:
```python
# Apply discount code
discount_amount = 0
if state.get('discount_code'):
    code = state['discount_code']
    if code in self.discount_codes:
        discount_info = self.discount_codes[code]
        discount_amount = price * discount_info['discount']
        price = price - discount_amount
```

### Step 4: Show in confirmation
```python
if discount_amount > 0:
    code = state['discount_code']
    reply += f"💰 **Base Price:** ₹{int(price + discount_amount)}\n"
    reply += f"🎓 **{self.discount_codes[code]['description']}:** -₹{int(discount_amount)}\n"
    reply += f"💰 **Final Price:** ₹{int(price)}\n\n"
```

### Step 5: Test
```
User: "Apply code STUDENT10"
AI: "Great! Student discount applied!"
At confirmation: Shows 10% discount ✅
```

---

## 🚀 Tutorial 4: Smart Time Suggestions

**Goal**: Suggest available times based on current time

### Step 1: Modify button generation
Find `_get_buttons` method (around line 610)

### Step 2: Make time buttons dynamic
Replace:
```python
'time': ['2 PM', '4 PM', '6 PM', '8 PM'],
```

With:
```python
'time': self._get_available_times(state),
```

### Step 3: Create the helper function
Add this new method to the class:
```python
def _get_available_times(self, state: Dict) -> List[str]:
    """Generate smart time suggestions based on current time"""
    from datetime import datetime, timedelta
    
    now = datetime.now()
    current_hour = now.hour
    
    # If booking for today, only show future times
    is_today = False
    if state.get('date'):
        try:
            booking_date = datetime.strptime(state['date'], '%Y-%m-%d')
            is_today = booking_date.date() == now.date()
        except:
            pass
    
    # Generate time slots
    times = []
    for hour in range(10, 22):  # 10 AM to 9 PM
        if is_today and hour <= current_hour:
            continue  # Skip past times
        
        # Convert to 12-hour format
        if hour == 12:
            time_str = "12 PM"
        elif hour > 12:
            time_str = f"{hour-12} PM"
        else:
            time_str = f"{hour} AM"
        
        times.append(time_str)
    
    # Return first 4 suggestions
    return times[:4] if times else ['2 PM', '4 PM', '6 PM', '8 PM']
```

### Step 4: Test
```
Book for today at 3 PM → Only shows 4 PM onwards ✅
Book for tomorrow → Shows all times ✅
```

---

## 🚀 Tutorial 5: Add "Quick Booking" for Regulars

**Goal**: If someone says "usual", book their usual game/time

### Step 1: Add customer memory
In `__init__`:
```python
# Customer memory (in production, use database)
self.customer_preferences = {
    '9876543210': {  # Phone number
        'usual_game': 'PS5',
        'usual_duration': 60,
        'usual_time': '18:00'
    }
}
```

### Step 2: Detect "usual" keyword
In `_extract_info`:
```python
# Quick booking for regulars
if 'usual' in msg_lower or 'same as last time' in msg_lower:
    phone = state.get('phone')
    if phone and phone in self.customer_preferences:
        prefs = self.customer_preferences[phone]
        state['game'] = prefs.get('usual_game')
        state['duration'] = prefs.get('usual_duration')
        state['time'] = prefs.get('usual_time')
```

### Step 3: Handle in response
In `_get_reply`:
```python
if 'usual' in user_msg.lower() and state.get('game'):
    return f"Got it! Your usual {state['game']} session. How many players today?"
```

### Step 4: Test
```
User with phone 9876543210: "Book my usual"
AI: Automatically fills game, duration, time ✅
```

---

## 🚀 Tutorial 6: Handle Group Bookings

**Goal**: When someone says "group of 6", book 2 PS5 units (3 + 3 players)

### Step 1: Detect large groups
In `_extract_info`:
```python
# Large group detection (>4 players)
for i in range(5, 13):  # 5 to 12 players
    if f'{i} player' in msg_lower or f'{i} people' in msg_lower:
        # Calculate units needed
        units_needed = (i + 3) // 4  # Round up to nearest 4
        state['large_group'] = {
            'total_players': i,
            'units_needed': units_needed
        }
        break
```

### Step 2: Create special response
In `_get_reply`:
```python
if state.get('large_group'):
    group_info = state['large_group']
    total = group_info['total_players']
    units = group_info['units_needed']
    
    return f"Perfect! For {total} players, we'll set up {units} PS5 stations. How long would you like to play?"
```

### Step 3: Calculate multi-unit pricing
In confirmation step:
```python
if state.get('large_group'):
    group_info = state['large_group']
    # Calculate pricing for multiple units
    # ... custom pricing logic
```

---

## 🧪 Testing Framework

Create `test_training.py` to test all your changes:

```python
#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:8000/api/ai/chat'

def test(message, session_id='test'):
    """Send message and print response"""
    response = requests.post(BASE_URL, json={
        'message': message,
        'session_id': session_id
    })
    data = response.json()
    print(f"\n{'='*60}")
    print(f"👤 USER: {message}")
    print(f"🤖 AI: {data['reply'][:200]}...")
    print(f"🔘 BUTTONS: {data.get('buttons', [])[:3]}")
    return data

print("🧪 Testing AI Training Changes...\n")

# Test 1: Weekend discount
print("\n=== TEST 1: Weekend Discount ===")
test("Hi", "weekend_test")
test("PS5", "weekend_test")
test("2 players", "weekend_test")
test("1 hour", "weekend_test")
test("This Saturday", "weekend_test")

# Test 2: Couple recognition
print("\n=== TEST 2: Couple Recognition ===")
test("Book for couple", "couple_test")

# Test 3: Discount code
print("\n=== TEST 3: Discount Code ===")
test("I have code STUDENT10", "discount_test")

# Test 4: Smart times
print("\n=== TEST 4: Smart Time Suggestions ===")
response = test("Book for today", "time_test")
print(f"Time buttons: {response.get('buttons', [])}")

print("\n✅ All tests completed!")
```

Run:
```bash
chmod +x test_training.py
python3 test_training.py
```

---

## 📝 Training Checklist

After each change:

- [ ] Edit `fast_ai_booking.py`
- [ ] Save file
- [ ] Restart backend: `python3 app.py`
- [ ] Test with curl or frontend
- [ ] Check for errors in backend logs
- [ ] Document what you changed
- [ ] Commit to git (optional)

---

## 🎓 Graduation Project

**Challenge**: Implement all 6 tutorials above!

When done, your AI will:
- ✅ Give weekend discounts
- ✅ Understand "couple" as 2 players
- ✅ Apply discount codes
- ✅ Show smart time suggestions
- ✅ Handle "usual" bookings
- ✅ Manage large groups

---

## 💡 Pro Tips

1. **Always test incrementally** - Add one feature at a time
2. **Use print() for debugging** - See what's happening
3. **Check backend logs** - Look for Python errors
4. **Keep a backup** - Copy file before major changes
5. **Document changes** - Add comments in code

---

## 🆘 Need Help?

**File Location**: 
```
/Users/abhijithca/Documents/GitHub/gamespotweb/backend_python/services/fast_ai_booking.py
```

**Common Issues**:
- Syntax error → Check Python indentation
- Not working → Restart backend
- Wrong behavior → Check `msg_lower` (case sensitivity)

---

**Ready to train your AI?** Start with Tutorial 1! 🚀
