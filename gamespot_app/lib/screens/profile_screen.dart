import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart';

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

    if (!auth.isAuthenticated) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: AppColors.profileBg),
          child: Center(child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.lpPrimary.withOpacity(0.1)),
                child: const Icon(FeatherIcons.user, size: 36, color: AppColors.lpPrimary),
              ),
              const SizedBox(height: 20),
              const Text('Sign in to view your profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
              const SizedBox(height: 8),
              const Text('Access your bookings, membership, and more', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
              const SizedBox(height: 24),
              Container(
                decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
                child: ElevatedButton(
                  onPressed: () => context.go('/login'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                ),
              ),
            ]),
          )),
        ),
      );
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.profileBg),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.lpPrimary))
            : RefreshIndicator(
                onRefresh: _loadProfile,
                color: AppColors.lpPrimary,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(bottom: 100),
                  child: SafeArea(child: Column(children: [
                    const SizedBox(height: 24),
                    // Avatar
                    Container(
                      width: 90, height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AppColors.orangeGradient,
                        boxShadow: [BoxShadow(color: AppColors.lpPrimary.withOpacity(0.3), blurRadius: 16)],
                      ),
                      child: Center(child: Text(auth.userInitial, style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: Colors.white))),
                    ),
                    const SizedBox(height: 14),
                    Text(auth.userName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                    const SizedBox(height: 4),
                    Text(auth.userEmail, style: const TextStyle(fontSize: 14, color: AppColors.lpGray)),
                    if (auth.userPhone.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(auth.userPhone, style: const TextStyle(fontSize: 13, color: AppColors.lpGray)),
                    ],
                    const SizedBox(height: 24),
                    // Membership card
                    if (auth.userMembership != null) _MembershipCard(membership: auth.userMembership!),
                    // Stats row
                    if (_profile != null) Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      child: Row(children: [
                        _StatCard(label: 'Bookings', value: '${_profile!['total_bookings'] ?? _bookings.length}', icon: FeatherIcons.calendar),
                        const SizedBox(width: 12),
                        _StatCard(label: 'Points', value: '${_profile!['points'] ?? _profile!['reward_points'] ?? 0}', icon: FeatherIcons.star),
                        const SizedBox(width: 12),
                        _StatCard(label: 'Level', value: _profile!['level']?.toString() ?? 'New', icon: FeatherIcons.award),
                      ]),
                    ),
                    // Quick actions
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      child: Container(
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
                        child: Column(children: [
                          _ActionTile(icon: FeatherIcons.calendar, label: 'My Bookings', color: AppColors.lpPrimary, onTap: () => context.go('/booking')),
                          const Divider(height: 1, indent: 56),
                          _ActionTile(icon: FeatherIcons.award, label: 'Membership', color: AppColors.secondary, onTap: () => context.go('/membership')),
                          const Divider(height: 1, indent: 56),
                          _ActionTile(icon: FeatherIcons.gift, label: 'Offers', color: AppColors.success, onTap: () => context.go('/offers')),
                          const Divider(height: 1, indent: 56),
                          _ActionTile(icon: FeatherIcons.messageSquare, label: 'Feedback', color: AppColors.info, onTap: () => context.go('/feedback')),
                          const Divider(height: 1, indent: 56),
                          _ActionTile(icon: FeatherIcons.phone, label: 'Contact Us', color: AppColors.warning, onTap: () => context.go('/contact')),
                        ]),
                      ),
                    ),
                    // Booking history
                    if (_bookings.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.fromLTRB(20, 12, 20, 8),
                        child: Align(alignment: Alignment.centerLeft, child: Text('Recent Bookings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.lpDark))),
                      ),
                      ...(_bookings.take(5).map((b) => _BookingCard(booking: Map<String, dynamic>.from(b)))),
                    ],
                    const SizedBox(height: 20),
                    // Logout
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: SizedBox(width: double.infinity, child: OutlinedButton.icon(
                        onPressed: () async { await auth.logout(); if (mounted) context.go('/login'); },
                        icon: const Icon(FeatherIcons.logOut, size: 18),
                        label: const Text('Logout'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.lpError,
                          side: const BorderSide(color: AppColors.lpError),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      )),
                    ),
                  ])),
                ),
              ),
      ),
    );
  }
}

class _MembershipCard extends StatelessWidget {
  final Map<String, dynamic> membership;
  const _MembershipCard({required this.membership});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8), padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: AppColors.lpPrimary.withOpacity(0.3), blurRadius: 12)]),
      child: Row(children: [
        Container(width: 48, height: 48, decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(14)), child: const Icon(FeatherIcons.award, color: Colors.white, size: 22)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(membership['plan_name']?.toString() ?? 'Member', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 2),
          Text('Expires: ${membership['expires_at'] ?? 'N/A'}', style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.8))),
        ])),
        Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)), child: const Text('Active', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white))),
      ]),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label; final String value; final IconData icon;
  const _StatCard({required this.label, required this.value, required this.icon});
  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
      child: Column(children: [
        Icon(icon, size: 20, color: AppColors.lpPrimary),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.lpGray)),
      ]),
    ));
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon; final String label; final Color color; final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(width: 38, height: 38, decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 18, color: color)),
      title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.lpDark)),
      trailing: const Icon(FeatherIcons.chevronRight, size: 18, color: AppColors.lpGray),
      onTap: onTap,
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;
  const _BookingCard({required this.booking});
  @override
  Widget build(BuildContext context) {
    final status = booking['status']?.toString() ?? 'pending';
    final Color statusColor = status == 'confirmed' ? AppColors.success : status == 'cancelled' ? AppColors.error : AppColors.warning;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4), padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6)]),
      child: Row(children: [
        Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.lpPrimary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(FeatherIcons.monitor, size: 20, color: AppColors.lpPrimary)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(booking['console_name']?.toString() ?? booking['console']?.toString() ?? 'Console', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
          const SizedBox(height: 2),
          Text('${formatDateDisplay(booking['date']?.toString() ?? '')} • ${booking['time']?.toString() ?? ''}', style: const TextStyle(fontSize: 12, color: AppColors.lpGray)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
          child: Text(status[0].toUpperCase() + status.substring(1), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
        ),
      ]),
    );
  }
}
