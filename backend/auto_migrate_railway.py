"""
Auto-run rewards system migration on Railway MySQL
This script connects to Railway and runs the migration automatically
"""

import os
import sys
import mysql.connector
from mysql.connector import Error

# Railway MySQL Connection Details
# Get these from Railway environment variables or .env
DB_HOST = os.getenv('DB_HOST', 'mysql.railway.internal')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', os.getenv('DB_PASS', ''))
DB_NAME = os.getenv('DB_NAME', 'railway')
DB_PORT = int(os.getenv('DB_PORT', 3306))

# If running locally, you need Railway public URL
# Example: autorack.proxy.rlwy.net
if not DB_HOST or DB_HOST == 'localhost':
    print("⚠️  WARNING: Using localhost. This won't connect to Railway.")
    print("You need to set Railway MySQL credentials as environment variables.")
    print("\nTo get your Railway MySQL credentials:")
    print("1. Go to Railway Dashboard")
    print("2. Click on MySQL service")
    print("3. Go to 'Variables' tab")
    print("4. Copy: MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT")
    print("\nThen run:")
    print('$env:DB_HOST="your-host"; $env:DB_USER="root"; $env:DB_PASSWORD="your-password"; $env:DB_NAME="railway"; python auto_migrate_railway.py')
    sys.exit(1)

def run_migration():
    """Run the rewards system migration"""
    
    print("=" * 70)
    print("🚀 GameSpot Rewards System - Auto Migration to Railway")
    print("=" * 70)
    print(f"\n📡 Connecting to Railway MySQL...")
    print(f"   Host: {DB_HOST}")
    print(f"   User: {DB_USER}")
    print(f"   Database: {DB_NAME}")
    print(f"   Port: {DB_PORT}")
    
    try:
        # Connect to Railway MySQL
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            connect_timeout=10
        )
        
        if connection.is_connected():
            print("✅ Connected successfully!\n")
            cursor = connection.cursor()
            
            # Migration statements
            migrations = [
                {
                    'sql': "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500)",
                    'desc': "Add profile_picture column"
                },
                {
                    'sql': "ALTER TABLE users ADD COLUMN IF NOT EXISTS gamespot_points INT DEFAULT 0",
                    'desc': "Add gamespot_points column"
                },
                {
                    'sql': "ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_shares INT DEFAULT 0",
                    'desc': "Add instagram_shares column"
                },
                {
                    'sql': "ALTER TABLE users ADD COLUMN IF NOT EXISTS free_playtime_minutes INT DEFAULT 0",
                    'desc': "Add free_playtime_minutes column"
                },
                {
                    'sql': """
                        CREATE TABLE IF NOT EXISTS user_rewards (
                            id INT PRIMARY KEY AUTO_INCREMENT,
                            user_id INT NOT NULL,
                            reward_type VARCHAR(50) NOT NULL,
                            points_spent INT NOT NULL,
                            reward_description TEXT,
                            redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            status VARCHAR(20) DEFAULT 'active',
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    """,
                    'desc': "Create user_rewards table"
                },
                {
                    'sql': """
                        CREATE TABLE IF NOT EXISTS points_history (
                            id INT PRIMARY KEY AUTO_INCREMENT,
                            user_id INT NOT NULL,
                            booking_id INT,
                            points_earned INT NOT NULL,
                            points_type VARCHAR(50) DEFAULT 'booking',
                            booking_amount DECIMAL(10,2),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    """,
                    'desc': "Create points_history table"
                },
                {
                    'sql': """
                        CREATE TABLE IF NOT EXISTS instagram_shares (
                            id INT PRIMARY KEY AUTO_INCREMENT,
                            user_id INT NOT NULL,
                            share_count INT DEFAULT 0,
                            reward_claimed BOOLEAN DEFAULT FALSE,
                            last_share_at TIMESTAMP,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                        )
                    """,
                    'desc': "Create instagram_shares table"
                }
            ]
            
            print("📝 Running migration statements...\n")
            
            for i, migration in enumerate(migrations, 1):
                try:
                    cursor.execute(migration['sql'])
                    connection.commit()
                    print(f"✅ [{i}/{len(migrations)}] {migration['desc']}")
                except Error as e:
                    if 'Duplicate column' in str(e) or 'already exists' in str(e):
                        print(f"⚠️  [{i}/{len(migrations)}] {migration['desc']} (already exists)")
                    else:
                        print(f"❌ [{i}/{len(migrations)}] {migration['desc']} - Error: {e}")
                        raise
            
            cursor.close()
            connection.close()
            
            print("\n" + "=" * 70)
            print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
            print("=" * 70)
            print("\n✨ Your profile page is now ready!")
            print("\n📊 What was added:")
            print("   • 4 new columns in users table")
            print("   • user_rewards table (redemption tracking)")
            print("   • points_history table (points earned per booking)")
            print("   • instagram_shares table (share tracking)")
            print("\n💰 Rewards System Active:")
            print("   • Earn 50% of booking amount as points")
            print("   • PS5 Extra Hour: 500 points")
            print("   • VR Free Day: 3000 points")
            print("   • Instagram Share: 30 mins free (5 shares)")
            print("\n🌐 Visit your profile page now:")
            print("   https://gamespotbooking-v1-production-185b.up.railway.app/profile")
            print("=" * 70)
            
            return True
            
    except Error as e:
        print(f"\n❌ MySQL Error: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Check your Railway MySQL credentials")
        print("   2. Make sure Railway MySQL is running")
        print("   3. Check if you're using the correct host (might need public URL)")
        print("   4. Verify environment variables are set correctly")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
