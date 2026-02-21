import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/theme.dart';
import '../providers/booking_provider.dart';
import '../utils/helpers.dart';

// ─────────────────────────────────────────────────────────
//  BOOKING SCREEN — Light orange theme, matching web app
// ─────────────────────────────────────────────────────────

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});
  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final bp = context.read<BookingProvider>();
      if (bp.slots.isEmpty) bp.loadSlots();
      if (bp.allGames.isEmpty) bp.loadGames();
    });
  }

  @override
  Widget build(BuildContext context) {
    final bp = context.watch<BookingProvider>();
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.lightPageBg),
        child: SafeArea(
          child: Column(
            children: [
              // ── Step indicator ──
              _StepBar(step: bp.currentStep),
              // ── Content ──
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 350),
                  switchInCurve: Curves.easeOutCubic,
                  switchOutCurve: Curves.easeInCubic,
                  transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.05, 0),
                        end: Offset.zero,
                      ).animate(anim),
                      child: child,
                    ),
                  ),
                  child: bp.currentStep == 1
                      ? _Step1Schedule(key: const ValueKey(1))
                      : bp.currentStep == 2
                          ? _Step2Devices(key: const ValueKey(2))
                          : _Step3Confirm(key: const ValueKey(3)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════
//  STEP BAR
// ═══════════════════════════════════════════════════
class _StepBar extends StatelessWidget {
  final int step;
  const _StepBar({required this.step});

  static const _labels = ['Schedule', 'Equipment', 'Confirm'];
  static const _icons = [FeatherIcons.calendar, FeatherIcons.monitor, FeatherIcons.checkCircle];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: List.generate(3, (i) {
          final active = (i + 1) <= step;
          final current = (i + 1) == step;
          return Expanded(
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: active ? AppColors.orangeGradient : null,
                    color: active ? null : AppColors.lpGray200,
                    boxShadow: current
                        ? [BoxShadow(color: AppColors.lpPrimary.withOpacity(0.3), blurRadius: 8)]
                        : null,
                  ),
                  child: Center(
                    child: (i + 1) < step
                        ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
                        : Icon(_icons[i], size: 14, color: active ? Colors.white : AppColors.lpGray),
                  ),
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(_labels[i],
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: active ? FontWeight.w600 : FontWeight.w400,
                        color: active ? AppColors.lpDark : AppColors.lpGray,
                      ),
                      overflow: TextOverflow.ellipsis),
                ),
                if (i < 2)
                  Expanded(
                    child: Container(
                      height: 2,
                      margin: const EdgeInsets.symmetric(horizontal: 6),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(1),
                        color: (i + 1) < step ? AppColors.lpPrimary : AppColors.lpGray200,
                      ),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════
//  STEP 1 — Date & Time Selection
// ═══════════════════════════════════════════════════
class _Step1Schedule extends StatelessWidget {
  const _Step1Schedule({super.key});

  /// Is this slot past? Uses IST (Kerala time) so international users see correct results
  bool _isSlotPast(String time, String selectedDate) {
    final todayStr = getToday(); // IST today
    if (selectedDate != todayStr) return false;
    try {
      final parts = time.split(':');
      final slotMin = int.parse(parts[0]) * 60 + int.parse(parts[1]);
      final ist = getISTTime();
      final nowMin = ist['hours']! * 60 + ist['minutes']!;
      return slotMin <= nowMin;
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bp = context.watch<BookingProvider>();
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16).copyWith(bottom: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _CardSection(
            icon: FeatherIcons.calendar,
            title: 'Choose Your Schedule',
            subtitle: 'Select your preferred date and time slot',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                // ── Date carousel ──
                SizedBox(
                  height: 80,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    itemCount: 14,
                    itemBuilder: (_, i) {
                      // Use IST for date generation so international users see Kerala dates
                      final istToday = getISTDate();
                      final d = DateTime(istToday.year, istToday.month, istToday.day).add(Duration(days: i));
                      final ds = formatDateYMD(d);
                      final sel = bp.selectedDate == ds;
                      final isToday = i == 0;
                      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      const months = [
                        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                      ];
                      return GestureDetector(
                        onTap: () => bp.setDate(ds),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          width: 60,
                          margin: const EdgeInsets.only(right: 10),
                          decoration: BoxDecoration(
                            gradient: sel ? AppColors.orangeGradient : null,
                            color: sel ? null : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: sel ? Colors.transparent : AppColors.lpGray200,
                            ),
                            boxShadow: sel
                                ? [
                                    BoxShadow(
                                        color: AppColors.lpPrimary.withOpacity(0.3),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4))
                                  ]
                                : [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4)],
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                isToday ? 'Today' : weekdays[d.weekday - 1],
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: sel ? FontWeight.w600 : FontWeight.w400,
                                  color: sel ? Colors.white : AppColors.lpGray,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${d.day}',
                                style: GoogleFonts.poppins(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                  color: sel ? Colors.white : AppColors.lpDark,
                                ),
                              ),
                              Text(
                                months[d.month - 1],
                                style: GoogleFonts.inter(
                                    fontSize: 10,
                                    color: sel ? Colors.white70 : AppColors.lpGray),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // ── Day closed banner ──
                if (bp.dayClosedInfo != null)
                  Container(
                    margin: const EdgeInsets.only(top: 14),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.lpError.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.lpError.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        const Text('🚫', style: TextStyle(fontSize: 18)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Shop Closed',
                                  style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.lpError)),
                              const SizedBox(height: 2),
                              Text(
                                  bp.dayClosedInfo!['reason']?.toString() ?? 'Closed',
                                  style: GoogleFonts.inter(
                                      fontSize: 12, color: AppColors.lpGray700)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                if (bp.error != null && bp.slots.isEmpty)
                  _ErrorBanner(message: bp.error!, onRetry: bp.loadSlots),

                // ── Time slots ──
                if (bp.selectedDate.isNotEmpty && bp.dayClosedInfo == null) ...[
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Icon(FeatherIcons.clock, size: 18, color: AppColors.lpPrimary),
                      const SizedBox(width: 8),
                      Text('Pick Your Time',
                          style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.lpDark)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Legend (matching web — no Past since past slots are filtered out)
                  Wrap(
                    spacing: 12,
                    children: [
                      _legendDot(AppColors.lpSuccess, 'Open'),
                      _legendDot(AppColors.warning, 'Filling'),
                      _legendDot(AppColors.lpError, 'Full'),
                    ],
                  ),
                  const SizedBox(height: 14),

                  if (bp.loading)
                    const Padding(
                      padding: EdgeInsets.all(30),
                      child: Center(
                          child: CircularProgressIndicator(
                              color: AppColors.lpPrimary, strokeWidth: 3)),
                    )
                  else if (bp.slots
                      .where((s) =>
                          !_isSlotPast(s['time']?.toString() ?? '', bp.selectedDate))
                      .isEmpty)
                    _emptyState(
                        '⏰', 'No more slots available', 'Pick a future date.')
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: bp.slots
                          .where((s) => !_isSlotPast(
                              s['time']?.toString() ?? '', bp.selectedDate))
                          .map((slot) {
                        final time = slot['time']?.toString() ?? '';
                        final status = slot['status']?.toString() ?? 'available';
                        final isFull = status == 'full';
                        final isClosed = status == 'closed';
                        final isPartial = status == 'partial';
                        final isDisabled = isFull || isClosed;
                        final availPs5 = slot['available_ps5'];

                        Color bgColor, borderColor, dotColor, textColor;
                        if (isClosed) {
                          bgColor = AppColors.lpGray100;
                          borderColor = AppColors.lpGray200;
                          dotColor = AppColors.lpGray300;
                          textColor = AppColors.lpGray;
                        } else if (isFull) {
                          bgColor = AppColors.lpError.withOpacity(0.06);
                          borderColor = AppColors.lpError.withOpacity(0.2);
                          dotColor = AppColors.lpError;
                          textColor = AppColors.lpError;
                        } else if (isPartial) {
                          bgColor = AppColors.warning.withOpacity(0.06);
                          borderColor = AppColors.warning.withOpacity(0.25);
                          dotColor = AppColors.warning;
                          textColor = AppColors.lpDark;
                        } else {
                          bgColor = Colors.white;
                          borderColor = AppColors.lpSuccess.withOpacity(0.3);
                          dotColor = AppColors.lpSuccess;
                          textColor = AppColors.lpDark;
                        }

                        return GestureDetector(
                          onTap: isDisabled
                              ? null
                              : () => bp.selectTimeSlot(time),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: bgColor,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: borderColor),
                              boxShadow: [
                                if (!isDisabled)
                                  BoxShadow(
                                      color: Colors.black.withOpacity(0.03),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2)),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: BoxDecoration(
                                          shape: BoxShape.circle, color: dotColor),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(formatTime12Hour(time),
                                        style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w500,
                                            color: textColor)),
                                  ],
                                ),
                                if (isPartial && availPs5 != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text('$availPs5 left',
                                        style: GoogleFonts.inter(
                                            fontSize: 10,
                                            color: AppColors.warning,
                                            fontWeight: FontWeight.w500)),
                                  ),
                                if (isFull)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text('Full',
                                        style: GoogleFonts.inter(
                                            fontSize: 10,
                                            color: AppColors.lpError,
                                            fontWeight: FontWeight.w500)),
                                  ),
                                if (!isFull && !isPartial && !isClosed)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text('Open',
                                        style: GoogleFonts.inter(
                                            fontSize: 10,
                                            color: AppColors.lpSuccess,
                                            fontWeight: FontWeight.w500)),
                                  ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Icon(FeatherIcons.info, size: 13, color: AppColors.lpGray),
                      const SizedBox(width: 6),
                      Text('We close at 12:00 AM (Midnight)',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.lpGray)),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
        const SizedBox(width: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.lpGray700)),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════
//  STEP 2 — Device Selection
// ═══════════════════════════════════════════════════
class _Step2Devices extends StatelessWidget {
  const _Step2Devices({super.key});

  static const _durations = [30, 60, 90, 120];

  @override
  Widget build(BuildContext context) {
    final bp = context.watch<BookingProvider>();
    final hasSelections = bp.ps5Bookings.isNotEmpty || bp.drivingSim != null;

    return Stack(
      children: [
        SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: EdgeInsets.all(16).copyWith(bottom: hasSelections ? 100 : 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _BackHeader(
                onBack: () => bp.setStep(1),
                title: 'Choose Your Experience',
                subtitle: 'Select your gaming station',
              ),

              const SizedBox(height: 12),
              Row(
                children: [
                  _InfoBadge(
                      icon: FeatherIcons.calendar,
                      label: 'Date',
                      value: formatDateDisplay(bp.selectedDate)),
                  const SizedBox(width: 10),
                  _InfoBadge(
                    icon: FeatherIcons.clock,
                    label: 'Time',
                    value: bp.selectedTime != null
                        ? formatTime12Hour(bp.selectedTime!)
                        : '—',
                  ),
                  const SizedBox(width: 10),
                  _InfoBadge(
                    icon: FeatherIcons.users,
                    label: 'Capacity',
                    value:
                        '${bp.totalPlayersBooked + bp.ps5Bookings.fold<int>(0, (s, b) => s + ((b['player_count'] as int?) ?? 0))}/10',
                  ),
                ],
              ),

              if (bp.loading)
                const Padding(
                  padding: EdgeInsets.all(40),
                  child: Center(
                      child: CircularProgressIndicator(
                          color: AppColors.lpPrimary, strokeWidth: 3)),
                )
              else ...[
                if (bp.error != null) _ErrorBanner(message: bp.error!),

                // Availability warning
                if (bp.availablePS5Units.length < 3 || !bp.availableDriving) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.warning.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        const Text('⚡', style: TextStyle(fontSize: 16)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Limited Availability',
                                  style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.lpDark)),
                              Text(
                                '${bp.availablePS5Units.length < 3 ? 'PS5 Units ${[1, 2, 3].where((n) => !bp.availablePS5Units.contains(n)).join(', ')} booked. ' : ''}'
                                '${!bp.availableDriving ? 'Driving Simulator occupied.' : ''}',
                                style: GoogleFonts.inter(
                                    fontSize: 12, color: AppColors.lpGray700),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // ── PS5 Units ──
                const SizedBox(height: 18),
                _SectionHeader(icon: FeatherIcons.monitor, title: 'PlayStation 5 Consoles'),
                const SizedBox(height: 10),

                ...List.generate(3, (i) {
                  final unit = i + 1;
                  final isAvail = bp.availablePS5Units.contains(unit);
                  final booking = bp.ps5Bookings
                      .where((b) => b['device_number'] == unit)
                      .firstOrNull;
                  final isSelected = booking != null;

                  return _DeviceCard(
                    title: 'PlayStation 5',
                    subtitle: 'Unit $unit',
                    icon: FeatherIcons.monitor,
                    iconColor: AppColors.lpPrimary,
                    isAvailable: isAvail,
                    isSelected: isSelected,
                    onTap: isAvail ? () => bp.togglePS5Unit(unit) : null,
                    expandedContent: isSelected
                        ? Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _OptionRow(
                                icon: FeatherIcons.users,
                                label: 'Players',
                                child: Row(
                                  children: List.generate(4, (pi) {
                                    final count = pi + 1;
                                    final active =
                                        (booking['player_count'] as int? ?? 1) >= count;
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 6),
                                      child: GestureDetector(
                                        onTap: () =>
                                            bp.setPS5PlayerCount(unit, count),
                                        child: Container(
                                          width: 36,
                                          height: 36,
                                          decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(8),
                                            gradient: active
                                                ? AppColors.orangeGradient
                                                : null,
                                            color:
                                                active ? null : AppColors.lpGray100,
                                            border: Border.all(
                                                color: active
                                                    ? Colors.transparent
                                                    : AppColors.lpGray200),
                                          ),
                                          child: Center(
                                            child: Text('$count',
                                                style: GoogleFonts.inter(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w600,
                                                  color: active
                                                      ? Colors.white
                                                      : AppColors.lpGray700,
                                                )),
                                          ),
                                        ),
                                      ),
                                    );
                                  }),
                                ),
                              ),
                              const SizedBox(height: 10),
                              _OptionRow(
                                icon: FeatherIcons.clock,
                                label: 'Duration',
                                child: Row(
                                  children: _durations.map((dur) {
                                    final active =
                                        (booking['duration'] as int? ?? 60) == dur;
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 6),
                                      child: GestureDetector(
                                        onTap: () => bp.setPS5Duration(unit, dur),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 12, vertical: 8),
                                          decoration: BoxDecoration(
                                            borderRadius: BorderRadius.circular(8),
                                            gradient: active
                                                ? AppColors.orangeGradient
                                                : null,
                                            color:
                                                active ? null : AppColors.lpGray100,
                                            border: Border.all(
                                                color: active
                                                    ? Colors.transparent
                                                    : AppColors.lpGray200),
                                          ),
                                          child: Text(
                                            dur < 60
                                                ? '${dur}m'
                                                : '${dur ~/ 60}h${dur % 60 > 0 ? '${dur % 60}m' : ''}',
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              color: active
                                                  ? Colors.white
                                                  : AppColors.lpGray700,
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ),
                            ],
                          )
                        : null,
                  );
                }),

                // ── Driving Simulator ──
                const SizedBox(height: 18),
                _SectionHeader(
                    icon: FeatherIcons.navigation, title: 'Racing Simulator'),
                const SizedBox(height: 10),
                _DeviceCard(
                  title: 'Racing Simulator',
                  subtitle: 'Pro Setup with Wheel & Pedals',
                  icon: FeatherIcons.navigation,
                  iconColor: const Color(0xFF059669),
                  isAvailable: bp.availableDriving,
                  isSelected: bp.drivingSim != null,
                  onTap: bp.availableDriving ? () => bp.toggleDrivingSim() : null,
                  expandedContent: bp.drivingSim != null
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _OptionRow(
                              icon: FeatherIcons.clock,
                              label: 'Duration',
                              child: Row(
                                children: _durations.map((dur) {
                                  final active =
                                      (bp.drivingSim!['duration'] as int? ?? 60) ==
                                          dur;
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 6),
                                    child: GestureDetector(
                                      onTap: () => bp.setDrivingDuration(dur),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 12, vertical: 8),
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(8),
                                          gradient: active
                                              ? AppColors.orangeGradient
                                              : null,
                                          color:
                                              active ? null : AppColors.lpGray100,
                                          border: Border.all(
                                              color: active
                                                  ? Colors.transparent
                                                  : AppColors.lpGray200),
                                        ),
                                        child: Text(
                                          dur < 60
                                              ? '${dur}m'
                                              : '${dur ~/ 60}h${dur % 60 > 0 ? '${dur % 60}m' : ''}',
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: active
                                                ? Colors.white
                                                : AppColors.lpGray700,
                                          ),
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                            if (bp.ps5Bookings.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              GestureDetector(
                                onTap: () => bp.setDrivingAfterPS5(
                                    !(bp.drivingSim!['afterPS5'] == true)),
                                child: Row(
                                  children: [
                                    AnimatedContainer(
                                      duration: const Duration(milliseconds: 200),
                                      width: 44,
                                      height: 24,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(12),
                                        color: bp.drivingSim!['afterPS5'] == true
                                            ? AppColors.lpPrimary
                                            : AppColors.lpGray200,
                                      ),
                                      child: AnimatedAlign(
                                        duration: const Duration(milliseconds: 200),
                                        alignment:
                                            bp.drivingSim!['afterPS5'] == true
                                                ? Alignment.centerRight
                                                : Alignment.centerLeft,
                                        child: Container(
                                          width: 20,
                                          height: 20,
                                          margin: const EdgeInsets.symmetric(
                                              horizontal: 2),
                                          decoration: const BoxDecoration(
                                              shape: BoxShape.circle,
                                              color: Colors.white),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Text('Play after PS5 session',
                                        style: GoogleFonts.inter(
                                            fontSize: 13,
                                            color: AppColors.lpDark)),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        )
                      : null,
                ),

                const SizedBox(height: 80),
              ],
            ],
          ),
        ),

        // ── Fixed price footer ──
        if (hasSelections)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 12,
                      offset: const Offset(0, -4))
                ],
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('TOTAL',
                          style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: AppColors.lpGray,
                              letterSpacing: 1)),
                      bp.priceLoading
                          ? SizedBox(
                              width: 60,
                              height: 24,
                              child: LinearProgressIndicator(
                                  color: AppColors.lpPrimary,
                                  backgroundColor: AppColors.lpGray100,
                                  borderRadius: BorderRadius.circular(4)))
                          : Text(
                              formatPrice(bp.price),
                              style: GoogleFonts.poppins(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.lpDark),
                            ),
                    ],
                  ),
                  const Spacer(),
                  _OrangeButton(
                    label: 'Review Booking',
                    icon: FeatherIcons.arrowRight,
                    onTap: () => bp.setStep(3),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════
//  STEP 3 — Review & Confirm
// ═══════════════════════════════════════════════════
class _Step3Confirm extends StatelessWidget {
  const _Step3Confirm({super.key});

  @override
  Widget build(BuildContext context) {
    final bp = context.watch<BookingProvider>();
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16).copyWith(bottom: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _BackHeader(
              onBack: () => bp.setStep(2),
              title: 'Review & Confirm',
              subtitle: 'Final step to lock in your session'),

          const SizedBox(height: 16),

          // ── Customer Info ──
          _CardSection(
            icon: FeatherIcons.user,
            title: 'Your Details',
            subtitle: 'Enter name and phone to confirm',
            child: Column(
              children: [
                const SizedBox(height: 8),
                _InputField(
                  icon: FeatherIcons.user,
                  hint: 'Full Name',
                  value: bp.customerName,
                  onChanged: bp.setCustomerName,
                ),
                const SizedBox(height: 12),
                _InputField(
                  icon: FeatherIcons.phone,
                  hint: 'Phone Number',
                  value: bp.customerPhone,
                  onChanged: bp.setCustomerPhone,
                  keyboardType: TextInputType.phone,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Booking Summary ──
          _CardSection(
            icon: FeatherIcons.fileText,
            title: 'Booking Summary',
            child: Column(
              children: [
                const SizedBox(height: 4),
                _SummaryItem(
                    icon: FeatherIcons.calendar,
                    label: 'Date',
                    value: formatDateDisplay(bp.selectedDate)),
                _divider(),
                _SummaryItem(
                    icon: FeatherIcons.clock,
                    label: 'Time',
                    value: bp.selectedTime != null
                        ? formatTime12Hour(bp.selectedTime!)
                        : '—'),
                _divider(),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text('Selected Equipment',
                      style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppColors.lpGray)),
                ),
                const SizedBox(height: 8),
                ...bp.ps5Bookings.map((b) {
                  final unitNum = b['device_number'] ?? '?';
                  final players = b['player_count'] ?? 1;
                  final dur = b['duration'] ?? 60;
                  return _EquipmentRow(
                    icon: FeatherIcons.monitor,
                    name: 'PS5 - Unit $unitNum',
                    meta: '${players}P • ${formatDuration(dur)}',
                  );
                }),
                if (bp.drivingSim != null)
                  _EquipmentRow(
                    icon: FeatherIcons.navigation,
                    name: 'Racing Simulator',
                    meta: formatDuration(
                        (bp.drivingSim!['duration'] as int?) ?? 60),
                  ),
                _divider(),
                // Discount
                if (bp.discountInfo != null) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Subtotal',
                          style: GoogleFonts.inter(
                              fontSize: 14, color: AppColors.lpGray)),
                      Text(formatPrice(bp.originalPrice),
                          style: GoogleFonts.inter(
                              fontSize: 14,
                              color: AppColors.lpGray,
                              decoration: TextDecoration.lineThrough)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(FeatherIcons.tag,
                              size: 14, color: AppColors.lpSuccess),
                          const SizedBox(width: 4),
                          Text('Member Discount',
                              style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: AppColors.lpSuccess,
                                  fontWeight: FontWeight.w500)),
                        ],
                      ),
                      Text(
                          '-${formatPrice((bp.discountInfo!['amount'] as num?)?.toDouble() ?? 0)}',
                          style: GoogleFonts.inter(
                              fontSize: 13,
                              color: AppColors.lpSuccess,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                // Total
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total',
                        style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.lpDark)),
                    bp.priceLoading
                        ? const SizedBox(
                            width: 50,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: AppColors.lpPrimary))
                        : Text(formatPrice(bp.price),
                            style: GoogleFonts.poppins(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: AppColors.lpPrimary)),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(FeatherIcons.checkCircle,
                        size: 14, color: AppColors.lpSuccess),
                    const SizedBox(width: 6),
                    Text('No payment required now — pay at venue',
                        style: GoogleFonts.inter(
                            fontSize: 12, color: AppColors.lpGray)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Punctuality warning
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.warning.withOpacity(0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.warning.withOpacity(0.15)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('⏰', style: TextStyle(fontSize: 18)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Please arrive on time!',
                          style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.lpDark)),
                      const SizedBox(height: 4),
                      Text(
                        'If you do not arrive within 15 minutes and another customer is waiting, priority will be given to the on-time customer.',
                        style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.lpGray700,
                            height: 1.4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (bp.error != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: _ErrorBanner(message: bp.error!),
            ),

          if (bp.success != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.lpSuccess.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border:
                      Border.all(color: AppColors.lpSuccess.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(FeatherIcons.checkCircle,
                        size: 16, color: AppColors.lpSuccess),
                    const SizedBox(width: 10),
                    Expanded(
                        child: Text(bp.success!,
                            style: GoogleFonts.inter(
                                fontSize: 13, color: AppColors.lpSuccess))),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 20),

          // Confirm button
          SizedBox(
            width: double.infinity,
            child: _OrangeButton(
              label: bp.loading ? 'Processing...' : 'Confirm Booking',
              icon: bp.loading ? null : FeatherIcons.checkCircle,
              loading: bp.loading,
              onTap: bp.loading
                  ? null
                  : () async {
                      final result = await bp.submitBooking();
                      if (result['success'] == true && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                                '🎮 Booking Confirmed! #${result['booking_id'] ?? ''}',
                                style:
                                    GoogleFonts.inter(fontWeight: FontWeight.w500)),
                            backgroundColor: AppColors.lpSuccess,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            duration: const Duration(seconds: 4),
                          ),
                        );
                        bp.reset();
                      }
                    },
              wide: true,
            ),
          ),
        ],
      ),
    );
  }

  static Widget _divider() => Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Divider(height: 1, color: AppColors.lpGray200),
      );
}

// ═══════════════════════════════════════════════════
//  REUSABLE WIDGETS
// ═══════════════════════════════════════════════════

class _CardSection extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget child;

  const _CardSection(
      {required this.icon, required this.title, this.subtitle, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: AppColors.orangeGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 18, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: GoogleFonts.poppins(
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                            color: AppColors.lpDark)),
                    if (subtitle != null)
                      Text(subtitle!,
                          style: GoogleFonts.inter(
                              fontSize: 12, color: AppColors.lpGray)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }
}

class _DeviceCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final bool isAvailable;
  final bool isSelected;
  final VoidCallback? onTap;
  final Widget? expandedContent;

  const _DeviceCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.isAvailable,
    required this.isSelected,
    this.onTap,
    this.expandedContent,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isSelected
              ? AppColors.lpPrimary.withOpacity(0.4)
              : AppColors.lpGray200,
          width: isSelected ? 2 : 1,
        ),
        boxShadow: [
          if (isSelected)
            BoxShadow(
                color: AppColors.lpPrimary.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2)),
          BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 6,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: iconColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, size: 20, color: iconColor),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title,
                              style: GoogleFonts.poppins(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.lpDark)),
                          Text(subtitle,
                              style: GoogleFonts.inter(
                                  fontSize: 12, color: AppColors.lpGray)),
                        ],
                      ),
                    ),
                    if (!isAvailable)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.lpError.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('BOOKED',
                            style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.lpError)),
                      ),
                    if (isAvailable && isSelected)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: AppColors.orangeGradient,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check_rounded,
                                size: 14, color: Colors.white),
                            const SizedBox(width: 3),
                            Text('Selected',
                                style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white)),
                          ],
                        ),
                      ),
                  ],
                ),
                if (expandedContent != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.lpGray100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: expandedContent!,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OptionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget child;
  const _OptionRow({required this.icon, required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppColors.lpGray),
            const SizedBox(width: 6),
            Text(label,
                style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.lpGray)),
          ],
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _BackHeader extends StatelessWidget {
  final VoidCallback onBack;
  final String title;
  final String? subtitle;
  const _BackHeader({required this.onBack, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: onBack,
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.lpGray200),
            ),
            child: const Icon(FeatherIcons.arrowLeft,
                size: 18, color: AppColors.lpDark),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: AppColors.lpDark)),
              if (subtitle != null)
                Text(subtitle!,
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.lpGray)),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoBadge({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.lpGray200),
        ),
        child: Row(
          children: [
            Icon(icon, size: 14, color: AppColors.lpPrimary),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style:
                          GoogleFonts.inter(fontSize: 10, color: AppColors.lpGray)),
                  Text(value,
                      style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.lpDark),
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  const _SectionHeader({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.lpPrimary),
        const SizedBox(width: 8),
        Text(title,
            style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.lpDark)),
      ],
    );
  }
}

