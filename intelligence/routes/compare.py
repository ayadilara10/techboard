"""
routes/compare.py — Side-by-side tool comparison endpoint.

Blueprint registered here:
  GET /intelligence/compare?tools=react,vue,angular&industry=saas

What it returns for each requested tool:
  - latest_usage_percent  — most recent global (or industry-filtered) usage
  - trend_score           — linear regression slope (computed on the fly)
  - trend_direction       — 'rising' | 'stable' | 'falling'
  - yoy_change            — percentage-point change vs the previous year
  - avg_satisfaction      — mean satisfaction score across all available years
  - percentile_rank       — how this tool ranks relative to ALL tools in its
                            category (0.0–1.0), giving context to its usage figure
  - usage_history         — full year-by-year usage list for micro-charts

The comparison is intentionally stateless — it computes everything fresh from
usage_stats so it reflects the current data set without caching concerns.

Database access:
  Read-only.  Per-request connection from db.get_connection().
"""

from flask import Blueprint, jsonify, request
from mysql.connector import Error as MySQLError

from db import get_connection
from analysis.trend_detector import compute_trend, yoy_change
from analysis import stats_engine

compare_bp = Blueprint('compare', __name__)

# Cap the number of tools that can be compared in a single request
MAX_TOOLS = 5


# ── /intelligence/compare ────────────────────────────────────────────────────

