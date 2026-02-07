"""
Admin Setup Route - Create Instagram Promotion Tables
TEMPORARY: Run this once to setup tables in Railway
"""

from flask import Blueprint, jsonify
from config.database import get_db_connection
from datetime import date, timedelta

setup_bp = Blueprint('setup', __name__)

@setup_bp.route('/api/admin/setup-instagram-promo', methods=['POST'])
def setup_instagram_promotion():
    """
    ONE-TIME SETUP: Creates tables and inserts promotion
    Access: https://your-railway-url.railway.app/api/admin/setup-instagram-promo
    Method: POST (use Postman or curl)
    """
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create instagram_promotions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS instagram_promotions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                campaign_name VARCHAR(100) NOT NULL,
                instagram_handle VARCHAR(100) NOT NULL DEFAULT '@gamespot_kdlr',
                discount_type ENUM('fixed_amount', 'percentage', 'free_minutes') NOT NULL DEFAULT 'free_minutes',
                discount_value DECIMAL(10,2) NOT NULL,
                required_friends_count INT NOT NULL DEFAULT 2,
                max_redemptions_per_user INT NOT NULL DEFAULT 1,
                is_active BOOLEAN DEFAULT TRUE,
                start_date DATE NOT NULL,
                end_date DATE,
                terms_conditions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_active (is_active),
                INDEX idx_dates (start_date, end_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ''')
        
        # Create user_instagram_redemptions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_instagram_redemptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                promotion_id INT NOT NULL,
                instagram_username VARCHAR(100) NOT NULL,
                shared_with_friends JSON NOT NULL,
                redemption_code VARCHAR(20) UNIQUE NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                verified_by INT,
                verified_at TIMESTAMP NULL,
                is_used BOOLEAN DEFAULT FALSE,
                used_in_booking_id INT,
                used_at TIMESTAMP NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (promotion_id) REFERENCES instagram_promotions(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_promotion (user_id, promotion_id),
                INDEX idx_redemption_code (redemption_code),
                INDEX idx_verification (is_verified),
                INDEX idx_usage (is_used),
                INDEX idx_expiry (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ''')
        
        conn.commit()
        
        # Check if promotion already exists
        cursor.execute('SELECT COUNT(*) as count FROM instagram_promotions WHERE is_active = TRUE')
        result = cursor.fetchone()
        
        if result[0] == 0:
            # Insert the promotion
            start_date = date.today()
            end_date = start_date + timedelta(days=90)
            
            cursor.execute('''
                INSERT INTO instagram_promotions (
                    campaign_name,
                    instagram_handle,
                    discount_type,
                    discount_value,
                    required_friends_count,
                    max_redemptions_per_user,
                    start_date,
                    end_date,
                    terms_conditions,
                    is_active
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            ''', (
                'Win 30 Minutes FREE Gaming!',
                '@gamespot_kdlr',
                'free_minutes',
                30.00,
                2,
                1,
                start_date,
                end_date,
                '1. Follow @gamespot_kdlr on Instagram\n2. Share with 2 friends\n3. Get 30 min FREE\n4. One-time per user\n5. Admin verification required',
                True
            ))
            
            conn.commit()
            
            promotion_id = cursor.lastrowid
            
            return jsonify({
                'success': True,
                'message': 'Instagram promotion system setup complete!',
                'promotion': {
                    'id': promotion_id,
                    'campaign_name': 'Win 30 Minutes FREE Gaming!',
                    'discount_value': 30,
                    'instagram_handle': '@gamespot_kdlr'
                }
            }), 201
        else:
            return jsonify({
                'success': True,
                'message': 'Tables already exist and promotion is active',
                'note': 'No changes made'
            }), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({
            'success': False,
            'error': 'An error occurred',
            'message': 'Failed to setup Instagram promotion system'
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@setup_bp.route('/api/admin/check-instagram-tables', methods=['GET'])
def check_instagram_tables():
    """Check if Instagram promotion tables exist"""
    
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if tables exist
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('instagram_promotions', 'user_instagram_redemptions')
        """)
        
        tables = cursor.fetchall()
        table_names = [t['TABLE_NAME'] for t in tables]
        
        # Check for active promotions
        active_count = 0
        if 'instagram_promotions' in table_names:
            cursor.execute('SELECT COUNT(*) as count FROM instagram_promotions WHERE is_active = TRUE')
            result = cursor.fetchone()
            active_count = result['count']
        
        return jsonify({
            'success': True,
            'tables_exist': {
                'instagram_promotions': 'instagram_promotions' in table_names,
                'user_instagram_redemptions': 'user_instagram_redemptions' in table_names
            },
            'active_promotions_count': active_count,
            'status': 'ready' if len(table_names) == 2 and active_count > 0 else 'needs_setup'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'An error occurred'
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
