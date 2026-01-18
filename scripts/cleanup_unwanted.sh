#!/bin/bash
# =============================================================
# CLEANUP UNWANTED FILES
# Removes old AI services, test scripts, and outdated documentation
# =============================================================

set -e

echo "🧹 Starting Cleanup..."
echo ""

cd /Users/abhijithca/Documents/GitHub/gamespotweb

# =============================================================
# STEP 1: Remove OLD AI Services (NOT USED)
# =============================================================
echo "📁 STEP 1: Removing old AI services..."

# Ollama/Mistral/Simple AI (replaced by Fast AI)
rm -f backend_python/services/ollama_service.py
rm -f backend_python/services/mistral_ai_booking.py
rm -f backend_python/services/simple_ai_booking.py
rm -f backend_python/services/selfhosted_voice_service.py
rm -f backend_python/services/malayalam_translator.py

echo "✅ Removed old AI services"

# =============================================================
# STEP 2: Remove Test Scripts
# =============================================================
echo ""
echo "🧪 STEP 2: Removing test scripts..."

# Root test scripts
rm -f test_ai_intelligence.py
rm -f test_ai_intelligence.sh
rm -f test_gemini_ai.sh
rm -f install_gemini_ai.sh
rm -f test_selfhosted_ai.py
rm -f migrate_to_selfhosted.sh
rm -f test_rate_limiter.py
rm -f test_ai_booking_quick.sh
rm -f test_ai_booking.py
rm -f test-ai-chat.py
rm -f test-ai-complete.sh
rm -f test-ai-final.sh
rm -f start_and_test.sh

# Backend test scripts
rm -f backend_python/test_voice_ai.py
rm -f backend_python/test_voice_ai.sh
rm -f backend_python/test_admin_login.py
rm -f backend_python/test_fixes.py
rm -f backend_python/test_proof.py
rm -f backend_python/test_voice_fix.py

echo "✅ Removed test scripts"

# =============================================================
# STEP 3: Remove Upgrade Scripts
# =============================================================
echo ""
echo "📦 STEP 3: Removing upgrade scripts..."

rm -f backend_python/upgrade_ai_stack.sh
rm -f fix-mysql.sh
rm -f setup.sh

echo "✅ Removed upgrade scripts"

# =============================================================
# STEP 4: Remove OLD Documentation (Keep essentials)
# =============================================================
echo ""
echo "📄 STEP 4: Removing old documentation..."

# Keep these essential docs
# - README.md
# - REALISTIC_VOICE_UPGRADE.md (Latest)
# - QUICK_START.md
# - PROJECT_OVERVIEW.md
# - ARCHITECTURE.md

# Remove old AI docs
rm -f AI_ERROR_FIX_COMPLETE.md
rm -f AI_ERROR_FIXED.md
rm -f AI_FIX_SUMMARY.md
rm -f AI_IMPLEMENTATION_COMPLETE.md
rm -f AI_INTEGRATION_COMPLETE.md
rm -f AI_INTEGRATION_FINAL.md
rm -f AI_INTEGRATION_PLAN.md
rm -f AI_INTELLIGENCE_UPGRADE.md
rm -f AI_QUICK_START.md
rm -f AI_READY_TO_USE.md
rm -f AI_SMART_VOICE_SYSTEM_COMPLETE.md
rm -f AI_UX_IMPROVEMENTS.md
rm -f AI_UX_QUICK_TEST.md
rm -f AI_UPGRADE_READY.md
rm -f AI_CLEANUP_COMPLETE.md

# Remove booking docs
rm -f BOOKED_DEVICE_ENHANCEMENT.md
rm -f BOOKING_FLOW_IMPROVEMENTS.md
rm -f BOOKING_OVERLAP_FIX.md
rm -f BOOKING_STATE_MACHINE_FIX.md
rm -f BOOKING_UPDATE_V3.md
rm -f BOOKINGPAGE_REFACTORING_COMPLETED.md

# Remove fix/debug docs
rm -f COMPLETE_FIX_NAVIGATION_RESPONSIVE.md
rm -f COMPLETE_SYSTEM_FIX.md
rm -f DEBUG_FAILED_TO_FETCH.md
rm -f DEVICE_LOGIC_FIX.md
rm -f FIX_SUMMARY.md
rm -f ADMIN_LOGIN_FIX.md
rm -f ADMIN_LOGIN_FIXED.md

