import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

/// Global slide-out menu — reusable across all screens
/// Uses the booking page warm orange/white theme
class AppDrawer extends StatefulWidget {
  const AppDrawer({super.key});

  /// Convenience method to open the drawer from any screen
  static void open(BuildContext context) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close menu',
      barrierColor: Colors.black45,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (_, __, ___) => const AppDrawer(),
      transitionBuilder: (context, anim, _, child) {
        return SlideTransition(
          position: Tween<Offset>(begin: const Offset(-1, 0), end: Offset.zero)
              .animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic)),
          child: child,
        );
      },
    );
  }

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  void _navigate(String path) {
    Navigator.of(context).pop(); // close drawer
    Future.delayed(const Duration(milliseconds: 150), () {
      if (mounted) context.go(path);
    });
  }

  // Booking-page palette
  static const _primary = AppColors.lpPrimary;       // #FF6B35
  static const _primaryDark = AppColors.lpPrimaryDark; // #E85A2A
  static const _dark = AppColors.lpDark;              // #212529
  static const _gray = AppColors.lpGray;              // #6C757D
  static const _gray700 = AppColors.lpGray700;        // #495057
  static const _gray300 = AppColors.lpGray300;        // #DEE2E6
  static const _gray200 = AppColors.lpGray200;        // #E9ECEF

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final size = MediaQuery.of(context).size;

    return Align(
      alignment: Alignment.centerLeft,
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: size.width * 0.82,
          height: size.height,
          decoration: BoxDecoration(
            // Warm white/light-peach gradient matching BookingPage.css
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFFFFFFFF),   // white
                Color(0xFFFFF8F5),   // very light warm
                Color(0xFFFFF0E8),   // light peach
              ],
            ),
            boxShadow: [
              BoxShadow(color: _primary.withOpacity(0.12), blurRadius: 30, offset: const Offset(4, 0)),
            ],
          ),
          child: SafeArea(
            child: Column(
              children: [
                // ── Header: Logo + close ──
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 14, 8, 14),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: _primary.withOpacity(0.1))),
                    color: Colors.white,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Image.asset(
                        'assets/images/logo.png',
                        height: 30,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => ShaderMask(
                          shaderCallback: (b) => AppColors.orangeGradient.createShader(b),
                          child: const Text(
                            'GAMESPOT',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 1.5),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.of(context).pop(),
                        child: Container(
                          width: 38, height: 38,
                          decoration: BoxDecoration(
                            color: _gray200,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(FeatherIcons.x, color: _gray, size: 18),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── User section / Login ──
                if (auth.isAuthenticated) ...[
                  Container(
                    margin: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: AppColors.orangeGradient,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [BoxShadow(color: _primary.withOpacity(0.25), blurRadius: 12, offset: const Offset(0, 4))],
                    ),
                    child: GestureDetector(
                      onTap: () => _navigate('/profile'),
                      child: Row(
                        children: [
                          Container(
                            width: 44, height: 44,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Center(
                              child: Text(
                                auth.userInitial,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  auth.userName,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15),
                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  auth.userEmail,
                                  style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 12),
                                  maxLines: 1, overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          Icon(FeatherIcons.chevronRight, size: 16, color: Colors.white.withOpacity(0.6)),
                        ],
                      ),
                    ),
                  ),
                ] else ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                    child: GestureDetector(
                      onTap: () => _navigate('/login'),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          gradient: AppColors.orangeGradient,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [BoxShadow(color: _primary.withOpacity(0.3), blurRadius: 15)],
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(FeatherIcons.logIn, color: Colors.white, size: 18),
                            SizedBox(width: 10),
                            Text('Login / Sign Up', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],

                const SizedBox(height: 4),

                // ── Menu items ──
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _secTitle('MAIN'),
                        _Item(icon: FeatherIcons.home, label: 'Home', desc: 'Dashboard', onTap: () => _navigate('/')),
                        _Item(icon: FeatherIcons.calendar, label: 'Book Session', desc: 'Reserve your spot', iconColor: const Color(0xFF10B981), onTap: () => _navigate('/booking')),
                        _Item(icon: FeatherIcons.grid, label: 'Games Library', desc: 'Browse games', onTap: () => _navigate('/games')),
                        _Item(icon: FeatherIcons.award, label: 'Membership', desc: 'Plans & pricing', iconColor: const Color(0xFFF59E0B), onTap: () => _navigate('/membership')),
                        _secTitle('EXPLORE'),
                        _Item(icon: FeatherIcons.gift, label: 'Offers', desc: 'Instagram promo', iconColor: const Color(0xFFEF4444), onTap: () => _navigate('/offers')),
                        _Item(icon: FeatherIcons.monitor, label: 'Rentals', desc: 'VR & PS5 rental', onTap: () => _navigate('/rental')),
                        _Item(icon: FeatherIcons.bell, label: 'Updates', desc: 'News & events', onTap: () => _navigate('/updates')),
                        _secTitle('SUPPORT'),
                        _Item(icon: FeatherIcons.phone, label: 'Contact', desc: 'Get in touch', onTap: () => _navigate('/contact')),
                        _Item(icon: FeatherIcons.messageSquare, label: 'Feedback', desc: 'Share your thoughts', onTap: () => _navigate('/feedback')),
                        if (auth.isAuthenticated) ...[
                          const SizedBox(height: 8),
                          _Item(icon: FeatherIcons.user, label: 'Profile', desc: 'Your account', onTap: () => _navigate('/profile')),
                          _Item(
                            icon: FeatherIcons.logOut,
                            label: 'Logout',
                            desc: 'Sign out',
                            iconColor: const Color(0xFFEF4444),
                            onTap: () async {
                              Navigator.of(context).pop();
                              await auth.logout();
                            },
                          ),
                        ],
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),

                // ── Footer ──
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    border: Border(top: BorderSide(color: _gray300.withOpacity(0.6))),
                    color: Colors.white.withOpacity(0.6),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('GameSpot Kodungallur', style: TextStyle(fontSize: 10, color: _gray.withOpacity(0.6))),
                      Text('v1.0', style: TextStyle(fontSize: 10, color: _gray.withOpacity(0.4))),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _secTitle(String t) => Padding(
    padding: const EdgeInsets.fromLTRB(10, 16, 0, 6),
    child: Text(t, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: _primary.withOpacity(0.7), letterSpacing: 1.5)),
  );
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String label;
  final String desc;
  final Color? iconColor;
  final VoidCallback onTap;
  const _Item({required this.icon, required this.label, required this.desc, this.iconColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = iconColor ?? AppColors.lpPrimary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 2),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: c.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: c),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
                  Text(desc, style: TextStyle(fontSize: 11, color: AppColors.lpGray.withOpacity(0.7))),
                ],
              ),
            ),
            Icon(FeatherIcons.chevronRight, size: 16, color: AppColors.lpGray.withOpacity(0.3)),
          ],
        ),
      ),
    );
  }
}
