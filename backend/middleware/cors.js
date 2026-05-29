/**
 * middleware/cors.js — CORS Configuration
 *
 * Cross-Origin Resource Sharing controls which browser origins may call this API.
 *
 * In development:  all origins are allowed so the frontend can run on any local port.
 * In production:   only the explicit allowedOrigins list is accepted.
 *
 * The middleware is applied globally in server.js before any route handlers.
 */

const cors = require('cors');

// Origins that are allowed to call the API in production
const allowedOrigins = [
  'http://localhost',        // nginx serving the static frontend on port 80
  'http://localhost:80',
  'http://localhost:3000',   // direct backend testing in a browser
  'http://localhost:8080',   // PHP admin panel
  'http://127.0.0.1',
  'http://127.0.0.1:80',
];

const corsOptions = {
  /**
   * origin callback — called by the cors library for every request.
   * Returning callback(null, true) approves the origin.
   * Returning callback(new Error(...)) rejects it with a 403.
   */
  origin: function (origin, callback) {
    // Requests with no Origin header (e.g. curl, Postman, server-to-server) are always allowed
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      // Development: allow everything for frictionless local testing
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not permitted`));
    }
  },

  // HTTP methods the frontend is allowed to use
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

  // Headers the frontend may include in requests
  allowedHeaders: ['Content-Type', 'Authorization'],

  // Allows cookies and Authorization headers to be sent cross-origin
  credentials: true,

  // 200 instead of 204 for OPTIONS preflight — required by some older browsers
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
