import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _phoneCtrl.dispose(); _passCtrl.dispose(); _confirmCtrl.dispose(); super.dispose(); }

  double get _passwordStrength {
    final p = _passCtrl.text;
    if (p.isEmpty) return 0;
    double s = 0;
    if (p.length >= 6) s += 0.25;
    if (p.length >= 8) s += 0.15;
    if (RegExp(r'[A-Z]').hasMatch(p)) s += 0.2;
    if (RegExp(r'[0-9]').hasMatch(p)) s += 0.2;
    if (RegExp(r'[!@#\$%^&*]').hasMatch(p)) s += 0.2;
    return s.clamp(0, 1);
  }

  Color get _strengthColor {
    final s = _passwordStrength;
    if (s < 0.3) return AppColors.error;
    if (s < 0.6) return AppColors.warning;
    return AppColors.success;
  }

  Future<void> _signup() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passCtrl.text != _confirmCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
      return;
    }
    final auth = context.read<AuthProvider>();
    final result = await auth.signup({
      'name': _nameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'password': _passCtrl.text,
    });
    if (result['success'] == true && mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.loginBg),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              children: [
                Align(alignment: Alignment.centerLeft, child: IconButton(icon: const Icon(FeatherIcons.arrowLeft, color: AppColors.lpDark), onPressed: () => context.go('/'))),
                const SizedBox(height: 12),
                Container(
                  width: 64, height: 64,
                  decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(18), boxShadow: [BoxShadow(color: AppColors.lpPrimary.withOpacity(0.3), blurRadius: 14)]),
                  child: const Center(child: Text('GS', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white))),
                ),
                const SizedBox(height: 14),
                const Text('Create Account', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                const SizedBox(height: 4),
                const Text('Join the gaming community', style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12)]),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(width: 40, height: 3, decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(2))),
                        const SizedBox(height: 20),
                        _field(_nameCtrl, 'Full Name', FeatherIcons.user, validator: (v) => v!.isEmpty ? 'Name required' : null),
                        const SizedBox(height: 12),
                        _field(_emailCtrl, 'Email', FeatherIcons.mail, type: TextInputType.emailAddress, validator: (v) => v!.isEmpty ? 'Email required' : null),
                        const SizedBox(height: 12),
                        _field(_phoneCtrl, 'Phone Number', FeatherIcons.phone, type: TextInputType.phone, validator: (v) => v!.isEmpty ? 'Phone required' : null),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _passCtrl,
                          obscureText: _obscure,
                          onChanged: (_) => setState(() {}),
                          validator: (v) => v!.length < 6 ? 'Min 6 characters' : null,
                          style: const TextStyle(fontSize: 14, color: AppColors.lpDark),
                          decoration: _deco('Password', FeatherIcons.lock).copyWith(
                            suffixIcon: IconButton(icon: Icon(_obscure ? FeatherIcons.eyeOff : FeatherIcons.eye, size: 18, color: AppColors.lpGray), onPressed: () => setState(() => _obscure = !_obscure)),
                          ),
                        ),
                        if (_passCtrl.text.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          ClipRRect(borderRadius: BorderRadius.circular(3), child: LinearProgressIndicator(value: _passwordStrength, backgroundColor: AppColors.lpGray200, valueColor: AlwaysStoppedAnimation(_strengthColor), minHeight: 4)),
                        ],
                        const SizedBox(height: 12),
                        _field(_confirmCtrl, 'Confirm Password', FeatherIcons.lock, obscure: true, validator: (v) => v != _passCtrl.text ? 'Passwords must match' : null),
                        if (auth.error != null) ...[
                          const SizedBox(height: 10),
                          Text(auth.error!, style: const TextStyle(fontSize: 12, color: AppColors.error)),
                        ],
                        const SizedBox(height: 22),
                        SizedBox(
                          width: double.infinity,
                          child: Container(
                            decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
                            child: ElevatedButton(
                              onPressed: auth.loading ? null : _signup,
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                              child: auth.loading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Text('Already have an account? ', style: TextStyle(color: AppColors.lpGray)),
                  GestureDetector(onTap: () => context.push('/login'), child: const Text('Sign In', style: TextStyle(color: AppColors.lpPrimary, fontWeight: FontWeight.w600))),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon, {TextInputType? type, bool obscure = false, String? Function(String?)? validator}) {
    return TextFormField(
      controller: ctrl, keyboardType: type, obscureText: obscure, validator: validator,
      style: const TextStyle(fontSize: 14, color: AppColors.lpDark),
      decoration: _deco(hint, icon),
    );
  }

  InputDecoration _deco(String hint, IconData icon) => InputDecoration(
    hintText: hint, hintStyle: const TextStyle(color: AppColors.lpGray),
    prefixIcon: Icon(icon, size: 18, color: AppColors.lpGray),
    filled: true, fillColor: AppColors.lpGray100,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpPrimary, width: 2)),
  );
}
