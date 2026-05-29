"""
db.py — MySQL connection factory for the Flask intelligence engine.

All route handlers call get_connection() at the start of a request and close
the returned connection in a try/finally block.  Using a fresh connection per
request keeps the code simple and avoids connection-state bugs that arise from
sharing long-lived connections across requests.

The env vars (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT) are the same
ones used by the Node.js backend — both services share the same .env file at
the techboard/ project root.  python-dotenv loads that file in app.py before
any route is called, so os.getenv() works correctly here.
"""

import os
import mysql.connector
from mysql.connector import Error as MySQLError


def get_connection():
    """
    Open and return a new MySQL connection.

    The caller MUST close it — wrap every usage in a try/finally:

        conn = get_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(...)
            rows = cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    Raises:
        mysql.connector.Error — if the database is unreachable or
        credentials are wrong.  Route handlers catch this and return a 503.
    """
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME', 'techboard'),
        # Give up after 10 s instead of hanging indefinitely
        connection_timeout=10,
        # Return rows that contain NULL as Python None (not the string 'None')
        use_pure=True,
    )
