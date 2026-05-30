/**
 * dashboard.js — Main Dashboard Page Controller
 *
 * Controls everything that happens on index.html.
 *
 * Initialization sequence:
 *   1. DOM ready → render 15 skeleton cards immediately (instant visual feedback)
 *   2. Fire two parallel top-level requests:
 *      a. getGlobalStats()  → animate hero ticker numbers
 *      b. getCategories()   → know which categories are live vs coming_soon
 *   3. For every live category, fire getTopTools() in parallel (Promise.allSettled)
 *   4. Replace skeleton cards with real category cards
 *   5. Stagger-animate cards in using jQuery + CSS transitions
 *   6. Build the "Trending Now" strip from the already-fetched tool data
 *      (avoids an extra API round-trip)
 *
 * Dependencies (loaded before this file in index.html):
 *   - jQuery 3.7.x      → DOM, events, AJAX, animations
 *   - api.js            → API.getCategories(), API.getTopTools(), API.getGlobalStats()
 *   - theme.js          → already applied the saved theme; no dependency here
 */

/* Wrap everything in a jQuery-ready IIFE so:
 *   a) code runs only after the DOM is fully parsed
 *   b) '$' is guaranteed to be jQuery (safe alias) */
(function ($) {
  'use strict';

  /* ============================================================
     CATEGORY ICON MAP
     Emoji icons used as fallbacks when no SVG file is configured
     in the database. The category.icon DB column (Phase 7) will
     eventually override these with proper SVG filenames.
     ============================================================ */
  var CATEGORY_ICONS = {
    backend:     '⚙',
    frontend:    '◈',
    databases:   '⬡',
    cloud:       '☁',
    devops:      '⟳',
    apis:        '⇄',
    auth:        '⊠',
    mobile:      '▣',
    testing:     '✓',
    monitoring:  '◎',
    ai_ml:       '✦',
    search:      '⊙',
    messaging:   '⬡',
    cms:         '▤',
    analytics:   '↗',
  };

  /* ============================================================
     ENTRY POINT
     ============================================================ */

  /* $(document).ready() fires once the DOM tree is built.
   * We separate it into named functions for readability and testability. */
  $(document).ready(function () {
    renderSkeletons();      /* show placeholders immediately */
    loadGlobalStats();      /* fill in hero ticker numbers */
    loadDashboard();        /* fetch categories + tools, build real cards */
  });

  /* ============================================================
     SKELETON RENDERING
     Show placeholder cards before API data arrives so the page
     feels populated instantly.
     ============================================================ */

  function renderSkeletons() {
    var $grid = $('#categoriesGrid');
    var html  = '';

    /* 15 cards to match the expected final count */
    for (var i = 0; i < 15; i++) {
      html +=
        '<article class="category-card category-card--skeleton">' +
          '<div class="card-header">' +
            '<div class="skeleton skeleton--header"></div>' +
            '<div class="skeleton skeleton--title"></div>' +
          '</div>' +
          '<div class="card-body">' +
            '<div class="skeleton skeleton--line"></div>' +
            '<div class="skeleton skeleton--line"></div>' +
            '<div class="skeleton skeleton--line"></div>' +
          '</div>' +
        '</article>';
    }

    /* jQuery .html() replaces the grid content */
    $grid.html(html);
  }

  /* ============================================================
     GLOBAL STATS — hero ticker
     ============================================================ */

  /* loadGlobalStats fetches platform summary numbers and animates
   * them counting up from 0 to their final value using jQuery.animate(). */
  async function loadGlobalStats() {
    try {
      var stats = await API.getGlobalStats();
      animateCount('#stat-tools',       stats.total_tools);
      animateCount('#stat-industries',  stats.total_industries);
      animateCount('#stat-datapoints',  stats.total_data_points);
      animateCount('#stat-sources',     stats.data_sources);
    } catch (e) {
      /* Backend is probably not running — show dashes and move on */
      console.warn('[dashboard] Global stats unavailable:', e.message);
      $('.stat-value').text('—');
    }
  }

  /* ============================================================
     MAIN DASHBOARD LOAD
     ============================================================ */

  async function loadDashboard() {
    var $grid = $('#categoriesGrid');

    try {
      /* ---- Step 1: fetch all 15 categories ---- */
      var categories = await API.getCategories();

      /* Split into live (have data) and coming_soon */
      var liveCategories     = categories.filter(function (c) { return c.data_status === 'live'; });
      var comingSoonCategories = categories.filter(function (c) { return c.data_status === 'coming_soon'; });

      /* ---- Step 2: fetch top 3 tools for every live category in parallel ----
       * Promise.allSettled (not Promise.all) means one failing request
       * won't prevent the others from rendering. */
      var topToolPromises = liveCategories.map(function (cat) {
        return API.getTopTools(cat.slug, null, 3);
      });
      var toolResults = await Promise.allSettled(topToolPromises);

      /* Build a lookup map: category.id → tools array (or [] on failure) */
      var toolsByCategory = {};
      liveCategories.forEach(function (cat, index) {
        var result = toolResults[index];
        toolsByCategory[cat.id] = (result.status === 'fulfilled') ? result.value : [];
      });

      /* ---- Step 3: render all cards in sort_order sequence ---- */

      /* Merge live + coming_soon, re-sort so display order matches sort_order */
      var allCategories = liveCategories.concat(comingSoonCategories);
      allCategories.sort(function (a, b) { return a.sort_order - b.sort_order; });

      /* Clear skeletons */
      $grid.empty();

      allCategories.forEach(function (category) {
        var tools = toolsByCategory[category.id] || null;
        var $card = buildCategoryCard(category, tools);
        $grid.append($card);
      });

      /* ---- Step 4: stagger the entrance animation ----
       * Each card's CSS starts at opacity:0 translateY(16px).
       * Adding category-card--visible triggers the CSS transition.
       * We stagger with setTimeout so they fan in one-by-one. */
      $('.category-card').not('.category-card--skeleton').each(function (i) {
        var $card = $(this);
        setTimeout(function () {
          $card.addClass('category-card--visible');
        }, i * 70);   /* 70 ms stagger between cards — visible at 15-card scale */
      });

      /* ---- Step 5: populate trending strip ----
       * Primary source: GET /api/trends/rising (Phase 6 Flask intelligence engine).
       * Calling API.getTrendingRising() never throws — it returns null when Flask
       * is unavailable so we can fall back cleanly to the category data we already
       * fetched.  Both sources produce objects with the same fields (slug, name,
       * trend_score, trend_direction) so renderTrendingStrip() handles both. */
      var risingFromFlask = await API.getTrendingRising(6);

      if (risingFromFlask && risingFromFlask.length > 0) {
        /* Flask returned real trend data — use it directly.
         * renderTrendingStrip will still filter for trend_direction==='rising'
         * and sort by trend_score, which is harmless since Flask already did both. */
        renderTrendingStrip(risingFromFlask);
      } else {
        /* Flask is not running yet (Phase 6 optional), or returned no results.
         * Fall back to deriving rising tools from the already-loaded category data. */
        var allTools = Object.values(toolsByCategory).reduce(function (acc, arr) {
          return acc.concat(arr);
        }, []);
        renderTrendingStrip(allTools);
      }

    } catch (err) {
      console.error('[dashboard] Failed to load dashboard:', err.message);

      /* Show a user-friendly error message inside the grid */
      $grid.html(
        '<div class="error-state" style="grid-column: 1/-1;">' +
          '<p class="error-message">' +
            'Could not load category data. ' +
            'Make sure the backend API is running on ' +
            (window.TECHBOARD_API_URL || 'http://localhost:3000') + '.' +
          '</p>' +
        '</div>'
      );
    }
  }

  /* ============================================================
     CATEGORY CARD BUILDER
     Returns a jQuery object for one complete category card.
     ============================================================ */

  function buildCategoryCard(category, tools) {
    var isComingSoon = (category.data_status === 'coming_soon');

    /* Pick icon: use DB value (future) or fall back to the emoji map */
    var icon = CATEGORY_ICONS[category.slug] || '◆';

    /* Build the tools HTML only for live categories */
    var toolsHtml = '';
    if (!isComingSoon && tools && tools.length > 0) {
      tools.forEach(function (tool) {
        toolsHtml += buildToolItem(tool);
      });
    } else if (!isComingSoon) {
      toolsHtml = '<p class="no-data">No data available</p>';
    }

    /* Only show a trend badge if we have at least one tool to base it on.
     * Use the top tool's (highest usage) trend direction. */
    var trendHtml = '';
    if (tools && tools.length > 0 && tools[0].trend_direction) {
      trendHtml = buildTrendBadge(tools[0].trend_direction);
    }

    /* Assemble card HTML — escaping any user-provided strings to prevent XSS */
    var cardHtml =
      '<article class="category-card' +
        (isComingSoon ? ' category-card--muted' : '') +
        '" data-slug="' + escapeHtml(category.slug) + '"' +
        ' data-status="' + escapeHtml(category.data_status) + '">' +

        '<div class="card-header">' +
          '<span class="category-icon" aria-hidden="true">' + icon + '</span>' +
          '<h3 class="category-name">' + escapeHtml(category.name) + '</h3>' +
        '</div>' +

        '<div class="card-body">' +
          '<div class="tool-list">' + toolsHtml + '</div>' +
        '</div>' +

        '<div class="card-footer">' +
          trendHtml +
          (!isComingSoon
            ? '<a href="category.html?slug=' + encodeURIComponent(category.slug) +
              '" class="card-link">View all →</a>'
            : '') +
        '</div>' +

        /* Coming-soon overlay rendered inside the card for live blurring */
        (isComingSoon
          ? '<div class="coming-soon-overlay">' +
              '<span class="coming-soon-label">Data Coming Soon</span>' +
            '</div>'
          : '') +

      '</article>';

    var $card = $(cardHtml);

    /* ---- jQuery event wiring for live cards ---- */
    if (!isComingSoon) {
      /* Whole card is clickable — navigate to the category detail page.
       * We exclude clicks on the explicit "View all" anchor to avoid double-navigation. */
      $card.on('click', function (e) {
        if (!$(e.target).closest('a').length) {
          window.location.href = 'category.html?slug=' + encodeURIComponent(category.slug);
        }
      });

      /* jQuery hover animation — subtle border pulse */
      $card.on('mouseenter', function () {
        $(this).stop(true).animate({ 'border-spacing': 0 }, 0); /* trigger repaint */
      });
    }

    return $card;
  }

  /* ============================================================
     TOOL ITEM BUILDER
     Builds the HTML for one tool row inside a category card.
     ============================================================ */

  function buildToolItem(tool) {
    var percent = tool.usage_percent ? parseFloat(tool.usage_percent) : 0;
    /* Cap at 100 in case of data anomalies */
    var fillPercent = Math.min(100, Math.max(0, percent));
    var dir = tool.trend_direction || 'stable';

    /* The --fill-width CSS custom property is read by .usage-fill in components.css.
     * Using a CSS variable rather than a direct width attribute keeps the CSS rule
     * responsible for the transition, not inline style. */
    return (
      '<div class="tool-item">' +
        '<div class="tool-meta">' +
          '<span class="tool-name" title="' + escapeHtml(tool.name) + '">' +
            escapeHtml(tool.name) +
          '</span>' +
          '<span class="tool-percent tool-percent--' + dir + '">' +
            percent.toFixed(1) + '%' +
          '</span>' +
        '</div>' +
        '<div class="usage-bar" ' +
             'role="progressbar" ' +
             'aria-valuenow="' + percent.toFixed(1) + '" ' +
             'aria-valuemin="0" aria-valuemax="100" ' +
             'aria-label="' + escapeHtml(tool.name) + ' usage: ' + percent.toFixed(1) + '%">' +
          '<div class="usage-fill usage-fill--' + dir + '" ' +
               'style="--fill-width: ' + fillPercent + '%">' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ============================================================
     TREND BADGE BUILDER
     ============================================================ */

  function buildTrendBadge(direction) {
    /* Map each direction to its display config */
    var config = {
      rising:  { icon: '↑', label: 'Rising',  cls: 'trend-badge--rising'  },
      stable:  { icon: '→', label: 'Stable',  cls: 'trend-badge--stable'  },
      falling: { icon: '↓', label: 'Falling', cls: 'trend-badge--falling' },
    };

    var t = config[direction] || config.stable;
    return (
      '<span class="trend-badge ' + t.cls + '">' +
        t.icon + ' ' + t.label +
      '</span>'
    );
  }

  /* ============================================================
     TRENDING NOW STRIP
     Renders the horizontal "Trending Now" bar at the bottom of the dashboard.

     Accepts either:
       a) Rising tools from Flask (/api/trends/rising) — pre-sorted by trend_score
       b) All category tools (fallback) — will be filtered and sorted here

     Both sources have the same shape: {slug, name, trend_score, trend_direction}
     so the render logic is identical in both cases.
     ============================================================ */

  function renderTrendingStrip(allTools) {
    var $strip = $('#trendingStrip');

    /* Filter to rising tools only, sort by trend_score descending, take top 6 */
    var risingTools = allTools
      .filter(function (t) {
        return t.trend_direction === 'rising' && t.trend_score != null;
      })
      .sort(function (a, b) {
        return parseFloat(b.trend_score) - parseFloat(a.trend_score);
      })
      .slice(0, 6);

    if (risingTools.length === 0) {
      $strip.html(
        '<p class="no-data">' +
          'Trend data will be fully available once the intelligence engine is connected (Phase 6).' +
        '</p>'
      );
      return;
    }

    /* Build chip HTML */
    var html = '';
    risingTools.forEach(function (tool) {
      var score = parseFloat(tool.trend_score).toFixed(1);
      html +=
        '<div class="trending-chip" data-slug="' + escapeHtml(tool.slug) + '">' +
          '<span class="trending-chip-icon">↑</span>' +
          '<span class="trending-chip-name">' + escapeHtml(tool.name) + '</span>' +
          '<span class="trending-chip-score">+' + score + '</span>' +
        '</div>';
    });

    $strip.html(html);

    /* jQuery animation — chips slide in from the left, staggered */
    $strip.find('.trending-chip').each(function (i) {
      var $chip = $(this);
      /* Start hidden and shifted left */
      $chip.css({ opacity: 0, marginLeft: '-8px' });
      /* Delay each chip slightly so they fan in one by one */
      setTimeout(function () {
        $chip.animate({ opacity: 1, marginLeft: '0px' }, 250);
      }, i * 80);
    });

    /* Make chips clickable → navigate to category page if slug is available */
    $strip.find('.trending-chip').on('click', function () {
      var slug = $(this).data('slug');
      if (slug) {
        /* Find the category for this tool by checking the grid cards */
        var $matchingCard = $('.category-card[data-slug]').filter(function () {
          return $(this).find('.tool-name').filter(function () {
            return $(this).text() !== '';
          }).length > 0;
        });
        /* Default: open the tool's category via the grid, or just show a message */
        console.info('[Trending] Chip clicked:', slug);
      }
    });
  }

  /* ============================================================
     UTILITY FUNCTIONS
     ============================================================ */

  /**
   * animateCount — counts up a number from 0 to `target` using jQuery.animate().
   * jQuery's custom animation support lets us tween any numeric property —
   * here we animate a dummy 'count' property and read it in the `step` callback.
   *
   * @param {string} selector — CSS selector for the element to update
   * @param {number} target   — final value to animate to
   */
  function animateCount(selector, target) {
    /* Wrap in an object so jQuery can tween it */
    $({ count: 0 }).animate(
      { count: target },
      {
        duration: 1400,
        easing: 'swing',
        step: function () {
          /* Update the DOM element's text on each animation frame */
          $(selector).text(Math.floor(this.count).toLocaleString());
        },
        complete: function () {
          /* Set the exact final value once the animation ends */
          $(selector).text(Number(target).toLocaleString());
        },
      }
    );
  }

  /**
   * escapeHtml — prevent XSS by converting special characters to HTML entities.
   * Used for all user-controlled or API-sourced strings interpolated into HTML.
   *
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

}(jQuery));
