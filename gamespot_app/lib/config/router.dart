import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/home_screen.dart';
import '../screens/login_screen.dart';
import '../screens/signup_screen.dart';
import '../screens/booking_screen.dart';
import '../screens/games_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/membership_screen.dart';
import '../screens/contact_screen.dart';
import '../screens/feedback_screen.dart';
import '../screens/updates_screen.dart';
import '../screens/offers_screen.dart';
import '../screens/rental_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    // Splash screen
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    // Login / Signup
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignupScreen(),
    ),
    // All main screens — no bottom nav, side menu accessible everywhere
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/booking',
      builder: (context, state) => const BookingScreen(),
    ),
    GoRoute(
      path: '/games',
      builder: (context, state) => const GamesScreen(),
    ),
    GoRoute(
      path: '/membership',
      builder: (context, state) => const MembershipScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/contact',
      builder: (context, state) => const ContactScreen(),
    ),
    GoRoute(
      path: '/feedback',
      builder: (context, state) => const FeedbackScreen(),
    ),
    GoRoute(
      path: '/updates',
      builder: (context, state) => const UpdatesScreen(),
    ),
    GoRoute(
      path: '/offers',
      builder: (context, state) => const OffersScreen(),
    ),
    GoRoute(
      path: '/rental',
      builder: (context, state) => const RentalScreen(),
    ),
  ],
);
