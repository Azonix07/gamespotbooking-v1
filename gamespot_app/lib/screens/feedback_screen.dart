import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import '../config/theme.dart';
import '../services/api_service.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});
  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _formKey = GlobalKey<FormState>();
  String _type = 'suggestion';
  String _priority = 'medium';
  bool _anonymous = false;
  bool _submitted = false;
  bool _loading = false;
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _subjectCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();

  static final _types = [
    {'id': 'suggestion', 'label': 'Suggestion', 'icon': FeatherIcons.messageSquare},
    {'id': 'bug', 'label': 'Bug Report', 'icon': FeatherIcons.alertTriangle},
    {'id': 'complaint', 'label': 'Complaint', 'icon': FeatherIcons.frown},
    {'id': 'praise', 'label': 'Praise', 'icon': FeatherIcons.thumbsUp},
  ];

  static const _priorities = [
    {'id': 'low', 'label': 'Low', 'color': Color(0xFF28A745)},
    {'id': 'medium', 'label': 'Medium', 'color': Color(0xFFFFC107)},
    {'id': 'high', 'label': 'High', 'color': Color(0xFFFF6B35)},
    {'id': 'urgent', 'label': 'Urgent', 'color': Color(0xFFDC3545)},
  ];

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ApiService.instance.submitFeedback({
        'type': _type, 'priority': _priority, 'anonymous': _anonymous,
        'name': _anonymous ? 'Anonymous' : _nameCtrl.text.trim(),
        'email': _anonymous ? '' : _emailCtrl.text.trim(),
        'subject': _subjectCtrl.text.trim(), 'message': _messageCtrl.text.trim(),
      });
      setState(() => _submitted = true);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit feedback')));
    }
    setState(() => _loading = false);
  }

  @override
  void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _subjectCtrl.dispose(); _messageCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.lightPageBg),
        child: _submitted ? _buildSuccess() : _buildForm(),
      ),
    );
  }

  Widget _buildSuccess() {
    return Center(
      child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 80, height: 80, decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.success.withOpacity(0.1)), child: const Icon(FeatherIcons.checkCircle, size: 40, color: AppColors.success)),
        const SizedBox(height: 20),
        const Text('Thank You!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
        const SizedBox(height: 8),
        const Text('Your feedback has been submitted.', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
          child: ElevatedButton(
            onPressed: () => setState(() { _submitted = false; _subjectCtrl.clear(); _messageCtrl.clear(); }),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Submit Another', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          ),
        ),
      ])),
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 100),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Feedback', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                const SizedBox(height: 4),
                const Text('Help us improve your experience', style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
                const SizedBox(height: 24),
                const Text('Type', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
                const SizedBox(height: 10),
                Wrap(spacing: 8, runSpacing: 8, children: _types.map((t) {
                  final a = _type == t['id'];
                  return GestureDetector(
                    onTap: () => setState(() => _type = t['id'] as String),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(gradient: a ? AppColors.orangeGradient : null, color: a ? null : Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: a ? Colors.transparent : AppColors.lpGray300)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(t['icon'] as IconData, size: 16, color: a ? Colors.white : AppColors.lpGray),
                        const SizedBox(width: 6),
                        Text(t['label'] as String, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: a ? Colors.white : AppColors.lpGray700)),
                      ]),
                    ),
                  );
                }).toList()),
                const SizedBox(height: 20),
                const Text('Priority', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
                const SizedBox(height: 10),
                Row(children: _priorities.map((p) {
                  final a = _priority == p['id'];
                  return Expanded(child: GestureDetector(
                    onTap: () => setState(() => _priority = p['id'] as String),
                    child: Container(
                      margin: const EdgeInsets.only(right: 6), padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(color: a ? (p['color'] as Color).withOpacity(0.15) : Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: a ? (p['color'] as Color) : AppColors.lpGray300, width: a ? 2 : 1)),
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Container(width: 10, height: 10, decoration: BoxDecoration(shape: BoxShape.circle, color: p['color'] as Color)),
                        const SizedBox(height: 4),
                        Text(p['label'] as String, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: a ? p['color'] as Color : AppColors.lpGray)),
                      ]),
                    ),
                  ));
                }).toList()),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.lpGray300)),
                  child: Row(children: [
                    const Icon(FeatherIcons.eyeOff, size: 18, color: AppColors.lpGray), const SizedBox(width: 10),
                    const Expanded(child: Text('Submit anonymously', style: TextStyle(fontSize: 14, color: AppColors.lpDark))),
                    Switch(value: _anonymous, onChanged: (v) => setState(() => _anonymous = v), activeColor: AppColors.lpPrimary),
                  ]),
                ),
                if (!_anonymous) ...[
                  const SizedBox(height: 16),
                  _input(_nameCtrl, 'Name', FeatherIcons.user, validator: (v) => v!.isEmpty ? 'Required' : null),
                  const SizedBox(height: 12),
                  _input(_emailCtrl, 'Email', FeatherIcons.mail, type: TextInputType.emailAddress),
                ],
                const SizedBox(height: 16),
                _input(_subjectCtrl, 'Subject', FeatherIcons.edit3, validator: (v) => v!.isEmpty ? 'Required' : null),
                const SizedBox(height: 12),
                _input(_messageCtrl, 'Your feedback...', FeatherIcons.messageSquare, lines: 5, validator: (v) => v!.isEmpty ? 'Required' : null),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: Container(
                    decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
                    child: ElevatedButton(
                      onPressed: _loading ? null : _submit,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      child: _loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Submit Feedback', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _input(TextEditingController ctrl, String hint, IconData icon, {TextInputType? type, int lines = 1, String? Function(String?)? validator}) {
    return TextFormField(
      controller: ctrl, keyboardType: type, maxLines: lines, validator: validator,
      style: const TextStyle(fontSize: 14, color: AppColors.lpDark),
      decoration: InputDecoration(
        hintText: hint, hintStyle: const TextStyle(color: AppColors.lpGray),
        prefixIcon: lines == 1 ? Icon(icon, size: 18, color: AppColors.lpGray) : null,
        filled: true, fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpPrimary, width: 2)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.error)),
      ),
    );
  }
}
