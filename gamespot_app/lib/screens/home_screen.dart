import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

/// HomeScreen — full-viewport dark hero matching web's HomePage.css
/// Hamburger top-left → slide-out drawer from LEFT, login/avatar top-right
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  bool _menuOpen = false;
  late AnimationController _menuAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _menuAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _slideAnim = Tween<Offset>(begin: const Offset(-1, 0), end: Offset.zero)
        .animate(CurvedAnimation(parent: _menuAnim, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _menuAnim.dispose();
    super.dispose();
  }

  void _openMenu() {
    setState(() => _menuOpen = true);
    _menuAnim.forward();
  }

  void _closeMenu() {
    _menuAnim.reverse().then((_) {
      if (mounted) setState(() => _menuOpen = false);
    });
  }

  void _navigate(String path) {
    _closeMenu();
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) context.go(path);
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          // ── Dark gradient background (replaces video) ──
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

          // ── Top bar: hamburger + login/avatar ──
          Positioned(
            top: 0, left: 0, right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _iconBtn(FeatherIcons.menu, _openMenu),
                    if (!auth.isAuthenticated)
                      GestureDetector(
                        onTap: () => context.push('/login'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.white.withOpacity(0.12)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(FeatherIcons.logIn, size: 16, color: Colors.white),
                              SizedBox(width: 8),
                              Text('Login', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14)),
                            ],
                          ),
                        ),
                      )
                    else
                      GestureDetector(
                        onTap: () => context.go('/profile'),
                        child: Container(
                          width: 42, height: 42,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 10)],
                          ),
                          child: Center(
                            child: Text(auth.userInitial, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 17)),
                          ),
                        ),
                      ),
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
                  Image.asset(
                    'assets/images/logo.png',
                    width: size.width * 0.6,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => ShaderMask(
                      shaderCallback: (b) => AppColors.primaryGradient.createShader(b),
                      child: const Text('GAMESPOT', style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 6)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('NEXT-GEN GAMING AWAITS', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textSecondary, letterSpacing: 3)),
                  const SizedBox(height: 6),
                  Text('PS5  •  Xbox  •  VR', style: TextStyle(fontSize: 12, color: AppColors.textMuted.withOpacity(0.7), letterSpacing: 2)),
                  const SizedBox(height: 36),

                  // BOOK NOW gradient button
                  SizedBox(
                    width: double.infinity,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 6))],
                      ),
                      child: ElevatedButton(
                        onPressed: () => context.go('/booking'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent, shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('BOOK NOW', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: 3, color: Colors.white)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Console icons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _ConsoleIcon(asset: 'assets/images/ps5Icon.png', label: 'PS5'),
                      _sep(),
                      _ConsoleIcon(asset: 'assets/images/xboxIcon.png', label: 'Xbox'),
                      _sep(),
                      _ConsoleIcon(asset: 'assets/images/metaIcon.png', label: 'VR'),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ── Quick actions at bottom ──
          Positioned(
            bottom: 100, left: 20, right: 20,
            child: Row(
              children: [
                _QuickAction(icon: FeatherIcons.gift, label: 'Offers', onTap: () => context.go('/offers')),
                const SizedBox(width: 10),
                _QuickAction(icon: FeatherIcons.phone, label: 'Contact', onTap: () => context.go('/contact')),
                const SizedBox(width: 10),
                _QuickAction(icon: FeatherIcons.bell, label: 'Updates', onTap: () => context.go('/updates')),
              ],
            ),
          ),

          // ── Overlay ──
          if (_menuOpen)
            GestureDetector(
              onTap: _closeMenu,
              child: AnimatedBuilder(
                animation: _menuAnim,
                builder: (_, __) => Container(color: Colors.black.withOpacity(0.6 * _menuAnim.value)),
              ),
            ),

          // ── Slide menu from LEFT ──
          if (_menuOpen)
            Positioned(
              top: 0, bottom: 0, left: 0,
              width: size.width * 0.82,
              child: SlideTransition(
                position: _slideAnim,
                child: _SlideMenu(auth: auth, onClose: _closeMenu, onNavigate: _navigate),
              ),
            ),
        ],
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42, height: 42,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _sep() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 18),
    child: Text('|', style: TextStyle(fontSize: 22, color: AppColors.textMuted.withOpacity(0.25))),
  );
}

// ── Console Icon ──
class _ConsoleIcon extends StatelessWidget {
  final String asset;
  final String label;
  const _ConsoleIcon({required this.asset, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Image.asset(asset, width: 36, height: 36,
          errorBuilder: (_, __, ___) => Icon(FeatherIcons.monitor, size: 28, color: AppColors.textMuted)),
        const SizedBox(height: 6),
        Text(label, style: TextStyle(fontSize: 11, color: AppColors.textMuted.withOpacity(0.8))),
      ],
    );
  }
}

