import '../config/api_config.dart';
import 'api_client.dart';

/// API Service — mirrors the web app's api.ts
/// All API calls to the backend for the mobile app.
class ApiService {
  static final ApiService instance = ApiService._();
  ApiService._();

  final ApiClient _client = ApiClient();

  // ── Auth ──
  Future<Map<String, dynamic>> login(String identifier, String password) =>
      _client.post(ApiConfig.login, body: {
        'username': identifier,
        'email': identifier,
        'password': password,
      });

  Future<Map<String, dynamic>> signup(Map<String, dynamic> userData) =>
      _client.post(ApiConfig.signup, body: userData);

  Future<Map<String, dynamic>> logout() =>
      _client.post(ApiConfig.logout);

  Future<Map<String, dynamic>> checkSession() =>
      _client.get(ApiConfig.checkSession);

  Future<Map<String, dynamic>> getCurrentUser() =>
      _client.get(ApiConfig.userMe);

  Future<Map<String, dynamic>> forgotPassword(String email) =>
      _client.post(ApiConfig.forgotPassword, body: {'email': email});

  Future<Map<String, dynamic>> resetPassword(String token, String password, String confirmPassword) =>
      _client.post(ApiConfig.resetPassword, body: {
        'token': token,
        'password': password,
        'confirmPassword': confirmPassword,
      });

  Future<Map<String, dynamic>> resendVerification(String email) =>
      _client.post(ApiConfig.resendVerification, body: {'email': email});

  // ── Slots & Booking ──
  Future<Map<String, dynamic>> getSlots(String date) =>
      _client.get('${ApiConfig.slots}?date=$date');

  Future<Map<String, dynamic>> getSlotDetails(String date, String time, int duration) =>
      _client.get('${ApiConfig.slots}?date=$date&time=$time&duration=$duration');

  Future<Map<String, dynamic>> calculatePrice({
    required List<Map<String, dynamic>> ps5Bookings,
    required bool drivingSim,
    required int durationMinutes,
  }) =>
      _client.post(ApiConfig.pricing, body: {
        'ps5_bookings': ps5Bookings,
        'driving_sim': drivingSim,
        'duration_minutes': durationMinutes,
      });

  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> bookingData) =>
      _client.post(ApiConfig.bookings, body: bookingData);

  Future<Map<String, dynamic>> cancelUserBooking(int bookingId) =>
      _client.post('${ApiConfig.cancelBooking}/$bookingId/cancel');

  // ── Games ──
  Future<Map<String, dynamic>> getGames({String? ps5Filter}) {
    final url = ps5Filter != null
        ? '${ApiConfig.games}?ps5=$ps5Filter'
        : ApiConfig.games;
    return _client.get(url);
  }

  Future<Map<String, dynamic>> getRecommendations() =>
      _client.get(ApiConfig.recommendations);

  Future<Map<String, dynamic>> recommendGame(String gameName, {String description = ''}) =>
      _client.post(ApiConfig.recommendGame, body: {
        'game_name': gameName,
        'description': description,
      });

  Future<Map<String, dynamic>> voteForGame(int recommendationId) =>
      _client.post(ApiConfig.voteGame, body: {
        'recommendation_id': recommendationId,
      });

  // ── Membership ──
  Future<Map<String, dynamic>> getMembershipPlans() =>
      _client.get(ApiConfig.membershipPlans);

  Future<Map<String, dynamic>> subscribeMembership(String planType) =>
      _client.post(ApiConfig.membershipSubscribe, body: {'plan_type': planType});

  Future<Map<String, dynamic>> getMembershipStatus() =>
      _client.get(ApiConfig.membershipStatus);

  Future<Map<String, dynamic>> cancelMembership() =>
      _client.post(ApiConfig.membershipCancel);

  Future<Map<String, dynamic>> requestMembershipUpgrade(String planType) =>
      _client.post(ApiConfig.membershipUpgrade, body: {'plan_type': planType});

  Future<Map<String, dynamic>> requestDedicatedGame(String gameName) =>
      _client.post(ApiConfig.membershipRequestGame, body: {'game_name': gameName});

  // ── Quest Pass ──
  Future<Map<String, dynamic>> getQuestPassInfo() =>
      _client.get(ApiConfig.questPassInfo);

  Future<Map<String, dynamic>> getQuestPassStatus() =>
      _client.get(ApiConfig.questPassStatus);

  // ── Profile ──
  Future<Map<String, dynamic>> getUserProfile() =>
      _client.get(ApiConfig.userProfile);

  // ── Feedback ──
  Future<Map<String, dynamic>> submitFeedback(Map<String, dynamic> data) =>
      _client.post(ApiConfig.feedbackSubmit, body: data);

  // ── Updates ──
  Future<Map<String, dynamic>> getUpdates({int limit = 50, String? category}) {
    String url = '${ApiConfig.updatesLatest}?limit=$limit';
    if (category != null && category != 'all') {
      url += '&category=$category';
    }
    return _client.get(url);
  }

  Future<Map<String, dynamic>> getUpdateCategories() =>
      _client.get(ApiConfig.updatesCategories);

  // ── Closures ──
  Future<Map<String, dynamic>> checkClosures(String date) =>
      _client.get('${ApiConfig.checkClosures}?date=$date');

  // ── Instagram Promo / Offers ──
  Future<Map<String, dynamic>> getActivePromo() =>
      _client.get(ApiConfig.instaPromoActive);

  Future<Map<String, dynamic>> checkPromoEligibility() =>
      _client.get(ApiConfig.instaPromoCheckEligibility);

  Future<Map<String, dynamic>> claimPromo(Map<String, dynamic> data) =>
      _client.post(ApiConfig.instaPromoClaim, body: data);

  // ── Rentals ──
  Future<Map<String, dynamic>> getRentals() =>
      _client.get(ApiConfig.rentals);

  Future<Map<String, dynamic>> createRental(Map<String, dynamic> data) =>
      _client.post(ApiConfig.rentals, body: data);

  // ── Cancel booking (used by profile) ──
  Future<Map<String, dynamic>> cancelBooking(String bookingId) =>
      _client.post('${ApiConfig.cancelBooking}/$bookingId/cancel');

  // ── Party Booking ──
  Future<Map<String, dynamic>> createPartyBooking(Map<String, dynamic> data) =>
      _client.post(ApiConfig.partyBooking, body: data);
}
