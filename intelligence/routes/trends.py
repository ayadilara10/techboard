"""
routes/trends.py — Trend computation endpoints.

Blueprints registered here:
  GET /intelligence/trends?category=<slug>&industry=<slug>&years=<n>
    Computes year-over-year growth for every tool in a category using
    linear regression and returns them ranked by trend_score (highest = fastest-growing).

  GET /intelligence/rising?limit=<n>
    Scans ALL active tools, computes their global trend, and returns the
    top N fastest-growing tools across all categories.  This is the endpoint
    the dashboard "Trending Now" strip calls (via the Node.js proxy).

Algorithm (both endpoints):
  For each tool, collect its (year, usage_percent) pairs from usage_stats.
  Pass those pairs to analysis.trend_detector.compute_trend(), which fits a
  linear regression using numpy and returns slope + direction classification.
  Results are sorted by trend_score descending.

Database access:
  Read-only.  Uses a per-request connection from db.get_connection().
  Connections are always released in finally blocks.
"""

from flask import Blueprint, jsonify, request
from datetime import datetime
from mysql.connector import Error as MySQLError

from db import get_connection
from analysis.trend_detector import compute_trend, yoy_change
from analysis import stats_engine

# A Blueprint is Flask's way of grouping related routes.
# It is registered in app.py with app.register_blueprint(trends_bp).
trends_bp = Blueprint('trends', __name__)


# ── /intelligence/trends ─────────────────────────────────────────────────────

@trends_bp.route('/intelligence/trends')
def get_trends():
    """
    Compute year-over-year trend for every tool in a category.

    Query parameters
    ----------------
    category  (str, required)  — category slug, e.g. 'backend'
    industry  (str, optional)  — industry slug, e.g. 'saas'. Omit for global.
    years     (int, optional)  — how many years of history to include (default 5, max 10)

    Response JSON
    -------------
    {
      "data": [
        {
          "id": 1,
          "slug": "node",
          "name": "Node.js",
          "trend_score": 4.25,          // pp/year regression slope
          "trend_direction": "rising",
          "r_squared": 0.97,            // how well the line fits (0–1)
          "latest_usage": 45.3,
          "yoy_change": 3.8,            // latest year vs previous year
          "avg_satisfaction": 3.9,
          "year_from": 2020,
          "year_to": 2024,
          "data_points": 5,
          "usage_history": [{"year": 2020, "usage_percent": 30.0}, ...]
        },
        ...
      ],
      "meta": {
        "category": "backend",
        "industry": "saas",
        "years_analyzed": 5,
        "tool_count": 7
      }
    }
    """
    # --- Parse and validate query parameters ---
    category_slug = (request.args.get('category') or '').strip()
    industry_slug = (request.args.get('industry') or '').strip() or None

    try:
        years_back = max(2, min(10, int(request.args.get('years', 5))))
    except (ValueError, TypeError):
        years_back = 5

    if not category_slug:
        return jsonify({'error': 'Query param "category" is required'}), 400

    # Earliest year to include in the analysis window
    min_year = datetime.now().year - years_back

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # --- Fetch usage stats ---
        # One row per (tool, year) combination.  We join through categories and
        # optionally through industries depending on whether an industry filter
        # was provided.
        if industry_slug:
            # Industry-filtered query: join industries on slug so we don't need
            # a separate lookup round-trip.
            cursor.execute(
                """
                SELECT
                    t.id,
                    t.slug,
                    t.name,
                    us.year,
                    us.usage_percent,
                    us.satisfaction
                FROM tools t
                JOIN categories  c  ON c.id   = t.category_id
                JOIN industries  i  ON i.slug = %s
                JOIN usage_stats us ON us.tool_id     = t.id
                                   AND us.industry_id = i.id
                WHERE c.slug     = %s
                  AND t.is_active = 1
                  AND us.year    >= %s
                ORDER BY t.id ASC, us.year ASC
                """,
                (industry_slug, category_slug, min_year)
            )
        else:
            # Global query: industry_id IS NULL rows represent all-industry averages
            cursor.execute(
                """
                SELECT
                    t.id,
                    t.slug,
                    t.name,
                    us.year,
                    us.usage_percent,
                    us.satisfaction
                FROM tools t
                JOIN categories  c  ON c.id = t.category_id
                JOIN usage_stats us ON us.tool_id     = t.id
                                   AND us.industry_id IS NULL
                WHERE c.slug     = %s
                  AND t.is_active = 1
                  AND us.year    >= %s
                ORDER BY t.id ASC, us.year ASC
                """,
                (category_slug, min_year)
            )

        rows = cursor.fetchall()

        # --- Group rows by tool so we can compute one trend per tool ---
        tools_data = {}
        for row in rows:
            tid = row['id']
            if tid not in tools_data:
                tools_data[tid] = {
                    'id':              tid,
                    'slug':            row['slug'],
                    'name':            row['name'],
                    'usage_by_year':   [],    # list of (year, usage_percent) tuples
                    'satisfaction':    [],    # list of satisfaction scores
                }
            pct = float(row['usage_percent']) if row['usage_percent'] is not None else 0.0
            tools_data[tid]['usage_by_year'].append((int(row['year']), pct))
            if row['satisfaction'] is not None:
                tools_data[tid]['satisfaction'].append(float(row['satisfaction']))

        # --- Compute trend for each tool and build output records ---
        results = []
        for tool in tools_data.values():
            trend     = compute_trend(tool['usage_by_year'])
            delta     = yoy_change(tool['usage_by_year'])
            avg_sat   = stats_engine.mean(tool['satisfaction'])

            # Most recent usage figure (last entry after sorting by year)
            sorted_history = sorted(tool['usage_by_year'], key=lambda p: p[0])
            latest_usage   = sorted_history[-1][1] if sorted_history else None

            results.append({
                'id':               tool['id'],
                'slug':             tool['slug'],
                'name':             tool['name'],
                'trend_score':      trend['trend_score'],
                'trend_direction':  trend['trend_direction'],
                'r_squared':        trend['r_squared'],
                'latest_usage':     latest_usage,
                'yoy_change':       delta,
                'avg_satisfaction': round(avg_sat, 2) if avg_sat else None,
                'year_from':        trend['year_from'],
                'year_to':          trend['year_to'],
                'data_points':      trend['data_points'],
                'usage_history':    [
                    {'year': y, 'usage_percent': u}
                    for y, u in sorted_history
                ],
            })

        # --- Sort by trend_score descending (fastest-growing first) ---
        results.sort(key=lambda r: r['trend_score'], reverse=True)

        return jsonify({
            'data': results,
            'meta': {
                'category':       category_slug,
                'industry':       industry_slug or 'global',
                'years_analyzed': years_back,
                'tool_count':     len(results),
            },
        })

    except MySQLError as err:
        return jsonify({'error': f'Database error: {err.msg}'}), 503
    finally:
        # Always release the DB connection regardless of success or failure
        if conn and conn.is_connected():
            try:
                cursor.close()
            except Exception:
                pass
            conn.close()


