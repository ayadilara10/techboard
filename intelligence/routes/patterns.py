"""
routes/patterns.py — Co-adoption pattern detection endpoint.

Blueprint registered here:
  GET /intelligence/patterns?industry=<slug>

What it does:
  Examines every stack_profile that belongs to the requested industry and finds
  pairs of tools that appear together in those profiles.  A "co-adoption pair"
  is two tools that have been recommended together in at least one profile.

  The frequency_score for a pair is:
      frequency_score = profiles_in_common / total_profiles_for_industry

  A score of 1.0 means the pair appears together in every profile for that
  industry; 0.33 means they appear together in 1 out of 3 profiles.

Graceful fallback:
  If the industry has no stack profiles (or the stack_profile_tools table is
  empty), the endpoint falls back to returning the most widely-adopted
  individual tools in that industry sorted by usage_percent.  This way the
  frontend always gets useful data even in a fresh environment with no
  profile data.

Database access:
  Read-only.  Per-request connection from db.get_connection().
"""

from itertools import combinations
from flask import Blueprint, jsonify, request
from mysql.connector import Error as MySQLError

from db import get_connection
from analysis import stats_engine

patterns_bp = Blueprint('patterns', __name__)


# ── /intelligence/patterns ────────────────────────────────────────────────────

@patterns_bp.route('/intelligence/patterns')
def get_patterns():
    """
    Find co-adoption patterns for tools within a given industry.

    Query parameters
    ----------------
    industry  (str, optional) — industry slug, e.g. 'fintech'.
                                Omit to analyse patterns across all industries.
    limit     (int, optional) — max number of pairs to return (default 20)

    Response JSON
    -------------
    {
      "data": {
        "co_adoption_pairs": [
          {
            "tool_a": {"id": 1,  "slug": "node",       "name": "Node.js",    "category": "Backend"},
            "tool_b": {"id": 8,  "slug": "react",      "name": "React",      "category": "Frontend"},
            "frequency_score": 1.0,        // fraction of profiles containing both
            "profiles_together": 2,        // absolute count
            "total_profiles": 2
          },
          ...
        ],
        "commonly_adopted": [              // fallback list when no profiles exist
          {
            "id": 8, "slug": "react", "name": "React",
            "category": "Frontend", "usage_percent": 42.3
          }
        ],
        "source": "profiles"               // "profiles" or "usage_stats" (fallback)
      },
      "meta": {
        "industry": "fintech",
        "profiles_analysed": 2,
        "pairs_found": 15
      }
    }
    """
    industry_slug = (request.args.get('industry') or '').strip() or None

    try:
        limit = max(1, min(100, int(request.args.get('limit', 20))))
    except (ValueError, TypeError):
        limit = 20

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ── Step 1: find relevant stack profiles ──────────────────────────────

        if industry_slug:
            cursor.execute(
                """
                SELECT sp.id AS profile_id, sp.product_type, sp.industry_id
                FROM   stack_profiles sp
                JOIN   industries     i  ON i.id   = sp.industry_id
                WHERE  i.slug = %s AND sp.is_published = 1
                """,
                (industry_slug,)
            )
        else:
            cursor.execute(
                """
                SELECT sp.id AS profile_id, sp.product_type, sp.industry_id
                FROM   stack_profiles sp
                WHERE  sp.is_published = 1
                """
            )
        profiles = cursor.fetchall()

        # ── Step 2: if no profiles exist, fall back to usage stats ───────────

        if not profiles:
            return _usage_stats_fallback(cursor, industry_slug, limit)

        profile_ids = [p['profile_id'] for p in profiles]
        total_profiles = len(profile_ids)

        # ── Step 3: fetch all tools in those profiles ─────────────────────────

        # Build a parameterised IN clause for the profile IDs
        placeholders = ', '.join(['%s'] * len(profile_ids))

        cursor.execute(
            f"""
            SELECT
                spt.profile_id,
                t.id              AS tool_id,
                t.slug            AS tool_slug,
                t.name            AS tool_name,
                c.name            AS category_name
            FROM   stack_profile_tools spt
            JOIN   tools               t   ON t.id  = spt.tool_id
            JOIN   categories          c   ON c.id  = spt.category_id
            WHERE  spt.profile_id IN ({placeholders})
            ORDER  BY spt.profile_id
            """,
            profile_ids
        )
        profile_tool_rows = cursor.fetchall()

        # ── Step 4: group tools by profile ────────────────────────────────────

        # tools_by_profile maps profile_id → list of tool info dicts
        tools_by_profile = {}
        for row in profile_tool_rows:
            pid = row['profile_id']
            if pid not in tools_by_profile:
                tools_by_profile[pid] = []
            tools_by_profile[pid].append({
                'id':       row['tool_id'],
                'slug':     row['tool_slug'],
                'name':     row['tool_name'],
                'category': row['category_name'],
            })

        # ── Step 5: count pair co-occurrences across profiles ─────────────────

        # Use a dict keyed by frozenset({id_a, id_b}) to accumulate counts
        pair_counts = {}    # frozenset(id_a, id_b) → {'count': int, 'tool_a': …, 'tool_b': …}

        for pid, tools in tools_by_profile.items():
            # combinations(tools, 2) generates all unique pairs within this profile
            for tool_a, tool_b in combinations(tools, 2):
                # Normalise order so (React, Vue) and (Vue, React) count as the same pair
                if tool_a['id'] > tool_b['id']:
                    tool_a, tool_b = tool_b, tool_a

                key = frozenset({tool_a['id'], tool_b['id']})

                if key not in pair_counts:
                    pair_counts[key] = {
                        'tool_a':            tool_a,
                        'tool_b':            tool_b,
                        'profiles_together': 0,
                        'total_profiles':    total_profiles,
                    }
                pair_counts[key]['profiles_together'] += 1

        # ── Step 6: compute frequency_score and sort ──────────────────────────

        pairs = []
        for pair_data in pair_counts.values():
            score = pair_data['profiles_together'] / total_profiles
            pairs.append({
                'tool_a':            pair_data['tool_a'],
                'tool_b':            pair_data['tool_b'],
                'frequency_score':   round(score, 4),
                'profiles_together': pair_data['profiles_together'],
                'total_profiles':    pair_data['total_profiles'],
            })

        # Sort by frequency_score descending (most common pairs first)
        pairs.sort(key=lambda p: p['frequency_score'], reverse=True)
        top_pairs = pairs[:limit]

        return jsonify({
            'data': {
                'co_adoption_pairs': top_pairs,
                'commonly_adopted':  [],
                'source':            'profiles',
            },
            'meta': {
                'industry':          industry_slug or 'global',
                'profiles_analysed': total_profiles,
                'pairs_found':       len(top_pairs),
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


def _usage_stats_fallback(cursor, industry_slug, limit):
    """
    Fallback used when there are no published stack profiles for the industry.

    Returns the tools with the highest latest usage_percent in that industry
    so the caller always gets a meaningful response.

    Parameters
    ----------
    cursor       : mysql cursor (already open, caller owns the connection)
    industry_slug: str | None
    limit        : int

    Returns
    -------
    Flask Response (jsonify)
    """
    if industry_slug:
        # Fetch tools with the highest global usage in this industry
        cursor.execute(
            """
            SELECT
                t.id,
                t.slug,
                t.name,
                c.name AS category,
                us.usage_percent
            FROM tools t
            JOIN categories  c  ON c.id  = t.category_id
            JOIN industries  i  ON i.slug = %s
            JOIN usage_stats us ON us.tool_id     = t.id
                               AND us.industry_id = i.id
                               AND us.year = (
                                     SELECT MAX(us2.year) FROM usage_stats us2
                                     WHERE  us2.tool_id     = t.id
                                     AND    us2.industry_id = i.id
                                   )
            WHERE t.is_active = 1
            ORDER BY us.usage_percent DESC
            LIMIT %s
            """,
            (industry_slug, limit)
        )
    else:
        cursor.execute(
            """
            SELECT
                t.id,
                t.slug,
                t.name,
                c.name AS category,
                us.usage_percent
            FROM tools t
            JOIN categories  c  ON c.id  = t.category_id
            JOIN usage_stats us ON us.tool_id     = t.id
                               AND us.industry_id IS NULL
                               AND us.year = (
                                     SELECT MAX(us2.year) FROM usage_stats us2
                                     WHERE  us2.tool_id     = t.id
                                     AND    us2.industry_id IS NULL
                                   )
            WHERE t.is_active = 1
            ORDER BY us.usage_percent DESC
            LIMIT %s
            """,
            (limit,)
        )
    rows = cursor.fetchall()
    commonly_adopted = [
        {
            'id':            r['id'],
            'slug':          r['slug'],
            'name':          r['name'],
            'category':      r['category'],
            'usage_percent': float(r['usage_percent']) if r['usage_percent'] is not None else None,
        }
        for r in rows
    ]

    return jsonify({
        'data': {
            'co_adoption_pairs': [],
            'commonly_adopted':  commonly_adopted,
            'source':            'usage_stats',    # tells the caller this is the fallback
        },
        'meta': {
            'industry':          industry_slug or 'global',
            'profiles_analysed': 0,
            'pairs_found':       0,
        },
    })
