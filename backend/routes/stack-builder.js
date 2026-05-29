/**
 * routes/stack-builder.js — Tech Stack Builder Route
 *
 * GET /api/stack-builder
 *   No params → returns all published profiles grouped by industry.
 *   ?industry=fintech → filters to one industry's product types.
 *
 * GET /api/stack-builder?industry=fintech&type=Mobile+Banking+App
 *   Returns a full stack recommendation: profile metadata + all recommended
 *   tools ordered by category sort_order.
 *
 * The data comes from two tables:
 *   stack_profiles        — one row per (industry, product_type) combination
 *   stack_profile_tools   — many rows per profile; each links to a tool + category
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');

// ----------------------------------------------------------------
// GET /api/stack-builder
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
  const { industry, type } = req.query;

  // ---- Mode 1: list available profiles (no type given) ----
  if (!industry || !type) {
    try {
      // Build WHERE clause: optionally restrict to one industry slug
      let where  = 'sp.is_published = 1';
      const params = [];
      if (industry) {
        where += ' AND i.slug = ?';
        params.push(industry);
      }

      const [rows] = await pool.execute(
        `SELECT
           sp.id,
           sp.product_type,
           sp.description,
           i.slug        AS industry_slug,
           i.name        AS industry_name,
           i.sort_order  AS industry_order
         FROM stack_profiles sp
         JOIN industries i ON i.id = sp.industry_id
         WHERE ${where}
         ORDER BY i.sort_order ASC, sp.product_type ASC`,
        params
      );

      // Group profiles by industry so the frontend can drive the wizard steps
      const map = new Map();
      for (const row of rows) {
        if (!map.has(row.industry_slug)) {
          map.set(row.industry_slug, {
            industry_slug:  row.industry_slug,
            industry_name:  row.industry_name,
            product_types:  [],
          });
        }
        map.get(row.industry_slug).product_types.push({
          id:           row.id,
          product_type: row.product_type,
          description:  row.description,
        });
      }

      return res.json({ data: Array.from(map.values()) });

    } catch (err) {
      console.error('[GET /api/stack-builder list]', err.message);
      return res.status(500).json({ error: 'Failed to fetch stack profiles' });
    }
  }

  // ---- Mode 2: full stack for a specific industry + product type ----
  try {
    // Fetch the matching profile
    const [profiles] = await pool.execute(
      `SELECT
         sp.id,
         sp.product_type,
         sp.description,
         i.slug AS industry_slug,
         i.name AS industry_name
       FROM stack_profiles sp
       JOIN industries i ON i.id = sp.industry_id
       WHERE i.slug = ? AND sp.product_type = ? AND sp.is_published = 1
       LIMIT 1`,
      [industry, type]
    );

    if (profiles.length === 0) {
      return res.status(404).json({
        error: `No stack profile found for industry '${industry}' and type '${type}'`,
      });
    }

    const profile = profiles[0];

    // Fetch all tools in this profile, joined with their tool and category details
    const [tools] = await pool.execute(
      `SELECT
         spt.rationale,
         spt.is_primary,
         t.id          AS tool_id,
         t.slug        AS tool_slug,
         t.name        AS tool_name,
         t.description AS tool_description,
         t.website_url,
         t.open_source,
         t.first_released,
         c.id          AS category_id,
         c.slug        AS category_slug,
         c.name        AS category_name,
         c.sort_order  AS category_order
       FROM stack_profile_tools spt
       JOIN tools      t ON t.id = spt.tool_id
       JOIN categories c ON c.id = spt.category_id
       WHERE spt.profile_id = ?
       ORDER BY c.sort_order ASC, spt.is_primary DESC`,
      [profile.id]
    );

    return res.json({
      data: {
        profile: {
          id:            profile.id,
          product_type:  profile.product_type,
          description:   profile.description,
          industry_slug: profile.industry_slug,
          industry_name: profile.industry_name,
        },
        tools,
      },
    });

  } catch (err) {
    console.error('[GET /api/stack-builder stack]', err.message);
    return res.status(500).json({ error: 'Failed to fetch stack recommendation' });
  }
});

module.exports = router;
