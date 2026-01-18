"""
Realistic Text-to-Speech Service
Priority: Edge TTS (Microsoft Neural) > pyttsx3 > gTTS
Edge TTS provides human-like, natural voices for free
"""

import io
import base64
import tempfile
import os
import asyncio
from typing import Dict, Optional

class VoiceTTSService:
    """Realistic TTS Service with multiple engines"""
    
    def __init__(self):
        self.active_engine = None
        self.available_engines = []
        self.pyttsx3_engine = None
        
        # Voice config
        self.voice_config = {
            'gender': 'female',
            'accent': 'indian',
            'language': 'en-IN',
            'style': 'friendly',
            'rate': 175,  # Speaking speed
            'volume': 1.0,
            # Edge TTS voice - natural Indian English female
            'edge_voice': 'en-IN-NeerjaNeural'  # Indian female neural voice
        }
        
        # Try Edge TTS first (BEST - Microsoft neural voices, free)
        try:
            import edge_tts
            self.active_engine = 'edge_tts'
            self.available_engines.append('edge_tts')
            print("✅ Edge TTS available (REALISTIC Microsoft neural voice)")
        except Exception as e:
            print(f"⚠️  Edge TTS not available: {e}")
        
        # Try pyttsx3 second (offline, realistic)
        if not self.active_engine:
            try:
                import pyttsx3
                self.pyttsx3_engine = pyttsx3.init()
                
                # Configure for natural sound
                self.pyttsx3_engine.setProperty('rate', self.voice_config['rate'])
                self.pyttsx3_engine.setProperty('volume', self.voice_config['volume'])
                
                # Find a female voice
                voices = self.pyttsx3_engine.getProperty('voices')
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower() or 'samantha' in voice.name.lower():
                        self.pyttsx3_engine.setProperty('voice', voice.id)
                        break
                
                self.active_engine = 'pyttsx3'
                self.available_engines.append('pyttsx3')
                print("✅ pyttsx3 available (REALISTIC offline voice)")
            except Exception as e:
                print(f"⚠️  pyttsx3 not available: {e}")
                self.pyttsx3_engine = None
        
        # Check gTTS availability as last fallback
        try:
            from gtts import gTTS
            self.available_engines.append('gtts')
            if not self.active_engine:
                self.active_engine = 'gtts'
            print("✅ gTTS available (Basic fallback)")
        except ImportError:
            print("❌ gTTS not installed!")
        
        if not self.active_engine:
            print("❌ No TTS engine available!")
        
        print(f"\n🎤 Active TTS Engine: {self.active_engine or 'None'}")
        print(f"🔊 Available engines: {', '.join(self.available_engines) or 'None'}")
        
        if self.active_engine == 'edge_tts':
            quality = "⭐⭐⭐⭐⭐ REALISTIC (Microsoft Neural)"
        elif self.active_engine == 'pyttsx3':
            quality = "⭐⭐⭐⭐ Natural (pyttsx3)"
        else:
            quality = "⭐⭐⭐ Basic (gTTS)"
        
        print(f"🎵 Voice Quality: {quality}")
    
    def generate_speech(
        self, 
        text: str, 
        emotion: str = 'neutral',
        speed: float = 1.0,
        language: str = 'en'
    ) -> Optional[Dict]:
        """
        Generate speech from text
        
        Args:
            text: Text to convert to speech
            emotion: Emotion style
            speed: Speech rate
            language: Language code (en, ml, hi, etc.)
        
        Returns:
            Dict with audio data and metadata
        """
        
        if not self.active_engine:
            return None
        
        try:
            # Use Edge TTS (best), pyttsx3 (good), or gTTS (basic)
            if self.active_engine == 'edge_tts':
                return self._generate_edge_tts(text, speed, language)
            elif self.active_engine == 'pyttsx3' and self.pyttsx3_engine:
                return self._generate_pyttsx3(text, speed, language)
            else:
                return self._generate_gtts(text, language)
        except Exception as e:
            print(f"TTS Error: {e}")
            # Try fallback
            if self.active_engine != 'gtts' and 'gtts' in self.available_engines:
                return self._generate_gtts(text, language)
            return None
    
    def _generate_edge_tts(self, text: str, speed: float, language: str) -> Dict:
        """Generate REALISTIC speech with Microsoft Edge TTS (neural voices)"""
        try:
            import edge_tts
            
            # Select voice based on language
            voice_map = {
                'en': 'en-IN-NeerjaNeural',  # Indian English female (natural)
                'ml': 'ml-IN-SobhanaNeural',  # Malayalam female
                'hi': 'hi-IN-SwaraNeural'     # Hindi female
            }
            
            voice = voice_map.get(language, 'en-IN-NeerjaNeural')
            
            # Adjust rate based on speed (+0% = normal, -50% = slow, +50% = fast)
            rate_adjust = f"{int((speed - 1.0) * 50):+d}%"
            
            # Create temp file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            temp_path = temp_file.name
            temp_file.close()
            
            # Generate speech asynchronously
            async def generate():
                communicate = edge_tts.Communicate(text, voice, rate=rate_adjust)
                await communicate.save(temp_path)
            
            # Run async function
            asyncio.run(generate())
            
            # Read the file and encode to base64
            with open(temp_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Clean up temp file
            try:
                os.unlink(temp_path)
            except:
                pass
            
            # Encode to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                'audio_data': audio_base64,
                'format': 'mp3',
                'engine': 'edge_tts',
                'quality': 'realistic_neural',
                'language': language,
                'voice': voice
            }
            
        except Exception as e:
            print(f"❌ Edge TTS generation failed: {e}")
            # Fall back to next available engine
            if self.pyttsx3_engine:
                return self._generate_pyttsx3(text, speed, language)
            else:
                return self._generate_gtts(text, language)
    
    def _generate_pyttsx3(self, text: str, speed: float, language: str) -> Dict:
        """Generate realistic speech with pyttsx3 (offline)"""
        try:
            # Create temp file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            temp_path = temp_file.name
            temp_file.close()
            
            # Adjust rate based on speed parameter
            rate = int(self.voice_config['rate'] * speed)
            self.pyttsx3_engine.setProperty('rate', rate)
            
            # Generate speech to file
            self.pyttsx3_engine.save_to_file(text, temp_path)
            self.pyttsx3_engine.runAndWait()
            
            # Read the file and encode to base64
            with open(temp_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Clean up temp file
            try:
                os.unlink(temp_path)
            except:
                pass
            
            # Encode to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                'audio_data': audio_base64,
                'format': 'mp3',
                'engine': 'pyttsx3',
                'quality': 'realistic',
                'language': language
            }
            
        except Exception as e:
            print(f"❌ pyttsx3 generation failed: {e}")
            # Fall back to gTTS
            return self._generate_gtts(text, language)
    
    def _generate_gtts(self, text: str, language: str) -> Dict:
        """Generate speech with gTTS"""
        from gtts import gTTS
        
        lang_map = {
            'en': 'en',
            'ml': 'ml',
            'hi': 'hi'
        }
        
        # Use tld='co.in' for Indian accent
        tts = gTTS(
            text=text, 
            lang=lang_map.get(language, 'en'), 
            slow=False,  # Normal speed
            tld='co.in'  # Indian English accent
        )
        
        # Save to memory
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        # Convert to base64
        audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
        
        return {
            'audio_data': audio_base64,
            'format': 'mp3',
            'engine': 'gtts',
            'voice': 'indian_female',
            'duration_estimate': len(text) / 12
        }
    
    def get_voice_info(self) -> Dict:
        """Get current voice configuration"""
        return {
            'active_engine': self.active_engine,
            'available_engines': self.available_engines,
            'voice_config': self.voice_config,
            'supported_languages': ['en', 'ml', 'hi'],
            'supported_emotions': ['neutral']
        }


# Global instance
try:
    voice_tts_service = VoiceTTSService()
except Exception as e:
    print(f"⚠️  TTS Service initialization failed: {e}")
    voice_tts_service = None