# ── /intelligence/rising ─────────────────────────────────────────────────────

@trends_bp.route('/intelligence/rising')
def get_rising():
    """
    Return the top N fastest-growing tools across ALL categories (global stats).

    This scans every active tool that has at least 2 years of global usage data,
    computes its regression slope, filters to 'rising' tools only, and returns
    them sorted by trend_score descending.

    Query parameters
    ----------------
    limit  (int, optional) — how many tools to return (default 10, max 50)

    Response JSON
    -------------
    {
      "data": [
        {
          "id": 8,
          "slug": "react",
          "name": "React",
          "category_slug": "frontend",
          "category_name": "Frontend Frameworks & Languages",
          "trend_score": 5.2,
          "trend_direction": "rising",
          "latest_usage": 42.3,
          "yoy_change": 4.1,
          "data_points": 5
        },
        ...
      ],
      "meta": {
        "limit": 10,
        "returned": 7
      }
    }
    """
    try:
        limit = max(1, min(50, int(request.args.get('limit', 10))))
    except (ValueError, TypeError):
        limit = 10

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch all global usage stats (industry_id IS NULL) for all active tools,
        # ordered so rows for the same tool are consecutive.
        cursor.execute(
            """
            SELECT
                t.id,
                t.slug,
                t.name,
                c.slug AS category_slug,
                c.name AS category_name,
                us.year,
                us.usage_percent
            FROM tools t
            JOIN categories  c  ON c.id = t.category_id
            JOIN usage_stats us ON us.tool_id     = t.id
                               AND us.industry_id IS NULL
            WHERE t.is_active = 1
            ORDER BY t.id ASC, us.year ASC
            """
        )
        rows = cursor.fetchall()

        # --- Group by tool ---
        tools_data = {}
        for row in rows:
            tid = row['id']
            if tid not in tools_data:
                tools_data[tid] = {
                    'id':            tid,
                    'slug':          row['slug'],
                    'name':          row['name'],
                    'category_slug': row['category_slug'],
                    'category_name': row['category_name'],
                    'usage_by_year': [],
                }
            pct = float(row['usage_percent']) if row['usage_percent'] is not None else 0.0
            tools_data[tid]['usage_by_year'].append((int(row['year']), pct))

        # --- Compute trend, keep only 'rising' tools with enough data ---
        rising = []
        for tool in tools_data.values():
            # Need at least 2 data points for a meaningful trend
            if len(tool['usage_by_year']) < 2:
                continue

            trend = compute_trend(tool['usage_by_year'])

            if trend['trend_direction'] != 'rising':
                continue   # drop non-rising tools

            sorted_history = sorted(tool['usage_by_year'], key=lambda p: p[0])
            latest_usage   = sorted_history[-1][1] if sorted_history else None

            rising.append({
                'id':              tool['id'],
                'slug':            tool['slug'],
                'name':            tool['name'],
                'category_slug':   tool['category_slug'],
                'category_name':   tool['category_name'],
                'trend_score':     trend['trend_score'],
                'trend_direction': 'rising',
                'latest_usage':    latest_usage,
                'yoy_change':      yoy_change(tool['usage_by_year']),
                'data_points':     trend['data_points'],
            })

        # Sort by trend_score descending, then take top N
        rising.sort(key=lambda r: r['trend_score'], reverse=True)
        top_n = rising[:limit]

        return jsonify({
            'data': top_n,
            'meta': {
                'limit':    limit,
                'returned': len(top_n),
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
