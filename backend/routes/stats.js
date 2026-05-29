/**
 * routes/stats.js — Statistics Routes
 *
 * GET /api/stats/top
 *   Top N tools in a category by usage_percent, using the most recent year of data.
 *   Query params:
 *     category  (string, required)   — category slug, e.g. 'frontend'
 *     industry  (string, optional)   — industry slug, e.g. 'fintech'. Omit for global.
 *     limit     (number, optional)   — how many tools to return, default 5, max 20
 *
 *   Examples:
 *     /api/stats/top?category=frontend&limit=3
 *     /api/stats/top?category=frontend&industry=fintech&limit=3
 *
 * GET /api/stats/global
 *   Platform-wide summary counts used by the hero stats ticker on the dashboard.
 *   Returns: total tools, live categories, industries, data points, sources.
 *
 * GET /api/stats/usage
 *   Historical usage percent for one tool across a list of years (for charts).
 *   Query params:
 *     tool      (string, required)   — tool slug, e.g. 'react'
 *     years     (string, optional)   — comma-separated years, e.g. '2022,2023,2024'
 *     industry  (string, optional)   — industry slug; omit for global
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');
const { DEFAULT_TOP_LIMIT, MAX_TOP_LIMIT } = require('../config/constants');

// ----------------------------------------------------------------
// GET /api/stats/top
// ----------------------------------------------------------------
router.get('/top', async (req, res) => {
  const categorySlug = req.query.category;
  const industrySlug = req.query.industry || null;
  const limit = Math.min(
    MAX_TOP_LIMIT,
    Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_TOP_LIMIT)
  );

  // category is mandatory — the query cannot run without it
  if (!categorySlug) {
    return res.status(400).json({ error: 'Query param "category" is required' });
  }

  try {
    let rows;

    if (industrySlug) {
      // ---- Industry-specific query ----
      //
      // We resolve the industry slug to an id inside the query via a JOIN
      // rather than doing a separate lookup, keeping it as one round-trip.
      //
      // The correlated subquery picks the most recent year of data for each
      // tool within that industry, so results always reflect the latest survey.
      [rows] = await pool.execute(
        `SELECT
           t.id,
           t.slug,
           t.name,
           t.description,
           t.website_url,
           t.logo_url,
           t.open_source,
           us.usage_percent,
           us.year          AS stat_year,
           us.satisfaction,
           us.source,
           i.id             AS industry_id,
           i.slug           AS industry_slug,
           i.name           AS industry_name,
           tr.trend_direction,
           tr.trend_score
         FROM tools t
         JOIN categories   c  ON c.id   = t.category_id
         JOIN industries   i  ON i.slug = ?
         JOIN usage_stats  us ON us.tool_id     = t.id
                              AND us.industry_id = i.id
                              AND us.year = (
                                    SELECT MAX(us2.year)
                                    FROM   usage_stats us2
                                    WHERE  us2.tool_id     = t.id
                                    AND    us2.industry_id = i.id
                                  )
         LEFT JOIN trends  tr ON tr.tool_id     = t.id
                              AND tr.industry_id = i.id
         WHERE c.slug     = ?
           AND t.is_active = 1
         ORDER BY us.usage_percent DESC
         LIMIT ?`,
        [industrySlug, categorySlug, limit]
      );

    } else {
      // ---- Global query (industry_id IS NULL) ----
      //
      // Global rows have industry_id = NULL in usage_stats and trends.
      // The IS NULL condition must appear in the correlated subquery too
      // so it only compares against other global rows.
      [rows] = await pool.execute(
        `SELECT
           t.id,
           t.slug,
           t.name,
           t.description,
           t.website_url,
           t.logo_url,
           t.open_source,
           us.usage_percent,
           us.year          AS stat_year,
           us.satisfaction,
           us.source,
           tr.trend_direction,
           tr.trend_score
         FROM tools t
         JOIN categories   c  ON c.id = t.category_id
         JOIN usage_stats  us ON us.tool_id     = t.id
                              AND us.industry_id IS NULL
                              AND us.year = (
                                    SELECT MAX(us2.year)
                                    FROM   usage_stats us2
                                    WHERE  us2.tool_id     = t.id
                                    AND    us2.industry_id IS NULL
                                  )
         LEFT JOIN trends  tr ON tr.tool_id     = t.id
                              AND tr.industry_id IS NULL
         WHERE c.slug     = ?
           AND t.is_active = 1
         ORDER BY us.usage_percent DESC
         LIMIT ?`,
        [categorySlug, limit]
      );
    }

    res.json({
      data: rows,
      meta: {
        category: categorySlug,
        industry: industrySlug || 'global',
        limit,
        count: rows.length,
      },
    });

  } catch (err) {
    console.error('[GET /api/stats/top]', err.message);
    res.status(500).json({ error: 'Failed to fetch top stats' });
  }
});

// ----------------------------------------------------------------
// GET /api/stats/global
// ----------------------------------------------------------------
router.get('/global', async (req, res) => {
  try {
    // Run all six count queries in parallel — Promise.all waits for all of
    // them and returns results in the same order as the input array.
    // This is faster than six sequential await calls.
    const [
      [[toolCount]],
      [[categoryCount]],
      [[industryCount]],
      [[dataPointCount]],
      [[sourceCount]],
      [[trendCount]],
    ] = await Promise.all([
      // Total active tools across all categories
      pool.execute(`SELECT COUNT(*) AS n FROM tools WHERE is_active = 1`),
      // Only categories that have real data published
      pool.execute(`SELECT COUNT(*) AS n FROM categories WHERE data_status = 'live'`),
      // All industries (all 10 are always present)
      pool.execute(`SELECT COUNT(*) AS n FROM industries`),
      // Each usage_stats row is one data point (tool × industry × year)
      pool.execute(`SELECT COUNT(*) AS n FROM usage_stats`),
      // Distinct survey/report names that provided data
      pool.execute(`SELECT COUNT(DISTINCT source) AS n FROM usage_stats WHERE source IS NOT NULL`),
      // Pre-computed trend rows
      pool.execute(`SELECT COUNT(*) AS n FROM trends`),
    ]);

    res.json({
      data: {
        total_tools:       toolCount.n,
        live_categories:   categoryCount.n,
        total_industries:  industryCount.n,
        total_data_points: dataPointCount.n,
        data_sources:      sourceCount.n,
        trends_computed:   trendCount.n,
      },
    });

  } catch (err) {
    console.error('[GET /api/stats/global]', err.message);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
});

// ----------------------------------------------------------------
// GET /api/stats/usage
// Used in Phase 4 by the Chart.js usage-over-time chart.
// ----------------------------------------------------------------
router.get('/usage', async (req, res) => {
  const toolSlug   = req.query.tool;
  const industrySlug = req.query.industry || null;

  // Parse comma-separated years, e.g. "2022,2023,2024"
  const yearsParam = req.query.years;
  const years = yearsParam
    ? yearsParam.split(',').map(y => parseInt(y.trim(), 10)).filter(y => !isNaN(y))
    : null;

  if (!toolSlug) {
    return res.status(400).json({ error: 'Query param "tool" is required' });
  }

  try {
    // Build WHERE clause dynamically based on which filters are active
    let where   = 't.slug = ? AND t.is_active = 1';
    const params = [toolSlug];

    // Industry filter — NULL means global
    if (industrySlug) {
      where += ' AND i.slug = ?';
      params.push(industrySlug);
    } else {
      where += ' AND us.industry_id IS NULL';
    }

    // Year filter — if no years specified, return all years
    if (years && years.length > 0) {
      // Build a parameterised IN clause: (?,?,?)
      where += ` AND us.year IN (${years.map(() => '?').join(',')})`;
      params.push(...years);
    }

    const [rows] = await pool.execute(
      `SELECT
         us.year,
         us.usage_percent,
         us.satisfaction,
         us.sample_size,
         us.source,
         t.slug  AS tool_slug,
         t.name  AS tool_name,
         i.slug  AS industry_slug,
         i.name  AS industry_name
       FROM usage_stats us
       JOIN tools      t ON t.id = us.tool_id
       LEFT JOIN industries i ON i.id = us.industry_id
       WHERE ${where}
       ORDER BY us.year ASC`,
      params
    );

    res.json({
      data: rows,
      meta: {
        tool:     toolSlug,
        industry: industrySlug || 'global',
        years:    rows.map(r => r.year),
      },
    });

  } catch (err) {
    console.error('[GET /api/stats/usage]', err.message);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
});

module.exports = router;
