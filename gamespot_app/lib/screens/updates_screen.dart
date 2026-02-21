import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class UpdatesScreen extends StatefulWidget {
  const UpdatesScreen({super.key});
  @override
  State<UpdatesScreen> createState() => _UpdatesScreenState();
}

class _UpdatesScreenState extends State<UpdatesScreen> {
  List<Map<String, dynamic>> _updates = [];
  bool _loading = true;
  String _category = 'all';

  @override
  void initState() { super.initState(); _fetch(); }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final data = await ApiService.instance.getUpdates();
      setState(() => _updates = List<Map<String, dynamic>>.from(data['updates'] ?? data['data'] ?? []));
    } catch (_) {}
    setState(() => _loading = false);
  }

  List<Map<String, dynamic>> get _filtered => _category == 'all' ? _updates : _updates.where((u) => u['category'] == _category).toList();

  Color _catColor(String c) {
    switch (c) { case 'new_game': return const Color(0xFF6366F1); case 'event': return const Color(0xFFF59E0B); case 'offer': return AppColors.lpPrimary; case 'maintenance': return const Color(0xFF8B5CF6); default: return const Color(0xFF3B82F6); }
  }
  IconData _catIcon(String c) {
    switch (c) { case 'new_game': return FeatherIcons.monitor; case 'event': return FeatherIcons.calendar; case 'offer': return FeatherIcons.gift; case 'maintenance': return FeatherIcons.settings; default: return FeatherIcons.bell; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.lightPageBg),
        child: RefreshIndicator(
          onRefresh: _fetch, color: AppColors.lpPrimary,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: SafeArea(child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Updates', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                  const SizedBox(height: 4),
                  const Text('Latest news and announcements', style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
                  const SizedBox(height: 16),
                ]),
              ))),
              SliverToBoxAdapter(child: SizedBox(height: 42, child: ListView(
                scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 20),
                children: ['all', 'new_game', 'event', 'offer', 'maintenance', 'announcement'].map((c) {
                  final a = _category == c;
                  return GestureDetector(
                    onTap: () => setState(() => _category = c),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(gradient: a ? AppColors.orangeGradient : null, color: a ? null : Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: a ? Colors.transparent : AppColors.lpGray300)),
                      child: Text(c == 'all' ? 'All' : c.replaceAll('_', ' ').split(' ').map((w) => w[0].toUpperCase() + w.substring(1)).join(' '), style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: a ? Colors.white : AppColors.lpGray700)),
                    ),
                  );
                }).toList(),
              ))),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),
              if (_loading) const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.lpPrimary)))
              else if (_filtered.isEmpty) SliverFillRemaining(child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(FeatherIcons.bell, size: 48, color: AppColors.lpGray.withOpacity(0.4)),
                const SizedBox(height: 12), const Text('No updates yet', style: TextStyle(color: AppColors.lpGray)),
              ])))
              else SliverList(delegate: SliverChildBuilderDelegate((_, i) {
                final u = _filtered[i]; final cat = u['category']?.toString() ?? '';
                final color = _catColor(cat); final icon = _catIcon(cat);
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)]),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(height: 4, decoration: BoxDecoration(color: color, borderRadius: const BorderRadius.only(topLeft: Radius.circular(14), topRight: Radius.circular(14)))),
                    Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Container(width: 36, height: 36, decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: Icon(icon, size: 18, color: color)),
                        const SizedBox(width: 10),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(u['title']?.toString() ?? '', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.lpDark), maxLines: 2, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 2),
                          Row(children: [
                            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: Text(cat.replaceAll('_', ' '), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color))),
                            const SizedBox(width: 8),
                            Text((u['created_at'] ?? u['date'] ?? '').toString().length > 10 ? (u['created_at'] ?? u['date'] ?? '').toString().substring(0, 10) : (u['created_at'] ?? u['date'] ?? '').toString(), style: const TextStyle(fontSize: 11, color: AppColors.lpGray)),
                          ]),
                        ])),
                      ]),
                      if ((u['message'] ?? u['description'] ?? '').toString().isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text((u['message'] ?? u['description'] ?? '').toString(), style: const TextStyle(fontSize: 13, color: AppColors.lpGray700, height: 1.4), maxLines: 4, overflow: TextOverflow.ellipsis),
                      ],
                    ])),
                  ]),
                );
              }, childCount: _filtered.length)),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }
}
