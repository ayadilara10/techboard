/**
 * routes/categories.js — Category Routes
 *
 * GET /api/categories
 *   Returns all 15 categories ordered by sort_order.
 *   Each row includes data_status ('live' | 'coming_soon') so the dashboard
 *   can render "Coming Soon" overlays on cards with no data yet.
 *
 * GET /api/categories/:slug
 *   Returns one category (looked up by slug) plus every active tool in it,
 *   each decorated with:
 *     - Its latest global usage_percent and satisfaction score
 *     - Its trend_direction (rising | stable | falling) and trend_score
 *   Tools are sorted by usage_percent descending so the frontend can rank them.
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');

// ----------------------------------------------------------------
// GET /api/categories
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, slug, name, description, icon, sort_order, data_status, created_at
       FROM   categories
       ORDER  BY sort_order ASC`
    );

    res.json({
      data:  rows,
      count: rows.length,
    });

  } catch (err) {
    console.error('[GET /api/categories]', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ----------------------------------------------------------------
// GET /api/categories/:slug
// ----------------------------------------------------------------
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    // --- Step 1: fetch the category row ---
    const [categories] = await pool.execute(
      `SELECT id, slug, name, description, icon, sort_order, data_status
       FROM   categories
       WHERE  slug = ?`,
      [slug]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: `Category '${slug}' not found` });
    }

    const category = categories[0];

    // --- Step 2: fetch all active tools in this category ---
    //
    // The correlated subquery in the JOIN condition picks the single
    // usage_stats row for the highest available year per tool, keeping
    // the main query flat (no GROUP BY / HAVING needed).
    //
    // LEFT JOIN usage_stats  → tools without stats still appear in the list
    // LEFT JOIN trends       → tools without trends still appear
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
         us.usage_percent,
         us.year        AS stat_year,
         us.satisfaction,
         us.source,
         tr.trend_direction,
         tr.trend_score
       FROM tools t
       LEFT JOIN usage_stats us
         ON  us.tool_id     = t.id
         AND us.industry_id IS NULL
         AND us.year = (
               SELECT MAX(us2.year)
               FROM   usage_stats us2
               WHERE  us2.tool_id     = t.id
               AND    us2.industry_id IS NULL
             )
       LEFT JOIN trends tr
         ON  tr.tool_id     = t.id
         AND tr.industry_id IS NULL
       WHERE t.category_id = ?
         AND t.is_active   = 1
       ORDER BY us.usage_percent DESC`,
      [category.id]
    );

    res.json({
      data:        { ...category, tools },
      tool_count:  tools.length,
    });

  } catch (err) {
    console.error('[GET /api/categories/:slug]', err.message);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

module.exports = router;
