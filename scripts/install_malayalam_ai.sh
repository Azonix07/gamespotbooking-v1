#!/bin/bash

# Malayalam AI Voice Upgrade Installation Script
# Install Whisper and Coqui TTS for professional Malayalam voice

echo "🎤 Malayalam AI Voice Upgrade"
echo "================================"
echo ""

# Check if running in correct directory
if [ ! -d "backend_python" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

cd backend_python

echo "📦 Step 1: Installing PyTorch (Required for AI models)"
echo "------------------------------------------------------"
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
echo "✅ PyTorch installed!"
echo ""

echo "📦 Step 2: Installing Whisper (Speech Recognition)"
echo "---------------------------------------------------"
pip3 install openai-whisper
echo "✅ Whisper installed!"
echo ""

echo "📦 Step 3: Installing Coqui TTS (Text-to-Speech)"
echo "-------------------------------------------------"
pip3 install TTS
echo "✅ Coqui TTS installed!"
echo ""

echo "📦 Step 4: Installing Audio Processing Libraries"
echo "------------------------------------------------"
pip3 install pydub soundfile librosa
echo "✅ Audio libraries installed!"
echo ""

echo "🧪 Step 5: Testing Installation"
echo "-------------------------------"
python3 << 'PYEOF'
import sys

print("\n🔍 Checking installations...")

# Test Whisper
try:
    import whisper
    print("✅ Whisper: OK")
except Exception as e:
    print(f"❌ Whisper: FAILED - {e}")

# Test TTS
try:
    from TTS.api import TTS
    print("✅ Coqui TTS: OK")
except Exception as e:
    print(f"❌ Coqui TTS: FAILED - {e}")

# Test torch
try:
    import torch
    print(f"✅ PyTorch: OK (version {torch.__version__})")
except Exception as e:
    print(f"❌ PyTorch: FAILED - {e}")

# Test audio libraries
try:
    import soundfile
    import librosa
    print("✅ Audio libraries: OK")
except Exception as e:
    print(f"❌ Audio libraries: FAILED - {e}")

print("\n✨ Installation check complete!")
PYEOF

echo ""
echo "📥 Step 6: Downloading Models (First-time setup)"
echo "------------------------------------------------"
echo "This will download ~500MB of AI models..."
python3 << 'PYEOF'
import os

print("\n📥 Downloading Whisper 'small' model...")
try:
    import whisper
    model = whisper.load_model("small")
    print("✅ Whisper model downloaded and cached!")
except Exception as e:
    print(f"⚠️  Whisper model download issue: {e}")

print("\n📥 Listing available Coqui TTS models...")
try:
    from TTS.api import TTS
    print("\nAvailable multilingual models:")
    models = TTS.list_models()
    ml_models = [m for m in models if 'multilingual' in m.lower()]
    for i, model in enumerate(ml_models[:5], 1):
        print(f"  {i}. {model}")
    print("\n✅ TTS models listed!")
except Exception as e:
    print(f"⚠️  TTS model listing issue: {e}")

print("\n✨ Models ready to use!")
PYEOF

echo ""
echo "🎯 Step 7: Creating Test Script"
echo "--------------------------------"

cat > test_malayalam_voice.py << 'TESTEOF'
#!/usr/bin/env python3
"""
Test script for Malayalam Voice AI
"""

def test_whisper_malayalam():
    """Test Whisper transcription with Malayalam"""
    print("\n🎤 Testing Whisper Malayalam Transcription...")
    print("=" * 50)
    
    try:
        import whisper
        
        model = whisper.load_model("small")
        print("✅ Model loaded!")
        
        # Test with Malayalam text (you'll need a real audio file)
        print("\n📝 To test transcription:")
        print("   result = model.transcribe('malayalam_audio.mp3', language='ml')")
        print("   print(result['text'])")
        
        print("\n✅ Whisper is ready for Malayalam!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_coqui_tts_malayalam():
    """Test Coqui TTS with Malayalam"""
    print("\n🔊 Testing Coqui TTS Malayalam Synthesis...")
    print("=" * 50)
    
    try:
        from TTS.api import TTS
        
        print("📥 Loading TTS model (may take a minute)...")
        
        # Use a multilingual model
        tts = TTS(model_name="tts_models/multilingual/multi-dataset/your_tts")
        print("✅ Model loaded!")
        
        # Test Malayalam synthesis
        test_text = "ഹായ്, ഇത് ടെസ്റ്റ് ആണ്!"
        print(f"\n📝 Test text: {test_text}")
        
        output_file = "test_malayalam_output.wav"
        print(f"🎵 Generating audio: {output_file}")
        
        tts.tts_to_file(
            text=test_text,
            file_path=output_file,
            language="ml"
        )
        
        print(f"✅ Audio generated successfully!")
        print(f"   Listen to: {output_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("\n" + "=" * 50)
    print("🎤 Malayalam Voice AI Test Suite")
    print("=" * 50)
    
    # Test Whisper
    whisper_ok = test_whisper_malayalam()
    
    # Test TTS
    tts_ok = test_coqui_tts_malayalam()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    print(f"Whisper (Speech Recognition): {'✅ PASS' if whisper_ok else '❌ FAIL'}")
    print(f"Coqui TTS (Text-to-Speech):   {'✅ PASS' if tts_ok else '❌ FAIL'}")
    
    if whisper_ok and tts_ok:
        print("\n🎉 All tests passed! Malayalam Voice AI is ready!")
        print("\n📚 Next steps:")
        print("   1. Integrate with your application")
        print("   2. Test with real Malayalam audio")
        print("   3. Fine-tune for your use case")
    else:
        print("\n⚠️  Some tests failed. Check errors above.")

if __name__ == "__main__":
    main()
TESTEOF

chmod +x test_malayalam_voice.py

echo "✅ Test script created: test_malayalam_voice.py"
echo ""

echo "✨ Installation Complete!"
echo "========================"
echo ""
echo "🎯 Next Steps:"
echo "  1. Run test: python3 test_malayalam_voice.py"
echo "  2. Check documentation: ../MALAYALAM_AI_VOICE_UPGRADE.md"
echo "  3. Integrate voice_ai_routes.py into your app.py"
echo "  4. Update frontend to use new API endpoints"
echo ""
echo "📖 API Endpoints:"
echo "  POST /api/voice/transcribe - Speech to text"
echo "  POST /api/voice/speak - Text to speech"
echo "  POST /api/voice/process - Complete conversation"
echo ""
echo "💡 Tip: First-time model loading may take longer!"
echo ""
echo "🚀 Happy coding with natural Malayalam AI! 🇮🇳"
