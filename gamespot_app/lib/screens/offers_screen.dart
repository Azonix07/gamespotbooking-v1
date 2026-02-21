import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../widgets/menu_button.dart';

class OffersScreen extends StatefulWidget {
  const OffersScreen({super.key});
  @override
  State<OffersScreen> createState() => _OffersScreenState();
}

class _OffersScreenState extends State<OffersScreen> {
  int _step = 0;
  Map<String, dynamic>? _promo;
  bool _loading = true;
  bool _claiming = false;
  final _codeCtrl = TextEditingController();
  String? _error;

  @override
  void initState() { super.initState(); _loadPromo(); }

  Future<void> _loadPromo() async {
    setState(() => _loading = true);
    try { final d = await ApiService.instance.getActivePromo(); setState(() => _promo = d); } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _claim() async {
    final code = _codeCtrl.text.trim();
    if (code.isEmpty) { setState(() => _error = 'Enter the promo code'); return; }
    setState(() { _claiming = true; _error = null; });
    try {
      final r = await ApiService.instance.claimPromo({'code': code});
      if (r['success'] == true) setState(() => _step = 4);
      else setState(() => _error = r['message']?.toString() ?? 'Invalid code');
    } catch (_) { setState(() => _error = 'Failed to claim'); }
    setState(() => _claiming = false);
  }

  @override
  void dispose() { _codeCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.lightPageBg),
        child: SafeArea(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.lpPrimary))
              : _promo == null ? _noPromo() : SingleChildScrollView(
                  padding: const EdgeInsets.all(20).copyWith(bottom: 100),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const MenuButton(light: false),
                    const SizedBox(height: 12),
                    const Text('Offers & Promos', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                    const SizedBox(height: 4),
                    const Text('Follow us on Instagram for rewards!', style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
                    const SizedBox(height: 24),
                    // Progress
                    Row(children: List.generate(5, (i) => Expanded(child: Container(height: 4, margin: EdgeInsets.only(right: i < 4 ? 4 : 0), decoration: BoxDecoration(gradient: i <= _step ? AppColors.orangeGradient : null, color: i <= _step ? null : AppColors.lpGray300, borderRadius: BorderRadius.circular(2)))))),
                    const SizedBox(height: 24),
                    if (_step == 0) _card(FeatherIcons.instagram, 'Win Free Gaming Hours!', 'Follow us on Instagram, share our page, and get a free gaming session! \u{1F3AE}', 'Get Started', () => setState(() => _step = 1), gradient: true),
                    if (_step == 1) _card(FeatherIcons.userPlus, 'Step 1: Follow Us', 'Follow @game_spot_kodungallur on Instagram', "I've Followed \u2713", () => setState(() => _step = 2)),
                    if (_step == 2) _card(FeatherIcons.share2, 'Step 2: Share', 'Share our Instagram page to your story and tag us!', "I've Shared \u2713", () => setState(() => _step = 3)),
                    if (_step == 3) _claimCard(),
                    if (_step == 4) _successCard(),
                  ]),
                ),
        ),
      ),
    );
  }

  Widget _noPromo() => Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
    Icon(FeatherIcons.gift, size: 56, color: AppColors.lpGray.withOpacity(0.4)),
    const SizedBox(height: 16),
    const Text('No Active Promotions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
    const SizedBox(height: 8),
    const Text('Check back later!', style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
  ])));

  Widget _card(IconData icon, String title, String desc, String btn, VoidCallback onTap, {bool gradient = false}) {
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
      child: Column(children: [
        Container(
          width: gradient ? 72 : 56, height: gradient ? 72 : 56,
          decoration: gradient
              ? BoxDecoration(borderRadius: BorderRadius.circular(20), gradient: const LinearGradient(begin: Alignment.topRight, end: Alignment.bottomLeft, colors: [Color(0xFF405DE6), Color(0xFF833AB4), Color(0xFFE1306C), Color(0xFFF77737), Color(0xFFFCAF45)]))
              : BoxDecoration(shape: BoxShape.circle, color: AppColors.lpPrimary.withOpacity(0.1)),
          child: Icon(icon, size: gradient ? 36 : 28, color: gradient ? Colors.white : AppColors.lpPrimary),
        ),
        const SizedBox(height: 16),
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
        const SizedBox(height: 8),
        Text(desc, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: AppColors.lpGray, height: 1.5)),
        const SizedBox(height: 20),
        _orangeBtn(btn, onTap),
      ]),
    );
  }

  Widget _claimCard() => Container(
    width: double.infinity, padding: const EdgeInsets.all(24),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
    child: Column(children: [
      Container(width: 56, height: 56, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.lpPrimary.withOpacity(0.1)), child: const Icon(FeatherIcons.gift, size: 28, color: AppColors.lpPrimary)),
      const SizedBox(height: 16),
      const Text('Step 3: Claim Reward', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
      const SizedBox(height: 8),
      const Text('Enter the promo code from our Instagram post', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
      const SizedBox(height: 20),
      TextField(
        controller: _codeCtrl, textCapitalization: TextCapitalization.characters, textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: 4, color: AppColors.lpDark),
        decoration: InputDecoration(
          hintText: 'PROMO CODE', hintStyle: const TextStyle(color: AppColors.lpGray, letterSpacing: 2, fontSize: 16),
          filled: true, fillColor: AppColors.lpGray100,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: _error != null ? AppColors.error : AppColors.lpGray300)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: _error != null ? AppColors.error : AppColors.lpGray300)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpPrimary, width: 2)),
        ),
      ),
      if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(fontSize: 12, color: AppColors.error))),
      const SizedBox(height: 20),
      _orangeBtn(_claiming ? 'Claiming...' : 'Claim Reward \u{1F389}', _claiming ? null : _claim),
    ]),
  );

  Widget _successCard() => Container(
    width: double.infinity, padding: const EdgeInsets.all(24),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
    child: Column(children: [
      Container(width: 72, height: 72, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.success.withOpacity(0.1)), child: const Icon(FeatherIcons.checkCircle, size: 40, color: AppColors.success)),
      const SizedBox(height: 16),
      const Text('\u{1F389} Congratulations!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
      const SizedBox(height: 8),
      Text('You claimed: ${_promo?['reward'] ?? 'Free Gaming Session'}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: AppColors.lpGray)),
      const SizedBox(height: 8),
      const Text('Show this screen at the counter.', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppColors.lpGray)),
      const SizedBox(height: 24),
      _orangeBtn('Done', () => setState(() { _step = 0; _codeCtrl.clear(); })),
    ]),
  );

  Widget _orangeBtn(String label, VoidCallback? onTap) => SizedBox(
    width: double.infinity,
    child: Container(
      decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
        child: Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    ),
  );
}
