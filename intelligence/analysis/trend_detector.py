"""
analysis/trend_detector.py — Core trend computation algorithm.

Given a list of (year, usage_percent) pairs for a single tool, this module
computes a linear regression slope and classifies the tool's direction as
'rising', 'stable', or 'falling'.

Why linear regression?
  A simple year-over-year delta is noisy — one bad survey year can flip the
  direction.  Fitting a straight line through all available data points gives
  a robust estimate of the long-term trajectory and is not thrown off by a
  single outlier year.

The slope returned by numpy.polyfit has units of "percentage points per year"
(e.g. slope=3.5 means the tool grows ~3.5 pp per year on average).  This
value is stored as trend_score and used directly for sorting in /rising.

Classification thresholds (tunable constants at the bottom of this file):
  slope > RISING_THRESHOLD   → 'rising'
  slope < FALLING_THRESHOLD  → 'falling'
  otherwise                  → 'stable'

Both thresholds default to ±1.0 pp/year so that genuinely flat tools (e.g.
a tool hovering at 40 % ± 0.5 % for five years) are labelled 'stable'.
"""

import numpy as np

# --- Classification thresholds (percentage points per year) ---
# Adjust these to make the classifier more or less sensitive.
RISING_THRESHOLD  =  1.0   # slope above this → rising
FALLING_THRESHOLD = -1.0   # slope below this → falling


def compute_trend(usage_by_year):
    """
    Compute the linear trend for one tool from its historical usage data.

    Parameters
    ----------
    usage_by_year : list of (int, float)
        A list of (year, usage_percent) pairs, e.g.
        [(2020, 30.5), (2021, 34.2), (2022, 38.0), (2023, 41.5), (2024, 45.1)]
        The list need not be sorted, but it should contain at least 2 data points
        for the regression to be meaningful.

    Returns
    -------
    dict with keys:
        trend_score     : float — linear regression slope (pp/year), rounded to 3 d.p.
        trend_direction : str   — 'rising', 'stable', or 'falling'
        r_squared       : float — coefficient of determination (goodness of fit, 0–1)
        year_from       : int   — earliest year in the data
        year_to         : int   — latest year in the data
        data_points     : int   — number of (year, usage) pairs used

    Edge cases
    ----------
    - Fewer than 2 data points: returns trend_score=0.0, direction='stable', r_squared=0.0
    - All usage values identical (zero variance): slope=0.0, direction='stable'
    """
    # Handle degenerate case — not enough data to fit a line
    if not usage_by_year or len(usage_by_year) < 2:
        return {
            'trend_score':     0.0,
            'trend_direction': 'stable',
            'r_squared':       0.0,
            'year_from':       None,
            'year_to':         None,
            'data_points':     len(usage_by_year) if usage_by_year else 0,
        }

    # Sort by year ascending so the regression runs left-to-right in time
    sorted_pairs = sorted(usage_by_year, key=lambda p: p[0])

    years   = np.array([p[0] for p in sorted_pairs], dtype=float)
    usages  = np.array([p[1] for p in sorted_pairs], dtype=float)

    # Normalize years to 0-based (e.g. 2020→0, 2021→1, …) to keep numbers
    # small and avoid floating-point precision issues in polyfit.
    years_norm = years - years[0]

    # numpy.polyfit returns [slope, intercept] for a degree-1 polynomial.
    # We use full=True to also get the residuals needed for R².
    coeffs, residuals, *_ = np.polyfit(years_norm, usages, deg=1, full=True)
    slope = float(coeffs[0])

    # --- Compute R² (coefficient of determination) ---
    # R² measures how well the linear model fits the data.
    # 1.0 = perfect straight line; 0.0 = the line explains nothing.
    ss_total = float(np.var(usages) * len(usages))   # total sum of squares
    if ss_total == 0:
        # All usage values are the same — model is perfect by definition
        r_squared = 1.0
    elif len(residuals) > 0:
        r_squared = float(1.0 - residuals[0] / ss_total)
    else:
        # polyfit didn't return residuals (happens when len==2)
        predicted  = slope * years_norm + coeffs[1]
        ss_res     = float(np.sum((usages - predicted) ** 2))
        r_squared  = float(1.0 - ss_res / ss_total)

    # Clamp R² to [0, 1] — floating-point arithmetic can produce tiny negatives
    r_squared = max(0.0, min(1.0, r_squared))

    # --- Classify direction ---
    if slope > RISING_THRESHOLD:
        direction = 'rising'
    elif slope < FALLING_THRESHOLD:
        direction = 'falling'
    else:
        direction = 'stable'

    return {
        'trend_score':     round(slope, 3),
        'trend_direction': direction,
        'r_squared':       round(r_squared, 4),
        'year_from':       int(years[0]),
        'year_to':         int(years[-1]),
        'data_points':     len(sorted_pairs),
    }


def yoy_change(usage_by_year):
    """
    Compute the simple year-over-year change between the two most recent years.

    Returns the difference in percentage points (latest − previous), or None
    if fewer than two data points are available.

    This is a complementary metric to trend_score: trend_score shows the
    long-term slope, yoy_change shows what happened most recently.

    Parameters
    ----------
    usage_by_year : list of (int, float)

    Returns
    -------
    float or None
    """
    if not usage_by_year or len(usage_by_year) < 2:
        return None

    sorted_pairs = sorted(usage_by_year, key=lambda p: p[0])
    prev = sorted_pairs[-2][1]
    curr = sorted_pairs[-1][1]
    return round(curr - prev, 2)