class _OrangeButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool loading;
  final bool wide;

  const _OrangeButton(
      {required this.label,
      this.icon,
      this.onTap,
      this.loading = false,
      this.wide = false});

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null && !loading;
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding:
            EdgeInsets.symmetric(horizontal: wide ? 0 : 24, vertical: 14),
        decoration: BoxDecoration(
          gradient: enabled ? AppColors.orangeGradient : null,
          color: enabled ? null : AppColors.lpGray200,
          borderRadius: BorderRadius.circular(12),
          boxShadow: enabled
              ? [
                  BoxShadow(
                      color: AppColors.lpPrimary.withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4))
                ]
              : null,
        ),
        child: Center(
          child: loading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2.5))
              : Row(
                  mainAxisSize: wide ? MainAxisSize.max : MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(label,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: enabled ? Colors.white : AppColors.lpGray,
                        )),
                    if (icon != null) ...[
                      const SizedBox(width: 8),
                      Icon(icon,
                          size: 18,
                          color: enabled ? Colors.white : AppColors.lpGray),
                    ],
                  ],
                ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  const _ErrorBanner({required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.lpError.withOpacity(0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.lpError.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          const Text('⚠️', style: TextStyle(fontSize: 16)),
          const SizedBox(width: 10),
          Expanded(
              child: Text(message,
                  style: GoogleFonts.inter(
                      fontSize: 13, color: AppColors.lpError))),
          if (onRetry != null)
            GestureDetector(
              onTap: onRetry,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.lpError.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('Retry',
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.lpError)),
              ),
            ),
        ],
      ),
    );
  }
}

