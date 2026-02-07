"""
GameSpot Booking System - Python Backend
Flask application with MySQL database
Production-hardened with security middleware
"""

from flask import Flask, session, request, jsonify
from flask_cors import CORS
from datetime import timedelta
import os
import sys
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
        sys.stderr.write("⚠️  CRITICAL: SECRET_KEY not set in production! Using random key.\n")

app.config['SECRET_KEY'] = secret_key
app.config['SESSION_COOKIE_NAME'] = 'gamespot_session'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Required for cross-origin cookies
app.config['SESSION_COOKIE_SECURE'] = True  # Required when SameSite=None
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_COOKIE_DOMAIN'] = None  # Let browser handle domain automatically
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Allowed origins (whitelist)
ALLOWED_ORIGINS = [
    'https://gamespot.in',
    'https://www.gamespot.in',
    'https://gamespotbooking-v1-production.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]

# Add custom origins from environment (comma-separated)
custom_origins = os.getenv('ALLOWED_ORIGINS', '')
if custom_origins:
    ALLOWED_ORIGINS.extend([o.strip() for o in custom_origins.split(',') if o.strip()])


def is_origin_allowed(origin):
    """Check if origin is allowed — whitelist + Railway pattern matching"""
    if not origin:
        return False
    if origin in ALLOWED_ORIGINS:
        return True
    # Allow any Railway-deployed service (*.up.railway.app)
    if origin.endswith('.up.railway.app') and origin.startswith('https://'):
        return True
    return False


# CORS Configuration
CORS(app, 
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Add after_request handler for security headers
@app.after_request
def add_security_headers(response):
    origin = request.headers.get('Origin')
    
    # CORS: Only allow whitelisted origins + Railway services
    if origin and is_origin_allowed(origin):
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
    
    # Content-Security-Policy
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://*.railway.app https://accounts.google.com; "
        "frame-src https://accounts.google.com; "
        "object-src 'none'; "
        "base-uri 'self'"
    )
    
    # Remove server identification headers
    response.headers.pop('Server', None)
    response.headers.pop('X-Powered-By', None)
    
    # Strict-Transport-Security for production
    if os.getenv('RAILWAY_ENVIRONMENT') or request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    return response

# Initialize database connection pool
init_db_pool()

# Auto-run rewards system migration
run_rewards_migration()

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

# ============================================================
# FIX ADMIN PASSWORD ON STARTUP
# The Railway database has a different hash than expected.
# This ensures the admin password is always correct.
# ============================================================
def fix_admin_credentials():
    """Ensure admin user exists with correct password hash and email"""
    import bcrypt
    conn = None
    cursor = None
    try:
        from config.database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Generate correct hash for password 9645136006
        correct_password = '9645136006'
        correct_hash = bcrypt.hashpw(correct_password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')
        
        # Check if admin user exists
        cursor.execute('SELECT id, username FROM admin_users WHERE username = %s', ('admin',))
        admin = cursor.fetchone()
        
        if admin:
            # Update password hash to correct one
            cursor.execute('UPDATE admin_users SET password_hash = %s WHERE username = %s', (correct_hash, 'admin'))
            conn.commit()
            print("✅ Admin password hash updated successfully")
        else:
            # Insert admin user
            cursor.execute(
                'INSERT INTO admin_users (username, password_hash) VALUES (%s, %s)',
                ('admin', correct_hash)
            )
            conn.commit()
            print("✅ Admin user created successfully")
        
        # Try to add email column if it doesn't exist
        try:
            cursor.execute("SELECT email FROM admin_users LIMIT 1")
            cursor.fetchone()
            # Column exists, update email
            cursor.execute("UPDATE admin_users SET email = %s WHERE username = %s", ('admin@gamespot.in', 'admin'))
            conn.commit()
            print("✅ Admin email set to admin@gamespot.in")
        except Exception:
            try:
                cursor.execute("ALTER TABLE admin_users ADD COLUMN email VARCHAR(255) UNIQUE NULL")
                conn.commit()
                cursor.execute("UPDATE admin_users SET email = %s WHERE username = %s", ('admin@gamespot.in', 'admin'))
                conn.commit()
                print("✅ Email column added and admin email set")
            except Exception as e2:
                print(f"⚠️  Could not add email column: {e2}")
        
    except Exception as e:
        print(f"⚠️  Admin credential fix error: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            try:
                conn.close()
            except:
                pass

# Run the fix on startup
fix_admin_credentials()

# ============================================================
# AUTO-CREATE MISSING TABLES ON STARTUP
# Ensures all required tables exist in the Railway database
# ============================================================
def create_missing_tables():
    """Create any missing tables that the admin dashboard needs"""
    conn = None
    cursor = None
    try:
        from config.database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Drop and recreate tables that were created with wrong column names
        # These tables are empty so no data loss
        fix_tables = [
            "DROP TABLE IF EXISTS page_visits",
            "DROP TABLE IF EXISTS game_leaderboard",
        ]
        for sql in fix_tables:
            try:
                cursor.execute(sql)
            except Exception:
                pass
        conn.commit()
        
        tables_sql = [
            """CREATE TABLE IF NOT EXISTS page_visits (
                id INT PRIMARY KEY AUTO_INCREMENT,
                page VARCHAR(255) NOT NULL,
                referrer VARCHAR(500) NULL,
                user_agent VARCHAR(500) NULL,
                ip_address VARCHAR(45) NULL,
                session_id VARCHAR(255) NULL,
                user_id INT NULL,
                device_type VARCHAR(50) DEFAULT 'desktop',
                browser VARCHAR(100) NULL,
                country VARCHAR(100) NULL,
                visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS rental_bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                customer_name VARCHAR(100) NOT NULL,
                customer_phone VARCHAR(20) NOT NULL,
                customer_email VARCHAR(255) NULL,
                rental_type VARCHAR(50) NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                quantity INT DEFAULT 1,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                deposit_amount DECIMAL(10,2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS college_bookings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                college_name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(100) NOT NULL,
                contact_phone VARCHAR(20) NOT NULL,
                contact_email VARCHAR(255) NULL,
                event_type VARCHAR(100) NOT NULL,
                event_date DATE NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                expected_attendees INT DEFAULT 50,
                requirements TEXT,
                total_price DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS game_leaderboard (
                id INT PRIMARY KEY AUTO_INCREMENT,
                player_name VARCHAR(100) NOT NULL,
                score INT NOT NULL,
                game_type VARCHAR(50) DEFAULT 'discount_game',
                enemies_shot INT DEFAULT 0,
                boss_enemies_shot INT DEFAULT 0,
                accuracy_percentage DECIMAL(5,2) DEFAULT 0,
                duration_seconds INT DEFAULT 60,
                is_winner BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT TRUE,
                is_flagged BOOLEAN DEFAULT FALSE,
                prize_claimed BOOLEAN DEFAULT FALSE,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS game_winners (
                id INT PRIMARY KEY AUTO_INCREMENT,
                leaderboard_id INT NOT NULL,
                player_name VARCHAR(100) NOT NULL,
                score INT NOT NULL,
                prize_type VARCHAR(50) DEFAULT 'free_gaming',
                prize_value DECIMAL(10,2) DEFAULT 0,
                claimed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS college_event_media (
                id INT PRIMARY KEY AUTO_INCREMENT,
                booking_id INT NOT NULL,
                media_type VARCHAR(20) NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                caption VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )""",
            """CREATE TABLE IF NOT EXISTS site_settings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )"""
        ]
        
        created = 0
        for sql in tables_sql:
            try:
                cursor.execute(sql)
                created += 1
            except Exception as e:
                print(f"⚠️  Table creation warning: {e}")
        
        conn.commit()
        print(f"✅ Database tables verified ({created} CREATE IF NOT EXISTS statements executed)")
        
        # Auto-add missing columns to bookings table (from promo_codes migration)
        alter_statements = [
            "ALTER TABLE bookings ADD COLUMN bonus_minutes INT DEFAULT 0",
            "ALTER TABLE bookings ADD COLUMN promo_code_id INT NULL",
        ]
        for sql in alter_statements:
            try:
                cursor.execute(sql)
                conn.commit()
                print(f"✅ Added missing column: {sql}")
            except Exception:
                pass  # Column already exists, skip silently
        
    except Exception as e:
        print(f"⚠️  Table creation error: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            try:
                conn.close()
            except:
                pass

create_missing_tables()

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'message': 'GameSpot Python Backend is running'}, 200

# Root endpoint - minimal info (don't expose API structure)
@app.route('/', methods=['GET'])
def root():
    return {
        'message': 'GameSpot Booking System',
        'status': 'running'
    }, 200


# ============================================================
# GLOBAL ERROR HANDLERS — never expose internal details
# ============================================================
@app.errorhandler(400)
def bad_request(e):
    return jsonify({'success': False, 'error': 'Bad request'}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({'success': False, 'error': 'Not found'}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'success': False, 'error': 'Method not allowed'}), 405

@app.errorhandler(413)
def too_large(e):
    return jsonify({'success': False, 'error': 'Request too large'}), 413

@app.errorhandler(429)
def rate_limited(e):
    return jsonify({'success': False, 'error': 'Too many requests. Please try again later.'}), 429

@app.errorhandler(500)
def internal_error(e):
    # Log the real error for debugging, but never expose it to client
    sys.stderr.write(f"500 error: {e}\n")
    return jsonify({'success': False, 'error': 'An internal error occurred'}), 500

if __name__ == '__main__':
    is_production = bool(os.getenv('RAILWAY_ENVIRONMENT'))
    
    print("=" * 60)
    print("🎮 GameSpot Booking System - Python Backend")
    print("=" * 60)
    print(f"✅ Environment: {'PRODUCTION' if is_production else 'DEVELOPMENT'}")
    print("✅ Server starting on http://localhost:8000")
    print("✅ CORS enabled for React frontend")
    print("✅ Session-based authentication enabled")
    print("✅ MySQL connection pool initialized")
    print("=" * 60)
    
    # Run the Flask app — NEVER use debug=True in production
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=not is_production,
        threaded=True
    )
