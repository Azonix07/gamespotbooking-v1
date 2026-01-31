# 🎨 GAMESPOT THEME SYSTEM

## Complete Color Theme Management

A centralized CSS variables system that controls the entire website's appearance from a single file.

---

## 📁 File Location

**Main Theme File:** `frontend/src/styles/theme.css`

This file contains all color variables, spacing, typography, and theme alternatives for the entire website.

---

## 🎯 How It Works

### Current Setup

The theme system uses **CSS Custom Properties (variables)** defined in `:root` that cascade throughout the entire application.

```css
:root {
  --primary: #6366f1;        /* Main purple color */
  --secondary: #a855f7;      /* Violet accent */
  --dark: #0f172a;           /* Background */
  /* ...and 100+ more variables */
}
```

All components reference these variables:
```css
.button {
  background: var(--primary);     /* Uses theme color */
  color: var(--white);
  border-radius: var(--radius-md);
}
```

---

## 🎨 Available Themes

### 1. Default Theme (Purple/Violet) - ✅ Active

**Primary:** Purple/Violet gradient
**Usage:** Default - no class needed

```html
<!-- Default theme is active by default -->
<body>...</body>
```

**Colors:**
- Primary: `#6366f1` (Purple)
- Secondary: `#a855f7` (Violet)
- Accent: Various purples

---

### 2. Blue Theme

**Primary:** Blue/Cyan
**Usage:** Add class `theme-blue` to body

```html
<body class="theme-blue">...</body>
```

**Colors:**
- Primary: `#3b82f6` (Blue)
- Secondary: `#06b6d4` (Cyan)
- Accent: Ocean blues

---

### 3. Green Theme

**Primary:** Emerald/Teal
**Usage:** Add class `theme-green` to body

```html
<body class="theme-green">...</body>
```

**Colors:**
- Primary: `#10b981` (Emerald)
- Secondary: `#14b8a6` (Teal)
- Accent: Nature greens

---

### 4. Red Theme

**Primary:** Red/Pink
**Usage:** Add class `theme-red` to body

```html
<body class="theme-red">...</body>
```

**Colors:**
- Primary: `#ef4444` (Red)
- Secondary: `#ec4899` (Pink)
- Accent: Warm reds

---

### 5. Dark Mode (Enhanced)

**Style:** Pure black backgrounds
**Usage:** Add class `theme-dark` to body

```html
<body class="theme-dark">...</body>
```

**Effect:** Even darker than default

---

### 6. Light Mode

**Style:** White/light backgrounds
**Usage:** Add class `theme-light` to body

```html
<body class="theme-light">...</body>
```

**Effect:** Complete light theme (inverted colors)

---

## 🔧 How to Change Theme

### Method 1: Modify Default Theme (Permanent)

Edit `frontend/src/styles/theme.css`:

```css
:root {
  /* Change these values */
  --primary: #your-color;
  --primary-light: #your-light-color;
  --primary-dark: #your-dark-color;
}
```

### Method 2: Apply Alternative Theme (Quick Switch)

Edit `frontend/public/index.html`:

```html
<!-- Change the body tag -->
<body class="theme-blue">  <!-- or theme-green, theme-red, etc. -->
  <div id="root"></div>
</body>
```

### Method 3: Dynamic Theme Switching (Advanced)

Create a theme switcher component:

```javascript
// ThemeSwitcher.jsx
const ThemeSwitcher = () => {
  const changeTheme = (theme) => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  };

  return (
    <div>
      <button onClick={() => changeTheme('')}>Purple (Default)</button>
      <button onClick={() => changeTheme('theme-blue')}>Blue</button>
      <button onClick={() => changeTheme('theme-green')}>Green</button>
      <button onClick={() => changeTheme('theme-red')}>Red</button>
    </div>
  );
};
```

---

## 📊 Available Color Variables

### Primary Colors
```css
--primary              /* Main theme color */
--primary-light        /* Lighter shade */
--primary-dark         /* Darker shade */
--primary-darker       /* Even darker */
--secondary            /* Secondary accent */
--secondary-light      /* Light secondary */
--secondary-dark       /* Dark secondary */
```

### Status Colors
```css
--success              /* Green - positive actions */
--success-light        /* Light green */
--warning              /* Orange - warnings */
--warning-light        /* Gold/light orange */
--error                /* Red - errors */
--error-light          /* Light red */
--info                 /* Blue - information */
```

