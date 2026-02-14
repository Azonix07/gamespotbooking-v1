#!/usr/bin/env python3
"""
Clear Memberships Script
Removes all membership records from Railway database for a fresh start
"""

import os
import sys
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def clear_memberships():
    """Clear all membership data from the database"""
    
    # Get database credentials from environment
    host = os.getenv("MYSQLHOST")
    port = os.getenv("MYSQLPORT", "3306")
    user = os.getenv("MYSQLUSER", "root")
    password = os.getenv("MYSQLPASSWORD")
    database = os.getenv("MYSQLDATABASE", "railway")
    
    if not host or not password:
        print("❌ Missing database environment variables")
        print("Make sure MYSQLHOST and MYSQLPASSWORD are set in your .env file")
        return False
    
    print("=" * 60)
    print("🗑️  CLEAR MEMBERSHIPS - Fresh Start")
    print("=" * 60)
    print(f"Database: {database} @ {host}")
    print()
    
    # Confirm action
    confirm = input("⚠️  This will DELETE ALL membership records. Continue? (yes/no): ")
    if confirm.lower() != 'yes':
        print("❌ Cancelled")
        return False
    
    print()
    
    try:
        # Connect to database
        print("📡 Connecting to database...")
        conn = mysql.connector.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        
        # Check current count
        cursor.execute("SELECT COUNT(*) FROM memberships")
        count_before = cursor.fetchone()[0]
        print(f"📊 Current memberships in database: {count_before}")
        
        if count_before == 0:
            print("✅ Database already clear!")
            cursor.close()
            conn.close()
            return True
        
        print()
        
        # Step 1: Delete all memberships
        print("🗑️  Step 1: Deleting all membership records...")
        cursor.execute("DELETE FROM memberships")
        deleted = cursor.rowcount
        print(f"   ✅ Deleted {deleted} membership records")
        
        # Step 2: Reset auto-increment
        print("🔄 Step 2: Resetting auto-increment counter...")
        cursor.execute("ALTER TABLE memberships AUTO_INCREMENT = 1")
        print("   ✅ Counter reset to 1")
        
        # Step 3: Clear membership references from bookings
        print("🔗 Step 3: Clearing membership references from bookings...")
        cursor.execute("UPDATE bookings SET membership_id = NULL, membership_rate = 0 WHERE membership_id IS NOT NULL")
        updated = cursor.rowcount
        print(f"   ✅ Updated {updated} booking records")
        
        # Commit changes
        conn.commit()
        print()
        print("💾 Changes committed to database")
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM memberships")
        count_after = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        print()
        print("=" * 60)
        print("✅ MEMBERSHIP DATA CLEARED SUCCESSFULLY")
        print("=" * 60)
        print(f"Memberships before: {count_before}")
        print(f"Memberships after: {count_after}")
        print()
        print("Users can now subscribe to new plans:")
        print("  Story Pass: solo_quest, legend_mode, god_mode")
        print("  Driving Pass: ignition, turbo, apex")
        print("=" * 60)
        
        return True
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = clear_memberships()
    sys.exit(0 if success else 1)
