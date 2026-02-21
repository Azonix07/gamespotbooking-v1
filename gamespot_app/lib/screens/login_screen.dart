import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() { _emailCtrl.dispose(); _passCtrl.dispose(); super.dispose(); }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final result = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
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
                // Back button
                Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    icon: const Icon(FeatherIcons.arrowLeft, color: AppColors.lpDark),
                    onPressed: () => context.go('/'),
                  ),
                ),
                const SizedBox(height: 20),
                // Logo
                Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: AppColors.lpPrimary.withOpacity(0.3), blurRadius: 16)]),
                  child: const Center(child: Text('GS', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white))),
                ),
                const SizedBox(height: 16),
                const Text('Welcome Back', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                const SizedBox(height: 4),
                const Text('Sign in to continue gaming', style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
                const SizedBox(height: 28),
                // Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12)],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Orange accent line
                        Container(width: 40, height: 3, decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(2))),
                        const SizedBox(height: 20),
                        // Email
                        TextFormField(
                          controller: _emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          validator: (v) => v!.isEmpty ? 'Email required' : null,
                          style: const TextStyle(fontSize: 14, color: AppColors.lpDark),
                          decoration: _inputDeco('Email', FeatherIcons.mail),
                        ),
                        const SizedBox(height: 14),
                        // Password
                        TextFormField(
                          controller: _passCtrl,
                          obscureText: _obscure,
                          validator: (v) => v!.isEmpty ? 'Password required' : null,
                          style: const TextStyle(fontSize: 14, color: AppColors.lpDark),
                          decoration: _inputDeco('Password', FeatherIcons.lock).copyWith(
                            suffixIcon: IconButton(icon: Icon(_obscure ? FeatherIcons.eyeOff : FeatherIcons.eye, size: 18, color: AppColors.lpGray), onPressed: () => setState(() => _obscure = !_obscure)),
                          ),
                        ),
                        if (auth.error != null) ...[
                          const SizedBox(height: 10),
                          Text(auth.error!, style: const TextStyle(fontSize: 12, color: AppColors.error)),
                        ],
                        const SizedBox(height: 22),
                        // Login button
                        SizedBox(
                          width: double.infinity,
                          child: Container(
                            decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(12)),
                            child: ElevatedButton(
                              onPressed: auth.loading ? null : _login,
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                              child: auth.loading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('Sign In', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Text("Don't have an account? ", style: TextStyle(color: AppColors.lpGray)),
                  GestureDetector(
                    onTap: () => context.push('/signup'),
                    child: const Text('Sign Up', style: TextStyle(color: AppColors.lpPrimary, fontWeight: FontWeight.w600)),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDeco(String hint, IconData icon) => InputDecoration(
    hintText: hint, hintStyle: const TextStyle(color: AppColors.lpGray),
    prefixIcon: Icon(icon, size: 18, color: AppColors.lpGray),
    filled: true, fillColor: AppColors.lpGray100,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpGray300)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lpPrimary, width: 2)),
  );
}
