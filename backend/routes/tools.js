/**
 * routes/tools.js — Tool Routes
 *
 * Public (no auth):
 *   GET /api/tools          — paginated list of active tools
 *   GET /api/tools/:slug    — single tool with usage history and trends
 *
 * Admin (JWT required via requireAuth middleware):
 *   POST   /api/tools        — create a new tool
 *   PUT    /api/tools/:id    — update an existing tool by numeric id
 *   DELETE /api/tools/:id    — soft-delete (is_active = 0) a tool by id
 */

const express     = require('express');
const router      = express.Router();
const pool        = require('../config/database');
const requireAuth = require('../middleware/auth');
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

// ----------------------------------------------------------------
// POST /api/tools  (admin only — JWT required)
// ----------------------------------------------------------------
router.post('/', requireAuth, async (req, res) => {
  const {
    category_id,
    slug,
    name,
    description,
    website_url,
    logo_url,
    open_source,
    first_released,
  } = req.body || {};

  // Server-side validation — all fields checked even if the client validated too
  if (!category_id || !Number.isInteger(Number(category_id))) {
    return res.status(400).json({ error: 'category_id is required and must be an integer' });
  }
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    return res.status(400).json({ error: 'slug is required' });
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  // Slugs must be URL-safe: lowercase letters, numbers, hyphens only
  if (!/^[a-z0-9-]+$/.test(slug.trim())) {
    return res.status(400).json({ error: 'slug may only contain lowercase letters, numbers, and hyphens' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO tools
         (category_id, slug, name, description, website_url, logo_url, open_source, first_released)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(category_id),
        slug.trim().toLowerCase(),
        name.trim(),
        description || null,
        website_url || null,
        logo_url    || null,
        open_source === undefined ? true : Boolean(open_source),
        first_released ? Number(first_released) : null,
      ]
    );

    return res.status(201).json({
      message: 'Tool created',
      data: { id: result.insertId, slug: slug.trim().toLowerCase(), name: name.trim() },
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: `A tool with slug '${slug}' already exists` });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: `category_id ${category_id} does not exist` });
    }
    console.error('[POST /api/tools]', err.message);
    return res.status(500).json({ error: 'Failed to create tool' });
  }
});

// ----------------------------------------------------------------
// PUT /api/tools/:id  (admin only — JWT required)
// ----------------------------------------------------------------
router.put('/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Tool id must be a positive integer' });
  }

  const allowed = ['category_id', 'slug', 'name', 'description', 'website_url',
                   'logo_url', 'open_source', 'first_released', 'is_active'];

  // Build SET clause only from fields present in the request body
  const updates = [];
  const values  = [];

  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  values.push(id);   // for WHERE id = ?

  try {
    const [result] = await pool.execute(
      `UPDATE tools SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Tool id ${id} not found` });
    }

    return res.json({ message: 'Tool updated', data: { id } });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A tool with that slug already exists' });
    }
    console.error('[PUT /api/tools/:id]', err.message);
    return res.status(500).json({ error: 'Failed to update tool' });
  }
});

// ----------------------------------------------------------------
// DELETE /api/tools/:id  (admin only — JWT required)
// Soft-delete: sets is_active = 0 so historical data is preserved.
// ----------------------------------------------------------------
router.delete('/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Tool id must be a positive integer' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE tools SET is_active = 0 WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Tool id ${id} not found or already inactive` });
    }

    return res.json({ message: `Tool id ${id} deactivated (soft-deleted)` });

  } catch (err) {
    console.error('[DELETE /api/tools/:id]', err.message);
    return res.status(500).json({ error: 'Failed to delete tool' });
  }
});

module.exports = router;
