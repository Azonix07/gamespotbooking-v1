"""
Run rewards system database migration
Adds profile picture, points, Instagram shares, and rewards tables
"""

import os
import sys
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

# Load environment variables
load_dotenv()

def run_migration():
    """Execute the rewards system migration"""
    
    # Database connection details
    db_config = {
        'host': os.getenv('DB_HOST'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME'),
        'port': int(os.getenv('DB_PORT', 3306))
    }
    
    # Read migration SQL file
    migration_file = '../database/migration_rewards_system.sql'
    
    try:
        with open(migration_file, 'r') as f:
            sql_content = f.read()
        
        print("=" * 60)
        print("🎮 GameSpot Rewards System Migration")
        print("=" * 60)
        print(f"📁 Reading migration file: {migration_file}")
        
        # Connect to database
        print(f"🔌 Connecting to database: {db_config['host']}")
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        
        # Split SQL statements (handle multi-statement execution)
        statements = []
        current_statement = []
        
        for line in sql_content.split('\n'):
            # Skip comments and empty lines
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            
            current_statement.append(line)
            
            # Check if statement is complete (ends with semicolon)
            if line.endswith(';'):
                statements.append(' '.join(current_statement))
                current_statement = []
        
        # Execute each statement
        print(f"\n📝 Executing {len(statements)} SQL statements...")
        
        for i, statement in enumerate(statements, 1):
            try:
                cursor.execute(statement)
                connection.commit()
                
                # Parse statement type for better logging
                stmt_type = statement.split()[0].upper()
                if 'ALTER TABLE users' in statement:
                    if 'profile_picture' in statement:
                        print(f"✅ [{i}/{len(statements)}] Added profile_picture column")
                    elif 'gamespot_points' in statement:
                        print(f"✅ [{i}/{len(statements)}] Added gamespot_points column")
                    elif 'instagram_shares' in statement:
                        print(f"✅ [{i}/{len(statements)}] Added instagram_shares column")
                    elif 'free_playtime_minutes' in statement:
                        print(f"✅ [{i}/{len(statements)}] Added free_playtime_minutes column")
                elif 'CREATE TABLE' in statement:
                    table_name = statement.split('CREATE TABLE')[1].split('(')[0].strip()
                    print(f"✅ [{i}/{len(statements)}] Created table: {table_name}")
                else:
                    print(f"✅ [{i}/{len(statements)}] {stmt_type} statement executed")
                    
            except Error as e:
                # Check if error is "column already exists" or "table already exists"
                if 'Duplicate column name' in str(e):
                    print(f"⚠️  [{i}/{len(statements)}] Column already exists (skipping)")
                elif 'already exists' in str(e):
                    print(f"⚠️  [{i}/{len(statements)}] Table already exists (skipping)")
                else:
                    print(f"❌ [{i}/{len(statements)}] Error: {e}")
                    raise
        
        cursor.close()
        connection.close()
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        print("\n📊 Rewards System Tables:")
        print("   • users (extended with profile_picture, points, shares)")
        print("   • user_rewards (redemption records)")
        print("   • points_history (points earned per booking)")
        print("   • instagram_shares (share tracking)")
        print("\n💰 Points System:")
        print("   • Earn 2% of booking amount as GameSpot Points")
        print("   • ₹500 booking = 10 points")
        print("   • ₹25,000 in bookings = 500 points (PS5 hour)")
        print("   • ₹100,000 in bookings = 2000 points (VR day)")
        print("\n📱 Instagram Rewards:")
        print("   • Share to 5 people = 30 minutes free playtime")
        print("   • One-time reward when 5 shares complete")
        print("\n🎁 Redemption Options:")
        print("   • 500 pts → 1 hour extra PS5 time (min ₹300 booking)")
        print("   • 2000 pts → 1 day VR rental free")
        print("\n" + "=" * 60)
        
        return True
        
    except FileNotFoundError:
        print(f"❌ Error: Migration file not found: {migration_file}")
        return False
    except Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
