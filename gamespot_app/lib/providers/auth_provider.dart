import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';
import '../services/api_service.dart';

/// AuthProvider — mirrors the web app's AuthContext.tsx
class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;
  final ApiClient _client = ApiClient();

  Map<String, dynamic>? _user;
  bool _isAdmin = false;
  bool _isAuthenticated = false;
  bool _loading = true;
  String? _error;

  // Getters
  Map<String, dynamic>? get user => _user;
  bool get isAdmin => _isAdmin;
  bool get isAuthenticated => _isAuthenticated;
  bool get loading => _loading;
  String? get error => _error;
  String get userName => _user?['name'] ?? _user?['username'] ?? 'User';
  String get userEmail => _user?['email'] ?? '';
  String get userPhone => _user?['phone'] ?? '';
  String get userInitial => userName.isNotEmpty ? userName[0].toUpperCase() : 'U';
  Map<String, dynamic>? get userMembership => _user?['membership'] as Map<String, dynamic>?;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    await _client.init();

    // Check cached login state
    final prefs = await SharedPreferences.getInstance();
    final wasLoggedIn = prefs.getBool('gamespot_logged_in') ?? false;
    final storedUserType = prefs.getString('gamespot_user_type');

    if (wasLoggedIn) {
      _isAuthenticated = true;
      _isAdmin = storedUserType == 'admin';
      _user = {'name': _isAdmin ? 'Admin' : 'User'};
      _loading = false;
      notifyListeners();
    }

    // Verify with server
    await checkSession();
  }

  Future<Map<String, dynamic>> checkSession({bool force = false}) async {
    try {
      _loading = true;
      notifyListeners();

      final data = await _api.checkSession();

      if (data['authenticated'] == true) {
        if (data['user_type'] == 'admin') {
          _isAdmin = true;
          _user = {
            'name': data['user']?['username'] ?? 'Admin',
            ...?data['user'],
          };
        } else {
          _isAdmin = false;
          _user = data['user'];
        }
        _isAuthenticated = true;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('gamespot_logged_in', true);
        await prefs.setString('gamespot_user_type', data['user_type'] ?? 'customer');
      } else {
        _clearState();
      }
      _error = null;
    } catch (e) {
      _clearState();
    } finally {
      _loading = false;
      notifyListeners();
    }
    return {'authenticated': _isAuthenticated, 'user': _user, 'isAdmin': _isAdmin};
  }

  Future<Map<String, dynamic>> login(String identifier, String password) async {
    try {
      _loading = true;
      _error = null;
      notifyListeners();

      final data = await _api.login(identifier, password);

      if (data['success'] == true) {
        if (data['user_type'] == 'admin') {
          _isAdmin = true;
          _user = {'name': data['username'] ?? 'Admin'};
        } else {
          _isAdmin = false;
          _user = data['user'] ?? {'name': identifier};
        }
        _isAuthenticated = true;

        // Save token
        if (data['token'] != null) {
          await _client.setAccessToken(data['token']);
        }

        // Cache state
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('gamespot_logged_in', true);
        await prefs.setString('gamespot_user_type', data['user_type'] ?? 'customer');

        _loading = false;
        notifyListeners();
        return {'success': true, 'userType': data['user_type']};
      } else {
        _error = data['error'] ?? 'Login failed';
        _loading = false;
        notifyListeners();
        return {'success': false, 'error': _error};
      }
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return {'success': false, 'error': _error};
    }
  }

  Future<Map<String, dynamic>> signup(Map<String, dynamic> formData) async {
    try {
      _loading = true;
      _error = null;
      notifyListeners();

      final data = await _api.signup(formData);

      if (data['success'] == true) {
        if (data['needs_verification'] == true) {
          _loading = false;
          notifyListeners();
          return {
            'success': true,
            'needs_verification': true,
            'message': data['message'],
          };
        }
        _isAdmin = false;
        _user = data['user'] ?? {
          'name': formData['name'],
          'email': formData['email'],
        };
        _isAuthenticated = true;

        if (data['token'] != null) {
          await _client.setAccessToken(data['token']);
        }

        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('gamespot_logged_in', true);
        await prefs.setString('gamespot_user_type', 'customer');

        _loading = false;
        notifyListeners();
        return {'success': true};
      } else {
        _error = data['error'] ?? 'Signup failed';
        _loading = false;
        notifyListeners();
        return {'success': false, 'error': _error};
      }
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return {'success': false, 'error': _error};
    }
  }

  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {}
    await _client.clearTokens();
    _clearState();
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _clearState() async {
    _user = null;
    _isAdmin = false;
    _isAuthenticated = false;
    _error = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('gamespot_logged_in');
    await prefs.remove('gamespot_user_type');
  }
}
