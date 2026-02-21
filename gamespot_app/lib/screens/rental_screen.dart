import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../utils/helpers.dart';
import '../widgets/menu_button.dart';

class RentalScreen extends StatefulWidget {
  const RentalScreen({super.key});
  @override
  State<RentalScreen> createState() => _RentalScreenState();
}

class _RentalScreenState extends State<RentalScreen> {
  String? _device;
  String? _package;
  DateTime? _startDate;
  bool _loading = false;
  bool _submitted = false;
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  static const _devices = [
    {'id': 'ps5', 'label': 'PlayStation 5', 'color': Color(0xFF0070D1)},
    {'id': 'xbox', 'label': 'Xbox Series X', 'color': Color(0xFF107C10)},
    {'id': 'switch', 'label': 'Nintendo Switch', 'color': Color(0xFFE60012)},
  ];

  static const Map<String, List<Map<String, dynamic>>> _packages = {
    'ps5': [{'id': 'daily', 'label': 'Daily', 'price': 500, 'dur': '1 Day'}, {'id': 'weekend', 'label': 'Weekend', 'price': 1200, 'dur': '2 Days'}, {'id': 'weekly', 'label': 'Weekly', 'price': 3000, 'dur': '7 Days'}],
    'xbox': [{'id': 'daily', 'label': 'Daily', 'price': 500, 'dur': '1 Day'}, {'id': 'weekend', 'label': 'Weekend', 'price': 1200, 'dur': '2 Days'}, {'id': 'weekly', 'label': 'Weekly', 'price': 3000, 'dur': '7 Days'}],
    'switch': [{'id': 'daily', 'label': 'Daily', 'price': 400, 'dur': '1 Day'}, {'id': 'weekend', 'label': 'Weekend', 'price': 900, 'dur': '2 Days'}, {'id': 'weekly', 'label': 'Weekly', 'price': 2500, 'dur': '7 Days'}],
  };

