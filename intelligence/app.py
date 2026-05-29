"""
app.py — TechBoard Intelligence Engine — Flask entry point.

This is the main file for the Python microservice that powers TechBoard's
trend analysis, pattern detection, and statistical comparisons.

Architecture summary:
  Node.js backend  ─── HTTP (axios) ───►  This Flask service  ─── MySQL
  (port 3000)                              (port 5001)

The Node.js backend calls Flask internally (server-to-server) — it is never
called directly from the browser.  This keeps the Python service private
(not publicly routed) and lets Node validate/cache results before returning
them to clients.

Flask is started in development with:
    python app.py

In production (Docker):
    gunicorn --bind 0.0.0.0:5001 app:app

Blueprints registered:
  trends_bp   — GET /intelligence/trends, GET /intelligence/rising
  patterns_bp — GET /intelligence/patterns
  compare_bp  — GET /intelligence/compare

Health check:
  GET /intelligence/health — returns {"status": "ok"} with DB connectivity info.
  Used by Docker healthcheck and by the Node.js backend on startup.

Environment variables (loaded from .env at project root):
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME — same as Node.js backend
  FLASK_PORT  — port to listen on (default 5001)
  FLASK_DEBUG — set to 'true' for auto-reload in development (default false)
"""

import os
import sys

# python-dotenv loads environment variables from a .env file.
# We look in the project root (one level up from intelligence/) so that this
# service can share credentials with the Node.js backend without duplication.
from dotenv import load_dotenv

# Resolve the path to the parent directory's .env before importing anything
# else that might read os.getenv() at import time.
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_project_root, '.env'))

from flask import Flask, jsonify
from flask_cors import CORS

# Import the three route blueprints.
# Each blueprint registers its own URL rules — app.py just wires them together.
from routes.trends   import trends_bp
from routes.patterns import patterns_bp
from routes.compare  import compare_bp

# Also import the DB helper to test connectivity at startup
from db import get_connection
from mysql.connector import Error as MySQLError

# ── Application factory ───────────────────────────────────────────────────────

app = Flask(__name__)

# CORS: allow requests from the Node.js backend and from the browser during
# local development.  In production, restrict origins to the known domains.
# We allow all origins here because the browser never calls this service
# directly (only Node does), so the risk is low.
CORS(app, resources={r'/intelligence/*': {'origins': '*'}})

# Register blueprints.
# Each blueprint's routes are prefixed with whatever URL rules it defines
# internally (e.g. /intelligence/trends, /intelligence/rising, …).
app.register_blueprint(trends_bp)
app.register_blueprint(patterns_bp)
app.register_blueprint(compare_bp)


# ── Health check endpoint ─────────────────────────────────────────────────────

@app.route('/intelligence/health')
def health():
    """
    GET /intelligence/health

    Liveness + readiness probe used by:
      - Docker HEALTHCHECK directive (returns non-200 on failure → container restart)
      - Node.js flaskClient.js ping on startup (warns if Flask is unreachable)

    Response (healthy):
      {"status": "ok", "db": "connected", "service": "techboard-intelligence"}

    Response (degraded — Flask running but MySQL unreachable):
      {"status": "degraded", "db": "error", "db_error": "...", "service": "..."}
      HTTP 503 so load balancers know not to route traffic here.
    """
    db_status = 'connected'
    db_error  = None

    try:
        # Attempt a lightweight DB round-trip to verify MySQL is alive.
        # We execute SELECT 1 rather than querying a real table so the health
        # check passes even on a freshly created, empty database.
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        cursor.fetchone()
        cursor.close()
        conn.close()
    except MySQLError as err:
        db_status = 'error'
        db_error  = str(err)

    payload = {
        'status':  'ok' if db_status == 'connected' else 'degraded',
        'db':      db_status,
        'service': 'techboard-intelligence',
    }
    if db_error:
        payload['db_error'] = db_error

    http_status = 200 if db_status == 'connected' else 503
    return jsonify(payload), http_status


# ── 404 and 500 error handlers ────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(err):
    """Return JSON 404 instead of Flask's default HTML error page."""
    return jsonify({'error': f'Route not found: {err}'}), 404


@app.errorhandler(500)
def internal_error(err):
    """Return JSON 500 instead of Flask's default HTML error page."""
    return jsonify({'error': 'Internal server error', 'detail': str(err)}), 500


# ── Startup ───────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port  = int(os.getenv('FLASK_PORT', 5001))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    # Verify MySQL is reachable before accepting requests
    print(f'[intelligence] Starting TechBoard intelligence engine on port {port}')
    print(f'[intelligence] DB_HOST={os.getenv("DB_HOST", "localhost")} '
          f'DB_NAME={os.getenv("DB_NAME", "techboard")}')

    try:
        conn = get_connection()
        conn.close()
        print('[intelligence] ✓ MySQL connected')
    except MySQLError as err:
        # Warn but don't exit — the service can still start; health endpoint
        # will report degraded until MySQL becomes available.
        print(f'[intelligence] ✗ MySQL not reachable: {err}', file=sys.stderr)
        print('[intelligence]   Health endpoint will return 503 until DB is up.',
              file=sys.stderr)

    app.run(host='0.0.0.0', port=port, debug=debug)
