"""
Setup Railway MySQL Database - Automated Script
Reads Railway MySQL credentials from environment variables and executes COMPLETE_DATABASE_SETUP.sql
"""

import mysql.connector
import os
import sys

def connect_to_railway():
    """Connect to Railway MySQL using environment variables"""
    print("🔌 Connecting to Railway MySQL...")
    
    # Get credentials from environment variables
    host = os.getenv('MYSQLHOST')
    port = os.getenv('MYSQLPORT', '3306')
    user = os.getenv('MYSQLUSER', 'root')
    password = os.getenv('MYSQLPASSWORD')
    database = os.getenv('MYSQLDATABASE')
    
    # Validate credentials
    if not all([host, password, database]):
        print("❌ ERROR: Missing required environment variables!")
        print("\nRequired variables:")
        print("  - MYSQLHOST")
        print("  - MYSQLPASSWORD")
        print("  - MYSQLDATABASE")
        print("  - MYSQLPORT (optional, defaults to 3306)")
        print("  - MYSQLUSER (optional, defaults to root)")
        print("\nSet them with:")
        print('  $env:MYSQLHOST="your-host.railway.app"')
        print('  $env:MYSQLPASSWORD="your-password"')
        print('  $env:MYSQLDATABASE="railway"')
        sys.exit(1)
    
    try:
        connection = mysql.connector.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            database=database,
            autocommit=False,
            allow_local_infile=True
        )
        print(f"✅ Connected to Railway MySQL: {host}")
        return connection
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        sys.exit(1)

def read_sql_file():
    """Read the complete database setup SQL file"""
    print("\n📄 Reading COMPLETE_DATABASE_SETUP.sql...")
    
    sql_file = os.path.join('database', 'COMPLETE_DATABASE_SETUP.sql')
    
    if not os.path.exists(sql_file):
        print(f"❌ ERROR: SQL file not found at {sql_file}")
        sys.exit(1)
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    print(f"✅ SQL file loaded ({len(sql_content)} characters)")
    return sql_content

def execute_sql(connection, sql_content):
    """Execute SQL statements from the file"""
    print("\n🚀 Executing database setup...")
    
    cursor = connection.cursor()
    
    # Split SQL into individual statements
    statements = []
    current_statement = []
    
    for line in sql_content.split('\n'):
        # Skip comments and empty lines
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        
        current_statement.append(line)
        
        # If line ends with semicolon, it's end of statement
        if stripped.endswith(';'):
            statement = '\n'.join(current_statement)
            statements.append(statement)
            current_statement = []
    
    print(f"📝 Found {len(statements)} SQL statements to execute\n")
    
    # Execute each statement
    success_count = 0
    error_count = 0
    
    for i, statement in enumerate(statements, 1):
        # Show progress for major operations
        statement_lower = statement.lower().strip()
        
        if statement_lower.startswith('drop'):
            print(f"🗑️  [{i}/{len(statements)}] Dropping tables...")
        elif statement_lower.startswith('create database'):
            print(f"🏗️  [{i}/{len(statements)}] Creating database...")
        elif statement_lower.startswith('create table'):
            # Extract table name
            table_name = statement_lower.split('create table')[1].split('(')[0].strip()
            print(f"📦 [{i}/{len(statements)}] Creating table: {table_name}")
        elif statement_lower.startswith('insert'):
            if 'users' in statement_lower:
                print(f"👤 [{i}/{len(statements)}] Inserting sample users...")
            elif 'bookings' in statement_lower:
                print(f"📅 [{i}/{len(statements)}] Inserting sample bookings...")
            elif 'admin' in statement_lower:
                print(f"👑 [{i}/{len(statements)}] Creating admin user...")
            else:
                print(f"➕ [{i}/{len(statements)}] Inserting data...")
        
        try:
            cursor.execute(statement)
            # Consume any results to avoid "Unread result" error
            try:
                cursor.fetchall()
            except:
                pass
            success_count += 1
        except mysql.connector.Error as e:
            # Some errors are expected (like DROP IF EXISTS on non-existent tables)
            if 'unknown database' not in str(e).lower():
                print(f"⚠️  Warning: {str(e)}")
            error_count += 1
    
    # Commit all changes
    connection.commit()
    cursor.close()
    
    print(f"\n✅ Execution complete!")
    print(f"   Success: {success_count} statements")
    if error_count > 0:
        print(f"   Warnings: {error_count} (expected for non-existent drops)")

def verify_setup(connection):
    """Verify the database setup"""
    print("\n🔍 Verifying database setup...\n")
    
    cursor = connection.cursor(dictionary=True)
    
    # Check tables
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    print("📋 Tables created:")
    for table in tables:
        table_name = list(table.values())[0]
        cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
        count = cursor.fetchone()['count']
        print(f"   ✓ {table_name} ({count} rows)")
    
    # Check sample users
    print("\n👥 Sample users:")
    cursor.execute("SELECT id, name, email, gamespot_points FROM users")
    users = cursor.fetchall()
    for user in users:
        print(f"   ✓ {user['email']} - {user['gamespot_points']} points")
    
    # Check sample bookings
    print("\n📅 Sample bookings:")
    cursor.execute("""
        SELECT b.id, u.email, b.booking_date, b.total_price, b.status 
        FROM bookings b 
        LEFT JOIN users u ON b.user_id = u.id
    """)
    bookings = cursor.fetchall()
    for booking in bookings:
        user_info = booking['email'] if booking['email'] else 'Guest'
        print(f"   ✓ Booking #{booking['id']} - {user_info} - ₹{booking['total_price']} ({booking['status']})")
    
    cursor.close()

def main():
    """Main execution flow"""
    print("=" * 60)
    print("🎮 GameSpot Booking - Railway Database Setup")
    print("=" * 60)
    
    try:
        # Connect to Railway MySQL
        connection = connect_to_railway()
        
        # Read SQL file
        sql_content = read_sql_file()
        
        # Execute SQL
        execute_sql(connection, sql_content)
        
        # Verify setup
        verify_setup(connection)
        
        # Close connection
        connection.close()
        
        print("\n" + "=" * 60)
        print("🎉 DATABASE SETUP COMPLETE!")
        print("=" * 60)
        print("\n📝 Test Credentials:")
        print("   Email: test@gamespot.com")
        print("   Password: password123")
        print("\n   Email: john@example.com")
        print("   Password: password123")
        print("\n🔐 Admin Credentials:")
        print("   Username: admin")
        print("   Password: admin")
        print("\n🚀 Next steps:")
        print("   1. Test login on your website")
        print("   2. Check profile page for booking history")
        print("   3. Create a new booking to test points system")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
