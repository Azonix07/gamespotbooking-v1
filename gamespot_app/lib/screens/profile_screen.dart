import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart';
import '../widgets/menu_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;
  List<dynamic> _bookings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.instance.getUserProfile();
      if (data['success'] == true || data['user'] != null) {
        _profile = data['user'] ?? data;
        _bookings = List.from(data['bookings'] ?? data['recent_bookings'] ?? []);
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    // ── Unauthenticated state — dark theme matching home ──
    if (!auth.isAuthenticated) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF080D1A), Color(0xFF0F172A), Color(0xFF141932)],
            ),
          ),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                // Hamburger menu at top
                const Align(alignment: Alignment.centerLeft, child: MenuButton(light: true)),
                const SizedBox(height: 24),
                // Avatar placeholder with glow
                Container(
                  width: 90, height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.primaryGradient,
                    boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 24)],
                  ),
                  child: const Icon(FeatherIcons.user, size: 40, color: Colors.white),
                ),
                const SizedBox(height: 24),
                const Text('Sign in to view your profile', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 8),
                Text('Access your bookings, membership, and more', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.5))),
                const SizedBox(height: 32),
                Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 20, offset: const Offset(0, 6))],
                  ),
                  child: ElevatedButton(
                    onPressed: () => context.go('/login'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent, shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(FeatherIcons.logIn, size: 18, color: Colors.white),
                        SizedBox(width: 10),
                        Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 1)),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ),
      );
    }

    // ── Authenticated profile — dark sleek design ──
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF080D1A), Color(0xFF0F172A), Color(0xFF141932)],
          ),
        ),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryLight))
            : RefreshIndicator(
                onRefresh: _loadProfile,
                color: AppColors.primaryLight,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(bottom: 100),
                  child: SafeArea(
                    child: Column(children: [
                      const SizedBox(height: 8),
                      // Hamburger menu
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 20),
                        child: Align(alignment: Alignment.centerLeft, child: MenuButton(light: true)),
                      ),
                      const SizedBox(height: 8),
                      // Header section with gradient background
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                        padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFA855F7)],
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 24, offset: const Offset(0, 8)),
                          ],
                        ),
                        child: Column(children: [
                          // Avatar circle
                          Container(
                            width: 80, height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.2),
                              border: Border.all(color: Colors.white.withOpacity(0.3), width: 2),
                            ),
                            child: Center(
                              child: Text(auth.userInitial, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: Colors.white)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(auth.userName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                          const SizedBox(height: 4),
                          Text(auth.userEmail, style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.7))),
                          if (auth.userPhone.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(auth.userPhone, style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.6))),
                          ],
                        ]),
                      ),
                      const SizedBox(height: 20),

                      // Membership card
                      if (auth.userMembership != null)
                        _MembershipCard(membership: auth.userMembership!),

                      // Stats row
                      if (_profile != null)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          child: Row(children: [
                            _StatCard(label: 'Bookings', value: '${_profile!['total_bookings'] ?? _bookings.length}', icon: FeatherIcons.calendar),
                            const SizedBox(width: 10),
                            _StatCard(label: 'Points', value: '${_profile!['points'] ?? _profile!['reward_points'] ?? 0}', icon: FeatherIcons.star),
                            const SizedBox(width: 10),
                            _StatCard(label: 'Level', value: _profile!['level']?.toString() ?? 'New', icon: FeatherIcons.award),
                          ]),
                        ),

                      // Quick actions
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withOpacity(0.08)),
                          ),
                          child: Column(children: [
                            _ActionTile(icon: FeatherIcons.calendar, label: 'My Bookings', color: AppColors.primaryLight, onTap: () => context.go('/booking')),
                            Divider(height: 1, indent: 56, color: Colors.white.withOpacity(0.06)),
                            _ActionTile(icon: FeatherIcons.award, label: 'Membership', color: const Color(0xFFF59E0B), onTap: () => context.go('/membership')),
                            Divider(height: 1, indent: 56, color: Colors.white.withOpacity(0.06)),
                            _ActionTile(icon: FeatherIcons.gift, label: 'Offers', color: const Color(0xFF10B981), onTap: () => context.go('/offers')),
                            Divider(height: 1, indent: 56, color: Colors.white.withOpacity(0.06)),
                            _ActionTile(icon: FeatherIcons.messageSquare, label: 'Feedback', color: const Color(0xFF3B82F6), onTap: () => context.go('/feedback')),
                            Divider(height: 1, indent: 56, color: Colors.white.withOpacity(0.06)),
                            _ActionTile(icon: FeatherIcons.phone, label: 'Contact Us', color: const Color(0xFFEC4899), onTap: () => context.go('/contact')),
                          ]),
                        ),
                      ),

                      // Booking history
                      if (_bookings.isNotEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text('Recent Bookings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white.withOpacity(0.9))),
                          ),
                        ),
                        ...(_bookings.take(5).map((b) => _BookingCard(booking: Map<String, dynamic>.from(b)))),
                      ],
                      const SizedBox(height: 20),

                      // Logout button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: SizedBox(
                          width: double.infinity,
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.error.withOpacity(0.4)),
                            ),
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                await auth.logout();
                                if (mounted) context.go('/login');
                              },
                              icon: const Icon(FeatherIcons.logOut, size: 18),
                              label: const Text('Logout'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.error.withOpacity(0.1),
                                foregroundColor: AppColors.error,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                elevation: 0,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ]),
                  ),
                ),
              ),
      ),
    );
  }
}

