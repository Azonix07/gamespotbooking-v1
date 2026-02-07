"""
Voice AI Routes
API endpoints for professional Malayalam voice processing
"""

from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import tempfile

# Create blueprint
voice_ai_bp = Blueprint('voice_ai', __name__, url_prefix='/api/voice')

# Import voice service
try:
    from services.malayalam_voice_service import malayalam_voice_service
    VOICE_SERVICE_AVAILABLE = malayalam_voice_service is not None
except Exception as e:
    print(f"⚠️  Could not import malayalam_voice_service: {e}")
    VOICE_SERVICE_AVAILABLE = False

# Allowed audio file extensions
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'm4a', 'flac', 'webm'}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@voice_ai_bp.route('/status', methods=['GET'])
def voice_status():
    """
    Get voice service status
    GET /api/voice/status
    """
    if not VOICE_SERVICE_AVAILABLE:
        return jsonify({
            'available': False,
            'error': 'Voice service not initialized',
            'message': 'Install whisper and TTS: pip3 install openai-whisper TTS'
        }), 503
    
    model_info = malayalam_voice_service.get_model_info()
    
    return jsonify({
        'available': True,
        'models': model_info,
        'endpoints': {
            'transcribe': '/api/voice/transcribe',
            'speak': '/api/voice/speak',
            'process': '/api/voice/process'
        }
    })


