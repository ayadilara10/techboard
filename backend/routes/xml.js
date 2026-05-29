/**
 * routes/xml.js — XML Output Routes
 *
 * This router is mounted at the application root ('/') so that it can serve
 * two structurally different paths from a single file:
 *
 * GET /feed.xml
 *   RSS 2.0 feed listing the 20 most recently added tools plus their latest
 *   global usage figure and trend direction.
 *   Content-Type: application/rss+xml
 *
 * GET /api/export/xml
 *   Full dataset dump — every active tool with its complete usage history and
 *   all pre-computed trend rows, grouped by category.
 *   Content-Type: application/xml
 *   Content-Disposition: attachment (triggers browser download)
 *
 * Both endpoints generate XML via string templating.  Every value from the
 * database is passed through escapeXml() before being interpolated so that
 * names or descriptions containing & < > " ' cannot break the document.
 *
 * Course requirement: XML files must be valid and served with the correct
 * Content-Type header (CLAUDE.md note 6).
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');

// Base URL used for <link> and <atom:link> elements in the RSS feed.
// Set BASE_URL in .env for production; falls back to localhost in dev.
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// ----------------------------------------------------------------
// XML utilities
// ----------------------------------------------------------------

/**
 * Escapes the five characters that are illegal in XML text nodes and
 * attribute values.  Call this on every database string before embedding
 * it in XML output.
 *
 * @param {*} value  Any value — will be coerced to a string.
 * @returns {string} Safe XML string.
 */
function escapeXml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

/**
 * Converts a JavaScript Date (or any value accepted by new Date()) to the
 * RFC-822 date-time string required by the RSS <pubDate> and
 * <lastBuildDate> elements.
 *
 * Example output: "Thu, 01 Jan 2025 12:00:00 +0000"
 *
 * @param {Date|string|number} date
 * @returns {string}
 */
function toRfc822(date) {
  // toUTCString() returns something like "Thu, 01 Jan 2025 12:00:00 GMT"
  // RSS requires "+0000" instead of "GMT"
  return new Date(date).toUTCString().replace('GMT', '+0000');
}

