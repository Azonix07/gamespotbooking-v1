import 'package:intl/intl.dart';

/// Utility functions — mirrors the web app's helpers.ts

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

String getToday() => formatDateYMD(DateTime.now());

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
