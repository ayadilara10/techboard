/**
 * routes/tools.js — Tool Routes
 *
 * GET /api/tools
 *   Returns all active tools, paginated.
 *   Query params:
 *     page      (number, default 1)   — which page to return
 *     limit     (number, default 20)  — items per page, max 100
 *     category  (string, optional)    — filter by category slug
 *
 * GET /api/tools/:slug
 *   Returns a single tool by its slug, with:
 *     - Full usage history across all years and all industries
 *     - All pre-computed trend rows (global + per-industry)
 *     - Parent category info
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');
const { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT } = require('../config/constants');

// ----------------------------------------------------------------
// GET /api/tools
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
  // Parse pagination params; clamp to safe ranges
  const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit  = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_LIMIT));
  const offset = (page - 1) * limit;

  // Optional category filter
  const categorySlug = req.query.category || null;

  try {
    // Build WHERE clause dynamically — extra condition only when filtering by category
    let whereClause = 't.is_active = 1';
    const filterParams = [];  // bound params for the WHERE clause (before LIMIT/OFFSET)

    if (categorySlug) {
      whereClause += ' AND c.slug = ?';
      filterParams.push(categorySlug);
    }

    // Get total matching rows for pagination metadata
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM   tools t
       JOIN   categories c ON c.id = t.category_id
       WHERE  ${whereClause}`,
      filterParams
    );

    // Fetch the requested page — sorted by category display order then tool name
    const [tools] = await pool.execute(
      `SELECT
         t.id,
         t.slug,
         t.name,
         t.description,
         t.website_url,
         t.logo_url,
         t.open_source,
         t.first_released,
         t.created_at,
         c.id   AS category_id,
         c.slug AS category_slug,
         c.name AS category_name
       FROM tools t
       JOIN categories c ON c.id = t.category_id
       WHERE  ${whereClause}
       ORDER  BY c.sort_order ASC, t.name ASC
       LIMIT  ? OFFSET ?`,
      [...filterParams, limit, offset]
    );

    res.json({
      data: tools,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next:    page * limit < total,
        has_prev:    page > 1,
      },
    });

  } catch (err) {
    console.error('[GET /api/tools]', err.message);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

// ----------------------------------------------------------------
// GET /api/tools/:slug
// ----------------------------------------------------------------
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    // --- Step 1: fetch the tool + its parent category ---
    const [tools] = await pool.execute(
      `SELECT
         t.id,
         t.slug,
         t.name,
         t.description,
         t.website_url,
         t.logo_url,
         t.open_source,
         t.first_released,
         t.created_at,
         c.id   AS category_id,
         c.slug AS category_slug,
         c.name AS category_name
       FROM tools t
       JOIN categories c ON c.id = t.category_id
       WHERE t.slug = ? AND t.is_active = 1`,
      [slug]
    );

    if (tools.length === 0) {
      return res.status(404).json({ error: `Tool '${slug}' not found` });
    }

    const tool = tools[0];

    // --- Step 2: fetch complete usage history ---
    // industry_id NULL rows = global (all industries combined)
    // Sorted newest year first, then by industry display order
    const [usageStats] = await pool.execute(
      `SELECT
         us.id,
         us.year,
         us.usage_percent,
         us.satisfaction,
         us.sample_size,
         us.source,
         i.id   AS industry_id,
         i.slug AS industry_slug,
         i.name AS industry_name
       FROM usage_stats us
       LEFT JOIN industries i ON i.id = us.industry_id
       WHERE us.tool_id = ?
       ORDER BY us.year DESC, i.sort_order ASC`,
      [tool.id]
    );

    // --- Step 3: fetch all pre-computed trends ---
    const [trends] = await pool.execute(
      `SELECT
         tr.trend_score,
         tr.trend_direction,
         tr.year_from,
         tr.year_to,
         tr.computed_at,
         i.slug AS industry_slug,
         i.name AS industry_name
       FROM trends tr
       LEFT JOIN industries i ON i.id = tr.industry_id
       WHERE tr.tool_id = ?`,
      [tool.id]
    );

    res.json({
      data: {
        ...tool,
        usage_stats: usageStats,
        trends,
      },
    });

  } catch (err) {
    console.error('[GET /api/tools/:slug]', err.message);
    res.status(500).json({ error: 'Failed to fetch tool' });
  }
});

module.exports = router;
