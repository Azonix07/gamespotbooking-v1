#!/usr/bin/env python3
"""
Migration Script: Add email column to admin_users and update admin email
Run this to update the Railway database
"""

import os
import mysql.connector
from mysql.connector import Error

def run_migration():
    """Run the admin email migration on Railway database"""
    
    try:
        # Get Railway database credentials from environment
        connection = mysql.connector.connect(
            host=os.getenv('MYSQLHOST'),
            port=int(os.getenv('MYSQLPORT', 3306)),
            user=os.getenv('MYSQLUSER', 'root'),
            password=os.getenv('MYSQLPASSWORD'),
            database=os.getenv('MYSQLDATABASE', 'railway')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            print("✅ Connected to Railway database")
            
            # Add email column if it doesn't exist
            print("\n📝 Adding email column to admin_users table...")
            cursor.execute("""
                ALTER TABLE admin_users 
                ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE NULL
            """)
            connection.commit()
            print("✅ Email column added (or already exists)")
            
            # Update existing admin user
            print("\n📝 Updating admin user with email...")
            cursor.execute("""
                UPDATE admin_users 
                SET email = 'admin@gamespot.in' 
                WHERE username = 'admin' AND email IS NULL
            """)
            connection.commit()
            rows_affected = cursor.rowcount
            print(f"✅ Updated {rows_affected} admin user(s)")
            
            # Verify the change
            print("\n📊 Current admin_users:")
            cursor.execute("SELECT id, username, email, created_at FROM admin_users")
            results = cursor.fetchall()
            
            for row in results:
                print(f"   ID: {row[0]}, Username: {row[1]}, Email: {row[2]}, Created: {row[3]}")
            
            print("\n✅ Migration completed successfully!")
            print("\n📧 Admin can now login with:")
            print("   - Username: admin")
            print("   - Email: admin@gamespot.in")
            print("   - Password: 9645136006")
            
    except Error as e:
        print(f"❌ Database error: {e}")
        return False
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 ADMIN EMAIL MIGRATION")
    print("=" * 60)
    
    # Check if environment variables are set
    if not os.getenv('MYSQLHOST') or not os.getenv('MYSQLPASSWORD'):
        print("\n❌ Missing required environment variables:")
        print("   Set MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE")
        print("\n💡 You can run this script on Railway using the Railway CLI:")
        print("   railway run python database/run_admin_email_migration.py")
        exit(1)
    
    success = run_migration()
    exit(0 if success else 1)
