"""
Database Configuration
MySQL connection setup with connection pooling
"""

import mysql.connector
from mysql.connector import pooling
import os

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'gamespot_booking'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASS', 'newpassword'),
    'charset': 'utf8mb4',
    'unix_socket': '/tmp/mysql.sock' if os.path.exists('/tmp/mysql.sock') else None
}

# Connection Pool
connection_pool = None

def init_db_pool():
    """Initialize database connection pool"""
    global connection_pool
    
    try:
        # Remove None values from config
        config = {k: v for k, v in DB_CONFIG.items() if v is not None}
        
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="gamespot_pool",
            pool_size=10,
            pool_reset_session=True,
            **config
        )
        print("✅ Database connection pool initialized")
    except mysql.connector.Error as err:
        print(f"❌ Database connection failed: {err}")
        raise

def get_db_connection():
    """Get a database connection from the pool"""
    try:
        if connection_pool is None:
            init_db_pool()
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        print(f"❌ Failed to get database connection: {err}")
        raise

def execute_query(query, params=None, fetch_one=False, fetch_all=True, commit=False):
    """
    Execute a database query
    
    Args:
        query: SQL query string
        params: Query parameters (tuple or list)
        fetch_one: Return single result
        fetch_all: Return all results
        commit: Commit transaction
        
    Returns:
        Query results or None
    """
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(query, params or ())
        
        if commit:
            conn.commit()
            return cursor.lastrowid if cursor.lastrowid else True
        
        if fetch_one:
            return cursor.fetchone()
        
        if fetch_all:
            return cursor.fetchall()
        
        return True
        
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        raise err
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