### Background Colors
```css
--dark                 /* Main background */
--dark-light           /* Lighter background */
--dark-lighter         /* Even lighter */
--card-bg              /* Card backgrounds */
--card-bg-hover        /* Card hover state */
--card-gradient        /* Gradient backgrounds */
```

### Text Colors
```css
--white                /* Primary text */
--light-gray           /* Secondary text */
--gray                 /* Muted text */
--text-primary         /* Main text */
--text-secondary       /* Secondary text */
--text-muted           /* Muted text */
```

### Border & Effects
```css
--border-light         /* Light borders */
--border-medium        /* Medium borders */
--hover-overlay        /* Hover effects */
--focus-ring           /* Focus rings */
--shadow-sm/md/lg/xl   /* Shadow levels */
```

---

## 🎨 Gradient Variables

```css
--gradient-primary     /* Primary color gradient */
--gradient-purple      /* Purple gradient */
--gradient-violet      /* Violet gradient */
```

**Usage:**
```css
.hero {
  background: var(--gradient-primary);
}
```

---

## 📐 Design System Variables

### Border Radius
```css
--radius-sm            /* 6px - small corners */
--radius-md            /* 8px - medium */
--radius-lg            /* 12px - large */
--radius-xl            /* 16px - extra large */
--radius-full          /* 9999px - fully rounded */
```

### Spacing
```css
--spacing-xs           /* 4px */
--spacing-sm           /* 8px */
--spacing-md           /* 16px */
--spacing-lg           /* 24px */
--spacing-xl           /* 32px */
--spacing-2xl          /* 48px */
```

### Typography
```css
--font-size-xs         /* 12px */
--font-size-sm         /* 14px */
--font-size-base       /* 16px */
--font-size-lg         /* 18px */
--font-size-xl         /* 20px */
--font-size-2xl        /* 24px */
--font-size-3xl        /* 32px */
--font-size-4xl        /* 40px */
```

### Transitions
```css
--transition-fast      /* 0.15s */
--transition-base      /* 0.2s */
--transition-medium    /* 0.3s */
--transition-slow      /* 0.5s */
```

---

## 🛠️ Utility Classes

The theme system includes ready-to-use utility classes:

### Text Colors
```html
<span class="text-primary">Primary colored text</span>
<span class="text-success">Success text</span>
<span class="text-error">Error text</span>
```

### Backgrounds
```html
<div class="bg-primary">Primary background</div>
<div class="bg-gradient-primary">Gradient background</div>
```

### Shadows
```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-glow">Glowing shadow</div>
```

### Border Radius
```html
<div class="rounded-sm">Small corners</div>
<div class="rounded-lg">Large corners</div>
<div class="rounded-full">Fully rounded</div>
```

### Animations
```html
<div class="animate-fadeIn">Fades in</div>
<div class="animate-slideUp">Slides up</div>
<div class="animate-pulse">Pulses</div>
```

---

## 📝 Creating Custom Themes

### Step 1: Add Theme Class

Edit `frontend/src/styles/theme.css`:

```css
/* Custom Orange Theme */
.theme-orange {
  --primary: #f97316;
  --primary-light: #fb923c;
  --primary-dark: #ea580c;
  --primary-darker: #c2410c;
  
  --secondary: #facc15;
  --secondary-light: #fde047;
  --secondary-dark: #eab308;
  
  --gradient-primary: linear-gradient(135deg, #f97316 0%, #facc15 100%);
  
  --focus-ring: rgba(249, 115, 22, 0.3);
  --focus-border: #f97316;
  --shadow-glow: 0 8px 20px rgba(249, 115, 22, 0.4);
}
```

### Step 2: Apply Theme

```html
<body class="theme-orange">
  <div id="root"></div>
</body>
```

---

## 🎯 Best Practices

### ✅ DO:
- Use CSS variables instead of hardcoded colors
- Reference theme variables: `var(--primary)`
- Add new colors to theme.css for consistency
- Use utility classes for common styles
- Test all themes before deploying

### ❌ DON'T:
- Hardcode color values: `color: #6366f1` ❌
- Use inline styles with colors
- Create duplicate color definitions
- Override theme variables in components

