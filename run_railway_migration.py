"""
Run OAuth Migration on Railway MySQL
Execute this script to add OAuth columns to users table
"""

import mysql.connector
import os

# Railway MySQL credentials
DB_CONFIG = {
    'host': 'trolley.proxy.rlwy.net',
    'port': 44284,
    'user': 'root',
    'password': 'ajwQKNsWiVxeaGlmWJWTLErXmqwDUrBu',
    'database': 'railway'
}

def run_migration():
    print("🔄 Connecting to Railway MySQL...")
    
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("✅ Connected successfully!")
        print("\n📝 Running OAuth migration...\n")
        
        # Check if columns already exist
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'railway' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('oauth_provider', 'oauth_provider_id')
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        if 'oauth_provider' in existing_columns and 'oauth_provider_id' in existing_columns:
            print("ℹ️  OAuth columns already exist!")
        else:
            # Add oauth_provider column
            if 'oauth_provider' not in existing_columns:
                print("➕ Adding oauth_provider column...")
                cursor.execute("""
                    ALTER TABLE users 
                    ADD COLUMN oauth_provider VARCHAR(50)
                """)
                print("✅ oauth_provider column added!")
            
            # Add oauth_provider_id column
            if 'oauth_provider_id' not in existing_columns:
                print("➕ Adding oauth_provider_id column...")
                cursor.execute("""
                    ALTER TABLE users 
                    ADD COLUMN oauth_provider_id VARCHAR(255)
                """)
                print("✅ oauth_provider_id column added!")
            
            # Add index
            print("➕ Adding index...")
            try:
                cursor.execute("""
                    ALTER TABLE users 
                    ADD INDEX idx_oauth_provider_id (oauth_provider_id)
                """)
                print("✅ Index added!")
            except mysql.connector.Error as e:
                if 'Duplicate key name' in str(e):
                    print("ℹ️  Index already exists!")
                else:
                    raise
            
            conn.commit()
        
        # Verify the changes
        print("\n📊 Verifying migration...")
        cursor.execute("""
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'railway' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME LIKE 'oauth%'
        """)
        
        columns = cursor.fetchall()
        if columns:
            print("\n✅ OAuth columns verified:")
            for col in columns:
                print(f"   - {col[0]}: {col[1]}({col[2] if col[2] else 'N/A'})")
        else:
            print("❌ No OAuth columns found!")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Migration completed successfully!")
        print("\n📋 Next steps:")
        print("   1. Your Railway backend should auto-redeploy")
        print("   2. Go to: https://your-frontend.up.railway.app/login")
        print("   3. Test OTP login!")
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        print("\nTroubleshooting:")
        print("   - Verify MySQL credentials are correct")
        print("   - Check if Railway MySQL is running")
        print("   - Ensure your IP is not blocked")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Railway MySQL OAuth Migration")
    print("=" * 60)
    run_migration()
