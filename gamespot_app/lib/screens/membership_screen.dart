import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../providers/membership_provider.dart';
import '../providers/auth_provider.dart';
import '../utils/helpers.dart';
import '../widgets/menu_button.dart';

class MembershipScreen extends StatefulWidget {
  const MembershipScreen({super.key});
  @override
  State<MembershipScreen> createState() => _MembershipScreenState();
}

class _MembershipScreenState extends State<MembershipScreen> {
  String _selectedCategory = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      context.read<MembershipProvider>().loadData(isAuthenticated: auth.isAuthenticated, isAdmin: auth.isAdmin);
    });
  }

  @override
  Widget build(BuildContext context) {
    final mp = context.watch<MembershipProvider>();
    List<Map<String, dynamic>> allPlans = [];
    if (mp.categories != null) {
      for (var entry in mp.categories!.entries) {
        final catName = entry.key;
        final plans = entry.value;
        if (plans is List) {
          for (var p in plans) {
            if (p is Map<String, dynamic>) allPlans.add({...p, '_cat': catName});
          }
        }
      }
    }
    List<String> cats = ['all'];
    if (mp.categories != null) cats.addAll(mp.categories!.keys);
    final filtered = _selectedCategory == 'all' ? allPlans : allPlans.where((p) => p['_cat'] == _selectedCategory).toList();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.lightPageBg),
        child: RefreshIndicator(
          onRefresh: () {
            final auth = context.read<AuthProvider>();
            return mp.loadData(isAuthenticated: auth.isAuthenticated, isAdmin: auth.isAdmin);
          },
          color: AppColors.lpPrimary,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: SafeArea(child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const MenuButton(light: false),
                  const SizedBox(height: 12),
                  const Text('Membership Plans', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                  const SizedBox(height: 4),
                  const Text('Choose the perfect plan', style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
                  const SizedBox(height: 16),
                ]),
              ))),
              // Current membership
              if (context.watch<AuthProvider>().userMembership != null)
                SliverToBoxAdapter(child: _CurrentCard(membership: context.watch<AuthProvider>().userMembership!)),
              // Category chips
              SliverToBoxAdapter(child: SizedBox(height: 42, child: ListView.builder(
                scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 20), itemCount: cats.length,
                itemBuilder: (_, i) {
                  final c = cats[i]; final a = _selectedCategory == c;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedCategory = c),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8), padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(gradient: a ? AppColors.orangeGradient : null, color: a ? null : Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: a ? Colors.transparent : AppColors.lpGray300)),
                      child: Text(c[0].toUpperCase() + c.substring(1), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: a ? Colors.white : AppColors.lpGray700)),
                    ),
                  );
                },
              ))),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),
              if (mp.loading) const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.lpPrimary)))
              else if (filtered.isEmpty) SliverFillRemaining(child: Center(child: Text('No plans available', style: TextStyle(color: AppColors.lpGray))))
              else SliverList(delegate: SliverChildBuilderDelegate((_, i) => _PlanCard(plan: filtered[i]), childCount: filtered.length)),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }
}

class _CurrentCard extends StatelessWidget {
  final Map<String, dynamic> membership;
  const _CurrentCard({required this.membership});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8), padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: AppColors.lpPrimary.withOpacity(0.3), blurRadius: 12)]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(FeatherIcons.award, color: Colors.white, size: 20), const SizedBox(width: 8),
          const Text('Current Plan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
          const Spacer(),
          Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)), child: const Text('Active', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white))),
        ]),
        const SizedBox(height: 12),
        Text(membership['plan_name']?.toString() ?? 'Standard', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
        const SizedBox(height: 4),
        Text('Expires: ${membership['expires_at'] ?? 'N/A'}', style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.8))),
      ]),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final Map<String, dynamic> plan;
  const _PlanCard({required this.plan});
  @override
  Widget build(BuildContext context) {
    final name = plan['name']?.toString() ?? 'Plan';
    final price = plan['price'] ?? 0;
    final duration = plan['duration']?.toString() ?? '';
    final features = List<String>.from(plan['features'] ?? []);
    final popular = plan['popular'] == true;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: popular ? AppColors.lpPrimary : AppColors.lpGray300, width: popular ? 2 : 1),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (popular) Container(
          width: double.infinity, padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: const BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.only(topLeft: Radius.circular(14), topRight: Radius.circular(14))),
          child: const Text('Most Popular', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
        ),
        Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
          const SizedBox(height: 4),
          Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text(formatPrice((price is num ? price.toDouble() : 0.0)), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.lpPrimary)),
            const SizedBox(width: 4),
            if (duration.isNotEmpty) Padding(padding: const EdgeInsets.only(bottom: 4), child: Text('/ $duration', style: const TextStyle(fontSize: 13, color: AppColors.lpGray))),
          ]),
          const SizedBox(height: 16),
          ...features.map((f) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [
            const Icon(FeatherIcons.check, size: 16, color: AppColors.success), const SizedBox(width: 8),
            Expanded(child: Text(f, style: const TextStyle(fontSize: 13, color: AppColors.lpGray700))),
          ]))),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: Container(
            decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
            child: ElevatedButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Contact us to subscribe to $name'), backgroundColor: AppColors.lpPrimary)),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('Subscribe Now', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
            ),
          )),
        ])),
      ]),
    );
  }
}
