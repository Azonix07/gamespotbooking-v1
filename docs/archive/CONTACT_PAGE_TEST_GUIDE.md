# Contact Page - Quick Visual Test Guide 🎨

## How to Access
Navigate to: `http://localhost:3000/contact`

Or click **"Contact"** in the navigation bar.

---

## 🔍 What to Test & Look For

### 1. WhatsApp Card (Top Left)
**Visual Features:**
- 💚 **Green WhatsApp icon** in rounded box
- 📝 **Textarea** for typing messages
- 🔢 **Character counter** (0/500)
- 📤 **Green "Send on WhatsApp" button**
- 🏷️ **Three quick message chips** below button

**Test Actions:**
1. ✅ Type in the textarea - watch character counter update
2. ✅ Click any chip - message auto-fills
3. ✅ Click "Send on WhatsApp" - opens WhatsApp with your message
4. ✅ Try typing 500+ characters - should stop at 500
5. ✅ Leave textarea empty - send button should be dimmed

**Expected Behavior:**
- Smooth typing experience
- Counter updates in real-time
- Chips populate message instantly
- WhatsApp opens in new tab with pre-filled message

---

### 2. Phone Card (Top Right)
**Visual Features:**
- 📞 **Orange phone icon** in rounded box
- 📱 **Large phone number** display (+91 98765 43210)
- 📋 **"Copy" button** next to number
- 📞 **"Call Now" button** (orange gradient)
- 🕐 **Working hours** card at bottom

**Test Actions:**
1. ✅ Click "Copy" button - should change to "Copied!" with checkmark
2. ✅ Wait 2 seconds - button reverts to "Copy"
3. ✅ Click "Call Now" - should open phone dialer (mobile)
4. ✅ Check working hours display - two rows (weekdays/weekends)
5. ✅ Hover over buttons - watch lift effect

**Expected Behavior:**
- Copy button changes state for 2 seconds
- Phone number copied to clipboard
- Call Now opens tel: link
- Working hours clearly visible

---

### 3. Connect With Us Section
**Visual Features:**
- 🌐 **Section title** with globe emoji
- 🎴 **Four social media cards** in a row:
  - 💗 **Instagram** (pink icon)
  - 💙 **Facebook** (blue icon)
  - 🐦 **Twitter** (light blue icon)
  - 📧 **Email** (orange icon)

**Test Actions:**
1. ✅ Hover over Instagram card - pink border appears
2. ✅ Hover over Facebook card - blue border appears
3. ✅ Hover over Twitter card - light blue border appears
4. ✅ Hover over Email card - orange border appears
5. ✅ Watch arrow (→) move right on hover
6. ✅ Click any card - opens in new tab

**Expected Behavior:**
- Each card has unique brand color
- Shimmer effect slides across on hover
- Arrow slides right
- External links open in new tab

---

### 4. Visit Our Shop Section
**Visual Features:**
- 📍 **Section title** with pin emoji
- 🗂️ **Two-column layout**:
  - **Left**: Location info card
  - **Right**: Google Maps

**Location Info Card:**
- 📍 **Orange map pin icon**
- 🏢 **Business name** (GameSpot Gaming Arena)
- ⭐ **Star rating** (4.8 with 326 reviews)
- 🏠 **Full address** with icon
- 📞 **Phone number** with icon
- 🕐 **Opening hours** with icon
- 🗺️ **"Get Directions" button** (orange)
- 📋 **"Copy Address" button** (outlined)
- 🏷️ **Four facility tags** (Parking, Accessible, WiFi, AC)

**Google Maps:**
- 🗺️ **Embedded interactive map**
- 🖱️ **Zoom controls**
- 🔍 **Draggable view**

**Test Actions:**
1. ✅ Count stars - should show 4.8 rating (4 full + partial)
2. ✅ Click "Get Directions" - opens Google Maps in new tab
3. ✅ Click "Copy Address" - shows alert "Address copied!"
4. ✅ Interact with map - zoom, drag, etc.
5. ✅ Check facility tags - 4 different amenities
6. ✅ Hover over buttons - lift effect

**Expected Behavior:**
- Stars render correctly (gold color)
- Directions opens Google Maps
- Address copied to clipboard with alert
- Map is fully interactive
- Tags are clearly visible

---

### 5. Bottom Info Cards
**Visual Features:**
- 🎮 **Latest Gaming Equipment** card
- 👥 **Friendly Staff** card
- 🍕 **Food & Beverages** card

**Test Actions:**
1. ✅ Hover over each card - lifts up
2. ✅ Watch border color change
3. ✅ Check emoji displays
4. ✅ Read descriptions

**Expected Behavior:**
- Cards lift on hover (-6px)
- Border turns orange
- Emoji, title, and description visible
- Shadow increases on hover

---

## 🎨 Visual Quality Checks

### Colors
- ✅ **WhatsApp Green**: #25D366 (send button, focus)
- ✅ **Orange Gradient**: Theme colors (Call Now, Get Directions)
- ✅ **Instagram Pink**: #E4405F (on hover)
- ✅ **Facebook Blue**: #1877F2 (on hover)
- ✅ **Twitter Blue**: #1DA1F2 (on hover)
- ✅ **Gold Stars**: #fbbf24 (rating)

### Animations
- ✅ **Page Load**: Elements fade in from bottom (staggered)
- ✅ **Hover Effects**: All cards lift up smoothly
- ✅ **Social Cards**: Shimmer effect on hover
- ✅ **Buttons**: Transform on hover
- ✅ **Copy Button**: State change animation

