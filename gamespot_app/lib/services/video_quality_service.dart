import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Adaptive video quality selector — mirrors web's detectBestVideo() in HomePageClient.tsx
/// Picks 480p / 720p / 1080p based on device capability + network speed
class VideoQualityService {
  // Videos served from the Next.js frontend (gamespotkdlr.com)
  static const String _baseUrl = 'https://gamespotkdlr.com';

  // Video URLs matching the web app's public/assets/videos
  static const String video480 = '$_baseUrl/assets/videos/background-480p.mp4';
  static const String video720 = '$_baseUrl/assets/videos/background-720p.mp4';
  static const String video1080 = '$_baseUrl/assets/videos/background-1080p.mp4';
  static const String poster = '$_baseUrl/assets/videos/poster.jpg';

  /// Detect the best video quality for this device.
  /// Returns the URL string for the appropriate quality tier.
  static Future<String> detectBestVideo() async {
    int deviceScore = 0;
    int networkScore = 0;

    // ── Device capability score (0–3) ──
    try {
      // Check total RAM (Android only via ProcessInfo; fallback to platform heuristic)
      final processorCount = Platform.numberOfProcessors;
      if (processorCount >= 4) deviceScore++;
      if (processorCount >= 6) deviceScore++;
      if (processorCount >= 8) deviceScore++;
    } catch (_) {
      deviceScore = 1; // conservative fallback
    }

    // ── Network speed score (0–3) ──
    try {
      final stopwatch = Stopwatch()..start();
      final response = await http.get(
        Uri.parse('$poster?_probe=${DateTime.now().millisecondsSinceEpoch}'),
      ).timeout(const Duration(seconds: 5));
      stopwatch.stop();

      if (response.statusCode == 200) {
        final bytes = response.bodyBytes.length;
        final seconds = stopwatch.elapsedMilliseconds / 1000.0;
        final mbps = (bytes * 8 / seconds) / 1000000; // Megabits per second

        debugPrint('[VideoQuality] Probe: ${bytes}B in ${seconds.toStringAsFixed(2)}s = ${mbps.toStringAsFixed(1)} Mbps');

        if (mbps > 2) networkScore++;   // decent connection
        if (mbps > 8) networkScore++;   // good connection
        if (mbps > 20) networkScore++;  // fast connection
      }
    } catch (e) {
      debugPrint('[VideoQuality] Network probe failed: $e');
      networkScore = 0; // conservative — use 480p on network error
    }

    final totalScore = deviceScore + networkScore; // 0–6

    debugPrint('[VideoQuality] Device=$deviceScore, Network=$networkScore, Total=$totalScore');

    // Score 0–2: 480p  (slow network or weak device)
    // Score 3–4: 720p  (mid-range)
    // Score 5–6: 1080p (fast + powerful)
    if (totalScore >= 5) return video1080;
    if (totalScore >= 3) return video720;
    return video480;
  }
}