// ----------------------------------------------------------------
// GET /feed.xml  —  RSS 2.0 feed
// ----------------------------------------------------------------
router.get('/feed.xml', async (req, res) => {
  try {
    // Fetch the 20 most recently added active tools.
    // Join to usage_stats for the latest *global* usage figure (industry_id IS NULL)
    // and to trends for the global trend direction.
    // Both joins are LEFT JOINs so tools without stats still appear in the feed.
    const [tools] = await pool.execute(
      `SELECT
         t.id,
         t.slug,
         t.name,
         t.description,
         t.website_url,
         t.open_source,
         t.first_released,
         t.created_at,
         c.slug  AS category_slug,
         c.name  AS category_name,
         us.usage_percent,
         us.year     AS stat_year,
         us.source   AS stat_source,
         tr.trend_direction,
         tr.trend_score
       FROM tools t
       JOIN categories c ON c.id = t.category_id
       LEFT JOIN usage_stats us
         ON  us.tool_id      = t.id
         AND us.industry_id IS NULL
         AND us.year = (
               SELECT MAX(us2.year)
               FROM   usage_stats us2
               WHERE  us2.tool_id     = t.id
               AND    us2.industry_id IS NULL
             )
       LEFT JOIN trends tr
         ON  tr.tool_id      = t.id
         AND tr.industry_id IS NULL
       WHERE t.is_active = 1
       ORDER BY t.created_at DESC
       LIMIT 20`
    );

    const lastBuildDate = toRfc822(new Date());

    // Map each row to an RSS <item> block
    const items = tools.map(tool => {
      // Prefer the tool's own website; fall back to its category page on TechBoard
      const itemLink = tool.website_url
        ? escapeXml(tool.website_url)
        : `${escapeXml(BASE_URL)}/category.html?slug=${escapeXml(tool.category_slug)}`;

      // Human-readable trend badge
      const trendMap = { rising: '↑ Rising', stable: '→ Stable', falling: '↓ Falling' };
      const trendText = tool.trend_direction ? ` Trend: ${trendMap[tool.trend_direction] || tool.trend_direction}.` : '';

      // Usage line only when data is available
      const usageText = tool.usage_percent != null
        ? ` Usage (${tool.stat_year}): ${tool.usage_percent}%${tool.stat_source ? ' — ' + tool.stat_source : ''}.`
        : '';

      // Compose a plain-text description (no HTML markup inside RSS description)
      const description = escapeXml(
        [
          tool.description || '',
          usageText,
          trendText,
          tool.open_source ? ' Open source.' : '',
          tool.first_released ? ` First released: ${tool.first_released}.` : '',
        ].join('')
      );

      return `
    <item>
      <title>${escapeXml(tool.name)}</title>
      <link>${itemLink}</link>
      <guid isPermaLink="false">techboard-tool-${tool.id}</guid>
      <description>${description}</description>
      <category>${escapeXml(tool.category_name)}</category>
      <pubDate>${toRfc822(tool.created_at)}</pubDate>
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TechBoard — Tech Stack Intelligence</title>
    <link>${escapeXml(BASE_URL)}</link>
    <description>Newest developer tools and trending technologies tracked by TechBoard Intelligence Platform</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${escapeXml(BASE_URL)}/feed.xml" rel="self" type="application/rss+xml"/>
    <managingEditor>techboard@example.com (TechBoard Team)</managingEditor>${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(xml);

  } catch (err) {
    console.error('[GET /feed.xml]', err.message);
    // Return a minimal valid XML error document so the client always gets XML
    res.status(500)
      .setHeader('Content-Type', 'application/xml; charset=utf-8')
      .send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate RSS feed</error>');
  }
});

// ----------------------------------------------------------------
// GET /api/export/xml  —  Full dataset download
// ----------------------------------------------------------------
router.get('/api/export/xml', async (req, res) => {
  try {
    // ---- 1. Categories ----
    const [categories] = await pool.execute(
      `SELECT id, slug, name, description, data_status, sort_order
       FROM   categories
       ORDER  BY sort_order ASC`
    );

    // ---- 2. All active tools ----
    const [tools] = await pool.execute(
      `SELECT
         t.id,
         t.slug,
         t.name,
         t.description,
         t.website_url,
         t.open_source,
         t.first_released,
         t.created_at,
         t.category_id,
         c.slug AS category_slug
       FROM   tools t
       JOIN   categories c ON c.id = t.category_id
       WHERE  t.is_active = 1
       ORDER  BY c.sort_order ASC, t.name ASC`
    );

    // ---- 3. Complete usage history (all years, all industries) ----
    // The export ships every data point so consumers can do their own analysis.
    const [stats] = await pool.execute(
      `SELECT
         us.tool_id,
         us.year,
         us.usage_percent,
         us.satisfaction,
         us.sample_size,
         us.source,
         i.slug AS industry_slug,
         i.name AS industry_name
       FROM   usage_stats us
       LEFT JOIN industries i ON i.id = us.industry_id
       ORDER  BY us.tool_id ASC, us.year ASC, i.sort_order ASC`
    );

    // ---- 4. All pre-computed trend rows ----
    const [trends] = await pool.execute(
      `SELECT
         tr.tool_id,
         tr.trend_score,
         tr.trend_direction,
         tr.year_from,
         tr.year_to,
         i.slug AS industry_slug
       FROM   trends tr
       LEFT JOIN industries i ON i.id = tr.industry_id
       ORDER  BY tr.tool_id ASC`
    );

    // ---- Build lookup maps for O(1) access when rendering ----

    // Group usage stats by tool_id
    const statsByTool = {};
    for (const stat of stats) {
      if (!statsByTool[stat.tool_id]) statsByTool[stat.tool_id] = [];
      statsByTool[stat.tool_id].push(stat);
    }

    // Group trend rows by tool_id
    const trendsByTool = {};
    for (const trend of trends) {
      if (!trendsByTool[trend.tool_id]) trendsByTool[trend.tool_id] = [];
      trendsByTool[trend.tool_id].push(trend);
    }

    // Group tools by category_id
    const toolsByCategory = {};
    for (const tool of tools) {
      if (!toolsByCategory[tool.category_id]) toolsByCategory[tool.category_id] = [];
      toolsByCategory[tool.category_id].push(tool);
    }

    // ---- Render categories → tools → stats / trends ----
    const categoriesXml = categories.map(cat => {
      const catTools = (toolsByCategory[cat.id] || []).map(tool => {

        // Render <stat> elements for this tool
        const statsXml = (statsByTool[tool.id] || []).map(stat => {
          const industryAttr = stat.industry_slug
            ? ` industry="${escapeXml(stat.industry_slug)}"`
            : ' industry="global"';
          return `
          <stat${industryAttr} year="${stat.year}">
            <usage_percent>${stat.usage_percent != null ? stat.usage_percent : ''}</usage_percent>
            <satisfaction>${stat.satisfaction   != null ? stat.satisfaction   : ''}</satisfaction>
            <sample_size>${stat.sample_size     != null ? stat.sample_size    : ''}</sample_size>
            <source>${escapeXml(stat.source)}</source>
          </stat>`;
        }).join('');

        // Render <trend> elements for this tool
        const trendsXml = (trendsByTool[tool.id] || []).map(tr => {
          const industryAttr = tr.industry_slug
            ? ` industry="${escapeXml(tr.industry_slug)}"`
            : ' industry="global"';
          return `
          <trend${industryAttr}>
            <direction>${escapeXml(tr.trend_direction)}</direction>
            <score>${tr.trend_score != null ? tr.trend_score : ''}</score>
            <year_from>${tr.year_from || ''}</year_from>
            <year_to>${tr.year_to   || ''}</year_to>
          </trend>`;
        }).join('');

        return `
        <tool slug="${escapeXml(tool.slug)}">
          <name>${escapeXml(tool.name)}</name>
          <description>${escapeXml(tool.description)}</description>
          <website>${escapeXml(tool.website_url)}</website>
          <open_source>${tool.open_source ? 'true' : 'false'}</open_source>
          <first_released>${tool.first_released || ''}</first_released>
          <added>${new Date(tool.created_at).toISOString()}</added>
          <usage_stats>${statsXml || ''}
          </usage_stats>
          <trends>${trendsXml || ''}
          </trends>
        </tool>`;
      }).join('');

      return `
    <category slug="${escapeXml(cat.slug)}" status="${escapeXml(cat.data_status)}">
      <name>${escapeXml(cat.name)}</name>
      <description>${escapeXml(cat.description)}</description>
      <tools>${catTools || ''}
      </tools>
    </category>`;
    }).join('');

    const exportDate = new Date().toISOString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<techboard_export generated="${escapeXml(exportDate)}" version="1.0">
  <meta>
    <platform>TechBoard Intelligence Platform</platform>
    <description>Full dataset export — all tracked tools with complete usage history and trend data</description>
    <total_categories>${categories.length}</total_categories>
    <total_tools>${tools.length}</total_tools>
    <total_data_points>${stats.length}</total_data_points>
    <feed_url>${escapeXml(BASE_URL)}/feed.xml</feed_url>
    <export_url>${escapeXml(BASE_URL)}/api/export/xml</export_url>
  </meta>
  <categories>${categoriesXml}
  </categories>
</techboard_export>`;

    // Filename includes the date so repeated downloads are distinguishable
    const filename = `techboard-export-${exportDate.slice(0, 10)}.xml`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);

  } catch (err) {
    console.error('[GET /api/export/xml]', err.message);
    res.status(500)
      .setHeader('Content-Type', 'application/xml; charset=utf-8')
      .send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate XML export</error>');
  }
});

module.exports = router;
