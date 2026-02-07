"""
GameSpot Booking System - Python Backend
Flask application with MySQL database
"""

from flask import Flask, session, request
from flask_cors import CORS
from datetime import timedelta
import os
from dotenv import load_dotenv

# Load environment variables FIRST (before importing services)
load_dotenv()

# Import configuration
from config.database import init_db_pool

# Import migration
from migrate_rewards import run_rewards_migration

# Import routes
from routes.slots import slots_bp
from routes.pricing import pricing_bp
from routes.bookings import bookings_bp
from routes.admin import admin_bp
from routes.ai import ai_bp  # AI Assistant route
from routes.voice_upgraded_routes import voice_upgraded_bp  # Professional Malayalam Voice AI
from routes.auth_routes import auth_bp  # User authentication routes
from routes.membership_routes import membership_bp  # Membership management routes
from routes.games import games_bp  # Games catalog and recommendations
from routes.analytics import analytics_bp  # Analytics and visitor tracking
from routes.feedback import feedback_bp  # User feedback and suggestions
from routes.updates import updates_bp  # Shop updates and announcements
from routes.rentals import rentals_bp  # Rental bookings (VR & PS5)
from routes.college import college_bp  # College event bookings
from routes.game_leaderboard import game_leaderboard_bp  # Game leaderboard and winners
from routes.instagram_promotion import instagram_promo_bp  # Instagram promotions
from routes.setup_promo import setup_bp  # One-time setup for Instagram promotions
from routes.promo_codes import promo_bp  # Promo codes system
from routes.user_routes import user_bp  # User profile and rewards system

# Create Flask app
app = Flask(__name__)

# ============================================================
# SECURITY CONFIGURATION
# ============================================================

# Ensure SECRET_KEY is set from environment (no weak default in production)
secret_key = os.getenv('SECRET_KEY')
if not secret_key or secret_key == 'gamespot-secret-key-change-in-production':
    import secrets
    secret_key = secrets.token_hex(32)
    if os.getenv('RAILWAY_ENVIRONMENT'):
        print("⚠️  WARNING: SECRET_KEY not set! Using random key (sessions won't persist across restarts)")

app.config['SECRET_KEY'] = secret_key
app.config['SESSION_COOKIE_NAME'] = 'gamespot_session'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Required for cross-origin cookies
app.config['SESSION_COOKIE_SECURE'] = True  # Required when SameSite=None
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_COOKIE_DOMAIN'] = None  # Let browser handle domain automatically
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Allowed origins (whitelist instead of wildcard)
ALLOWED_ORIGINS = [
    'https://gamespot.in',
    'https://www.gamespot.in',
    'https://gamespotbooking-v1-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]

# Add custom origins from environment
custom_origins = os.getenv('ALLOWED_ORIGINS', '')
if custom_origins:
    ALLOWED_ORIGINS.extend([o.strip() for o in custom_origins.split(',') if o.strip()])

# CORS Configuration - Restricted to allowed origins
CORS(app, 
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Add after_request handler for security headers
@app.after_request
def add_security_headers(response):
    origin = request.headers.get('Origin')
    
    # CORS: Only allow whitelisted origins
    if origin and origin in ALLOWED_ORIGINS:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(self), geolocation=()'
    
    # Remove server identification header
    response.headers.pop('Server', None)
    
    # Strict-Transport-Security for production
    if os.getenv('RAILWAY_ENVIRONMENT') or request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response

# Initialize database connection pool
init_db_pool()

# Auto-run rewards system migration
run_rewards_migration()

# Create uploads directory for profile pictures
os.makedirs('static/uploads/profiles', exist_ok=True)

# Register blueprints
app.register_blueprint(slots_bp)
app.register_blueprint(pricing_bp)
app.register_blueprint(bookings_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(ai_bp)  # AI Assistant
app.register_blueprint(voice_upgraded_bp)  # Professional Malayalam Voice AI
app.register_blueprint(auth_bp)  # User authentication (signup, login, password reset)
app.register_blueprint(membership_bp)  # Membership plans and subscriptions
app.register_blueprint(games_bp)  # Games catalog and recommendations
app.register_blueprint(analytics_bp)  # Analytics and visitor tracking
app.register_blueprint(feedback_bp)  # User feedback and suggestions
app.register_blueprint(updates_bp)  # Shop updates and announcements
app.register_blueprint(rentals_bp)  # Rental bookings (VR & PS5)
app.register_blueprint(college_bp)  # College event bookings
app.register_blueprint(game_leaderboard_bp)  # Game leaderboard and winners
app.register_blueprint(instagram_promo_bp)  # Instagram promotions
app.register_blueprint(setup_bp)  # One-time setup for Instagram promotions
app.register_blueprint(promo_bp)  # Promo codes system
app.register_blueprint(user_bp)  # User profile and rewards system

# Create uploads directory for profile pictures
os.makedirs('static/uploads/profiles', exist_ok=True)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'message': 'GameSpot Python Backend is running'}, 200

# Root endpoint - API info
@app.route('/', methods=['GET'])
def root():
    return {
        'message': 'GameSpot Booking System API',
        'version': '2.0.0',
        'backend': 'Python/Flask',
        'endpoints': {
            'slots': '/api/slots.php',
            'pricing': '/api/pricing.php',
            'bookings': '/api/bookings.php',
            'admin': '/api/admin.php',
            'ai_chat': '/api/ai/chat',
            'auth_signup': '/api/auth/signup',
            'auth_login': '/api/auth/login',
            'membership_plans': '/api/membership/plans'
        }
    }, 200

if __name__ == '__main__':
    print("=" * 60)
    print("🎮 GameSpot Booking System - Python Backend")
    print("=" * 60)
    print("✅ Server starting on http://localhost:8000")
    print("✅ CORS enabled for React frontend")
    print("✅ Session-based authentication enabled")
    print("✅ MySQL connection pool initialized")
    print("=" * 60)
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=True,
        threaded=True
    )
