/**
 * utils/flaskClient.js — HTTP client for the Flask intelligence engine.
 *
 * All communication between the Node.js backend and the Python Flask service
 * is funnelled through this module.  Route handlers call flaskClient.get()
 * instead of using axios directly so that:
 *   1. The Flask base URL is configured in one place (FLASK_URL env var).
 *   2. Timeout and error handling are consistent across all proxy routes.
 *   3. If Flask is unreachable, callers get a typed error they can handle
 *      gracefully (returning a 503 or a degraded response to the client).
 *
 * Usage (inside any route handler):
 *
 *   const flaskClient = require('../utils/flaskClient');
 *
 *   try {
 *     const data = await flaskClient.get('/intelligence/trends', {
 *       category: 'backend',
 *       industry: 'saas',
 *       years:    5,
 *     });
 *     res.json(data);
 *   } catch (err) {
 *     if (err.flaskUnavailable) {
 *       return res.status(503).json({ error: 'Intelligence engine is not available' });
 *     }
 *     throw err;
 *   }
 *
 * Environment variables:
 *   FLASK_URL        — base URL of the Flask service, default http://localhost:5001
 *   FLASK_TIMEOUT_MS — request timeout in milliseconds, default 8000
 */

const axios = require('axios');

// Flask base URL — points to localhost in dev, to the 'intelligence' Docker
// service name in production (configured in docker-compose.yml).
const FLASK_BASE_URL = (process.env.FLASK_URL || 'http://localhost:5001').replace(/\/$/, '');

// Default timeout: 8 seconds.  Flask performs DB queries and numpy computations
// so it can be slower than a pure-Node route; 8 s is generous without being
// indefinite.  Override with FLASK_TIMEOUT_MS for slower hardware.
const TIMEOUT_MS = parseInt(process.env.FLASK_TIMEOUT_MS || '8000', 10);

/**
 * get(path, params) — make a GET request to the Flask intelligence engine.
 *
 * @param {string} path   — Flask route path, e.g. '/intelligence/trends'
 * @param {object} params — query-string parameters as a key/value object
 *                          (axios serialises them automatically)
 * @returns {Promise<any>} — parsed JSON body from Flask
 * @throws  {Error}        — with .flaskUnavailable = true if Flask is down,
 *                           or a regular Error for HTTP errors from Flask.
 */
async function get(path, params = {}) {
  const url = FLASK_BASE_URL + path;

  try {
    const response = await axios.get(url, {
      params,
      timeout: TIMEOUT_MS,
      // Tell axios to only throw for network errors; we inspect HTTP status ourselves
      validateStatus: () => true,
    });

    // Flask returned an HTTP error — surface it to the caller with the
    // Flask-side error message so it can be forwarded to the client.
    if (response.status >= 400) {
      const flaskError = (response.data && response.data.error)
        ? response.data.error
        : `Flask returned HTTP ${response.status} for ${path}`;
      const err = new Error(flaskError);
      err.flaskStatus = response.status;
      throw err;
    }

    return response.data;

  } catch (err) {
    // Network-level failures — Flask is not running, or the container hasn't started yet
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET') {
      const serviceErr = new Error(
        `Flask intelligence engine is not reachable at ${FLASK_BASE_URL} (${err.code}). ` +
        'Start it with: cd intelligence && python app.py'
      );
      // Flag so callers can distinguish "Flask is down" from "Flask returned an error"
      serviceErr.flaskUnavailable = true;
      throw serviceErr;
    }

    // Timeout
    if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
      const timeoutErr = new Error(
        `Flask request to ${path} timed out after ${TIMEOUT_MS}ms`
      );
      timeoutErr.flaskUnavailable = true;
      throw timeoutErr;
    }

    // Re-throw anything else (HTTP errors from Flask, parse errors, etc.)
    throw err;
  }
}

/**
 * ping() — check if Flask is reachable by calling GET /intelligence/health.
 *
 * Returns true if Flask responds with status < 400; false otherwise.
 * Used in server.js startup logging — never throws.
 *
 * @returns {Promise<boolean>}
 */
async function ping() {
  try {
    const result = await get('/intelligence/health');
    return result && result.status !== undefined;
  } catch (_) {
    return false;
  }
}

module.exports = { get, ping };
