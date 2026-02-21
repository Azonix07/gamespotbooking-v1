import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

/// MainShell — bottom navigation matching web's mobile nav bar
/// Dark background with subtle border, gradient active indicator
/// Profile tab shows user initial when logged in
class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const _navItems = [
    _NavItem('/', FeatherIcons.home, 'Home'),
    _NavItem('/booking', FeatherIcons.calendar, 'Book'),
    _NavItem('/games', FeatherIcons.grid, 'Games'),
    _NavItem('/membership', FeatherIcons.award, 'Plans'),
    _NavItem('/profile', FeatherIcons.user, 'Profile'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    for (int i = 0; i < _navItems.length; i++) {
      if (location == _navItems[i].path ||
          (i == 0 && location == '/') ||
          location.startsWith(_navItems[i].path) && _navItems[i].path != '/') {
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.dark,
          border: const Border(top: BorderSide(color: AppColors.borderLight, width: 0.5)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.4), blurRadius: 24, offset: const Offset(0, -4)),
          ],
        ),
        child: Padding(
          padding: EdgeInsets.only(top: 8, bottom: bottomPadding > 0 ? bottomPadding : 8, left: 4, right: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(_navItems.length, (i) {
              final item = _navItems[i];
              final isActive = i == index;
              final isProfile = item.path == '/profile';
              return _NavButton(
                icon: item.icon,
                label: item.label,
                isActive: isActive,
                onTap: () {
                  if (i != index) context.go(item.path);
                },
                // Show user initial in profile tab when authenticated
                profileInitial: isProfile && auth.isAuthenticated ? auth.userInitial : null,
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final String path;
  final IconData icon;
  final String label;
  const _NavItem(this.path, this.icon, this.label);
}

class _NavButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;
  final String? profileInitial;

  const _NavButton({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
    this.profileInitial,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          gradient: isActive
              ? const LinearGradient(
                  colors: [Color(0x406366F1), Color(0x338B5CF6)], // matches web active nav gradient
                )
              : null,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Show user initial circle for Profile tab when logged in
            if (profileInitial != null)
              Container(
                width: 24, height: 24,
                decoration: BoxDecoration(
                  gradient: isActive ? AppColors.primaryGradient : null,
                  color: isActive ? null : AppColors.textMuted.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    profileInitial!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isActive ? Colors.white : AppColors.textMuted,
                    ),
                  ),
                ),
              )
            else
              Icon(
                icon,
                size: 22,
                color: isActive ? AppColors.primaryLight : AppColors.textMuted,
              ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                color: isActive ? AppColors.primaryLight : AppColors.textMuted,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
