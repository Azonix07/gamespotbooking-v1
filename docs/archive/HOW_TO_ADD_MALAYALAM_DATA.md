# 📝 How to Add Malayalam Chat Data

## 📍 File Location
**File**: `frontend/public/ai-responses-malayalam.json`

This file contains all Malayalam conversation responses for the voice AI.

---

## 🏗️ Structure

```json
{
  "defaultResponse": "Default fallback response",
  
  "responses": {
    "topic_name": {
      "keywords": ["word1", "word2", "word3"],
      "response": "The Malayalam response text"
    }
  }
}
```

---

## ✏️ How to Add New Topics

### **Example 1: Adding Tournament Information**

```json
"tournament": {
  "keywords": ["ടൂർണമെന്റ്", "മത്സരം", "കോമ്പറ്റീഷൻ", "പ്രൈസ്"],
  "response": "അടിപൊളി ടൂർണമെന്റുകൾ നടത്താറുണ്ട് മച്ചാനെ! ഫിഫ, കോഡ്, ടെക്കൻ ഒക്കെ ടൂർണമെന്റുകൾ വരും. കൂൾ പ്രൈസുകളും കിട്ടും! സോഷ്യൽ മീഡിയയിൽ ഫോളോ ചെയ്യൂ, അപ്ഡേറ്റ്സ് കിട്ടും കേട്ടോ!"
}
```

### **Example 2: Adding VIP Membership**

```json
"membership": {
  "keywords": ["മെമ്പർഷിപ്", "വി ഐ പി", "മെമ്പർ", "പാസ്"],
  "response": "വി ഐ പി മെമ്പർഷിപ്പുണ്ട് മച്ചാനെ! മാസത്തിൽ ഒരു തവണ പണം കൊടുത്താ പിന്നെ ഡിസ്കൗണ്ട് കിട്ടും, പ്രയോരിറ്റി ബുക്കിംഗും കിട്ടും. വിലക്കും കണ്ടു, ആളൊക്കെ വാങ്ങുന്നുണ്ട്!"
}
```

### **Example 3: Adding Game Request**

```json
"request_game": {
  "keywords": ["ഗെയിം ചോദിക്കുക", "പുതിയ ഗെയിം", "ഗെയിം ആഡ്"],
  "response": "പുതിയ ഗെയിം വേണോ മച്ചാനെ? പറയൂ ഏത് ഗെയിമാ വേണ്ടേ. ഡിമാൻഡ് ഉണ്ടെങ്കി ഞങ്ങള് ആഡ് ചെയ്തോളാം കേട്ടോ! കസ്റ്റമറിനാ ഞങ്ങള് പ്രാധാന്യം!"
}
```

### **Example 4: Adding WiFi Info**

```json
"wifi": {
  "keywords": ["വൈഫൈ", "ഇന്റർനെറ്റ്", "വൈ ഫൈ", "നെറ്റ്"],
  "response": "ഹൈ സ്പീഡ് വൈഫൈ ഫ്രീയാ മച്ചാനെ! അൺലിമിറ്റഡാ, ഡൗൺലോഡ് സ്പീഡും കിടു! മൾട്ടിപ്ലയർ ഗെയിമുകൾ ഓൺലൈൻ കളിക്കാ ഒരു സുഖം!"
}
```

### **Example 5: Adding Coaching**

```json
"coaching": {
  "keywords": ["കോച്ചിംഗ്", "പഠിപ്പിക്കുക", "ട്രെയിനിംഗ്", "ടിപ്സ്"],
  "response": "പ്രോ പ്ലെയേഴ്സ് ഉണ്ട് കോച്ചിംഗ് തരാൻ മച്ചാനെ! ഫിഫ, കോഡ്, ഫോർട്ട്നൈറ്റ് ഒക്കെ ട്രിക്ക്സും കോംബോസും പഠിപ്പിച്ചു തരും. ഗെയിമിൽ പ്രോ ആകണോ, ചോയ്ക്കൂ!"
}
```

---

## 🎨 Tips for Writing Natural Malayalam

### **Use Casual Language**:
✅ "മച്ചാനെ" (bro/dude) - friendly address
✅ "കേട്ടോ" (got it?) - confirmation
✅ "പൊളി" (awesome) - casual positive
✅ "ഒരു പത്ത്" (easy) - simple/no problem

❌ Avoid formal: "താങ്കൾ", "അങ്ങ്", "നിങ്ങൾ" (too formal)

### **Short Forms**:
- "എന്താണ്" → "എന്താ"
- "ആണ്" → "ആ"
- "ഉണ്ട്" → "ഉണ്ട്"
- "ചെയ്യുക" → "ചെയ്യൂ"

### **Add Emphasis**:
- "ഒക്കെ" (all)
- "തന്നെ" (itself)
- "കേട്ടോ" (listen/understood?)
- "അല്ലെ" (right?)

### **Numbers in Malayalam**:
- "1" → "ഒന്ന്"
- "2" → "രണ്ട്"
- "5" → "അഞ്ച്"
- "10" → "പത്ത്"
- "PS5" → "പിഎസ് ഫൈവ്"

---

## 📋 Template for New Topics

```json
"YOUR_TOPIC_NAME": {
  "keywords": ["മലയാളം ക്വേർഡ് 1", "വേർഡ് 2", "വേർഡ് 3"],
  "response": "നിങ്ങളുടെ പുതിയ മലയാളം റസ്പോൺസ് ഇവിടെ എഴുതൂ മച്ചാനെ!"
}
```

---

## 🚀 How to Add

1. **Open file**: `frontend/public/ai-responses-malayalam.json`
2. **Find the "responses" section**
3. **Add your new topic** (copy template above)
4. **Save file**
5. **Restart frontend** (it will auto-reload)
6. **Test** by saying the keywords!

---

## ✅ Current Topics in File

1. ✅ greeting - Hello/Hi
2. ✅ booking - Booking process
3. ✅ ps5_price - PS5 pricing
4. ✅ games - Available games
5. ✅ hours - Opening hours
6. ✅ location - Address/location
7. ✅ snacks - Food/drinks
8. ✅ payment - Payment methods
9. ✅ group - Group bookings
10. ✅ cancellation - Cancel/modify
11. ✅ age - Age restrictions
12. ✅ parking - Parking info
13. ✅ contact - Phone/email
14. ✅ thanks - Thank you
15. ✅ goodbye - Bye/farewell

**Total: 15 topics**

---

## 💡 Suggested Topics to Add

- 🎮 **Tournament info**
- 👑 **VIP membership**
- 🎯 **Game requests**
- 📶 **WiFi details**
- 🎓 **Gaming coaching**
- 🎁 **Gift vouchers**
- 🎉 **Special offers**
- 🏆 **Leaderboards**
- 👕 **Merchandise**
- 🎤 **Streaming setup**

---

## 🔧 Testing Your Changes

After adding new data:

```bash
# Restart frontend (if needed)
cd frontend
npm start

# Test in browser
# 1. Go to http://localhost:3000
# 2. Click Malayalam Voice AI
# 3. Say one of your new keywords
# 4. Listen to the response!
```

---

**File to Edit**: `frontend/public/ai-responses-malayalam.json`

**Live Example**: The file currently has 15 topics with natural, casual Malayalam responses.

