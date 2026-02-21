import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../config/theme.dart';
import '../providers/games_provider.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({super.key});
  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  final _searchCtrl = TextEditingController();
  String _platform = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final gp = context.read<GamesProvider>();
      if (gp.games.isEmpty) gp.loadGames();
    });
  }

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final gp = context.watch<GamesProvider>();
    var games = gp.games;
    final q = _searchCtrl.text.toLowerCase();
    if (q.isNotEmpty) games = games.where((g) => (g['name']?.toString() ?? '').toLowerCase().contains(q)).toList();
    if (_platform != 'all') games = games.where((g) => (g['platform']?.toString() ?? '').toLowerCase() == _platform).toList();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.lightPageBg),
        child: RefreshIndicator(
          onRefresh: () => gp.loadGames(),
          color: AppColors.lpPrimary,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Games Library', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                        const SizedBox(height: 4),
                        Text('${gp.games.length} games available', style: const TextStyle(fontSize: 14, color: AppColors.lpGray)),
                        const SizedBox(height: 16),
                        // Search
                        TextField(
                          controller: _searchCtrl,
                          onChanged: (_) => setState(() {}),
                          style: const TextStyle(fontSize: 14, color: AppColors.lpDark),
                          decoration: InputDecoration(
                            hintText: 'Search games...', hintStyle: const TextStyle(color: AppColors.lpGray),
                            prefixIcon: const Icon(FeatherIcons.search, size: 18, color: AppColors.lpGray),
                            filled: true, fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpPrimary, width: 2)),
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Platform filter
                        SizedBox(
                          height: 36,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: ['all', 'ps5', 'xbox', 'pc', 'switch'].map((p) {
                              final a = _platform == p;
                              return GestureDetector(
                                onTap: () => setState(() => _platform = p),
                                child: Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    gradient: a ? AppColors.orangeGradient : null,
                                    color: a ? null : Colors.white,
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: a ? Colors.transparent : AppColors.lpGray300),
                                  ),
                                  child: Text(p == 'all' ? 'All' : p.toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: a ? Colors.white : AppColors.lpGray700)),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),
              ),
              if (gp.loading)
                const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.lpPrimary)))
              else if (games.isEmpty)
                SliverFillRemaining(child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(FeatherIcons.search, size: 48, color: AppColors.lpGray.withOpacity(0.4)),
                  const SizedBox(height: 12),
                  const Text('No games found', style: TextStyle(color: AppColors.lpGray)),
                ])))
              else
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: 0.72),
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => _GameCard(game: games[i]),
                      childCount: games.length,
                    ),
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }
}

class _GameCard extends StatelessWidget {
  final Map<String, dynamic> game;
  const _GameCard({required this.game});
  @override
  Widget build(BuildContext context) {
    final name = game['name']?.toString() ?? '';
    final platform = game['platform']?.toString() ?? '';
    final image = game['image']?.toString();

    return GestureDetector(
      onTap: () => _showDetail(context),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image / gradient placeholder
            Expanded(
              flex: 3,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.only(topLeft: Radius.circular(14), topRight: Radius.circular(14)),
                  gradient: image == null ? AppColors.orangeGradient : null,
                ),
                child: image != null
                    ? ClipRRect(
                        borderRadius: const BorderRadius.only(topLeft: Radius.circular(14), topRight: Radius.circular(14)),
                        child: CachedNetworkImage(imageUrl: image, fit: BoxFit.cover, errorWidget: (_, __, ___) => _placeholder()),
                      )
                    : _placeholder(),
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.lpDark), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: AppColors.lpPrimary.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                    child: Text(platform.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.lpPrimary)),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() => const Center(child: Icon(FeatherIcons.monitor, size: 28, color: Colors.white));

  void _showDetail(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.lpGray200, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 20),
          Text(game['name']?.toString() ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
          const SizedBox(height: 6),
          Text('Platform: ${game['platform']?.toString().toUpperCase() ?? ''}', style: const TextStyle(fontSize: 13, color: AppColors.lpGray)),
          if (game['genre'] != null) ...[
            const SizedBox(height: 4),
            Text('Genre: ${game['genre']}', style: const TextStyle(fontSize: 13, color: AppColors.lpGray)),
          ],
          if (game['description'] != null) ...[
            const SizedBox(height: 12),
            Text(game['description'].toString(), style: const TextStyle(fontSize: 14, color: AppColors.lpGray700, height: 1.4)),
          ],
          const SizedBox(height: 20),
        ]),
      ),
    );
  }
}
