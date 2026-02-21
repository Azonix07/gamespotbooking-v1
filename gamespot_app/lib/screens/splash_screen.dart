import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _progress;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200));
    _progress = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    _ctrl.forward();
    _ctrl.addStatusListener((s) {
      if (s == AnimationStatus.completed && mounted) context.go('/');
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dark,
      body: Stack(
        children: [
          // Purple glow top-right
          Positioned(top: -80, right: -80, child: Container(width: 240, height: 240, decoration: BoxDecoration(shape: BoxShape.circle, boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.15), blurRadius: 120)]))),
          // Purple glow bottom-left
          Positioned(bottom: -80, left: -80, child: Container(width: 200, height: 200, decoration: BoxDecoration(shape: BoxShape.circle, boxShadow: [BoxShadow(color: AppColors.secondary.withOpacity(0.12), blurRadius: 100)]))),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Logo
                Image.asset('assets/images/logo.png', width: 120, height: 120, errorBuilder: (_, __, ___) => Container(
                  width: 100, height: 100,
                  decoration: BoxDecoration(gradient: AppColors.primaryGradient, borderRadius: BorderRadius.circular(24)),
                  child: const Center(child: Text('GS', style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: Colors.white))),
                )),
                const SizedBox(height: 24),
                const Text('GAMESPOT', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 4)),
                const SizedBox(height: 6),
                Text('KODUNGALLUR', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textMuted, letterSpacing: 3)),
                const SizedBox(height: 40),
                // Progress bar
                SizedBox(
                  width: 180,
                  child: AnimatedBuilder(
                    animation: _progress,
                    builder: (_, __) => ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _progress.value,
                        backgroundColor: AppColors.darkLight,
                        valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                        minHeight: 4,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Loading...', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