@compare_bp.route('/intelligence/compare')
def compare_tools():
    """
    Return a statistical comparison of 2–5 tools side-by-side.

    Query parameters
    ----------------
    tools     (str, required) — comma-separated tool slugs, e.g. 'react,vue,angular'
    industry  (str, optional) — industry slug; omit for global comparison

    Response JSON
    -------------
    {
      "data": [
        {
          "slug": "react",
          "name": "React",
          "category_slug": "frontend",
          "category_name": "Frontend Frameworks & Languages",
          "latest_usage": 42.3,
          "trend_score": 5.2,
          "trend_direction": "rising",
          "yoy_change": 4.1,
          "avg_satisfaction": 4.1,
          "percentile_rank": 0.94,
          "rank_in_category": 1,
          "usage_history": [{"year": 2020, "usage_percent": 30.0}, ...]
        },
        ...
      ],
      "meta": {
        "tools": ["react", "vue", "angular"],
        "industry": "saas",
        "comparison_dimension": "usage_percent"
      }
    }
    """
    # --- Parse and validate parameters ---
    tools_param   = (request.args.get('tools') or '').strip()
    industry_slug = (request.args.get('industry') or '').strip() or None

    if not tools_param:
        return jsonify({'error': 'Query param "tools" is required (comma-separated slugs)'}), 400

    # Split, strip whitespace, deduplicate while preserving order
    requested_slugs = []
    seen = set()
    for slug in tools_param.split(','):
        slug = slug.strip().lower()
        if slug and slug not in seen:
            requested_slugs.append(slug)
            seen.add(slug)

    if len(requested_slugs) < 2:
        return jsonify({'error': 'At least 2 tools are required for comparison'}), 400

    if len(requested_slugs) > MAX_TOOLS:
        # Silently cap rather than error — user probably sent a long comma list
        requested_slugs = requested_slugs[:MAX_TOOLS]

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ── Step 1: fetch tool metadata + all usage history ───────────────────

        # Build a parameterised IN clause for the requested slugs
        placeholders = ', '.join(['%s'] * len(requested_slugs))

        if industry_slug:
            # Industry-filtered usage data
            cursor.execute(
                f"""
                SELECT
                    t.id,
                    t.slug,
                    t.name,
                    c.slug AS category_slug,
                    c.name AS category_name,
                    us.year,
                    us.usage_percent,
                    us.satisfaction
                FROM tools t
                JOIN categories  c  ON c.id  = t.category_id
                JOIN industries  i  ON i.slug = %s
                JOIN usage_stats us ON us.tool_id     = t.id
                                   AND us.industry_id = i.id
                WHERE t.slug IN ({placeholders})
                  AND t.is_active = 1
                ORDER BY t.slug ASC, us.year ASC
                """,
                [industry_slug] + requested_slugs
            )
        else:
            # Global usage data (industry_id IS NULL)
            cursor.execute(
                f"""
                SELECT
                    t.id,
                    t.slug,
                    t.name,
                    c.slug AS category_slug,
                    c.name AS category_name,
                    us.year,
                    us.usage_percent,
                    us.satisfaction
                FROM tools t
                JOIN categories  c  ON c.id = t.category_id
                JOIN usage_stats us ON us.tool_id     = t.id
                                   AND us.industry_id IS NULL
                WHERE t.slug IN ({placeholders})
                  AND t.is_active = 1
                ORDER BY t.slug ASC, us.year ASC
                """,
                requested_slugs
            )
        rows = cursor.fetchall()

        # ── Step 2: group rows by tool slug ───────────────────────────────────

        tools_data = {}
        for row in rows:
            slug = row['slug']
            if slug not in tools_data:
                tools_data[slug] = {
                    'id':            row['id'],
                    'slug':          slug,
                    'name':          row['name'],
                    'category_slug': row['category_slug'],
                    'category_name': row['category_name'],
                    'usage_by_year': [],
                    'satisfaction':  [],
                }
            pct = float(row['usage_percent']) if row['usage_percent'] is not None else None
            if pct is not None:
                tools_data[slug]['usage_by_year'].append((int(row['year']), pct))
            if row['satisfaction'] is not None:
                tools_data[slug]['satisfaction'].append(float(row['satisfaction']))

        # ── Step 3: fetch the broader population for percentile ranking ───────
        # We want to rank each tool within its own category so we can say
        # "React is in the 94th percentile for frontend tools."
        # Fetch the latest usage_percent for all tools in the same category.

        # Collect the unique category slugs of the requested tools
        category_slugs = list({d['category_slug'] for d in tools_data.values()})
        cat_placeholders = ', '.join(['%s'] * len(category_slugs))

        if industry_slug:
            cursor.execute(
                f"""
                SELECT
                    c.slug AS category_slug,
                    us.usage_percent
                FROM tools t
                JOIN categories  c  ON c.id   = t.category_id
                JOIN industries  i  ON i.slug = %s
                JOIN usage_stats us ON us.tool_id     = t.id
                                   AND us.industry_id = i.id
                                   AND us.year = (
                                         SELECT MAX(us2.year)
                                         FROM   usage_stats us2
                                         WHERE  us2.tool_id     = t.id
                                         AND    us2.industry_id = i.id
                                       )
                WHERE c.slug IN ({cat_placeholders})
                  AND t.is_active = 1
                """,
                [industry_slug] + category_slugs
            )
        else:
            cursor.execute(
                f"""
                SELECT
                    c.slug AS category_slug,
                    us.usage_percent
                FROM tools t
                JOIN categories  c  ON c.id = t.category_id
                JOIN usage_stats us ON us.tool_id     = t.id
                                   AND us.industry_id IS NULL
                                   AND us.year = (
                                         SELECT MAX(us2.year)
                                         FROM   usage_stats us2
                                         WHERE  us2.tool_id     = t.id
                                         AND    us2.industry_id IS NULL
                                       )
                WHERE c.slug IN ({cat_placeholders})
                  AND t.is_active = 1
                """,
                category_slugs
            )
        population_rows = cursor.fetchall()

        # Build: category_slug → [usage_percent, …] for all tools in that category
        category_population = {}
        for row in population_rows:
            cat = row['category_slug']
            if cat not in category_population:
                category_population[cat] = []
            if row['usage_percent'] is not None:
                category_population[cat].append(float(row['usage_percent']))

        # ── Step 4: compute per-tool metrics ──────────────────────────────────

        results = []
        for slug in requested_slugs:
            if slug not in tools_data:
                # Tool slug wasn't found in DB — include a placeholder with nulls
                results.append({
                    'slug':  slug,
                    'name':  slug,
                    'error': 'Tool not found or has no usage data',
                })
                continue

            tool          = tools_data[slug]
            trend         = compute_trend(tool['usage_by_year'])
            delta         = yoy_change(tool['usage_by_year'])
            avg_sat       = stats_engine.mean(tool['satisfaction'])

            sorted_hist   = sorted(tool['usage_by_year'], key=lambda p: p[0])
            latest_usage  = sorted_hist[-1][1] if sorted_hist else None

            # Percentile rank within the tool's own category
            population   = category_population.get(tool['category_slug'], [])
            pct_rank     = (
                stats_engine.percentile_rank(latest_usage, population)
                if latest_usage is not None and population
                else None
            )

            results.append({
                'id':               tool['id'],
                'slug':             tool['slug'],
                'name':             tool['name'],
                'category_slug':    tool['category_slug'],
                'category_name':    tool['category_name'],
                'latest_usage':     latest_usage,
                'trend_score':      trend['trend_score'],
                'trend_direction':  trend['trend_direction'],
                'yoy_change':       delta,
                'avg_satisfaction': round(avg_sat, 2) if avg_sat else None,
                'percentile_rank':  pct_rank,
                'usage_history':    [
                    {'year': y, 'usage_percent': u}
                    for y, u in sorted_hist
                ],
            })

        # Attach category-wide rank (by latest_usage) to each tool
        # so the UI can show e.g. "#1 in Frontend"
        _attach_category_rank(results, category_population)

        return jsonify({
            'data': results,
            'meta': {
                'tools':                requested_slugs,
                'industry':             industry_slug or 'global',
                'comparison_dimension': 'usage_percent',
            },
        })

    except MySQLError as err:
        return jsonify({'error': f'Database error: {err.msg}'}), 503
    finally:
        if conn and conn.is_connected():
            try:
                cursor.close()
            except Exception:
                pass
            conn.close()


def _attach_category_rank(results, category_population):
    """
    Add a 'rank_in_category' integer to each result dict.

    Rank is 1-based within the tool's category (1 = highest usage in category).
    A tool with no usage data gets rank None.

    This mutates the result dicts in place — no return value.
    """
    # Group results by category so we can rank within each group
    by_cat = {}
    for r in results:
        cat = r.get('category_slug')
        if cat:
            if cat not in by_cat:
                by_cat[cat] = []
            by_cat[cat].append(r)

    for cat, cat_results in by_cat.items():
        # Sort this group by latest_usage descending, assign rank
        sortable = [(r.get('latest_usage') or -1, r) for r in cat_results]
        sortable.sort(key=lambda x: x[0], reverse=True)
        for rank, (_, r) in enumerate(sortable, start=1):
            r['rank_in_category'] = rank if r.get('latest_usage') is not None else None