Widget _emptyState(String emoji, String title, String sub) {
  return Padding(
    padding: const EdgeInsets.all(24),
    child: Center(
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 36)),
          const SizedBox(height: 10),
          Text(title,
              style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.lpDark)),
          const SizedBox(height: 4),
          Text(sub,
              style: GoogleFonts.inter(fontSize: 13, color: AppColors.lpGray),
              textAlign: TextAlign.center),
        ],
      ),
    ),
  );
}

class _InputField extends StatelessWidget {
  final IconData icon;
  final String hint;
  final String value;
  final ValueChanged<String> onChanged;
  final TextInputType? keyboardType;

  const _InputField(
      {required this.icon,
      required this.hint,
      required this.value,
      required this.onChanged,
      this.keyboardType});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.lpGray100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.lpGray200),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Icon(icon, size: 18, color: AppColors.lpGray),
          ),
          Expanded(
            child: TextField(
              controller: TextEditingController.fromValue(
                TextEditingValue(
                    text: value,
                    selection:
                        TextSelection.collapsed(offset: value.length)),
              ),
              onChanged: onChanged,
              keyboardType: keyboardType,
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.lpDark),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle:
                    GoogleFonts.inter(fontSize: 14, color: AppColors.lpGray),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _SummaryItem(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.lpPrimary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: AppColors.lpPrimary),
        ),
        const SizedBox(width: 12),
        Text(label,
            style: GoogleFonts.inter(fontSize: 14, color: AppColors.lpGray)),
        const Spacer(),
        Text(value,
            style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.lpDark)),
      ],
    );
  }
}

class _EquipmentRow extends StatelessWidget {
  final IconData icon;
  final String name;
  final String meta;
  const _EquipmentRow(
      {required this.icon, required this.name, required this.meta});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.lpPrimary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 14, color: AppColors.lpPrimary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.lpDark)),
                Text(meta,
                    style: GoogleFonts.inter(
                        fontSize: 12, color: AppColors.lpGray)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