  List<Map<String, dynamic>> get _pkgs => _packages[_device] ?? [];

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(context: context, initialDate: _startDate ?? now, firstDate: now, lastDate: now.add(const Duration(days: 90)),
      builder: (ctx, child) => Theme(data: Theme.of(ctx).copyWith(colorScheme: const ColorScheme.light(primary: AppColors.lpPrimary, onPrimary: Colors.white, surface: Colors.white, onSurface: AppColors.lpDark)), child: child!));
    if (picked != null) setState(() => _startDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_device == null || _package == null || _startDate == null) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please complete all fields'))); return; }
    setState(() => _loading = true);
    try {
      await ApiService.instance.createRental({'device': _device, 'package': _package, 'start_date': formatDateYMD(_startDate!), 'name': _nameCtrl.text.trim(), 'phone': _phoneCtrl.text.trim()});
      setState(() => _submitted = true);
    } catch (_) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit'))); }
    setState(() => _loading = false);
  }

  @override
  void dispose() { _nameCtrl.dispose(); _phoneCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.lightPageBg),
        child: _submitted
            ? Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 80, height: 80, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.success.withOpacity(0.1)), child: const Icon(FeatherIcons.checkCircle, size: 40, color: AppColors.success)),
                const SizedBox(height: 20),
                const Text('Rental Request Submitted!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                const SizedBox(height: 8),
                const Text("We'll contact you shortly to confirm.", textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
                const SizedBox(height: 24),
                Container(
                  decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
                  child: ElevatedButton(onPressed: () => setState(() { _submitted = false; _device = null; _package = null; _startDate = null; _nameCtrl.clear(); _phoneCtrl.clear(); }),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: const Text('Rent Another', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600))),
                ),
              ])))
            : _buildForm(),
      ),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 100),
      child: SafeArea(child: Padding(padding: const EdgeInsets.all(20), child: Form(key: _formKey, child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const MenuButton(light: false),
          const SizedBox(height: 12),
          const Text('Console Rental', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
          const SizedBox(height: 4),
          const Text('Rent a gaming console to enjoy at home', style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
          const SizedBox(height: 24),
          const Text('Choose Console', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
          const SizedBox(height: 10),
          ..._devices.map((d) {
            final a = _device == d['id'];
            return GestureDetector(
              onTap: () => setState(() { _device = d['id'] as String; _package = null; }),
              child: Container(
                width: double.infinity, margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: a ? (d['color'] as Color) : AppColors.lpGray300, width: a ? 2 : 1), boxShadow: a ? [BoxShadow(color: (d['color'] as Color).withOpacity(0.15), blurRadius: 8)] : null),
                child: Row(children: [
                  Container(width: 44, height: 44, decoration: BoxDecoration(color: (d['color'] as Color).withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: Icon(FeatherIcons.monitor, size: 22, color: d['color'] as Color)),
                  const SizedBox(width: 14),
                  Text(d['label'] as String, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: a ? d['color'] as Color : AppColors.lpDark)),
                  const Spacer(),
                  if (a) Icon(FeatherIcons.checkCircle, size: 20, color: d['color'] as Color),
                ]),
              ),
            );
          }),
          if (_device != null) ...[
            const SizedBox(height: 16),
            const Text('Select Package', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
            const SizedBox(height: 10),
            Row(children: _pkgs.map((p) {
              final a = _package == p['id'];
              return Expanded(child: GestureDetector(
                onTap: () => setState(() => _package = p['id'] as String),
                child: Container(
                  margin: const EdgeInsets.only(right: 8), padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(gradient: a ? AppColors.orangeGradient : null, color: a ? null : Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: a ? Colors.transparent : AppColors.lpGray300)),
                  child: Column(children: [
                    Text(p['label'] as String, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: a ? Colors.white : AppColors.lpDark)),
                    const SizedBox(height: 4),
                    Text(formatPrice((p['price'] as num).toDouble()), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: a ? Colors.white : AppColors.lpPrimary)),
                    const SizedBox(height: 2),
                    Text(p['dur'] as String, style: TextStyle(fontSize: 11, color: a ? Colors.white.withOpacity(0.8) : AppColors.lpGray)),
                  ]),
                ),
              ));
            }).toList()),
          ],
          if (_package != null) ...[
            const SizedBox(height: 20),
            GestureDetector(
              onTap: _pickDate,
              child: Container(
                width: double.infinity, padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.lpGray300)),
                child: Row(children: [
                  const Icon(FeatherIcons.calendar, size: 16, color: AppColors.lpGray), const SizedBox(width: 8),
                  Text(_startDate != null ? formatDateYMD(_startDate!) : 'Select Start Date', style: TextStyle(fontSize: 13, color: _startDate != null ? AppColors.lpDark : AppColors.lpGray)),
                ]),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(controller: _nameCtrl, validator: (v) => v!.isEmpty ? 'Required' : null, style: const TextStyle(fontSize: 14, color: AppColors.lpDark), decoration: _deco('Full Name', FeatherIcons.user)),
            const SizedBox(height: 12),
            TextFormField(controller: _phoneCtrl, keyboardType: TextInputType.phone, validator: (v) => v!.isEmpty ? 'Required' : null, style: const TextStyle(fontSize: 14, color: AppColors.lpDark), decoration: _deco('Phone', FeatherIcons.phone)),
            const SizedBox(height: 24),
            SizedBox(width: double.infinity, child: Container(
              decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Submit Rental Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
              ),
            )),
          ],
        ],
      )))),
    );
  }

  InputDecoration _deco(String hint, IconData icon) => InputDecoration(
    hintText: hint, hintStyle: const TextStyle(color: AppColors.lpGray),
    prefixIcon: Icon(icon, size: 18, color: AppColors.lpGray),
    filled: true, fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpPrimary, width: 2)),
  );
}
