import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'app_drawer.dart';

/// Hamburger menu button — use on every page to open the slide-out drawer
class MenuButton extends StatelessWidget {
  /// If true, uses a light (white) style for dark backgrounds
  /// If false, uses a dark style for light backgrounds
  final bool light;

  const MenuButton({super.key, this.light = true});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => AppDrawer.open(context),
      child: Container(
        width: 42, height: 42,
        decoration: BoxDecoration(
          color: light
              ? Colors.white.withOpacity(0.08)
              : Colors.black.withOpacity(0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: light
                ? Colors.white.withOpacity(0.1)
                : Colors.black.withOpacity(0.08),
          ),
        ),
        child: Icon(
          FeatherIcons.menu,
          color: light ? Colors.white : const Color(0xFF212529),
          size: 20,
        ),
      ),
    );
  }
}