### Typography
- ✅ **Title**: Large gradient text (orange to yellow)
- ✅ **Section Titles**: Bold with emoji
- ✅ **Card Headers**: Clear hierarchy
- ✅ **Body Text**: Readable, good contrast
- ✅ **Labels**: Uppercase, letter-spaced

### Spacing
- ✅ **Section Gaps**: 4rem between sections
- ✅ **Card Padding**: 2.5rem generous padding
- ✅ **Grid Gaps**: 2rem between cards
- ✅ **Element Spacing**: Consistent throughout

---

## 📱 Responsive Testing

### Desktop (Your current view)
- ✅ 2 contact cards side by side
- ✅ 4 social cards in a row
- ✅ 2 columns (info + map)
- ✅ 3 bottom info cards in a row

### Tablet (Resize browser to ~800px)
- ✅ Contact cards still side by side
- ✅ Social cards reduce to 2 columns
- ✅ Location section stacks (info on top, map below)
- ✅ Bottom cards 2-up

### Mobile (Resize browser to ~400px)
- ✅ Everything stacks vertically
- ✅ One card per row
- ✅ Smaller title text
- ✅ Full-width buttons
- ✅ Message chips stack

**Test Method:**
1. Press `Cmd + Option + I` (Mac) or `F12` (Windows) - Open DevTools
2. Click device toolbar icon (phone/tablet icon)
3. Select different device sizes
4. Check layout adapts properly

---

## ✅ Interaction Checklist

Go through each item and test:

- [ ] **WhatsApp textarea** - Type message
- [ ] **Character counter** - Check it updates
- [ ] **Quick chips** - Click each chip
- [ ] **Send WhatsApp** - Opens WhatsApp
- [ ] **Copy phone** - Button changes state
- [ ] **Call Now** - Opens dialer
- [ ] **Instagram card** - Hover and click
- [ ] **Facebook card** - Hover and click
- [ ] **Twitter card** - Hover and click
- [ ] **Email card** - Opens mail client
- [ ] **Get Directions** - Opens Google Maps
- [ ] **Copy Address** - Shows alert
- [ ] **Map interaction** - Zoom and pan
- [ ] **Info cards hover** - Lift effect
- [ ] **All buttons hover** - Transform effect

---

## 🎯 Key Visual Indicators

### ✅ Working Correctly If You See:
1. **WhatsApp icon** is green
2. **Phone icon** is orange
3. **Send button** is green gradient
4. **Call button** is orange gradient
5. **Stars** are gold colored
6. **Social icons** have correct colors
7. **Map** loads and is interactive
8. **All text** is readable
9. **Hover effects** work smoothly
10. **Animations** are smooth (not janky)

### ❌ Problem Indicators:
- Icons not showing (check react-icons installed)
- Map not loading (check iframe src)
- Colors look wrong (check CSS variables)
- Hover effects not working (check CSS)
- Layout broken on mobile (check responsive CSS)

---

## 🚀 Quick Test Scenarios

### Scenario 1: "I want to contact via WhatsApp"
1. Type message in textarea
2. Watch counter update
3. Click "Send on WhatsApp"
4. Verify WhatsApp opens with message
**Expected Time:** 10 seconds

### Scenario 2: "I need the phone number"
1. Look at phone card
2. Click "Copy" button
3. See "Copied!" confirmation
4. Paste somewhere to verify
**Expected Time:** 5 seconds

### Scenario 3: "I want to visit the shop"
1. Scroll to location section
2. Read address and hours
3. Click "Get Directions"
4. Google Maps opens with location
**Expected Time:** 15 seconds

### Scenario 4: "I want to follow on social media"
1. Scroll to Connect With Us
2. Hover over each card (see effects)
3. Click Instagram card
4. Instagram profile opens
**Expected Time:** 10 seconds

---

## 💡 Pro Tips

### Best Way to Experience:
1. **Full screen view** first - see desktop layout
2. **Hover slowly** over elements - watch effects
3. **Resize browser** - test responsive design
4. **Use real phone** - test tel: and WhatsApp links
5. **Try all interactions** - complete checklist above

### Look for Polish:
- Smooth animations (no lag)
- Consistent spacing
- Aligned elements
- Readable text
- Working links
- Proper colors
- Interactive feedback

---

## 🎉 Success Criteria

**The page is perfect if:**
✅ You can send WhatsApp message easily
✅ Copying phone number works instantly
✅ All social links work
✅ Map is interactive
✅ All hover effects are smooth
✅ Everything looks professional
✅ Mobile layout works well
✅ No console errors
✅ All colors match theme
✅ Text is readable everywhere

---

## 📸 Visual Elements to Notice

### Header
- Big gradient title: "Get In Touch"
- Smooth fade-in animation from top

### Contact Cards
- Glassmorphism effect (semi-transparent)
- Lift on hover (transform)
- Border color changes
- Shadow increases

### Social Cards
- Shimmer effect on hover
- Brand colors on hover
- Arrow slides right
- Opens in new tab

### Location Section
- Star rating with gold stars
- Facility tags with emojis
- Interactive Google Maps
- Action buttons with icons

### Bottom Cards
- Large emojis as icons
- Clear descriptions
- Hover lift effect
- Orange border on hover

---

**Everything should feel smooth, professional, and easy to use! 🎨✨**

If anything looks off or doesn't work, check the browser console (F12) for errors.
