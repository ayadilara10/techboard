/**
 * server.js — TechBoard Backend Entry Point
 *
 * Responsibilities:
 *   1. Load environment variables from .env (must happen before any other require)
 *   2. Create the Express application
 *   3. Attach global middleware (CORS, JSON body parsing)
 *   4. Mount all route handlers under /api/*
 *   5. Register a health-check endpoint and global error handlers
 *   6. Verify the MySQL connection is alive before accepting traffic
 *   7. Start the HTTP server
 *
 * Run in development:  npm run dev  (nodemon — auto-restarts on file changes)
 * Run in production:   npm start    (plain node)
 */

// dotenv must be the very first require so that process.env values are
// available to every other module (including config/database.js)
require('dotenv').config();

const express = require('express');

// Internal modules
const pool           = require('./config/database');
const corsMiddleware = require('./middleware/cors');
const flask          = require('./utils/flaskClient');

// Route handlers — each file exports an Express Router
const categoriesRouter    = require('./routes/categories');
const toolsRouter         = require('./routes/tools');
const industriesRouter    = require('./routes/industries');
const statsRouter         = require('./routes/stats');
const trendsRouter        = require('./routes/trends');
const xmlRouter           = require('./routes/xml');
const stackBuilderRouter  = require('./routes/stack-builder');
const authRouter          = require('./routes/auth');
const adminRouter         = require('./routes/admin');

// ---- Application setup ----

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ---- Global middleware ----

// CORS must come before routes so preflight OPTIONS requests are handled
app.use(corsMiddleware);

// Parse incoming JSON bodies (e.g. POST /api/auth/login)
app.use(express.json());

// Parse URL-encoded bodies (HTML form submissions)
app.use(express.urlencoded({ extended: false }));

// ---- Route mounting ----

app.use('/api/auth',          authRouter);
app.use('/api/categories',    categoriesRouter);
app.use('/api/tools',         toolsRouter);
app.use('/api/industries',    industriesRouter);
app.use('/api/stats',         statsRouter);
app.use('/api/trends',        trendsRouter);
app.use('/api/stack-builder', stackBuilderRouter);
app.use('/api/admin',         adminRouter);

// XML routes are mounted at root so they can serve both /feed.xml and /api/export/xml
app.use('/', xmlRouter);

// ---- Utility endpoints ----

/**
 * GET /health
 * Simple liveness probe — used by Docker and load balancers to check
 * that the Node process is running and responsive.
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'techboard-api', uptime: process.uptime() });
});

// ---- Error handlers (must be registered last) ----

/**
 * 404 handler — catches any request that didn't match a route above.
 */
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

/**
 * Global error handler — Express calls this when a route calls next(err)
 * or when an async route throws and the error propagates.
 * The four-parameter signature is required by Express to recognise this
 * as an error handler rather than a regular middleware.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ---- Startup ----

/**
 * Verify MySQL is reachable before binding the port.
 * This prevents the API from starting in a broken state where every
 * request immediately fails with a DB error.
 */
async function start() {
  try {
    // getConnection() will throw if MySQL is unreachable
    const conn = await pool.getConnection();
    console.log('✓ MySQL connected');
    conn.release();   // return the connection to the pool immediately

    app.listen(PORT, async () => {
      console.log(`✓ TechBoard API listening on port ${PORT}`);
      console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Health check: http://localhost:${PORT}/health`);

      // Non-blocking Flask connectivity check — a warning here does not prevent
      // the API from serving requests; trend endpoints will return 503 until Flask
      // is started separately (or via docker-compose).
      const flaskAlive = await flask.ping();
      if (flaskAlive) {
        console.log(`✓ Flask intelligence engine reachable at ${process.env.FLASK_URL || 'http://localhost:5001'}`);
      } else {
        console.warn(`⚠  Flask intelligence engine not reachable. Trend endpoints will return 503.`);
        console.warn(`   Start it with: cd intelligence && python app.py`);
      }
    });

  } catch (err) {
    console.error('✗ Failed to connect to MySQL:', err.message);
    console.error('  Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env');
    process.exit(1);  // exit with failure code so Docker/systemd can restart
  }
}

start();
