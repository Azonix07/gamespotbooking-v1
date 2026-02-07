"""
Auto-run rewards migration on startup
This runs automatically when the Flask app starts
"""

import os
from config.database import get_db_connection

def run_rewards_migration():
    """Auto-migrate rewards system on startup"""
    try:
        print("\n" + "="*60)
        print("🔄 Checking rewards system...")
        print("="*60)
        
        conn = get_db_connection()
        if not conn:
            print("❌ Database connection failed")
            return False
            
        cursor = conn.cursor()
        
        # Check if migration needed
        cursor.execute("""
            SELECT COUNT(*) as col_count
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('profile_picture', 'gamespot_points', 'instagram_shares', 'free_playtime_minutes', 'oauth_provider', 'oauth_provider_id')
        """)
        
        result = cursor.fetchone()
        cols_exist = result[0] if result else 0
        
        if cols_exist >= 6:
            print("✅ Rewards system already configured")
            cursor.close()
            conn.close()
            return True
        
        print(f"⚙️  Found {cols_exist}/6 columns - Running migration...")
        
        # Migration SQLs
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS gamespot_points INT DEFAULT 0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_shares INT DEFAULT 0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS free_playtime_minutes INT DEFAULT 0",
            # OAuth columns (needed for Google Sign-In)
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider_id VARCHAR(255) DEFAULT NULL",
            # Bookings: points tracking column
            "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS points_awarded BOOLEAN DEFAULT FALSE",
            """
            CREATE TABLE IF NOT EXISTS user_rewards (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                reward_type VARCHAR(50) NOT NULL,
                points_spent INT NOT NULL DEFAULT 0,
                reward_description TEXT,
                redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_rewards (user_id, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS points_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                booking_id INT NULL,
                points_earned INT NOT NULL,
                points_type VARCHAR(50) DEFAULT 'booking',
                booking_amount DECIMAL(10,2) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_points_history (user_id, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            """
            CREATE TABLE IF NOT EXISTS instagram_shares (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                share_count INT DEFAULT 0,
                reward_claimed BOOLEAN DEFAULT FALSE,
                last_share_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_instagram_shares (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        ]
        
        for i, sql in enumerate(migrations, 1):
            try:
                cursor.execute(sql)
                conn.commit()
                print(f"✅ [{i}/{len(migrations)}] Migration step completed")
            except Exception as e:
                if 'Duplicate column' in str(e) or 'already exists' in str(e):
                    print(f"⚠️  [{i}/{len(migrations)}] Already exists (skipping)")
                else:
                    print(f"❌ [{i}/{len(migrations)}] Error: {e}")
        
        cursor.close()
        conn.close()
        
        print("="*60)
        print("✅ Rewards system migration complete!")
        print("💰 Points: 50% of booking amount")
        print("🎁 Rewards: PS5 (500pts), VR (3000pts)")
        print("📱 Instagram: 30 mins free (5 shares)")
        print("="*60 + "\n")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        return False

if __name__ == '__main__':
    run_rewards_migration()
