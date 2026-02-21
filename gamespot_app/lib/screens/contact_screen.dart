import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  Future<void> _launch(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.lightPageBg),
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 100),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Contact Us', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.lpDark)),
                  const SizedBox(height: 4),
                  const Text("We'd love to hear from you", style: TextStyle(fontSize: 14, color: AppColors.lpGray)),
                  const SizedBox(height: 20),
                  // Hero card
                  Container(
                    width: double.infinity, padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(gradient: AppColors.orangeGradient, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: AppColors.lpPrimary.withOpacity(0.3), blurRadius: 12)]),
                    child: Column(children: [
                      const Icon(FeatherIcons.headphones, size: 40, color: Colors.white),
                      const SizedBox(height: 12),
                      const Text('GameSpot Kodungallur', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text('Your Premium Gaming Destination', style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.85))),
                    ]),
                  ),
                  const SizedBox(height: 20),
                  _ContactCard(icon: FeatherIcons.phone, title: 'Phone', value: '+91 86068 47653', onTap: () => _launch('tel:+918606847653')),
                  _ContactCard(icon: FeatherIcons.mail, title: 'Email', value: 'gamespotcdl@gmail.com', onTap: () => _launch('mailto:gamespotcdl@gmail.com')),
                  _ContactCard(icon: FeatherIcons.mapPin, title: 'Location', value: 'Kodungallur, Thrissur, Kerala', onTap: () => _launch('https://maps.google.com/?q=Kodungallur,Thrissur,Kerala')),
                  _ContactCard(icon: FeatherIcons.clock, title: 'Hours', value: 'Mon - Sun: 10:00 AM - 11:00 PM'),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: Container(
                      decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF25D366), Color(0xFF128C7E)]), borderRadius: BorderRadius.circular(12)),
                      child: ElevatedButton.icon(
                        onPressed: () => _launch('https://wa.me/918606847653?text=Hi%20GameSpot!'),
                        icon: const Icon(FeatherIcons.messageCircle, size: 18, color: Colors.white),
                        label: const Text('Chat on WhatsApp', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Follow Us', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
                  const SizedBox(height: 12),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    _SocialBtn(icon: FeatherIcons.instagram, label: 'Instagram', color: const Color(0xFFE4405F), onTap: () => _launch('https://www.instagram.com/game_spot_kodungallur/')),
                    const SizedBox(width: 16),
                    _SocialBtn(icon: FeatherIcons.youtube, label: 'YouTube', color: const Color(0xFFFF0000), onTap: () => _launch('https://www.youtube.com/@GameSpotKodungallur')),
                    const SizedBox(width: 16),
                    _SocialBtn(icon: FeatherIcons.facebook, label: 'Facebook', color: const Color(0xFF1877F2), onTap: () => _launch('https://www.facebook.com/gamespotcdl')),
                  ]),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  final IconData icon; final String title; final String value; final VoidCallback? onTap;
  const _ContactCard({required this.icon, required this.title, required this.value, this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity, margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)]),
        child: Row(children: [
          Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.lpPrimary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: Icon(icon, size: 20, color: AppColors.lpPrimary)),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.lpGray)),
            const SizedBox(height: 2),
            Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.lpDark)),
          ])),
          if (onTap != null) Icon(FeatherIcons.chevronRight, size: 18, color: AppColors.lpGray.withOpacity(0.5)),
        ]),
      ),
    );
  }
}

class _SocialBtn extends StatelessWidget {
  final IconData icon; final String label; final Color color; final VoidCallback onTap;
  const _SocialBtn({required this.icon, required this.label, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(children: [
        Container(width: 52, height: 52, decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(14)), child: Icon(icon, color: color, size: 24)),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.lpGray700)),
      ]),
    );
  }
}
