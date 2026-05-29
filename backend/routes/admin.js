/**
 * routes/admin.js — Admin-Only Utility Routes
 *
 * All routes in this file are protected by requireAuth (JWT middleware).
 *
 * GET /api/admin/import-log
 *   Returns the full data_import_log, most recent first.
 *   Used by the admin panel to show the history of CSV imports.
 *   Query params:
 *     limit  (number, optional) — page size, default 50, max 200
 *     page   (number, optional) — page number, default 1
 */

const express     = require('express');
const router      = express.Router();
const pool        = require('../config/database');
const requireAuth = require('../middleware/auth');

// ----------------------------------------------------------------
// GET /api/admin/import-log  (admin only)
// ----------------------------------------------------------------
router.get('/import-log', requireAuth, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;

  try {
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM data_import_log`
    );

    const [rows] = await pool.execute(
      `SELECT
         dil.id,
         dil.filename,
         dil.source,
         dil.rows_imported,
         dil.imported_at,
         au.email AS imported_by_email,
         au.name  AS imported_by_name
       FROM data_import_log dil
       LEFT JOIN admin_users au ON au.id = dil.imported_by
       ORDER BY dil.imported_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.json({
      data: rows,
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
    console.error('[GET /api/admin/import-log]', err.message);
    return res.status(500).json({ error: 'Failed to fetch import log' });
  }
});

module.exports = router;
