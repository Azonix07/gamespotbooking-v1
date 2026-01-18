#!/bin/bash

# 🚀 GEMINI AI + PREMIUM VOICE SETUP
# Complete upgrade to high-end AI with best voice quality

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     🚀 GEMINI PRO AI + PREMIUM VOICE INSTALLATION           ║"
echo "║                                                              ║"
echo "║         Upgrading to High-End AI Model                      ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/abhijithca/Documents/GitHub/gamespotweb/backend_python

# Check if already installed
echo "📋 Checking current installation..."
echo ""

# Install Gemini AI (if not already)
if pip3 show google-generativeai > /dev/null 2>&1; then
    echo "✅ Gemini AI already installed"
else
    echo "📦 Installing Gemini Pro AI..."
    pip3 install google-generativeai==0.3.2
fi

# Install voice packages (if not already)
if pip3 show edge-tts > /dev/null 2>&1; then
    echo "✅ Edge TTS already installed"
else
    echo "📦 Installing Edge TTS..."
    pip3 install edge-tts==6.1.9
fi

if pip3 show gTTS > /dev/null 2>&1; then
    echo "✅ gTTS already installed"
else
    echo "📦 Installing gTTS..."
    pip3 install gTTS==2.5.0
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  ✅ INSTALLATION COMPLETE                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 What was installed:"
echo "  ✅ Gemini Pro - Google's advanced AI model (FREE)"
echo "  ✅ Edge TTS - Natural voice synthesis (FREE)"
echo "  ✅ gTTS - Fallback voice system (FREE)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 NEXT STEP: Get Your FREE Gemini API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://makersuite.google.com/app/apikey"
echo ""
echo "2. Click 'Create API Key'"
echo ""
echo "3. Copy the key (starts with 'AIzaSy...')"
echo ""
echo "4. Add to .env file:"
echo "   nano .env"
echo "   (Replace 'your_gemini_api_key_here' with your actual key)"
echo ""
echo "5. Save and exit (Ctrl+X, then Y, then Enter)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 START USING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After adding API key, start backend:"
echo "  python3 app.py"
echo ""
echo "Your AI will:"
echo "  ✅ Use Gemini Pro for intelligent responses"
echo "  ✅ Never repeat information"
echo "  ✅ Give concise, clear answers"
echo "  ✅ Speak with natural human voice"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 OPTIONAL: Upgrade to Premium Voice (OpenAI TTS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For ULTRA realistic voice (best quality):"
echo ""
echo "1. Install OpenAI TTS:"
echo "   pip3 install openai"
echo ""
echo "2. Get API key from: https://platform.openai.com/api-keys"
echo ""
echo "3. Add to .env:"
echo "   echo 'OPENAI_API_KEY=sk-proj-xxxxx' >> .env"
echo ""
echo "Cost: ~\$2-5/month (very affordable)"
echo "Quality: ⭐⭐⭐⭐⭐ (Most realistic human voice)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