# Remove frontend docs
rm -f FRONTEND_REDESIGN.md
rm -f CSS_REFACTORING_GUIDE.md
rm -f CSS_REFACTORING_NEXT_STEPS.md
rm -f REACT_IMPORT_ERROR_FIX.md

# Remove mobile docs
rm -f MOBILE_APP_FINAL_SUMMARY.md
rm -f MOBILE_APP_SUCCESS.md
rm -f MOBILE_CLEANUP_SUMMARY.md
rm -f MOBILE_SLOT_LOADING_FIX.md

# Remove language docs
rm -f MALAYALAM_LANGUAGE_SUPPORT.md

# Remove migration docs
rm -f MIGRATION_SUMMARY.md
rm -f FREE_AI_MIGRATION_COMPLETE.md
rm -f CLEANUP_SUMMARY.md

# Remove implementation docs
rm -f IMPLEMENTATION_SUMMARY.md
rm -f PARTIAL_BOOKING_ENHANCEMENT.md
rm -f PARTIAL_BOOKING_FIX.md

# Remove voice docs (keep latest)
rm -f PRIYA_VOICE_AI.md
rm -f REALTIME_VOICE_AI.md
rm -f SMOOTH_NATURAL_VOICE.md
rm -f ULTRA_REALISTIC_HUMAN_VOICE.md
rm -f VOICE_AI_DEMO.txt
rm -f VOICE_AI_IMPLEMENTATION.md
rm -f VOICE_FLUENCY_UPGRADE.md
rm -f VOICE_AI_INTEGRATION_COMPLETE.md
rm -f VOICE_AI_SUCCESS.txt

# Remove quick reference docs
rm -f QUICK_DEVICE_FIX.md
rm -f QUICK_FIX_SUMMARY.md
rm -f QUICK_REFERENCE_REDESIGN.md
rm -f QUICK_REFERENCE.md
rm -f QUICK_START_AI_TEST.md
rm -f QUICK_TEST_GUIDE.md

# Remove super AI docs
rm -f SUPER_AI_QUICKSTART.md
rm -f SUPER_AI_SYSTEM.md

# Remove state machine docs
rm -f STATE_MACHINE_FIX_SUMMARY.md

# Remove system docs
rm -f SYSTEM_FLOW_DIAGRAM.txt
rm -f SYSTEM_STATUS.md

# Remove timeslot docs
rm -f TIMESLOTS_FINAL_FIX.md
rm -f TIMESLOTS_FIX_ANALYSIS.md

# Remove MySQL docs
rm -f MYSQL_FIX.md

# Remove conversation docs
rm -f CONVERSATION_FLOW_VISUAL.md

echo "✅ Removed old documentation"

# =============================================================
# STEP 5: Remove HTML test files
# =============================================================
echo ""
echo "🌐 STEP 5: Removing test HTML files..."

rm -f api-test.html

echo "✅ Removed test HTML files"

# =============================================================
# STEP 6: Remove log files
# =============================================================
echo ""
echo "📝 STEP 6: Removing log files..."

rm -f backend.log
rm -f backend_python/backend.log

echo "✅ Removed log files"

# =============================================================
# SUMMARY
# =============================================================
echo ""
echo "============================================================"
echo "✅ CLEANUP COMPLETE!"
echo "============================================================"
echo ""
echo "📊 Summary:"
echo "   • Removed OLD AI services (ollama, mistral, simple_ai, etc.)"
echo "   • Removed 20+ test scripts"
echo "   • Removed 3 upgrade scripts"
echo "   • Removed 60+ old documentation files"
echo "   • Removed test HTML files"
echo "   • Removed log files"
echo ""
echo "✅ KEPT ESSENTIAL FILES:"
echo "   • README.md (Main documentation)"
echo "   • REALISTIC_VOICE_UPGRADE.md (Latest voice upgrade)"
echo "   • QUICK_START.md (Quick start guide)"
echo "   • PROJECT_OVERVIEW.md (Project overview)"
echo "   • ARCHITECTURE.md (Architecture docs)"
echo "   • All active backend services (Fast AI, Edge TTS)"
echo "   • All frontend code"
echo "   • Database schema"
echo ""
echo "🎯 Your project is now CLEAN and organized!"
echo ""
