import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens matching the web application's CSS variables EXACTLY
class AppColors {
  // ── Homepage Dark Theme (variables.css / theme.css) ──
  static const Color primary = Color(0xFF6366F1);       // --primary
  static const Color primaryDark = Color(0xFF4F46E5);    // --primary-dark
  static const Color primaryLight = Color(0xFF818CF8);   // --primary-light
  static const Color secondary = Color(0xFFA855F7);      // --secondary
  static const Color secondaryLight = Color(0xFFC084FC); // --secondary-light
  static const Color accent = Color(0xFFEC4899);         // --accent

  // Status
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Dark backgrounds (Home, Slide Menu)
  static const Color dark = Color(0xFF0F172A);           // --dark
  static const Color darkLight = Color(0xFF1E293B);      // --dark-light
  static const Color darkLighter = Color(0xFF334155);    // --dark-lighter
  static const Color darkOverlay = Color(0xF00F172A);

  // Dark-theme text
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFE2E8F0);  // --text-secondary
  static const Color textMuted = Color(0xFF94A3B8);       // --text-muted
  static const Color gray = Color(0xFF64748B);            // --gray-dark

  // Dark-theme borders
  static const Color borderLight = Color(0x1AFFFFFF);    // rgba(255,255,255,0.1)
  static const Color borderMedium = Color(0x33FFFFFF);

  // Booking status
  static const Color available = Color(0xFF10B981);
  static const Color partial = Color(0xFFF59E0B);
  static const Color full = Color(0xFFEF4444);

  // Card (dark)
  static const Color cardBg = Color(0x991E293B);         // rgba(30,41,59,0.6)

  // ── Light / Orange Theme (Booking, Games, Membership, Profile, Login) ──
  static const Color lpPrimary = Color(0xFFFF6B35);      // --booking-primary / --lp-primary
  static const Color lpPrimaryDark = Color(0xFFE85A2A);  // --booking-primary-dark
  static const Color lpPrimaryLight = Color(0xFFFF8C5F);
  static const Color lpSecondary = Color(0xFFFF9966);    // --booking-secondary
  static const Color lpAccent = Color(0xFFFFB84D);       // --booking-accent
  static const Color lpBg = Color(0xFFFFF8F5);           // light warm bg
  static const Color lpWhite = Color(0xFFFFFFFF);
  static const Color lpGray = Color(0xFF6C757D);
  static const Color lpDark = Color(0xFF212529);
  static const Color lpGray100 = Color(0xFFF8F9FA);
  static const Color lpGray200 = Color(0xFFE9ECEF);
  static const Color lpGray300 = Color(0xFFDEE2E6);
  static const Color lpGray700 = Color(0xFF495057);
  static const Color lpError = Color(0xFFDC3545);
  static const Color lpSuccess = Color(0xFF28A745);

  // ── Gradients ──
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF6366F1), Color(0xFFA855F7)],
  );

  static const LinearGradient darkGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
  );

  // Orange gradient used across Booking/Games/Membership pages
  static const LinearGradient orangeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF6B35), Color(0xFFFF9966)],
  );

  // Light page background gradient
  static const LinearGradient lightPageBg = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xFFFFFFFF),   // white
      Color(0xFFFFF5F0),   // very light orange
      Color(0xFFFFE8DC),   // light peach
      Color(0xFFFFFFFF),   // white
    ],
    stops: [0.0, 0.3, 0.6, 1.0],
  );

  // Login page gradient
  static const LinearGradient loginBg = LinearGradient(
    begin: Alignment(-0.5, -1),
    end: Alignment(0.5, 1),
    colors: [
      Color(0xFFFFFFFF),
      Color(0xFFFFF7F3),
      Color(0xFFFFE8DC),
    ],
    stops: [0.0, 0.4, 1.0],
  );

  // Profile page gradient
  static const LinearGradient profileBg = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF5F7FA), Color(0xFFC3CFE2)],
  );
}

class GameSpotTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.dark,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.darkLight,
        error: AppColors.error,
      ),
      textTheme: GoogleFonts.interTextTheme(
        const TextTheme(
          displayLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
          displayMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
          displaySmall: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          headlineLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700),
          headlineMedium: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          headlineSmall: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          titleLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          titleMedium: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
          titleSmall: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
          bodyLarge: TextStyle(color: AppColors.textSecondary),
          bodyMedium: TextStyle(color: AppColors.textMuted),
          bodySmall: TextStyle(color: AppColors.textMuted),
          labelLarge: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.dark.withOpacity(0.85),
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.spaceGrotesk(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.dark,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkLight,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: const TextStyle(color: AppColors.textMuted),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.borderLight,
        thickness: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.darkLight,
        contentTextStyle: const TextStyle(color: AppColors.textPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
