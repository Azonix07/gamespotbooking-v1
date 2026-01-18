"""
Malayalam Voice Service
Professional AI-powered speech recognition and TTS for Malayalam
Uses Whisper (OpenAI) + Coqui TTS for natural Malayalam voice
"""

import os
import io
import base64
import hashlib
from typing import Dict, Optional
from datetime import datetime

class MalayalamVoiceService:
    """
    Professional Malayalam Voice Service
    Integrates Whisper for speech recognition and Coqui TTS for synthesis
    """
    
    def __init__(self):
        self.whisper_model = None
        self.coqui_tts = None
        self.cache_dir = "audio_cache"
        self.supported_languages = ['ml', 'en']  # Malayalam, English
        
        # Create cache directory
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Initialize models
        self._init_models()
    
    def _init_models(self):
        """Initialize Whisper and Coqui TTS models"""
        try:
            # Import Whisper
            import whisper
            print("📥 Loading Whisper model...")
            self.whisper_model = whisper.load_model("small")  # Good balance of speed/quality
            print("✅ Whisper model loaded successfully!")
            
        except Exception as e:
            print(f"⚠️  Whisper not available: {e}")
            print("   Install with: pip3 install openai-whisper")
        
        try:
            # Import Coqui TTS
            from TTS.api import TTS
            print("📥 Loading Coqui TTS model...")
            
            # Use multilingual model that supports Malayalam
            self.coqui_tts = TTS(
                model_name="tts_models/multilingual/multi-dataset/your_tts",
                progress_bar=False
            )
            print("✅ Coqui TTS loaded successfully!")
            
        except Exception as e:
            print(f"⚠️  Coqui TTS not available: {e}")
            print("   Install with: pip3 install TTS")
    
    def transcribe_audio(
        self, 
        audio_file_path: str,
        language: str = 'ml',
        task: str = 'transcribe'
    ) -> Dict:
        """
        Transcribe audio to text using Whisper
        
        Args:
            audio_file_path: Path to audio file
            language: Language code ('ml' for Malayalam, 'en' for English)
            task: 'transcribe' or 'translate'
        
        Returns:
            Dict with transcription results
        """
        
        if not self.whisper_model:
            return {
                'success': False,
                'error': 'Whisper model not available'
            }
        
        try:
            start_time = datetime.now()
            
            # Transcribe with Whisper
            result = self.whisper_model.transcribe(
                audio_file_path,
                language=language,
                task=task,
                temperature=0.0,  # Deterministic output
                word_timestamps=True  # Get word-level timing
            )
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return {
                'success': True,
                'text': result['text'].strip(),
                'language': result.get('language', language),
                'segments': result.get('segments', []),
                'duration': duration,
                'confidence': self._calculate_confidence(result)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_confidence(self, whisper_result: Dict) -> float:
        """Calculate average confidence from Whisper segments"""
        segments = whisper_result.get('segments', [])
        if not segments:
            return 0.0
        
        # Average confidence across all segments
        confidences = [
            seg.get('no_speech_prob', 1.0)
            for seg in segments
        ]
        
        return 1.0 - (sum(confidences) / len(confidences))
    
    def synthesize_speech(
        self,
        text: str,
        language: str = 'ml',
        speaker_reference: Optional[str] = None
    ) -> Dict:
        """
        Generate speech from text using Coqui TTS
        
        Args:
            text: Text to convert to speech
            language: Language code ('ml' for Malayalam)
            speaker_reference: Path to reference audio for voice cloning
        
        Returns:
            Dict with audio data
        """
        
        if not self.coqui_tts:
            return {
                'success': False,
                'error': 'Coqui TTS not available'
            }
        
        try:
            # Check cache first
            cache_key = self._get_cache_key(text, language)
            cached_file = os.path.join(self.cache_dir, f"{cache_key}.wav")
            
            if os.path.exists(cached_file):
                print(f"📦 Using cached audio: {cache_key}")
                return self._load_cached_audio(cached_file)
            
            # Generate new audio
            start_time = datetime.now()
            
            # Save to cache file
            self.coqui_tts.tts_to_file(
                text=text,
                file_path=cached_file,
                speaker_wav=speaker_reference,  # Optional voice cloning
                language=language,
                split_sentences=True  # Better prosody
            )
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return self._load_cached_audio(cached_file, duration)
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_cache_key(self, text: str, language: str) -> str:
        """Generate cache key from text and language"""
        content = f"{text}_{language}"
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def _load_cached_audio(self, file_path: str, generation_time: float = 0.0) -> Dict:
        """Load audio file and return as base64"""
        try:
            with open(file_path, 'rb') as f:
                audio_data = f.read()
            
            # Convert to base64 for transmission
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                'success': True,
                'audio_data': audio_base64,
                'audio_url': file_path,
                'format': 'wav',
                'generation_time': generation_time,
                'cached': generation_time == 0.0
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to load audio: {str(e)}"
            }
    
    def enhance_malayalam_text(self, formal_text: str) -> str:
        """
        Enhance Malayalam text to sound more natural
        Convert formal Malayalam to conversational style
        """
        
        # Casual word replacements
        replacements = {
            "നിങ്ങൾ": "നിങ്ങൾ",  # Keep formal for now (can customize)
            "എന്താണ്": "എന്താ",
            "എവിടെയാണ്": "എവിടെയാ",
            "ചെയ്യുക": "ചെയ്യൂ",
            "വരിക": "വരൂ",
            "പോകുക": "പോകൂ"
        }
        
        enhanced = formal_text
        for formal, casual in replacements.items():
            enhanced = enhanced.replace(formal, casual)
        
        # Add natural pauses
        enhanced = enhanced.replace(" എന്നിട്ട് ", ", എന്നിട്ട്, ")
        enhanced = enhanced.replace(" പിന്നെ ", ", പിന്നെ, ")
        
        return enhanced
    
    def process_code_mixed_text(self, text: str) -> Dict:
        """
        Process Malayalam-English code-mixed text
        Detect language segments and handle appropriately
        """
        import re
        
        # Pattern to detect Malayalam and English
        malayalam_pattern = r'[\u0D00-\u0D7F]+'
        english_pattern = r'[a-zA-Z0-9\s]+'
        
        segments = []
        last_pos = 0
        
        for match in re.finditer(f'({malayalam_pattern})|({english_pattern})', text):
            if match.group(1):  # Malayalam
                segments.append({
                    'text': match.group(1),
                    'language': 'ml',
                    'start': match.start(),
                    'end': match.end()
                })
            elif match.group(2) and match.group(2).strip():  # English
                segments.append({
                    'text': match.group(2).strip(),
                    'language': 'en',
                    'start': match.start(),
                    'end': match.end()
                })
        
        return {
            'segments': segments,
            'is_code_mixed': len(segments) > 1 and any(s['language'] == 'ml' for s in segments) and any(s['language'] == 'en' for s in segments)
        }
    
    def get_model_info(self) -> Dict:
        """Get information about loaded models"""
        return {
            'whisper': {
                'loaded': self.whisper_model is not None,
                'model': 'small' if self.whisper_model else None,
                'languages': ['ml', 'en'] if self.whisper_model else []
            },
            'coqui_tts': {
                'loaded': self.coqui_tts is not None,
                'model': 'multilingual/your_tts' if self.coqui_tts else None,
                'languages': ['ml', 'en'] if self.coqui_tts else []
            },
            'cache_dir': self.cache_dir,
            'supported_languages': self.supported_languages
        }


# Global instance
try:
    malayalam_voice_service = MalayalamVoiceService()
    print("\n✅ Malayalam Voice Service initialized successfully!")
    print(f"   Models: {malayalam_voice_service.get_model_info()}")
except Exception as e:
    print(f"\n⚠️  Malayalam Voice Service initialization failed: {e}")
    malayalam_voice_service = None
