#!/bin/bash

# 🎤 VOICE AI INSTALLATION SCRIPT
# Installs best FREE voice synthesis for GameSpot AI

echo "======================================"
echo "🎤 GameSpot AI - Voice Installation"
echo "======================================"
echo ""

cd /Users/abhijithca/Documents/GitHub/gamespotweb/backend_python

# Install required packages
echo "📦 Installing voice packages..."
echo ""

# Install Edge TTS (FREE, Microsoft, Excellent quality)
echo "1️⃣  Installing Edge TTS (FREE - Recommended)..."
pip3 install edge-tts==6.1.9

# Install gTTS (FREE backup)
echo "2️⃣  Installing gTTS (FREE fallback)..."
pip3 install gTTS==2.5.0

# Check if Gemini is installed
echo ""
echo "3️⃣  Checking Gemini AI..."
if pip3 show google-generativeai > /dev/null 2>&1; then
    echo "✅ Gemini AI already installed"
else
    echo "📦 Installing Gemini AI..."
    pip3 install google-generativeai==0.3.2
fi

echo ""
echo "======================================"
echo "✅ VOICE INSTALLATION COMPLETE!"
echo "======================================"
echo ""
echo "🎤 Installed TTS Engines:"
echo "  ✅ Edge TTS (Microsoft) - FREE, Natural voice"
echo "  ✅ gTTS - FREE, Basic fallback"
echo ""
echo "🧠 AI Engine:"
echo "  ✅ Google Gemini - FREE tier"
echo ""
echo "======================================"
echo "📋 NEXT STEPS:"
echo "======================================"
echo ""
echo "1. Get Gemini API Key (FREE):"
echo "   https://makersuite.google.com/app/apikey"
echo ""
echo "2. Add to .env file:"
echo "   echo 'GEMINI_API_KEY=your_key_here' >> .env"
echo ""
echo "3. Test voice AI:"
echo "   ./test_voice_ai.sh"
echo ""
echo "4. Start backend:"
echo "   python3 app.py"
echo ""
echo "======================================"
echo "🎯 VOICE OPTIONS:"
echo "======================================"
echo ""
echo "Current: Edge TTS (FREE)"
echo "  ✅ Natural Indian English female voice"
echo "  ✅ No API key required"
echo "  ✅ Unlimited usage"
echo "  ✅ Malayalam & Hindi support"
echo ""
echo "Upgrade options:"
echo "  • OpenAI TTS (\$0.015/1M chars) - Premium quality"
echo "  • Google Cloud TTS (FREE tier) - Excellent quality"
echo "  • ElevenLabs (10k/month free) - Ultra realistic"
echo ""
echo "======================================"
