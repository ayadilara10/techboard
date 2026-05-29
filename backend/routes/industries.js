/**
 * routes/industries.js — Industry Routes
 *
 * GET /api/industries
 *   Returns all 10 industries sorted by sort_order.
 *
 *   Used by the frontend to populate:
 *     - The industry filter chips on the category detail page
 *     - The industry selection cards in the Tech Stack Builder (Step 1)
 */

const express  = require('express');
const router   = express.Router();
const pool     = require('../config/database');

// ----------------------------------------------------------------
// GET /api/industries
// ----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, slug, name, description, icon, sort_order
       FROM   industries
       ORDER  BY sort_order ASC`
    );

    res.json({
      data:  rows,
      count: rows.length,
    });

  } catch (err) {
    console.error('[GET /api/industries]', err.message);
    res.status(500).json({ error: 'Failed to fetch industries' });
  }
});

module.exports = router;