---

## 🔄 Migration Guide

### Converting Existing Components

**Before:**
```css
.button {
  background: #6366f1;
  color: white;
  border-radius: 8px;
  padding: 16px;
}
```

**After:**
```css
.button {
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}
```

---

## 🧪 Testing Themes

### Quick Test Script

Add to any component:

```javascript
const testThemes = () => {
  const themes = ['', 'theme-blue', 'theme-green', 'theme-red', 'theme-light'];
  let index = 0;
  
  setInterval(() => {
    document.body.className = themes[index];
    console.log('Theme:', themes[index] || 'default');
    index = (index + 1) % themes.length;
  }, 3000); // Change theme every 3 seconds
};

// Call in useEffect or console
testThemes();
```

---

## 📦 Files Using Theme Variables

All these files now use the centralized theme:
- ✅ `HomePage.css`
- ✅ `BookingPage.css`
- ✅ `AdminDashboard.css`
- ✅ `GamesPage.css`
- ✅ `Navbar.css`
- ✅ `modal.css`
- ✅ `buttons.css`
- ✅ `forms.css`

---

## 🎨 Color Palette Reference

### Default Purple Theme
```
Primary Colors:
████ #6366f1 (Purple)
████ #818cf8 (Light Purple)
████ #4f46e5 (Dark Purple)

Secondary:
████ #a855f7 (Violet)
████ #c084fc (Light Violet)

Backgrounds:
████ #0f172a (Dark)
████ #1e293b (Card)
```

### Blue Theme
```
████ #3b82f6 (Blue)
████ #60a5fa (Light Blue)
████ #06b6d4 (Cyan)
```

### Green Theme
```
████ #10b981 (Emerald)
████ #34d399 (Light Emerald)
████ #14b8a6 (Teal)
```

### Red Theme
```
████ #ef4444 (Red)
████ #f87171 (Light Red)
████ #ec4899 (Pink)
```

---

## 🚀 Quick Start Examples

### Example 1: Change to Blue Theme

```bash
# Edit frontend/public/index.html
<body class="theme-blue">
```

### Example 2: Create Button with Theme

```css
.my-button {
  background: var(--primary);
  color: var(--white);
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.my-button:hover {
  background: var(--primary-light);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}
```

### Example 3: Custom Color Variable

```css
:root {
  /* Add your custom color */
  --custom-gold: #fbbf24;
}

.gold-badge {
  background: var(--custom-gold);
}
```

---

## 📊 Variable Count

- **Color Variables:** 60+
- **Spacing Variables:** 6
- **Typography Variables:** 15+
- **Shadow Variables:** 5
- **Border Radius:** 5
- **Transition Variables:** 4
- **Total:** 95+ CSS Variables

---

## 🎉 Benefits

✅ **Single Source of Truth** - All colors in one file
✅ **Easy Theme Switching** - Change theme with one class
✅ **Consistency** - Same colors everywhere
✅ **Maintainability** - Update once, apply everywhere
✅ **Flexibility** - Create unlimited themes
✅ **Performance** - CSS variables are fast
✅ **No Build Step** - Works instantly
✅ **Browser Support** - 95%+ browsers

---

## 🔗 Related Files

- **Theme File:** `frontend/src/styles/theme.css`
- **Import:** `frontend/src/index.css`
- **HTML:** `frontend/public/index.html`

---

## 💡 Pro Tips

1. **Always use variables** instead of hardcoded colors
2. **Test new themes** before deploying
3. **Keep theme.css organized** with clear sections
4. **Document custom colors** you add
5. **Use utility classes** for rapid development
6. **Consider accessibility** when choosing colors
7. **Test contrast ratios** for readability

---

## ✨ Summary

The GameSpot theme system provides:
- 🎨 Centralized color management
- 🔄 Easy theme switching (6 themes included)
- 📦 95+ CSS variables
- 🛠️ Utility classes for common patterns
- 🎯 Consistent design system
- ⚡ No build step required

**To change the entire website's theme, just add a class to the body tag!**

```html
<body class="theme-blue">    <!-- Blue theme -->
<body class="theme-green">   <!-- Green theme -->
<body class="theme-red">     <!-- Red theme -->
<body>                       <!-- Purple (default) -->
```

**That's it! The entire website updates instantly!** 🚀
