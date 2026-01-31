#!/bin/bash
# =============================================================
# SELF-HOSTED AI UPGRADE
# From: Llama 3.2 + gTTS
# To: Mistral 7B + Whisper + Coqui TTS
# =============================================================

set -e

echo "🚀 Starting Self-Hosted AI Upgrade..."
echo ""

# =============================================================
# STEP 1: Install Mistral 7B via Ollama
# =============================================================
echo "📥 STEP 1: Installing Mistral 7B..."
echo "This model is smarter and more conversational than Llama 3.2"
echo ""

if command -v ollama &> /dev/null; then
    echo "✅ Ollama is installed"
    
    # Pull Mistral 7B
    echo "Downloading Mistral 7B (this may take 5-10 minutes)..."
    ollama pull mistral:latest
    
    echo "✅ Mistral 7B installed successfully"
else
    echo "❌ Ollama not found!"
    echo "Please install Ollama first:"
    echo "  brew install ollama"
    echo "  or visit: https://ollama.ai"
    exit 1
fi

echo ""

# =============================================================
# STEP 2: Install Whisper for Speech-to-Text
# =============================================================
echo "📥 STEP 2: Installing Whisper (Speech-to-Text)..."
echo ""

pip3 install -q openai-whisper
echo "✅ Whisper installed"

echo ""

# =============================================================
# STEP 3: Install Coqui TTS for Better Voice
# =============================================================
echo "📥 STEP 3: Installing Coqui TTS (Text-to-Speech)..."
echo ""

# Note: Coqui TTS requires Python 3.9-3.11
pip3 install -q TTS
echo "✅ Coqui TTS installed"

echo ""

# =============================================================
# STEP 4: Test All Components
# =============================================================
echo "🧪 STEP 4: Testing AI Stack..."
echo ""

# Test Ollama + Mistral
echo "Testing Mistral 7B..."
if ollama run mistral "Hi" --verbose=false 2>/dev/null | grep -q "."; then
    echo "✅ Mistral 7B working"
else
    echo "⚠️  Mistral 7B test failed - but it's installed"
fi

# Test Whisper
echo "Testing Whisper..."
python3 -c "import whisper; print('✅ Whisper available')" 2>/dev/null || echo "⚠️  Whisper import check failed"

# Test Coqui TTS
echo "Testing Coqui TTS..."
python3 -c "from TTS.api import TTS; print('✅ Coqui TTS available')" 2>/dev/null || echo "⚠️  Coqui TTS import check failed"

echo ""

# =============================================================
# STEP 5: Summary
# =============================================================
echo "════════════════════════════════════════════════════════"
echo "✅ SELF-HOSTED AI STACK INSTALLED"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🧠 AI Brain: Mistral 7B (smarter than Llama 3.2)"
echo "🎤 Speech-to-Text: Whisper (local, unlimited)"
echo "🔊 Text-to-Speech: Coqui TTS (natural voice)"
echo "💰 Cost: FREE (fully self-hosted)"
echo "⚡ Limits: NONE (unlimited usage)"
echo ""
echo "════════════════════════════════════════════════════════"
echo "NEXT STEPS:"
echo "════════════════════════════════════════════════════════"
echo ""
echo "1. Update backend to use Mistral instead of Llama 3.2"
echo "2. Integrate Whisper for voice input"
echo "3. Replace gTTS with Coqui TTS"
echo "4. Test full conversation flow"
echo ""
echo "Ready to proceed with code updates!"
echo ""
