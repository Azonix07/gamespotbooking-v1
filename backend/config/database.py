"""
Database Configuration
MySQL connection setup with connection pooling
Railway-compatible (NO localhost, NO unix_socket)
"""

import os
import time
import mysql.connector
from mysql.connector import pooling

# Global connection pool
connection_pool = None

# Pool configuration - increased for production
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 32))  # Increased from 10 to 32
MAX_RETRIES = 3
RETRY_DELAY = 0.5  # seconds


def init_db_pool():
    """
    Initialize MySQL connection pool.
    Will NOT crash the app if database is temporarily unavailable.
    """
    global connection_pool

    try:
        # Get environment variables
        host = os.getenv("MYSQLHOST")
        port = os.getenv("MYSQLPORT", "3306")
        user = os.getenv("MYSQLUSER", "root")
        password = os.getenv("MYSQLPASSWORD")
        database = os.getenv("MYSQLDATABASE", "railway")

        # Minimal connection status logging (never log credentials)
        import sys
        sys.stderr.write("🔍 DATABASE: Initializing connection pool...\n")
        sys.stderr.flush()

        # Validate required variables
        if not host or not password:
            sys.stderr.write("❌ MISSING REQUIRED DB ENVIRONMENT VARIABLES\n")
            sys.stderr.write("⚠️ Database connection pool NOT initialized\n")
            sys.stderr.flush()
            connection_pool = None
            return

        db_config = {
            "host": host,
            "port": int(port),
            "user": user,
            "password": password,
            "database": database,
            "charset": "utf8mb4",
            "autocommit": False,
            "connect_timeout": 10,
            "connection_timeout": 10,
        }

        connection_pool = pooling.MySQLConnectionPool(
            pool_name="gamespot_pool",
            pool_size=POOL_SIZE,
            pool_reset_session=True,
            **db_config
        )

        sys.stderr.write(f"✅ DATABASE CONNECTION POOL INITIALIZED (size: {POOL_SIZE})\n")
        sys.stderr.flush()

    except mysql.connector.Error as err:
        sys.stderr.write(f"❌ DATABASE CONNECTION FAILED: {err}\n")
        sys.stderr.flush()
        connection_pool = None
    except Exception as e:
        sys.stderr.write(f"❌ UNEXPECTED ERROR INITIALIZING DATABASE: {e}\n")
        sys.stderr.flush()
        connection_pool = None


def get_db_connection():
    """
    Get a database connection from the pool with retry logic.
    Handles pool exhaustion by retrying with exponential backoff.
    """
    global connection_pool

    if connection_pool is None:
        init_db_pool()

    if connection_pool is None:
        raise RuntimeError("Database connection pool is not available")

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            conn = connection_pool.get_connection()
            # Verify connection is alive
            if conn.is_connected():
                return conn
            else:
                conn.reconnect()
                return conn
        except mysql.connector.errors.PoolError as err:
            last_error = err
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))  # Exponential backoff
                continue
            # Try to recreate the pool as a last resort
            print(f"⚠️ Pool exhausted, attempting to recreate pool...")
            init_db_pool()
            if connection_pool:
                try:
                    return connection_pool.get_connection()
                except:
                    pass
            raise RuntimeError(f"Database pool exhausted after {MAX_RETRIES} retries: {err}")
        except mysql.connector.Error as err:
            last_error = err
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
                continue
            raise err
    
    raise RuntimeError(f"Failed to get database connection: {last_error}")


class DatabaseConnection:
    """Context manager for database connections to ensure proper cleanup"""
    
    def __init__(self):
        self.conn = None
        self.cursor = None
    
    def __enter__(self):
        self.conn = get_db_connection()
        self.cursor = self.conn.cursor(dictionary=True)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.cursor:
            try:
                self.cursor.close()
            except:
                pass
        if self.conn:
            try:
                if exc_type is not None:
                    self.conn.rollback()
                self.conn.close()
            except:
                pass
        return False  # Don't suppress exceptions


def execute_query(
    query,
    params=None,
    fetch_one=False,
    fetch_all=True,
    commit=False,
):
    """
    Execute a database query safely.

    Args:
        query (str): SQL query
        params (tuple | list): query parameters
        fetch_one (bool): return single row
        fetch_all (bool): return all rows
        commit (bool): commit transaction

    Returns:
        Query result or None
    """

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(query, params or ())

        if commit:
            conn.commit()
            return cursor.lastrowid or True

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
