"""
Professional Malayalam Voice API Routes
Provides endpoints for speech recognition and synthesis
"""

from flask import Blueprint, request, jsonify, send_file
import os
import tempfile
from werkzeug.utils import secure_filename

# Import the upgraded Malayalam voice service
try:
    from services.malayalam_voice_upgraded import malayalam_voice_service
    VOICE_SERVICE_AVAILABLE = malayalam_voice_service is not None
except Exception as e:
    print(f"⚠️  Voice service import error: {e}")
    malayalam_voice_service = None
    VOICE_SERVICE_AVAILABLE = False

# Create Blueprint
voice_upgraded_bp = Blueprint('voice_upgraded', __name__)

# Allowed file extensions for audio upload
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'm4a', 'flac', 'webm'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@voice_upgraded_bp.route('/api/voice-pro/status', methods=['GET'])
def get_service_status():
    """
    Get professional voice service status and capabilities
    
    Returns:
        JSON with service information
    """
    
    if not VOICE_SERVICE_AVAILABLE or not malayalam_voice_service:
        return jsonify({
            'available': False,
            'error': 'Voice service not initialized'
        }), 503
    
    try:
        info = malayalam_voice_service.get_service_info()
        return jsonify({
            'available': True,
            'service_info': info
        })
    except Exception as e:
        return jsonify({
            'available': False,
            'error': 'An error occurred'
        }), 500


@voice_upgraded_bp.route('/api/voice-pro/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio to text using Whisper AI
    
    Request:
        - Multipart form-data with audio file
        - Optional: language ('ml' or 'en')
    
    Returns:
        JSON with transcribed text and confidence score
    """
    
    if not VOICE_SERVICE_AVAILABLE or not malayalam_voice_service:
        return jsonify({
            'success': False,
            'error': 'Voice service not available'
        }), 503
    
    # Check if audio file is present
    if 'audio' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No audio file provided'
        }), 400
    
    audio_file = request.files['audio']
    
    if audio_file.filename == '':
        return jsonify({
            'success': False,
            'error': 'Empty filename'
        }), 400
    
    if not allowed_file(audio_file.filename):
        return jsonify({
            'success': False,
            'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    # Get language parameter
    language = request.form.get('language', 'ml')
    
    # Save uploaded file temporarily
    try:
        filename = secure_filename(audio_file.filename)
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        audio_file.save(temp_path)
        
        # Transcribe
        result = malayalam_voice_service.transcribe_audio(temp_path, language)
        
        # Clean up
        try:
            os.remove(temp_path)
        except:
            pass
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500


@voice_upgraded_bp.route('/api/voice-pro/speak', methods=['POST'])
def generate_speech():
    """
    Generate speech from text using Google TTS
    
    Request:
        JSON: {
            "text": "Malayalam or English text",
            "language": "ml" (optional, default: 'ml'),
            "use_cache": true (optional, default: true)
        }
    
    Returns:
        JSON with base64-encoded audio
    """
    
    if not VOICE_SERVICE_AVAILABLE or not malayalam_voice_service:
        return jsonify({
            'success': False,
            'error': 'Voice service not available'
        }), 503
    
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({
            'success': False,
            'error': 'No text provided'
        }), 400
    
    text = data['text']
    language = data.get('language', 'ml')
    use_cache = data.get('use_cache', True)
    
    if not text.strip():
        return jsonify({
            'success': False,
            'error': 'Empty text'
        }), 400
    
    try:
        result = malayalam_voice_service.synthesize_speech(text, language, use_cache)
        
        if result:
            return jsonify({
                'success': True,
                **result
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Speech generation failed'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500


@voice_upgraded_bp.route('/api/voice-pro/process', methods=['POST'])
def process_voice_conversation():
    """
    Complete voice conversation flow:
    1. Transcribe user's speech to text
    2. Get AI response (from your AI assistant)
    3. Generate speech from AI response
    
    Request:
        - Multipart form-data with audio file
        - Optional: session_id, language
    
    Returns:
        JSON with user text, AI response text, and AI speech audio
    """
    
    if not VOICE_SERVICE_AVAILABLE or not malayalam_voice_service:
        return jsonify({
            'success': False,
            'error': 'Voice service not available'
        }), 503
    
    # Check if audio file is present
    if 'audio' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No audio file provided'
        }), 400
    
    audio_file = request.files['audio']
    
    if audio_file.filename == '' or not allowed_file(audio_file.filename):
        return jsonify({
            'success': False,
            'error': 'Invalid audio file'
        }), 400
    
    language = request.form.get('language', 'ml')
    session_id = request.form.get('session_id', 'default')
    
    try:
        # Step 1: Transcribe user's speech
        filename = secure_filename(audio_file.filename)
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        
        audio_file.save(temp_path)
        
        transcription = malayalam_voice_service.transcribe_audio(temp_path, language)
        
        # Clean up temp file
        try:
            os.remove(temp_path)
        except:
            pass
        
        if not transcription['success']:
            return jsonify({
                'success': False,
                'error': 'Transcription failed',
                'details': transcription.get('error')
            }), 500
        
        user_text = transcription['text']
        
        # Step 2: Get AI response
        # TODO: Integrate with your AI assistant
        # For now, simple echo response
        ai_response_text = f"നിങ്ങൾ പറഞ്ഞത്: {user_text}"
        
        # Step 3: Generate speech from AI response
        ai_speech = malayalam_voice_service.synthesize_speech(ai_response_text, language)
        
        if not ai_speech:
            return jsonify({
                'success': False,
                'error': 'Speech generation failed'
            }), 500
        
        return jsonify({
            'success': True,
            'user_text': user_text,
            'user_confidence': transcription.get('confidence', 0),
            'ai_text': ai_response_text,
            'ai_audio': ai_speech['audio_data'],
            'audio_format': ai_speech['format'],
            'language': language,
            'session_id': session_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500


@voice_upgraded_bp.route('/api/voice-pro/test', methods=['POST'])
def test_malayalam_speech():
    """
    Quick test endpoint for Malayalam speech
    
    Request:
        JSON: {"text": "നമസ്കാരം"}
    
    Returns:
        JSON with audio
    """
    
    if not VOICE_SERVICE_AVAILABLE or not malayalam_voice_service:
        return jsonify({
            'success': False,
            'error': 'Voice service not available'
        }), 503
    
    data = request.get_json()
    text = data.get('text', 'നമസ്കാരം! ഗെയിം സ്പോട്ടിലേക്ക് സ്വാഗതം!')
    
    try:
        result = malayalam_voice_service.synthesize_speech(text, 'ml')
        
        if result:
            return jsonify({
                'success': True,
                'text': text,
                'audio_data': result['audio_data'],
                'format': result['format'],
                'message': '✅ Malayalam speech generated successfully!'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Speech generation failed'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500
