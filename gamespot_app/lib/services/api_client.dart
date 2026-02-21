import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

/// Central API client — mirrors the web app's apiClient.ts
/// Handles JWT auth, token refresh, retries, and error handling.
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'gamespot_auth_token';
  static const _refreshKey = 'gamespot_refresh_token';

  String? _accessToken;

  /// Initialize — load token from secure storage
  Future<void> init() async {
    try {
      _accessToken = await _storage.read(key: _tokenKey);
    } catch (e) {
      // Keychain may not be available on simulator without entitlements
      _accessToken = null;
    }
  }

  /// Get current access token
  String? get accessToken => _accessToken;

  /// Set access token (after login)
  Future<void> setAccessToken(String? token) async {
    _accessToken = token;
    try {
      if (token != null) {
        await _storage.write(key: _tokenKey, value: token);
      } else {
        await _storage.delete(key: _tokenKey);
      }
    } catch (_) {
      // Keychain may not be available on simulator
    }
  }

  /// Clear all tokens (on logout)
  Future<void> clearTokens() async {
    _accessToken = null;
    try {
      await _storage.deleteAll();
    } catch (_) {
      // Keychain may not be available on simulator
    }
  }

  /// Build headers for requests
  Map<String, String> _headers({bool withContentType = true}) {
    final headers = <String, String>{};
    if (withContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  /// Refresh access token
  Future<bool> _refreshAccessToken() async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.refreshToken}'),
        headers: {'Content-Type': 'application/json'},
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['token'] != null) {
          await setAccessToken(data['token']);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Core fetch method with retry logic (mirrors fetchWithCredentials from web)
  Future<Map<String, dynamic>> fetch(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    int retries = 3,
    bool isRetry = false,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$path');
    final needsContentType = ['POST', 'PUT', 'PATCH', 'DELETE'].contains(method);

    http.Response response;
    try {
      switch (method) {
        case 'POST':
          response = await http
              .post(url,
                  headers: _headers(withContentType: needsContentType),
                  body: body != null ? json.encode(body) : null)
              .timeout(const Duration(seconds: 40));
          break;
        case 'PUT':
          response = await http
              .put(url,
                  headers: _headers(withContentType: needsContentType),
                  body: body != null ? json.encode(body) : null)
              .timeout(const Duration(seconds: 40));
          break;
        case 'DELETE':
          response = await http
              .delete(url, headers: _headers(withContentType: needsContentType))
              .timeout(const Duration(seconds: 40));
          break;
        default:
          response = await http
              .get(url, headers: _headers(withContentType: false))
              .timeout(const Duration(seconds: 40));
      }
    } catch (e) {
      if (retries > 0) {
        await Future.delayed(Duration(milliseconds: 2000 + (3 - retries) * 1500));
        return fetch(path, method: method, body: body, retries: retries - 1);
      }
      throw ApiException('Unable to connect to the server. Please try again.');
    }

    // Retry on 502/503/504 (Railway cold start)
    if ([502, 503, 504].contains(response.statusCode) && retries > 0) {
      await Future.delayed(const Duration(milliseconds: 2500));
      return fetch(path, method: method, body: body, retries: retries - 1);
    }

    Map<String, dynamic> data;
    try {
      data = json.decode(response.body);
    } catch (e) {
      if (retries > 0) {
        await Future.delayed(const Duration(milliseconds: 2000));
        return fetch(path, method: method, body: body, retries: retries - 1);
      }
      throw ApiException('Server returned an unexpected response. Please try again.');
    }

    // Handle 401 — try refresh
    if (response.statusCode == 401 && !isRetry) {
      final refreshed = await _refreshAccessToken();
      if (refreshed) {
        return fetch(path, method: method, body: body, isRetry: true);
      }
      await clearTokens();
    }

    if (response.statusCode == 429) {
      throw ApiException(data['error'] ?? 'Too many requests. Please try again later.');
    }

    if (response.statusCode >= 400) {
      throw ApiException(data['error'] ?? 'Something went wrong. Please try again.');
    }

    return data;
  }

  // Convenience methods
  Future<Map<String, dynamic>> get(String path) => fetch(path);

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) =>
      fetch(path, method: 'POST', body: body);

  Future<Map<String, dynamic>> put(String path, {Map<String, dynamic>? body}) =>
      fetch(path, method: 'PUT', body: body);

  Future<Map<String, dynamic>> delete(String path) =>
      fetch(path, method: 'DELETE');
}

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}
