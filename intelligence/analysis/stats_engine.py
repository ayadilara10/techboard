"""
analysis/stats_engine.py — Statistical helper functions used across Flask routes.

These are pure functions (no database access, no Flask imports) so they can
be tested in isolation without any external dependencies.

Functions
---------
mean(values)
    Arithmetic mean of a list of numbers.  Handles empty lists gracefully.

percentage_change(old_val, new_val)
    Relative change from old to new as a percentage.

rank_by(items, key_fn, reverse=True)
    Sort a list of dicts by a computed key and attach a 1-based rank field.

percentile_rank(value, population)
    What fraction of the population is at or below `value`?

normalise(values)
    Scale a list of numbers to the [0, 1] range (min–max normalisation).

summarise(values)
    Return a dict with min, max, mean, std_dev, and count.
"""

import math
import numpy as np


# ── mean ─────────────────────────────────────────────────────────────────────

def mean(values):
    """
    Return the arithmetic mean of a list of numbers.

    Returns 0.0 for an empty list (rather than raising ZeroDivisionError)
    so callers don't need to guard against empty result sets.

    Parameters
    ----------
    values : list of float | int

    Returns
    -------
    float
    """
    values = [v for v in values if v is not None]
    if not values:
        return 0.0
    return sum(values) / len(values)


# ── percentage_change ─────────────────────────────────────────────────────────

def percentage_change(old_val, new_val):
    """
    Compute the relative change from old_val to new_val.

    Formula:  ((new − old) / |old|) × 100

    Returns None when:
    - Either value is None (missing data)
    - old_val is 0 (avoids division by zero)

    Parameters
    ----------
    old_val : float | None
    new_val : float | None

    Returns
    -------
    float | None — percentage change, rounded to 2 decimal places
    """
    if old_val is None or new_val is None:
        return None
    if old_val == 0:
        # Can't express relative change from zero — return None rather than ±inf
        return None
    return round(((new_val - old_val) / abs(old_val)) * 100.0, 2)


# ── rank_by ───────────────────────────────────────────────────────────────────

def rank_by(items, key_fn, reverse=True):
    """
    Sort a list of dicts by a computed key, then add a 'rank' integer field.

    Ties receive different ranks (no dense ranking) — the first item in
    sorted order gets rank 1.

    Parameters
    ----------
    items   : list of dict
    key_fn  : callable — takes one dict, returns the sort key value
    reverse : bool — True (default) means highest value → rank 1

    Returns
    -------
    list of dict — same dicts with an added 'rank' key, sorted in rank order

    Example
    -------
    tools = [{'name': 'Vue', 'score': 3.1}, {'name': 'React', 'score': 5.2}]
    ranked = rank_by(tools, lambda t: t['score'])
    # → [{'name': 'React', 'score': 5.2, 'rank': 1},
    #    {'name': 'Vue',   'score': 3.1, 'rank': 2}]
    """
    # Sort a copy so the original list is not mutated
    sorted_items = sorted(items, key=key_fn, reverse=reverse)
    for i, item in enumerate(sorted_items):
        item['rank'] = i + 1
    return sorted_items


# ── percentile_rank ───────────────────────────────────────────────────────────

def percentile_rank(value, population):
    """
    Return what fraction of the population is at or below `value` (0.0–1.0).

    Used in compare.py to contextualise a tool's usage relative to its peers
    (e.g. "React is in the 92nd percentile for frontend usage").

    Parameters
    ----------
    value      : float
    population : list of float

    Returns
    -------
    float — fraction in [0, 1], or None if population is empty
    """
    clean = [v for v in population if v is not None]
    if not clean:
        return None
    below_or_equal = sum(1 for v in clean if v <= value)
    return round(below_or_equal / len(clean), 4)


# ── normalise ─────────────────────────────────────────────────────────────────

def normalise(values):
    """
    Min–max normalisation: scale all values to the [0, 1] range.

    If all values are identical the result is a list of zeros (the range
    is zero, so any normalised value would be arbitrary — we return 0.0).

    Parameters
    ----------
    values : list of float

    Returns
    -------
    list of float
    """
    clean = [v for v in values if v is not None]
    if not clean:
        return []

    min_v = min(clean)
    max_v = max(clean)
    rng   = max_v - min_v

    if rng == 0:
        return [0.0] * len(clean)

    return [round((v - min_v) / rng, 6) for v in clean]


# ── summarise ─────────────────────────────────────────────────────────────────

def summarise(values):
    """
    Return a basic statistical summary of a list of numbers.

    Parameters
    ----------
    values : list of float | int

    Returns
    -------
    dict with keys:
        count   : int
        min     : float | None
        max     : float | None
        mean    : float | None
        std_dev : float | None
    """
    clean = [float(v) for v in values if v is not None]

    if not clean:
        return {'count': 0, 'min': None, 'max': None, 'mean': None, 'std_dev': None}

    arr = np.array(clean)
    return {
        'count':   len(clean),
        'min':     round(float(arr.min()), 4),
        'max':     round(float(arr.max()), 4),
        'mean':    round(float(arr.mean()), 4),
        'std_dev': round(float(arr.std()), 4),
    }