@voice_ai_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio to text using Whisper
    
    POST /api/voice/transcribe
    Content-Type: multipart/form-data
    
    Form data:
    - audio: Audio file (wav, mp3, ogg, etc.)
    - language: Language code (default: 'ml' for Malayalam)
    - task: 'transcribe' or 'translate' (default: 'transcribe')
    
    Returns:
    {
        "success": true,
        "text": "transcribed text",
        "language": "ml",
        "confidence": 0.95,
        "duration": 1.23
    }
    """
    
    if not VOICE_SERVICE_AVAILABLE:
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
            'error': f'Invalid file type. Allowed: {ALLOWED_EXTENSIONS}'
        }), 400
    
    # Get parameters
    language = request.form.get('language', 'ml')  # Default to Malayalam
    task = request.form.get('task', 'transcribe')
    
    try:
        # Save uploaded file temporarily
        filename = secure_filename(audio_file.filename)
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, filename)
        audio_file.save(temp_path)
        
        # Transcribe using Whisper
        result = malayalam_voice_service.transcribe_audio(
            audio_file_path=temp_path,
            language=language,
            task=task
        )
        
        # Clean up temp file
        os.remove(temp_path)
        os.rmdir(temp_dir)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500


@voice_ai_bp.route('/speak', methods=['POST'])
def synthesize_speech():
    """
    Generate speech from text using Coqui TTS
    
    POST /api/voice/speak
    Content-Type: application/json
    
    Body:
    {
        "text": "text to speak",
        "language": "ml",  # Malayalam
        "format": "base64"  # or "url"
    }
    
    Returns:
    {
        "success": true,
        "audio_data": "base64_encoded_audio",  # if format=base64
        "audio_url": "/path/to/audio.wav",     # if format=url
        "format": "wav",
        "cached": false,
        "generation_time": 0.5
    }
    """
    
    if not VOICE_SERVICE_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Voice service not available'
        }), 503
    
    # Get request data
    data = request.get_json()
    
    if not data or 'text' not in data:
        return jsonify({
            'success': False,
            'error': 'No text provided'
        }), 400
    
    text = data['text']
    language = data.get('language', 'ml')  # Default to Malayalam
    output_format = data.get('format', 'base64')  # base64 or url
    
    # Enhance Malayalam text for natural speech
    if language == 'ml':
        text = malayalam_voice_service.enhance_malayalam_text(text)
    
    try:
        # Generate speech
        result = malayalam_voice_service.synthesize_speech(
            text=text,
            language=language
        )
        
        if not result['success']:
            return jsonify(result), 500
        
        # Return based on requested format
        if output_format == 'url':
            # Return URL to audio file
            return jsonify({
                'success': True,
                'audio_url': result['audio_url'],
                'format': result['format'],
                'cached': result['cached'],
                'generation_time': result['generation_time']
            })
        else:
            # Return base64 encoded audio
            return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500


@voice_ai_bp.route('/process', methods=['POST'])
def process_conversation():
    """
    Complete conversation processing: transcribe + respond + speak
    
    POST /api/voice/process
    Content-Type: multipart/form-data
    
    Form data:
    - audio: User's audio message
    - language: Language code (default: 'ml')
    - session_id: Session ID for context
    
    Returns:
    {
        "success": true,
        "user_text": "transcribed user input",
        "ai_text": "AI response text",
        "ai_audio": "base64_encoded_audio",
        "language": "ml"
    }
    """
    
    if not VOICE_SERVICE_AVAILABLE:
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
    language = request.form.get('language', 'ml')
    session_id = request.form.get('session_id', 'default')
    
    try:
        # Step 1: Transcribe user's audio
        filename = secure_filename(audio_file.filename)
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, filename)
        audio_file.save(temp_path)
        
        transcription = malayalam_voice_service.transcribe_audio(
            audio_file_path=temp_path,
            language=language
        )
        
        os.remove(temp_path)
        os.rmdir(temp_dir)
        
        if not transcription['success']:
            return jsonify(transcription), 500
        
        user_text = transcription['text']
        
        # Step 2: Generate AI response
        # TODO: Integrate with your AI response system
        # For now, use a simple response
        from services.ai_assistant import AIAssistant
        ai_assistant = AIAssistant()
        
        ai_response = ai_assistant.generate_response(
            user_message=user_text,
            session_id=session_id,
            language=language
        )
        
        ai_text = ai_response.get('reply', 'ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലായില്ല.')
        
        # Step 3: Generate AI speech
        speech_result = malayalam_voice_service.synthesize_speech(
            text=ai_text,
            language=language
        )
        
        if not speech_result['success']:
            return jsonify(speech_result), 500
        
        # Return complete conversation
        return jsonify({
            'success': True,
            'user_text': user_text,
            'user_confidence': transcription.get('confidence', 0.0),
            'ai_text': ai_text,
            'ai_audio': speech_result['audio_data'],
            'audio_format': speech_result['format'],
            'language': language,
            'session_id': session_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500


@voice_ai_bp.route('/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    """
    Serve cached audio files
    
    GET /api/voice/audio/<filename>
    """
    
    if not VOICE_SERVICE_AVAILABLE:
        return jsonify({
            'error': 'Voice service not available'
        }), 503
    
    # Security: only serve from cache directory
    cache_dir = malayalam_voice_service.cache_dir
    file_path = os.path.join(cache_dir, secure_filename(filename))
    
    if not os.path.exists(file_path):
        return jsonify({
            'error': 'Audio file not found'
        }), 404
    
    return send_file(
        file_path,
        mimetype='audio/wav',
        as_attachment=False
    )


@voice_ai_bp.route('/enhance', methods=['POST'])
def enhance_text():
    """
    Enhance Malayalam text to sound more natural
    
    POST /api/voice/enhance
    Content-Type: application/json
    
    Body:
    {
        "text": "formal Malayalam text",
        "style": "casual"  # or "formal"
    }
    
    Returns:
    {
        "original": "original text",
        "enhanced": "enhanced text",
        "changes": ["list of changes"]
    }
    """
    
    if not VOICE_SERVICE_AVAILABLE:
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
    
    original_text = data['text']
    style = data.get('style', 'casual')
    
    try:
        if style == 'casual':
            enhanced_text = malayalam_voice_service.enhance_malayalam_text(original_text)
        else:
            enhanced_text = original_text
        
        return jsonify({
            'success': True,
            'original': original_text,
            'enhanced': enhanced_text,
            'style': style
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500


# Register blueprint in main app.py
# app.register_blueprint(voice_ai_bp)
