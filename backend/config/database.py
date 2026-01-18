"""
Database Configuration
MySQL connection setup with connection pooling
Railway-compatible (NO localhost, NO unix_socket)
"""

import os
import mysql.connector
from mysql.connector import pooling

# Global connection pool
connection_pool = None


def init_db_pool():
    """
    Initialize MySQL connection pool.
    Will NOT crash the app if database is temporarily unavailable.
    """
    global connection_pool

    try:
        db_config = {
            "host": os.getenv("MYSQLHOST"),
            "port": int(os.getenv("MYSQLPORT", 3306)),
            "user": os.getenv("MYSQLUSER"),
            "password": os.getenv("MYSQLPASSWORD"),
            "database": os.getenv("MYSQLDATABASE"),
            "charset": "utf8mb4",
        }

        # Remove empty values
        db_config = {k: v for k, v in db_config.items() if v}

        if not all(
            key in db_config
            for key in ("host", "user", "password", "database")
        ):
            print("⚠️ MySQL environment variables not fully set")
            connection_pool = None
            return

        connection_pool = pooling.MySQLConnectionPool(
            pool_name="gamespot_pool",
            pool_size=10,
            pool_reset_session=True,
            **db_config
        )

        print("✅ Database connection pool initialized")

    except mysql.connector.Error as err:
        print(f"⚠️ Database connection failed: {err}")
        connection_pool = None


def get_db_connection():
    """
    Get a database connection from the pool.
    """
    global connection_pool

    if connection_pool is None:
        init_db_pool()

    if connection_pool is None:
        raise RuntimeError("Database connection pool is not available")

    return connection_pool.get_connection()


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
