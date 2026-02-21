import 'package:intl/intl.dart';

/// Utility functions — mirrors the web app's helpers.ts

// ── IST Timezone Helpers ──
// The booking system always operates in IST (Asia/Kolkata, UTC+5:30)
// so users in UK, US, etc. see the correct Kerala time.

/// Get current time in IST (Asia/Kolkata, UTC+5:30).
/// This ensures the app always works relative to Kerala time,
/// regardless of the device's timezone (e.g. UK, US, etc.).
DateTime getISTDate() {
  final now = DateTime.now().toUtc();
  // IST = UTC + 5 hours 30 minutes
  return now.add(const Duration(hours: 5, minutes: 30));
}

/// Get IST hours and minutes as a map {hours, minutes}
Map<String, int> getISTTime() {
  final ist = getISTDate();
  return {'hours': ist.hour, 'minutes': ist.minute};
}

String formatDateYMD(DateTime date) {
  return DateFormat('yyyy-MM-dd').format(date);
}

String formatDateDisplay(String dateStr) {
  try {
    final d = DateTime.parse(dateStr);
    return DateFormat('d MMM yyyy').format(d);
  } catch (e) {
    return dateStr;
  }
}

String formatTime12Hour(String time24) {
  if (time24.isEmpty) return '';
  try {
    final parts = time24.split(':');
    int hours = int.parse(parts[0]);
    int minutes = int.parse(parts[1]);
    final period = hours >= 12 ? 'PM' : 'AM';
    final hours12 = hours % 12 == 0 ? 12 : hours % 12;
    return '$hours12:${minutes.toString().padLeft(2, '0')} $period';
  } catch (e) {
    return time24;
  }
}

/// Get today's date in IST (Kerala time)
String getToday() => formatDateYMD(getISTDate());

String formatDuration(int minutes) {
  if (minutes == 30) return '30 minutes';
  if (minutes == 60) return '1 hour';
  if (minutes == 90) return '1.5 hours';
  if (minutes == 120) return '2 hours';
  return '$minutes minutes';
}

String formatPrice(double price) => '₹${price.toStringAsFixed(0)}';

bool isValidPhone(String phone) {
  final cleaned = phone.replaceAll(RegExp(r'\D'), '');
  return cleaned.length >= 10;
}

bool isValidName(String name) => name.trim().length >= 2;

bool isValidEmail(String email) {
  return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email);
}
