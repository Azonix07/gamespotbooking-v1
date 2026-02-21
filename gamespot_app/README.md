# GameSpot Mobile App 🎮

A Flutter mobile application for **GameSpot Kodungallur** that mirrors the web application's design and connects to the same backend API — keeping both web and mobile in perfect sync.

## 📱 Features

- **Booking System** — 3-step wizard: date/time → device selection → checkout
- **Games Library** — Browse all available games, search, filter by genre
- **Membership Plans** — View and subscribe to membership plans
- **Profile & History** — View booking history, Quest Pass progress, cancel bookings
- **Contact & WhatsApp** — Quick WhatsApp messages, location, social links
- **Feedback** — Submit suggestions, bug reports, feature requests
- **Updates & News** — Latest news with category filters
- **Offers** — Instagram promo flow with discount codes
- **Device Rental** — Rent VR headsets & PS5 consoles

## 🏗️ Architecture

```
lib/
├── main.dart                 # App entry with MultiProvider
├── config/
│   ├── api_config.dart       # All backend API endpoints
│   ├── router.dart           # go_router configuration (all routes)
│   └── theme.dart            # Design tokens matching web CSS variables
├── services/
│   ├── api_client.dart       # HTTP client with JWT auth, retry, refresh
│   └── api_service.dart      # All API methods (mirrors web api.ts)
├── providers/
│   ├── auth_provider.dart    # Authentication state (mirrors AuthContext.tsx)
│   ├── booking_provider.dart # Booking flow state management
│   ├── games_provider.dart   # Games library state
│   └── membership_provider.dart # Membership plans state
├── screens/
│   ├── splash_screen.dart    # Animated splash with grid background
│   ├── home_screen.dart      # Landing page with hero + quick actions
│   ├── login_screen.dart     # Login form (light theme, orange accent)
│   ├── signup_screen.dart    # Signup with password strength indicator
│   ├── booking_screen.dart   # 3-step booking wizard
│   ├── games_screen.dart     # Game library + wishlist tabs
│   ├── profile_screen.dart   # User profile + booking history
│   ├── membership_screen.dart # Membership plans
│   ├── contact_screen.dart   # Contact info + WhatsApp
│   ├── feedback_screen.dart  # Feedback form
│   ├── updates_screen.dart   # News & updates
│   ├── offers_screen.dart    # Instagram promo flow
│   └── rental_screen.dart    # Device rental
├── widgets/
│   └── main_shell.dart       # Bottom navigation shell
└── utils/
    └── helpers.dart           # Utility functions (mirrors web helpers.ts)
```

## 🚀 Setup Instructions

### Prerequisites
- **Flutter SDK** (3.22+): [Install Flutter](https://docs.flutter.dev/get-started/install)
- **Dart SDK** (3.4+): Comes with Flutter
- **Android Studio** or **Xcode** (for emulators)

### Step 1: Install Flutter SDK
```bash
# macOS (using Homebrew)
brew install flutter

# Or download from https://docs.flutter.dev/get-started/install/macos
```

### Step 2: Generate Native Platform Files
```bash
cd gamespot_app

# Create Android & iOS platform folders
flutter create --org com.gamespot --project-name gamespot_app .
```

### Step 3: Install Dependencies
```bash
flutter pub get
```

### Step 4: Run the App
```bash
# Check connected devices
flutter devices

# Run on a device/emulator
flutter run

# Run on specific device
flutter run -d chrome        # Web (for testing)
flutter run -d emulator-5554 # Android emulator
flutter run -d iPhone        # iOS simulator
```

### Step 5: Build for Release
```bash
# Android APK
flutter build apk --release

# Android App Bundle (for Play Store)
flutter build appbundle --release

# iOS
flutter build ios --release
```

## 🎨 Design System

The app mirrors the web application's dark theme:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#6366F1` | Buttons, active states |
| Secondary | `#8B5CF6` | Secondary actions |
| Accent | `#EC4899` | Highlights, badges |
| Dark BG | `#0A0A0F` | Main background |
| Dark Light | `#1A1A2E` | Card backgrounds |
| Success | `#10B981` | Confirmations |
| Error | `#EF4444` | Errors, warnings |

Login/Signup pages use a **light theme** with orange (`#FF6B35`) as the primary color.

## 🔗 Backend Connection

The app connects to the same Railway-hosted backend as the web app:
```
https://gamespotbooking-v1-production.up.railway.app
```

Authentication uses **JWT Bearer tokens** stored in Flutter Secure Storage (instead of HttpOnly cookies used by the web app).

## 📋 Tech Stack

- **Flutter** 3.22+ / Dart 3.4+
- **Provider** — State management
- **go_router** — Declarative routing
- **http** — HTTP client
- **flutter_secure_storage** — Secure token storage
- **cached_network_image** — Image caching
- **google_fonts** — Inter, Space Grotesk, Rajdhani fonts
- **flutter_feather_icons** — Feather icons (matching web)
- **url_launcher** — WhatsApp, phone, maps links
- **shimmer** — Loading skeleton effects
