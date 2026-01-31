#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "🚀 GAMESPOT - PREMIUM AI SYSTEM"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✅ AI Model: Google Gemini 2.5 Flash (Latest, Fastest)"
echo "✅ Voice: Microsoft Edge TTS (Indian English, Natural)"
echo "✅ Features: Smart, Conversational, No Repetition"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

cd backend_python

# Check if API key is configured
if grep -q "GEMINI_API_KEY=AIza" .env; then
    echo "✅ Gemini API Key: Configured"
else
    echo "❌ ERROR: GEMINI_API_KEY not found in .env"
    echo ""
    echo "Please add your API key to backend_python/.env:"
    echo "GEMINI_API_KEY=your_key_here"
    echo ""
    echo "Get FREE key: https://makersuite.google.com/app/apikey"
    exit 1
fi

echo ""
echo "🔧 Starting Backend Services..."
echo ""

# Start Python backend
python3 app.py

echo ""
echo "════════════════════════════════════════════════════════════"
echo "💡 To test the AI:"
echo "   1. Open your frontend (mobile app or web)"
echo "   2. Click the AI chat button"
echo "   3. Say: 'I want to book a PS5'"
echo "   4. The AI will respond with natural voice!"
echo "════════════════════════════════════════════════════════════"
