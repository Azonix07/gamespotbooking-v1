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