// ── Quick Action ──
class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: Column(
            children: [
              Icon(icon, size: 20, color: AppColors.primaryLight),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════
// Slide Menu — matches web's .slide-menu
// ═══════════════════════════════════════
class _SlideMenu extends StatelessWidget {
  final AuthProvider auth;
  final VoidCallback onClose;
  final void Function(String) onNavigate;
  const _SlideMenu({required this.auth, required this.onClose, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFA0A0F1E),
        border: Border(right: BorderSide(color: Color(0x1AFFFFFF))),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 12, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ShaderMask(
                    shaderCallback: (b) => const LinearGradient(colors: [AppColors.primaryLight, AppColors.accent]).createShader(b),
                    child: const Text('GAMESPOT', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 1.5)),
                  ),
                  IconButton(icon: const Icon(FeatherIcons.x, color: Colors.white54, size: 20), onPressed: onClose),
                ],
              ),
            ),

            // User section
            if (auth.isAuthenticated) ...[
              Container(
                margin: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withOpacity(0.06)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 46, height: 46,
                      decoration: BoxDecoration(gradient: AppColors.primaryGradient, borderRadius: BorderRadius.circular(12)),
                      child: Center(child: Text(auth.userInitial, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18))),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(auth.userName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 2),
                          Text(auth.userEmail, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 4),

            // Menu items
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _secTitle('MAIN'),
                    _Item(icon: FeatherIcons.home, label: 'Home', desc: 'Dashboard', onTap: () => onNavigate('/')),
                    _Item(icon: FeatherIcons.calendar, label: 'Book Session', desc: 'Reserve your spot', iconColor: const Color(0xFF22C55E), onTap: () => onNavigate('/booking')),
                    _Item(icon: FeatherIcons.grid, label: 'Games Library', desc: 'Browse games', onTap: () => onNavigate('/games')),
                    _Item(icon: FeatherIcons.award, label: 'Membership', desc: 'Plans & pricing', iconColor: const Color(0xFFF59E0B), onTap: () => onNavigate('/membership')),
                    _secTitle('EXPLORE'),
                    _Item(icon: FeatherIcons.gift, label: 'Offers', desc: 'Instagram promo', iconColor: const Color(0xFFFF4757), onTap: () => onNavigate('/offers')),
                    _Item(icon: FeatherIcons.monitor, label: 'Rentals', desc: 'VR & PS5 rental', onTap: () => onNavigate('/rental')),
                    _Item(icon: FeatherIcons.bell, label: 'Updates', desc: 'News & events', onTap: () => onNavigate('/updates')),
                    _secTitle('SUPPORT'),
                    _Item(icon: FeatherIcons.phone, label: 'Contact', desc: 'Get in touch', onTap: () => onNavigate('/contact')),
                    _Item(icon: FeatherIcons.messageSquare, label: 'Feedback', desc: 'Share your thoughts', onTap: () => onNavigate('/feedback')),
                    if (auth.isAuthenticated) ...[
                      const SizedBox(height: 8),
                      _Item(icon: FeatherIcons.user, label: 'Profile', desc: 'Your account', onTap: () => onNavigate('/profile')),
                      _Item(icon: FeatherIcons.logOut, label: 'Logout', desc: 'Sign out', iconColor: const Color(0xFFEF4444), onTap: () async { onClose(); await auth.logout(); }),
                    ] else ...[
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: () => onNavigate('/login'),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(gradient: AppColors.primaryGradient, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 15)]),
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
                    ],
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.white.withOpacity(0.06))), color: Colors.black.withOpacity(0.15)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('GameSpot Kodungallur', style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.25))),
                  Text('v1.0', style: TextStyle(fontSize: 10, color: Colors.white.withOpacity(0.2))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _secTitle(String t) => Padding(
    padding: const EdgeInsets.fromLTRB(10, 16, 0, 6),
    child: Text(t, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primary.withOpacity(0.6), letterSpacing: 1.5)),
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
    final c = iconColor ?? Colors.white.withOpacity(0.7);
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
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.06), borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.white.withOpacity(0.08))),
              child: Icon(icon, size: 18, color: c),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.9))),
                  Text(desc, style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.35))),
                ],
              ),
            ),
            Icon(FeatherIcons.chevronRight, size: 16, color: Colors.white.withOpacity(0.15)),
          ],
        ),
      ),
    );
  }
}
