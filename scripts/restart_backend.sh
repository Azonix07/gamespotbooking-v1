#!/bin/bash

echo "════════════════════════════════════════════════════════════"
echo "🔄 RESTARTING BACKEND WITH ALL FIXES"
echo "════════════════════════════════════════════════════════════"

echo ""
echo "Step 1: Stopping old backend..."
pkill -f "python.*app.py" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Old backend stopped"
else
    echo "ℹ️  No old backend found"
fi

sleep 2

echo ""
echo "Step 2: Starting fresh backend with fixes..."
echo "   - Fixed Edge TTS (natural voice)"
echo "   - Fixed State Machine (smart conversation)"
echo "   - Improved gTTS fallback"
echo ""

cd /Users/abhijithca/Documents/GitHub/gamespotweb/backend_python

echo "════════════════════════════════════════════════════════════"
echo "🚀 BACKEND STARTING..."
echo "════════════════════════════════════════════════════════════"
echo ""

python3 app.py
