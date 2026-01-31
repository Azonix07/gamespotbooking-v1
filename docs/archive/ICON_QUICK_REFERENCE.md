# 🎨 Quick Button & Icon Reference Card

## 🚀 Quick Start - How to Use Icons in Buttons

### Step 1: Import Icon
```jsx
import { FiIconName } from 'react-icons/fi';
```

### Step 2: Use in Button
```jsx
<button className="btn btn-primary">
  <FiIconName /> Button Text
</button>
```

---

## 📋 All Icons Used in Project

### Admin Dashboard Icons
```jsx
import { 
  FiRefreshCw,     // Circular arrows (refresh)
  FiEdit2,         // Pencil (edit)
  FiTrash2,        // Trash bin (delete)
  FiSave,          // Floppy disk (save)
  FiX,             // X mark (cancel/close)
  FiHome,          // House (home)
  FiLogOut,        // Door with arrow (logout)
  FiBarChart2,     // Bar chart (dashboard)
  FiCalendar,      // Calendar (bookings)
  FiUsers,         // Multiple people (users)
  FiCreditCard,    // Credit card (memberships)
  FiSettings       // Gear (settings)
} from 'react-icons/fi';
```

### Booking Page Icons
```jsx
import { 
  FiArrowLeft,     // Left arrow (back)
  FiArrowRight,    // Right arrow (continue)
  FiCheckCircle    // Check mark in circle (confirm)
} from 'react-icons/fi';
```

### Login Page Icons (Already Implemented)
```jsx
import {
  FiMail,          // Envelope (email)
  FiLock,          // Padlock (password)
  FiUser,          // Person (username)
  FiPhone,         // Phone (phone number)
  FiEye,           // Eye (show password)
  FiEyeOff,        // Eye crossed (hide password)
  FiLogIn,         // Arrow to door (login)
  FiUserPlus,      // Person with plus (signup)
  FiAlertCircle,   // Exclamation in circle (error)
  FiCheckCircle    // Check in circle (success)
} from 'react-icons/fi';
```

---

## 🎨 Button Classes

### Button Types
```jsx
// Primary (purple gradient)
<button className="btn btn-primary">
  <FiSave /> Save
</button>

// Secondary (gray with border)
<button className="btn btn-secondary">
  <FiX /> Cancel
</button>

// Success (green gradient)
<button className="btn btn-success">
  <FiCheckCircle /> Confirm
</button>

// Danger (red gradient)
<button className="btn btn-danger">
  <FiTrash2 /> Delete
</button>

// Outline (transparent with border)
<button className="btn btn-outline">
  <FiHome /> Home
</button>
```

### Button Sizes
```jsx
// Small
<button className="btn btn-primary btn-sm">
  <FiEdit2 /> Edit
</button>

// Regular (default)
<button className="btn btn-primary">
  <FiSave /> Save
</button>

// Large
<button className="btn btn-primary btn-lg">
  <FiCheckCircle /> Confirm
</button>
```

---

## 🔍 Popular Feather Icons (Fi)

### Actions
- `FiPlus` - Add/Create
- `FiMinus` - Remove/Subtract
- `FiX` - Close/Cancel
- `FiCheck` - Confirm/Success
- `FiCheckCircle` - Success
- `FiAlertCircle` - Warning
- `FiInfo` - Information

### Navigation
- `FiArrowLeft` - Back
- `FiArrowRight` - Forward
- `FiArrowUp` - Up
- `FiArrowDown` - Down
- `FiChevronLeft` - Previous
- `FiChevronRight` - Next

### Files & Data
- `FiSave` - Save
- `FiDownload` - Download
- `FiUpload` - Upload
- `FiFile` - File
- `FiFolder` - Folder
- `FiCopy` - Copy
- `FiTrash2` - Delete

### Communication
- `FiMail` - Email
- `FiPhone` - Phone
- `FiMessageSquare` - Message
- `FiSend` - Send

### User & Account
- `FiUser` - User
- `FiUsers` - Multiple Users
- `FiUserPlus` - Add User
- `FiUserMinus` - Remove User
- `FiLogIn` - Login
- `FiLogOut` - Logout

### Settings & Tools
- `FiSettings` - Settings
- `FiTool` - Tools
- `FiEdit2` - Edit
- `FiEdit3` - Edit (alternate)
- `FiFilter` - Filter
- `FiSearch` - Search

### Media & UI
- `FiEye` - View/Show
- `FiEyeOff` - Hide
- `FiHeart` - Like/Favorite
- `FiStar` - Rating
- `FiImage` - Image
- `FiVideo` - Video
- `FiMusic` - Music

### Business
- `FiBarChart2` - Analytics
- `FiPieChart` - Statistics
- `FiTrendingUp` - Growth
- `FiDollarSign` - Money
- `FiCreditCard` - Payment
- `FiShoppingCart` - Cart
- `FiShoppingBag` - Purchase

### Status
- `FiLoader` - Loading (animate with spin)
- `FiRefreshCw` - Refresh
- `FiRefreshCcw` - Refresh (counter-clockwise)
- `FiRotateCw` - Rotate
- `FiClock` - Time
- `FiCalendar` - Calendar

---

## 🎯 Common Patterns

### Button with Loading State
```jsx
const [loading, setLoading] = useState(false);

<button className="btn btn-primary" disabled={loading}>
  {loading ? <FiLoader className="spin" /> : <FiSave />}
  {loading ? 'Saving...' : 'Save'}
</button>

// Add this CSS for spin animation
/* .spin { animation: spin 1s linear infinite; } */
```

### Icon-Only Button
```jsx
<button className="btn btn-sm" title="Edit">
  <FiEdit2 />
</button>
```

### Button Group
```jsx
<div className="action-buttons">
  <button className="btn btn-primary btn-sm">
    <FiEdit2 /> Edit
  </button>
  <button className="btn btn-danger btn-sm">
    <FiTrash2 /> Delete
  </button>
</div>
```

### Button with Badge
```jsx
<button className="btn btn-primary">
  <FiMail />
  Messages
  <span className="badge">5</span>
</button>
```

---

## 🎨 Customizing Icons

### Change Icon Size
```css
/* In your component/CSS */
.btn svg {
  width: 20px;
  height: 20px;
}

.btn-lg svg {
  width: 24px;
  height: 24px;
}
```

### Change Icon Color
```css
.btn-danger svg {
  color: #ef4444;
}

/* Or use currentColor to inherit */
svg {
  color: currentColor;
}
```

### Add Icon Animation
```css
/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

---

## 📱 Responsive Design

Icons automatically scale with button size:

```jsx
/* Mobile - smaller buttons */
@media (max-width: 768px) {
  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .btn svg {
    width: 16px;
    height: 16px;
  }
}
```

---

## 🔗 Useful Links

- **react-icons Docs**: https://react-icons.github.io/react-icons/
- **Feather Icons**: https://feathericons.com/
- **Icon Search**: https://react-icons.github.io/react-icons/search

---

## 💡 Pro Tips

1. **Consistency**: Stick to one icon library (Fi - Feather)
2. **Size**: Keep icon sizes consistent (16px small, 18px normal, 20px large)
3. **Spacing**: Always use gap between icon and text
4. **Accessibility**: Add `aria-label` for icon-only buttons
5. **Loading**: Use `<FiLoader className="spin" />` for loading states

---

## 🎉 You're Ready!

All buttons in your project now have professional icons. Use this guide whenever you need to add new buttons or icons.

**Happy Designing! 🚀**