// ── Membership Card ──
class _MembershipCard extends StatelessWidget {
  final Map<String, dynamic> membership;
  const _MembershipCard({required this.membership});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFF6B35), Color(0xFFFF9966)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: const Color(0xFFFF6B35).withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Row(children: [
        Container(
          width: 50, height: 50,
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(14)),
          child: const Icon(FeatherIcons.award, color: Colors.white, size: 24),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(membership['plan_name']?.toString() ?? 'Member', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 4),
          Text('Expires: ${membership['expires_at'] ?? 'N/A'}', style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.8))),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
          child: const Text('Active', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white)),
        ),
      ]),
    );
  }
}

// ── Stat Card (dark) ──
class _StatCard extends StatelessWidget {
  final String label; final String value; final IconData icon;
  const _StatCard({required this.label, required this.value, required this.icon});
  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(children: [
        Icon(icon, size: 20, color: AppColors.primaryLight),
        const SizedBox(height: 10),
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5))),
      ]),
    ));
  }
}

// ── Action Tile (dark) ──
class _ActionTile extends StatelessWidget {
  final IconData icon; final String label; final Color color; final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, size: 18, color: color),
      ),
      title: Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white.withOpacity(0.9))),
      trailing: Icon(FeatherIcons.chevronRight, size: 18, color: Colors.white.withOpacity(0.3)),
      onTap: onTap,
    );
  }
}

// ── Booking Card (dark) ──
class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  const _BookingCard({required this.booking});
  @override
  Widget build(BuildContext context) {
    final status = booking['status']?.toString() ?? 'pending';
    final Color statusColor = status == 'confirmed' ? AppColors.success : status == 'cancelled' ? AppColors.error : AppColors.warning;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: AppColors.primaryLight.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
          child: const Icon(FeatherIcons.monitor, size: 20, color: AppColors.primaryLight),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(booking['console_name']?.toString() ?? booking['console']?.toString() ?? 'Console',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.9))),
          const SizedBox(height: 3),
          Text('${formatDateDisplay(booking['date']?.toString() ?? '')} • ${booking['time']?.toString() ?? ''}',
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.4))),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: statusColor.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
          child: Text(status[0].toUpperCase() + status.substring(1), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
        ),
      ]),
    );
  }
}
