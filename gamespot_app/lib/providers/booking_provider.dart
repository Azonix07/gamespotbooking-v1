import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// BookingProvider — manages booking flow state (mirrors web app flow)
class BookingProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;

  // State
  String _selectedDate = '';
  String? _selectedTime;
  List<Map<String, dynamic>> _slots = [];
  List<Map<String, dynamic>> _ps5Bookings = [];
  Map<String, dynamic>? _drivingSim;
  double _price = 0;
  double _originalPrice = 0;
  Map<String, dynamic>? _discountInfo;
  bool _loading = false;
  bool _priceLoading = false;
  String? _error;
  String? _success;
  int _currentStep = 1;
  Map<String, dynamic>? _dayClosedInfo;

  // Step 2: availability data from getSlotDetails
  List<int> _availablePS5Units = [];
  bool _availableDriving = true;
  int _totalPlayersBooked = 0;

  // Customer info (Step 3)
  String _customerName = '';
  String _customerPhone = '';

  // Games
  List<Map<String, dynamic>> _allGames = [];
  bool _gamesLoading = false;

  // Getters
  String get selectedDate => _selectedDate;
  String? get selectedTime => _selectedTime;
  List<Map<String, dynamic>> get slots => _slots;
  List<Map<String, dynamic>> get ps5Bookings => _ps5Bookings;
  Map<String, dynamic>? get drivingSim => _drivingSim;
  double get price => _price;
  double get originalPrice => _originalPrice;
  Map<String, dynamic>? get discountInfo => _discountInfo;
  bool get loading => _loading;
  bool get priceLoading => _priceLoading;
  String? get error => _error;
  String? get success => _success;
  int get currentStep => _currentStep;
  Map<String, dynamic>? get dayClosedInfo => _dayClosedInfo;
  List<int> get availablePS5Units => _availablePS5Units;
  bool get availableDriving => _availableDriving;
  int get totalPlayersBooked => _totalPlayersBooked;
  String get customerName => _customerName;
  String get customerPhone => _customerPhone;
  List<Map<String, dynamic>> get allGames => _allGames;
  bool get gamesLoading => _gamesLoading;

  BookingProvider() {
    _selectedDate = _getToday();
  }

  String _getToday() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  void setDate(String date) {
    _selectedDate = date;
    _selectedTime = null;
    _ps5Bookings = [];
    _drivingSim = null;
    _price = 0;
    _originalPrice = 0;
    _currentStep = 1;
    _error = null;
    notifyListeners();
    loadSlots();
  }

  /// Select a time slot → fetches slot details → moves to step 2
  Future<void> selectTimeSlot(String time) async {
    _selectedTime = time;
    _ps5Bookings = [];
    _drivingSim = null;
    _price = 0;
    _originalPrice = 0;
    _error = null;

    try {
      _loading = true;
      notifyListeners();

      final response = await _api.getSlotDetails(_selectedDate, time, 60);
      _availablePS5Units = List<int>.from(response['available_ps5_units'] ?? []);
      _availableDriving = response['available_driving'] ?? true;
      _totalPlayersBooked = response['total_ps5_players_booked'] ?? 0;
      _currentStep = 2;
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void setTime(String time) {
    _selectedTime = time;
    _currentStep = 2;
    notifyListeners();
  }

  void setStep(int step) {
    _currentStep = step;
    notifyListeners();
  }

  Future<void> loadSlots() async {
    try {
      _loading = true;
      _error = null;
      _dayClosedInfo = null;
      notifyListeners();

      final response = await _api.getSlots(_selectedDate);
      _slots = List<Map<String, dynamic>>.from(response['slots'] ?? []);

      if (response['is_closed'] == true) {
        _dayClosedInfo = {
          'is_closed': true,
          'reason': response['closure_reason'] ?? 'Shop closed for the day',
        };
      }
    } catch (e) {
      _error = e.toString();
      _slots = [];
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> loadGames() async {
    try {
      _gamesLoading = true;
      notifyListeners();
      final response = await _api.getGames();
      _allGames = List<Map<String, dynamic>>.from(response['games'] ?? []);
    } catch (e) {
      // games are optional
    } finally {
      _gamesLoading = false;
      notifyListeners();
    }
  }

  // ── PS5 booking helpers (match web app device-first flow) ──

  void togglePS5Unit(int unitNumber) {
    final idx = _ps5Bookings.indexWhere((b) => b['device_number'] == unitNumber);
    if (idx >= 0) {
      _ps5Bookings.removeAt(idx);
    } else {
      _ps5Bookings.add({
        'device_number': unitNumber,
        'player_count': 1,
        'duration': 60,
      });
    }
    notifyListeners();
    _updatePrice();
  }

  void setPS5PlayerCount(int unitNumber, int count) {
    final idx = _ps5Bookings.indexWhere((b) => b['device_number'] == unitNumber);
    if (idx >= 0) {
      if (_ps5Bookings[idx]['player_count'] == count) {
        // Tapping same count deselects the unit
        _ps5Bookings.removeAt(idx);
      } else {
        _ps5Bookings[idx] = {..._ps5Bookings[idx], 'player_count': count};
      }
    } else {
      _ps5Bookings.add({
        'device_number': unitNumber,
        'player_count': count,
        'duration': 60,
      });
    }
    notifyListeners();
    _updatePrice();
  }

  void setPS5Duration(int unitNumber, int duration) {
    final idx = _ps5Bookings.indexWhere((b) => b['device_number'] == unitNumber);
    if (idx >= 0) {
      _ps5Bookings[idx] = {..._ps5Bookings[idx], 'duration': duration};
      notifyListeners();
      _updatePrice();
    }
  }

  void addPS5Booking(Map<String, dynamic> booking) {
    _ps5Bookings.add(booking);
    notifyListeners();
    _updatePrice();
  }

  void removePS5Booking(int index) {
    if (index < _ps5Bookings.length) {
      _ps5Bookings.removeAt(index);
      notifyListeners();
      _updatePrice();
    }
  }

  void updatePS5Booking(int index, Map<String, dynamic> booking) {
    if (index < _ps5Bookings.length) {
      _ps5Bookings[index] = booking;
      notifyListeners();
      _updatePrice();
    }
  }

  // ── Driving Sim ──

  void toggleDrivingSim() {
    if (_drivingSim != null) {
      _drivingSim = null;
    } else {
      _drivingSim = {'duration': 60, 'afterPS5': false};
    }
    notifyListeners();
    _updatePrice();
  }

  void setDrivingDuration(int duration) {
    if (_drivingSim != null) {
      _drivingSim = {..._drivingSim!, 'duration': duration};
      notifyListeners();
      _updatePrice();
    }
  }

  void setDrivingAfterPS5(bool afterPS5) {
    if (_drivingSim != null) {
      _drivingSim = {..._drivingSim!, 'afterPS5': afterPS5};
      notifyListeners();
      _updatePrice();
    }
  }

  void setDrivingSim(Map<String, dynamic>? sim) {
    _drivingSim = sim;
    notifyListeners();
    _updatePrice();
  }

  // ── Customer info ──

  void setCustomerName(String name) {
    _customerName = name;
    notifyListeners();
  }

  void setCustomerPhone(String phone) {
    _customerPhone = phone;
    notifyListeners();
  }

  // ── Price ──

  Future<void> _updatePrice() async {
    if (_ps5Bookings.isEmpty && _drivingSim == null) {
      _price = 0;
      _originalPrice = 0;
      _discountInfo = null;
      notifyListeners();
      return;
    }

    try {
      _priceLoading = true;
      notifyListeners();

      final maxDuration = _ps5Bookings.isNotEmpty
          ? _ps5Bookings
              .map<int>((b) => (b['duration'] as int?) ?? 60)
              .reduce((a, b) => a > b ? a : b)
          : (_drivingSim?['duration'] as int?) ?? 60;

      final response = await _api.calculatePrice(
        ps5Bookings: _ps5Bookings,
        drivingSim: _drivingSim != null,
        durationMinutes: maxDuration,
      );

      _price = (response['total_price'] ?? response['price'] ?? 0).toDouble();
      _originalPrice = (response['original_price'] ?? _price).toDouble();
      if (response['has_discount'] == true && response['membership'] != null) {
        _discountInfo = {
          'percentage': response['discount_percentage'],
          'membership': response['membership'],
          'amount': response['discount_amount'] ?? (_originalPrice - _price),
        };
      } else {
        _discountInfo = null;
      }
    } catch (e) {
      // Silently fail — price will show 0
    } finally {
      _priceLoading = false;
      notifyListeners();
    }
  }

  // ── Submit booking ──

  Future<Map<String, dynamic>> createBooking(Map<String, dynamic> bookingData) async {
    try {
      _loading = true;
      _error = null;
      notifyListeners();

      final response = await _api.createBooking(bookingData);

      if (response['success'] == true) {
        _success = 'Booking confirmed!';
        _loading = false;
        notifyListeners();
        return response;
      } else {
        _error = response['error'] ?? 'Booking failed';
        _loading = false;
        notifyListeners();
        return response;
      }
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return {'success': false, 'error': _error};
    }
  }

  /// Submit all bookings (one per device, like the web app)
  Future<Map<String, dynamic>> submitBooking() async {
    if (_customerName.trim().length < 2) {
      _error = 'Please enter a valid name (min 2 characters)';
      notifyListeners();
      return {'success': false, 'error': _error};
    }
    if (_customerPhone.replaceAll(RegExp(r'\D'), '').length < 10) {
      _error = 'Please enter a valid phone number (min 10 digits)';
      notifyListeners();
      return {'success': false, 'error': _error};
    }
    if (_ps5Bookings.isEmpty && _drivingSim == null) {
      _error = 'Please select at least one device';
      notifyListeners();
      return {'success': false, 'error': _error};
    }

    try {
      _loading = true;
      _error = null;
      notifyListeners();

      // Create one booking per PS5 device (matching web app behavior)
      final futures = <Future<Map<String, dynamic>>>[];

      for (final ps5 in _ps5Bookings) {
        futures.add(_api.createBooking({
          'customer_name': _customerName,
          'customer_phone': _customerPhone,
          'booking_date': _selectedDate,
          'start_time': _selectedTime,
          'duration_minutes': ps5['duration'] ?? 60,
          'ps5_bookings': [ps5],
          'driving_sim': false,
          'driving_after_ps5': false,
          'total_price': _price,
        }));
      }

      if (_drivingSim != null) {
        String drivingStartTime = _selectedTime!;
        if (_drivingSim!['afterPS5'] == true && _ps5Bookings.isNotEmpty) {
          final maxPS5 = _ps5Bookings
              .map<int>((b) => (b['duration'] as int?) ?? 60)
              .reduce((a, b) => a > b ? a : b);
          final parts = _selectedTime!.split(':');
          final totalMin = int.parse(parts[0]) * 60 + int.parse(parts[1]) + maxPS5;
          final h = (totalMin ~/ 60).toString().padLeft(2, '0');
          final m = (totalMin % 60).toString().padLeft(2, '0');
          drivingStartTime = '$h:$m';
        }

        futures.add(_api.createBooking({
          'customer_name': _customerName,
          'customer_phone': _customerPhone,
          'booking_date': _selectedDate,
          'start_time': drivingStartTime,
          'duration_minutes': _drivingSim!['duration'] ?? 60,
          'ps5_bookings': [],
          'driving_sim': true,
          'driving_after_ps5': _drivingSim!['afterPS5'] == true && _ps5Bookings.isNotEmpty,
          'total_price': _price,
        }));
      }

      final responses = await Future.wait(futures);
      final first = responses.first;

      if (first['success'] == true) {
        _success = 'Booking confirmed!';
        _loading = false;
        notifyListeners();
        return first;
      } else {
        _error = first['error'] ?? 'Booking failed';
        _loading = false;
        notifyListeners();
        return first;
      }
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
      return {'success': false, 'error': _error};
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void clearSuccess() {
    _success = null;
    notifyListeners();
  }

  void reset() {
    _selectedDate = _getToday();
    _selectedTime = null;
    _slots = [];
    _ps5Bookings = [];
    _drivingSim = null;
    _price = 0;
    _originalPrice = 0;
    _discountInfo = null;
    _currentStep = 1;
    _error = null;
    _success = null;
    _availablePS5Units = [];
    _availableDriving = true;
    _totalPlayersBooked = 0;
    _customerName = '';
    _customerPhone = '';
    notifyListeners();
  }
}
