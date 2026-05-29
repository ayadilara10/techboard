/**
 * middleware/auth.js — JWT Verification Middleware
 *
 * Protects admin API routes that require a valid JSON Web Token.
 *
 * Usage — mount on any route that needs authentication:
 *   router.post('/', requireAuth, async (req, res) => { ... });
 *
 * Token delivery:
 *   The client must include the token in the Authorization header:
 *     Authorization: Bearer <token>
 *
 * On success:
 *   req.admin is populated with the decoded token payload
 *   (id, email, name) and next() is called.
 *
 * On failure:
 *   Returns 401 JSON { error: '...' } — the route handler is NOT called.
 */

const jwt = require('jsonwebtoken');

/**
 * requireAuth — Express middleware that verifies the Bearer JWT.
 *
 * Called automatically by Express before the route handler when mounted.
 * Four-step validation:
 *   1. Header present?
 *   2. Scheme is "Bearer"?
 *   3. Token is non-empty?
 *   4. JWT signature + expiry valid?
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';

  // Step 1: header must be present
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required. Include Authorization: Bearer <token>' });
  }

  // Step 2: header must start with "Bearer "
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({ error: 'Malformed Authorization header. Expected: Bearer <token>' });
  }

  const token = parts[1];

  // Step 3: token string must be non-empty after splitting
  if (!token) {
    return res.status(401).json({ error: 'Bearer token is empty' });
  }

  // Step 4: verify signature and expiry with the application secret
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Misconfiguration — log prominently so it's caught in dev
    console.error('[AUTH] JWT_SECRET is not set in environment variables!');
    return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET not set' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      // Distinguish between an expired token and a tampered/invalid one
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired. Please log in again.' });
      }
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    // Attach decoded payload to req so route handlers can access admin identity
    req.admin = decoded;   // { id, email, name, iat, exp }
    next();
  });
}

module.exports = requireAuth;
