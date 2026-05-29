/**
 * routes/auth.js — Admin Authentication Routes
 *
 * POST /api/auth/login
 *   Accepts { email, password } in the JSON body.
 *   Looks up the admin in admin_users, compares password with bcrypt,
 *   and returns a signed JWT on success.
 *
 * POST /api/auth/logout
 *   Stateless JWT — no server-side session to invalidate.
 *   Returns 200 to acknowledge the request; the client is responsible
 *   for discarding its stored token.
 *
 * POST /api/auth/verify
 *   Convenience endpoint for the frontend to check if a stored token
 *   is still valid without performing a full login.
 *
 * Security notes:
 *   - Passwords are stored as bcrypt hashes (cost factor 12) — see admin_users table.
 *   - JWT_SECRET must be set as an environment variable — never hardcoded.
 *   - JWT expiry is controlled by JWT_EXPIRY constant (default 24h).
 *   - Deliberate timing: bcrypt.compare always runs even if no user is found,
 *     preventing timing-based user enumeration attacks.
 */

const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const pool       = require('../config/database');
const requireAuth = require('../middleware/auth');
const { JWT_EXPIRY } = require('../config/constants');

// Dummy hash used in timing-safe "user not found" path — same cost factor as production hashes
const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgI7e5Ky4K1FBl.WLpqJCu';

// ----------------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  // ---- Server-side input validation ----
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }

  const sanitisedEmail = email.trim().toLowerCase();

  try {
    // Look up admin by email — single query, constant time via index
    const [rows] = await pool.execute(
      `SELECT id, email, password_hash, name
       FROM admin_users
       WHERE email = ?
       LIMIT 1`,
      [sanitisedEmail]
    );

    const admin = rows[0] || null;

    // Always run bcrypt.compare — even when no user was found — to prevent
    // timing attacks that could reveal which email addresses are registered.
    const hashToCompare = admin ? admin.password_hash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    // Fail if no user found OR password wrong — same generic message for both
    if (!admin || !isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ---- Issue JWT ----
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[POST /api/auth/login] JWT_SECRET is not set');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const payload = {
      id:    admin.id,
      email: admin.email,
      name:  admin.name,
    };

    const token = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });

    // Return the token and basic admin info (never return the password hash)
    return res.json({
      token,
      admin: {
        id:    admin.id,
        email: admin.email,
        name:  admin.name,
      },
      expires_in: JWT_EXPIRY,
    });

  } catch (err) {
    console.error('[POST /api/auth/login]', err.message);
    return res.status(500).json({ error: 'Login failed due to a server error' });
  }
});

// ----------------------------------------------------------------
// POST /api/auth/logout
// ----------------------------------------------------------------
router.post('/logout', (req, res) => {
  // JWT is stateless — the server holds no session to destroy.
  // The client must delete its stored token after receiving this response.
  // A future upgrade could add a Redis token blocklist here without changing
  // the route signature.
  res.json({ message: 'Logged out successfully' });
});

// ----------------------------------------------------------------
// POST /api/auth/verify
// ----------------------------------------------------------------
router.post('/verify', requireAuth, (req, res) => {
  // requireAuth already validated the token — if we reach here it's good.
  res.json({
    valid: true,
    admin: {
      id:    req.admin.id,
      email: req.admin.email,
      name:  req.admin.name,
    },
  });
});

module.exports = router;
