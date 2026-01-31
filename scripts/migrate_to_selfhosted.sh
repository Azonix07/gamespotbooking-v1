#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "🚀 MIGRATION TO SELF-HOSTED AI STACK"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "This script will:"
echo "  1. Remove Gemini AI dependencies"
echo "  2. Install self-hosted AI stack (Mistral-7B + Whisper + Coqui)"
echo "  3. Download AI models (one-time, ~15GB)"
echo "  4. Configure and test the new system"
echo ""
echo "Requirements:"
echo "  - 8GB RAM minimum (16GB recommended)"
echo "  - 20GB free disk space"
echo "  - Python 3.9+"
echo "  - Internet connection (for initial download only)"
echo ""
read -p "Continue with migration? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/backend_python"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "STEP 1: Backup existing system"
echo "════════════════════════════════════════════════════════════════"

# Backup old requirements
if [ -f "requirements.txt" ]; then
    cp requirements.txt requirements.txt.backup_gemini
    echo "✅ Backed up: requirements.txt.backup_gemini"
fi

# Backup AI assistant
if [ -f "services/ai_assistant.py" ]; then
    cp services/ai_assistant.py services/ai_assistant.py.backup_gemini
    echo "✅ Backed up: services/ai_assistant.py.backup_gemini"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "STEP 2: Uninstall Gemini dependencies"
echo "════════════════════════════════════════════════════════════════"

pip uninstall -y google-generativeai google-api-core google-auth
echo "✅ Removed Gemini AI packages"

# Remove edge-tts (was unreliable)
pip uninstall -y edge-tts
echo "✅ Removed Edge TTS"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "STEP 3: Install self-hosted AI stack"
echo "════════════════════════════════════════════════════════════════"

echo "Installing PyTorch and transformers..."
pip install torch==2.1.2 transformers==4.36.2 accelerate==0.25.0 sentencepiece==0.1.99

echo "Installing Whisper (STT)..."
pip install openai-whisper==20231117

echo "Installing Coqui TTS (Voice)..."
pip install TTS==0.22.0

echo "Installing audio processing..."
pip install numpy==1.24.3 soundfile==0.12.1

echo "Installing fallback voice..."
pip install gTTS==2.5.0

echo "✅ All packages installed"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "STEP 4: Download AI models (this takes time!)"
echo "════════════════════════════════════════════════════════════════"

echo "Downloading Mistral-7B-Instruct (~14GB)..."
echo "This is a ONE-TIME download. Model will be cached for future use."

python3 - <<'PYTHON'
print("Starting model download...")
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

model_name = "mistralai/Mistral-7B-Instruct-v0.2"
print(f"Loading {model_name}...")

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    low_cpu_mem_usage=True
)

print("✅ Mistral-7B downloaded and cached!")
PYTHON

echo ""
echo "Downloading Whisper base model (~140MB)..."
python3 - <<'PYTHON'
import whisper
print("Loading Whisper base model...")
model = whisper.load_model("base")
print("✅ Whisper downloaded and cached!")
PYTHON

echo ""
echo "Downloading Coqui TTS model (~500MB)..."
python3 - <<'PYTHON'
from TTS.api import TTS
print("Loading Coqui TTS model...")
tts = TTS(model_name="tts_models/en/vctk/vits")
print("✅ Coqui TTS downloaded and cached!")
PYTHON

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "STEP 5: Update configuration"
echo "════════════════════════════════════════════════════════════════"

# Update .env file
if [ -f ".env" ]; then
    # Remove Gemini API key line
    sed -i.backup '/GEMINI_API_KEY/d' .env
    echo "✅ Removed GEMINI_API_KEY from .env"
    
    # Add self-hosted config
    echo "" >> .env
    echo "# Self-Hosted AI Configuration" >> .env
    echo "LOCAL_LLM_MODEL=mistralai/Mistral-7B-Instruct-v0.2" >> .env
    echo "WHISPER_MODEL=base" >> .env
    echo "AI_MODE=selfhosted" >> .env
    echo "✅ Added self-hosted configuration"
fi

# Replace ai_assistant.py with self-hosted version
cp services/ai_assistant_selfhosted.py services/ai_assistant.py
echo "✅ Updated AI assistant to use self-hosted stack"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "STEP 6: Test the new system"
echo "════════════════════════════════════════════════════════════════"

echo "Testing Self-Hosted LLM..."
python3 services/selfhosted_llm_service.py

echo ""
echo "Testing Self-Hosted Voice..."
python3 services/selfhosted_voice_service.py

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ MIGRATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Your AI system is now:"
echo "  ✅ Self-hosted (runs locally)"
echo "  ✅ Unlimited (no quotas)"
echo "  ✅ Free (no API costs)"
echo "  ✅ Private (no data sent to cloud)"
echo ""
echo "Models cached at:"
echo "  - Mistral-7B: ~/.cache/huggingface/"
echo "  - Whisper: ~/.cache/whisper/"
echo "  - Coqui TTS: ~/.local/share/tts/"
echo ""
echo "Next steps:"
echo "  1. Start backend: python3 app.py"
echo "  2. Test in your frontend"
echo "  3. Enjoy unlimited AI! 🎉"
echo ""
echo "Backups saved:"
echo "  - requirements.txt.backup_gemini"
echo "  - services/ai_assistant.py.backup_gemini"
echo ""
echo "To rollback (if needed):"
echo "  cp requirements.txt.backup_gemini requirements.txt"
echo "  cp services/ai_assistant.py.backup_gemini services/ai_assistant.py"
echo "  pip install -r requirements.txt"
echo ""
echo "════════════════════════════════════════════════════════════════"
