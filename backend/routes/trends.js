/**
 * routes/trends.js — Trend proxy routes (Node.js → Flask intelligence engine).
 *
 * This router acts as a transparent proxy between the frontend and the Flask
 * intelligence engine.  It:
 *   1. Validates and sanitises incoming query parameters
 *   2. Calls the appropriate Flask endpoint via flaskClient
 *   3. Returns Flask's response to the client as-is
 *   4. Handles the "Flask is down" case gracefully so the rest of the API
 *      keeps working even without the intelligence engine
 *
 * Endpoints exposed:
 *
 *   GET /api/trends/rising
 *     Top rising tools across all categories.
 *     Proxies → Flask GET /intelligence/rising
 *     Used by the dashboard "Trending Now" strip (API.getTrendingRising()).
 *     Query params: limit (int, optional, default 10)
 *
 *   GET /api/trends
 *     YoY trend data for tools in a specific category.
 *     Proxies → Flask GET /intelligence/trends
 *     Query params: category (required), industry (optional), years (optional)
 *
 * Error strategy:
 *   If Flask is unreachable, both endpoints return HTTP 503 with a JSON body
 *   that includes a human-readable message and a "flaskDown" flag.  The
 *   frontend's API.getTrendingRising() already handles this by returning null
 *   and falling back to local data.
 */

const express    = require('express');
const router     = express.Router();
const flask      = require('../utils/flaskClient');

// ── GET /api/trends/rising ────────────────────────────────────────────────────
//
// NOTE: This route MUST be registered before the generic '/' route.
// Express matches routes in registration order, and '/rising' would otherwise
// be caught by a hypothetical '/:slug' pattern if one existed.

router.get('/rising', async (req, res) => {
  // Parse limit param with safe defaults
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  try {
    // Forward the request to Flask and relay the response body directly.
    // Flask returns { data: [...], meta: {...} } — we pass that through unchanged.
    const flaskResponse = await flask.get('/intelligence/rising', { limit });
    res.json(flaskResponse);

  } catch (err) {
    if (err.flaskUnavailable) {
      // Flask is down — return a 503 with a structured body.
      // The frontend API client (API.getTrendingRising) catches this and
      // falls back to deriving trending tools from the already-loaded category data.
      console.warn('[GET /api/trends/rising] Flask unavailable:', err.message);
      return res.status(503).json({
        error:     'Intelligence engine is not available',
        flaskDown: true,
        data:      [],
        meta:      { returned: 0 },
      });
    }

    // Flask is up but returned an error (bad query, DB issue, etc.)
    console.error('[GET /api/trends/rising] Flask error:', err.message);
    const status = err.flaskStatus || 500;
    res.status(status).json({ error: err.message || 'Failed to fetch trending tools' });
  }
});


// ── GET /api/trends ───────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  // 'category' is required by Flask; reject early if it's missing
  const categorySlug  = (req.query.category || '').trim();
  const industrySlug  = (req.query.industry  || '').trim() || undefined;
  const yearsParam    = parseInt(req.query.years, 10) || 5;
  const years         = Math.min(10, Math.max(2, yearsParam));

  if (!categorySlug) {
    return res.status(400).json({ error: 'Query param "category" is required' });
  }

  // Build the params object to pass to Flask — omit undefined values so
  // Flask doesn't receive an empty 'industry' string (which it would treat
  // as a filter on an industry called '').
  const flaskParams = { category: categorySlug, years };
  if (industrySlug) flaskParams.industry = industrySlug;

  try {
    const flaskResponse = await flask.get('/intelligence/trends', flaskParams);
    res.json(flaskResponse);

  } catch (err) {
    if (err.flaskUnavailable) {
      console.warn('[GET /api/trends] Flask unavailable:', err.message);
      return res.status(503).json({
        error:     'Intelligence engine is not available',
        flaskDown: true,
        data:      [],
        meta:      { category: categorySlug, industry: industrySlug || 'global' },
      });
    }

    console.error('[GET /api/trends] Flask error:', err.message);
    const status = err.flaskStatus || 500;
    res.status(status).json({ error: err.message || 'Failed to fetch trend data' });
  }
});

module.exports = router;
