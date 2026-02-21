/// API Configuration — connects to the same backend as the web app
class ApiConfig {
  // Production backend URL (Railway)
  static const String baseUrl =
      'https://gamespotbooking-v1-production.up.railway.app';

  // For local development, uncomment below:
  // static const String baseUrl = 'http://10.0.2.2:5000'; // Android emulator
  // static const String baseUrl = 'http://localhost:5000'; // iOS simulator

  // Auth endpoints
  static const String login = '/api/auth/login';
  static const String signup = '/api/auth/signup';
  static const String logout = '/api/auth/logout';
  static const String checkSession = '/api/auth/check';
  static const String refreshToken = '/api/auth/refresh';
  static const String forgotPassword = '/api/auth/forgot-password';
  static const String resetPassword = '/api/auth/reset-password';
  static const String resendVerification = '/api/auth/resend-verification';
  static const String googleLogin = '/api/auth/google-login';

  // User
  static const String userProfile = '/api/user/profile';
  static const String userMe = '/api/auth/me';

  // Slots & Booking
  static const String slots = '/api/slots.php';
  static const String pricing = '/api/pricing.php';
  static const String bookings = '/api/bookings.php';
  static const String cancelBooking = '/api/user/bookings'; // /{id}/cancel

  // Games
  static const String games = '/api/games';
  static const String recommendations = '/api/games/recommendations';
  static const String recommendGame = '/api/games/recommend';
  static const String voteGame = '/api/games/vote';

  // Membership
  static const String membershipPlans = '/api/membership/plans';
  static const String membershipSubscribe = '/api/membership/subscribe';
  static const String membershipStatus = '/api/membership/status';
  static const String membershipCancel = '/api/membership/cancel';
  static const String membershipHistory = '/api/membership/history';
  static const String membershipUpgrade = '/api/membership/upgrade';
  static const String membershipRequestGame = '/api/membership/request-game';

  // Quest Pass
  static const String questPassInfo = '/api/quest-pass/info';
  static const String questPassStatus = '/api/quest-pass/status';
  static const String questPassSubscribe = '/api/quest-pass/subscribe';
  static const String questPassChangeGame = '/api/quest-pass/change-game';

  // Feedback
  static const String feedbackSubmit = '/api/feedback/submit';

  // Rentals
  static const String rentals = '/api/rentals';

  // Contact / Updates
  static const String updatesLatest = '/api/updates/latest';
  static const String updatesCategories = '/api/updates/categories';

  // Closures
  static const String checkClosures = '/api/closures/check';

  // Instagram Promo / Offers
  static const String instaPromoActive = '/api/instagram-promo/active';
  static const String instaPromoCheckEligibility =
      '/api/instagram-promo/check-eligibility';
  static const String instaPromoClaim = '/api/instagram-promo/claim';

  // Party Booking
  static const String partyBooking = '/api/party-booking';

  // Analytics
  static const String analyticsTrack = '/api/analytics/track';
}
