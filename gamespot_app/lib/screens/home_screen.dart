import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:video_player/video_player.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../services/video_quality_service.dart';
import '../widgets/app_drawer.dart';
import '../widgets/menu_button.dart';

/// HomeScreen — full-viewport dark hero matching web's HomePage
/// Background video with adaptive quality, hamburger → slide drawer
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Video player
  VideoPlayerController? _videoController;
  bool _videoReady = false;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  Future<void> _initVideo() async {
    try {
      final videoUrl = await VideoQualityService.detectBestVideo();
      debugPrint('[HomeScreen] Loading video: $videoUrl');

      final controller = VideoPlayerController.networkUrl(
        Uri.parse(videoUrl),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
      );

      await controller.initialize();
      controller.setLooping(true);
      controller.setVolume(0);
      controller.play();

      if (mounted) {
        setState(() {
          _videoController = controller;
          _videoReady = true;
        });
      }
    } catch (e) {
      debugPrint('[HomeScreen] Video load failed: $e');
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          // ── Video background (or gradient fallback) ──
          if (_videoReady && _videoController != null)
            SizedBox.expand(
              child: FittedBox(
                fit: BoxFit.cover,
                child: SizedBox(
                  width: _videoController!.value.size.width,
                  height: _videoController!.value.size.height,
                  child: VideoPlayer(_videoController!),
                ),
              ),
            )
          else
            Container(
              width: size.width,
              height: size.height,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFF080D1A), Color(0xFF0F172A), Color(0xFF141932), Color(0xFF0F172A)],
                ),
              ),
            ),

          // Dark overlay on video
          Positioned.fill(
            child: Container(color: Colors.black.withOpacity(_videoReady ? 0.45 : 0.0)),
          ),

          // Subtle radial glow
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0, -0.2),
                  radius: 1.4,
                  colors: [AppColors.primary.withOpacity(0.06), Colors.transparent],
                ),
              ),
            ),
          ),

          // Dark vignette
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  radius: 1.1,
                  colors: [Colors.transparent, Colors.black.withOpacity(0.5)],
                ),
              ),
            ),
          ),

          // ── Top bar: hamburger ──
          Positioned(
            top: 0, left: 0, right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    const MenuButton(light: true),
                  ],
                ),
              ),
            ),
          ),

          // ── Hero content ──
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo
                  Image.asset(
                    'assets/images/logo.png',
                    width: size.width * 0.55,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => ShaderMask(
                      shaderCallback: (b) => AppColors.primaryGradient.createShader(b),
                      child: const Text('GAMESPOT', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 6)),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const Text('NEXT-GEN GAMING AWAITS', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textSecondary, letterSpacing: 3)),
                  const SizedBox(height: 6),
                  Text('PS5  •  Xbox  •  VR', style: TextStyle(fontSize: 12, color: AppColors.textMuted.withOpacity(0.7), letterSpacing: 2)),
                  const SizedBox(height: 32),

                  // BOOK NOW — compact red button matching web's .cta-book-now-button
                  Center(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFFFF6B6B), Color(0xFFFF4757)],
                        ),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [BoxShadow(color: const Color(0xFFFF4757).withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 4))],
                      ),
                      child: ElevatedButton(
                        onPressed: () => context.go('/booking'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'BOOK NOW',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2,
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),

                  // Console icons — matching web sizes: ps5 & xbox small, meta larger
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Image.asset('assets/images/ps5Icon.png', height: 22, fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(FeatherIcons.monitor, size: 22, color: AppColors.textMuted)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text('|', style: TextStyle(fontSize: 20, color: Colors.white.withOpacity(0.2))),
                      ),
                      Image.asset('assets/images/xboxIcon.png', height: 22, fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(FeatherIcons.monitor, size: 22, color: AppColors.textMuted)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text('|', style: TextStyle(fontSize: 20, color: Colors.white.withOpacity(0.2))),
                      ),
                      Image.asset('assets/images/metaIcon.png', height: 55, fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(FeatherIcons.monitor, size: 28, color: AppColors.textMuted)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
