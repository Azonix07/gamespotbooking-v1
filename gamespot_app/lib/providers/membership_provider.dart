import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// MembershipProvider — manages membership plans & status
class MembershipProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;

  Map<String, dynamic>? _categories;
  Map<String, dynamic>? _currentMembership;
  Map<String, dynamic>? _pendingMembership;
  bool _loading = false;
  String? _error;
  String? _successMsg;

  // Getters
  Map<String, dynamic>? get categories => _categories;
  Map<String, dynamic>? get currentMembership => _currentMembership;
  Map<String, dynamic>? get pendingMembership => _pendingMembership;
  bool get loading => _loading;
  String? get error => _error;
  String? get successMsg => _successMsg;

  Future<void> loadData({required bool isAuthenticated, required bool isAdmin}) async {
    try {
      _loading = true;
      _error = null;
      notifyListeners();

      final plansData = await _api.getMembershipPlans();
      if (plansData['success'] == true) {
        _categories = plansData['categories'];
      }

      if (isAuthenticated && !isAdmin) {
        final statusData = await _api.getMembershipStatus();
        if (statusData['success'] == true) {
          _currentMembership = statusData['has_membership'] == true
              ? statusData['membership']
              : null;
          _pendingMembership = statusData['has_pending'] == true
              ? statusData['pending_membership']
              : null;
        }
      }
    } catch (e) {
      _error = 'Failed to load membership plans';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> subscribe(String planType) async {
    try {
      _loading = true;
      _error = null;
      _successMsg = null;
      notifyListeners();

      final data = await _api.subscribeMembership(planType);
      if (data['success'] == true) {
        _successMsg = data['message'] ?? 'Membership request submitted!';
        return data;
      } else {
        _error = data['error'] ?? 'Subscription failed';
        return data;
      }
    } catch (e) {
      _error = e.toString();
      return {'success': false, 'error': _error};
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> upgrade(String planType) async {
    try {
      _loading = true;
      _error = null;
      _successMsg = null;
      notifyListeners();

      final data = await _api.requestMembershipUpgrade(planType);
      if (data['success'] == true) {
        _successMsg = data['message'] ?? 'Upgrade request submitted!';
        return data;
      } else {
        _error = data['error'] ?? 'Upgrade failed';
        return data;
      }
    } catch (e) {
      _error = e.toString();
      return {'success': false, 'error': _error};
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void clearMessages() {
    _error = null;
    _successMsg = null;
    notifyListeners();
  }
}
