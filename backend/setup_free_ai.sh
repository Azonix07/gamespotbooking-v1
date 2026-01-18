#!/bin/bash

echo "=================================================="
echo "🚀 GameSpot FREE AI Setup (NO Quotas, NO Limits)"
echo "=================================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📦 Installing Ollama (local AI, completely FREE)..."
    brew install ollama
    echo "✅ Ollama installed!"
else
    echo "✅ Ollama already installed"
fi

# Start Ollama service
echo ""
echo "🔄 Starting Ollama service..."
brew services start ollama
sleep 3

# Check if service is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama service is running!"
else
    echo "⚠️  Starting Ollama manually..."
    ollama serve > /dev/null 2>&1 &
    sleep 5
fi

# Download Llama 3.2 model (fast, 2GB model)
echo ""
echo "📥 Downloading Llama 3.2 AI model (FREE, ~2GB, 3-5 minutes)..."
echo "   This is a ONE-TIME download. After this, UNLIMITED usage!"
ollama pull llama3.2

echo ""
echo "=================================================="
echo "✅ FREE AI SETUP COMPLETE!"
echo "=================================================="
echo ""
echo "What you now have:"
echo "  ✅ Ollama AI - Unlimited chat (NO quotas)"
echo "  ✅ Llama 3.2 - Smart, fast, completely FREE"
echo "  ✅ gTTS Voice - Reliable voice synthesis (FREE)"
echo "  ✅ NO API keys needed"
echo "  ✅ NO monthly limits"
echo "  ✅ NO authentication errors"
echo ""
echo "🎮 Ready to use! Restart your backend:"
echo "   cd backend_python && python3 app.py"
echo ""
echo "=================================================="
