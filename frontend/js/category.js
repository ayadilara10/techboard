/**
 * category.js — Category Detail Page Controller
 *
 * Controls everything on category.html.
 *
 * Initialisation sequence:
 *   1. Read ?slug= from the URL query string
 *   2. In parallel: fetch the category object + all industries
 *   3. Render the page hero (name, description, badge)
 *   4. Render industry filter chips using jQuery
 *   5. Render the year selector (locked to latest year in free tier)
 *   6. Fetch top tools for the current slug + active industry
 *   7. Render the ranked tool list with usage bars and trend badges
 *   8. Apply the premium gate if userTier is 'free'
 *   9. Render the Chart.js usage-over-time chart (via TBCharts)
 *  10. Wire up the compare modal
 *
 * Premium gate logic (userTier = 'free'):
 *   - Tool list rows 4+ are wrapped in a blurred premium-gate-wrapper
 *   - Industry chips (except "All") show a lock icon and are non-functional
 *   - Year selector is locked to the latest year
 *   - The chart wrapper receives a premium-overlay
 *   - The Compare button is disabled with a lock icon
 *
 * Dependencies (loaded before this file in category.html):
 *   - jQuery 3.7.x  → DOM, events, AJAX, animations
 *   - Chart.js 4.x
 *   - api.js        → API.*
 *   - charts.js     → TBCharts.renderUsageChart()
 *   - theme.js      → theme already applied
 */

(function ($) {
  'use strict';

  /* ============================================================
     PAGE STATE
     All mutable state lives here so functions can share it
     without passing arguments everywhere.
     ============================================================ */

  var categorySlug    = null;   /* read from ?slug= URL param             */
  var currentIndustry = null;   /* null = global; string = industry slug  */
  var currentYear     = 2024;   /* year currently selected in the dropdown */
  var allTools        = [];     /* the current fetched + rendered tool list */
  var selectedSlugs   = [];     /* slugs chosen for comparison (max 3)     */

  /* USER TIER — controls which features are gated.
   * Read from localStorage so admins who logged in via JWT get premium preview.
   * Falls back to 'free' for all unauthenticated visitors. */
  var USER_TIER       = (localStorage.getItem('techboard_tier') === 'premium') ? 'premium' : 'free';
  var FREE_VISIBLE    = 3;       /* tool rows visible without a subscription */

  /* ============================================================
     ENTRY POINT
     ============================================================ */

  /* $(document).ready() fires after the full DOM tree is parsed */
  $(document).ready(function () {
    categorySlug = getUrlParam('slug');

    if (!categorySlug) {
      /* No ?slug= in the URL — show a helpful error and stop */
      showPageError(
        'No category specified. <a href="index.html">← Back to the dashboard</a>.'
      );
      return;
    }

    initPage();
  });

  /* ============================================================
     INITIALISATION
     ============================================================ */

  async function initPage() {
    try {
      /* Fetch the category details and the list of industries in parallel.
       * Both are needed before we can render the hero + filter bar. */
      var results = await Promise.all([
        API.getCategory(categorySlug),
        API.getIndustries(),
      ]);

      var category   = results[0];
      var industries = results[1];

      /* Abort early if this category hasn't been published yet */
      if (category.data_status === 'coming_soon') {
        showComingSoon(category);
        return;
      }

      renderPageHero(category);
      renderIndustryChips(industries);
      renderYearSelector();
      wireCompareModal();

      /* Load tools and chart sequentially:
       * chart depends on the tool list being available */
      await loadTools();
      await renderChart();

    } catch (err) {
      console.error('[category.js] initPage failed:', err.message);
      showPageError(
        'Failed to load category data. ' +
        'Make sure the backend is running, then ' +
        '<a href="index.html">return to the dashboard</a>.'
      );
    }
  }

  /* ============================================================
     PAGE HERO
     ============================================================ */

  function renderPageHero(category) {
    /* Update document title for this category */
    document.title = category.name + ' — TechBoard';

    /* Fill in hero text content using jQuery */
    $('#categoryName').text(category.name).removeClass('page-hero-title--loading');
    $('#categoryDescription').text(category.description || '');

    /* Status badge */
    var badgeHtml = '<span class="badge badge--live">● Live Data</span>';
    $('#categoryBadge').html(badgeHtml);

    /* Compare button — locked in free tier */
    if (USER_TIER === 'free') {
      $('#compareOpenBtn')
        .text('🔒 Compare (Premium)')
        .addClass('is-locked')
        .attr('disabled', true)
        .attr('title', 'Tool comparisons are a Premium feature');
    }
  }

  /* ============================================================
     INDUSTRY FILTER CHIPS
     ============================================================ */

  function renderIndustryChips(industries) {
    var $filter = $('#industryFilter');
    $filter.empty();

    /* "All Industries" chip — always first and always available */
    $filter.append(
      $('<button>')
        .addClass('industry-chip is-active')
        .attr({ 'data-industry': 'all', type: 'button' })
        .text('All Industries')
    );

    /* One chip per industry */
    industries.forEach(function (ind) {
      var $chip = $('<button>')
        .addClass('industry-chip')
        .attr({ 'data-industry': ind.slug, type: 'button' })
        .text(ind.name);

      /* In free tier, all industry-specific chips are locked */
      if (USER_TIER === 'free') {
        $chip.addClass('is-locked').attr('disabled', true);
      }

      $filter.append($chip);
    });

    /* ---- jQuery click delegation ----
     * Delegating to the parent means jQuery only binds one listener
     * instead of one per chip (more efficient, also works for chips
     * added dynamically in the future). */
    $filter.on('click', '.industry-chip', function () {
      var $chip    = $(this);
      var industry = $chip.data('industry');

      /* Reject clicks on locked chips */
      if ($chip.hasClass('is-locked') || $chip.is(':disabled')) {
        showPremiumPrompt('Industry filtering is a Premium feature.');
        return;
      }

      /* Move the active highlight to the clicked chip */
      $filter.find('.industry-chip').removeClass('is-active');
      $chip.addClass('is-active');

      /* Update state — null signals "all industries" / global */
      currentIndustry = (industry === 'all') ? null : industry;

      /* Re-fetch the tool list and redraw the chart for the new industry */
      loadTools().then(renderChart);
    });
  }

  /* ============================================================
     YEAR SELECTOR
     ============================================================ */

  function renderYearSelector() {
    var $sel = $('#yearSelector');
    $sel.empty();

    /* All years in the chart range, newest first */
    TBCharts.CHART_YEARS.slice().reverse().forEach(function (year) {
      var $opt = $('<option>').val(year).text(year);

      /* In free tier, only the latest year (first in the list) is available */
      var isLatest = (year === Math.max.apply(null, TBCharts.CHART_YEARS));
      if (USER_TIER === 'free' && !isLatest) {
        $opt.prop('disabled', true).text(year + ' 🔒');
      }

      $sel.append($opt);
    });

    /* Set the selected option to the current year */
    $sel.val(currentYear);

    /* Wire up change event using jQuery */
    $sel.on('change', function () {
      var selected = parseInt($(this).val(), 10);

      /* Double-check the year is accessible to this tier */
      if (USER_TIER === 'free' && selected !== Math.max.apply(null, TBCharts.CHART_YEARS)) {
        showPremiumPrompt('Full historical data is a Premium feature.');
        $sel.val(currentYear);  /* revert selection */
        return;
      }

      currentYear = selected;
      /* Re-fetch tools for the selected year and redraw chart */
      loadTools().then(renderChart);
    });
  }

  /* ============================================================
     TOOL LIST LOADING & RENDERING
     ============================================================ */

  /**
   * loadTools — fetches the ranked tool list from the API and renders it.
   * Called on page load and every time the industry filter or year changes.
   */
  async function loadTools() {
    var $container = $('#toolListContainer');

    /* Swap in a loading skeleton while the fetch is in-flight */
    $container.html(buildToolSkeleton());

    try {
      /* Fetch up to 20 tools — we gate extras in the UI rather than the API */
      allTools = await API.getTopTools(categorySlug, currentIndustry, 20);

      /* Render the list, applying the premium gate for free-tier users */
      renderToolList(allTools);

      /* Update the tool count displayed in the column header */
      $('#toolCount').text(allTools.length + ' tools');

      /* Re-populate the compare modal picker with the new tool list */
      populateComparePicker(allTools);

    } catch (err) {
      console.error('[category.js] loadTools failed:', err.message);
      $container.html(
        '<p class="error-message">Failed to load tools for this category.</p>'
      );
    }
  }

  /** renderToolList — turns the allTools array into DOM nodes. */
  function renderToolList(tools) {
    var $container = $('#toolListContainer');
    $container.empty();

    if (tools.length === 0) {
      $container.html('<p class="no-data">No tools found for this selection.</p>');
      return;
    }

    if (USER_TIER === 'free' && tools.length > FREE_VISIBLE) {
      /* ---- Free tier: render top N normally, gate the rest ---- */

      /* Visible tools (top FREE_VISIBLE) */
      var visibleTools = tools.slice(0, FREE_VISIBLE);
      visibleTools.forEach(function (tool, i) {
        $container.append(buildToolRow(tool, i + 1));
      });

      /* Gated tools (rows FREE_VISIBLE+1 onwards) wrapped in the premium gate */
      var gatedTools = tools.slice(FREE_VISIBLE);
      var $gate      = $('<div>').addClass('premium-gate-wrapper');
      var $blurred   = $('<div>').addClass('premium-gated-content');

      gatedTools.forEach(function (tool, i) {
        $blurred.append(buildToolRow(tool, FREE_VISIBLE + i + 1));
      });

      /* The overlay that sits above the blurred content */
      var $overlay = $(
        '<div class="premium-overlay">' +
          '<span class="premium-badge">🔒 Premium</span>' +
          '<p class="premium-overlay-title">' + (tools.length - FREE_VISIBLE) + ' more tools available</p>' +
          '<p class="premium-overlay-desc">Upgrade to Premium to see the full ranked list, industry breakdowns, and historical trends.</p>' +
          '<button class="btn btn--primary btn--sm" id="premiumCTA">Unlock Premium</button>' +
        '</div>'
      );

      $gate.append($blurred).append($overlay);
      $container.append($gate);

      /* Wire up the CTA button — for now just shows an alert */
      $('#premiumCTA').on('click', function () {
        alert('Payment integration coming soon! Set USER_TIER = \'premium\' in category.js to preview.');
      });

    } else {
      /* ---- Premium tier: render all tools ---- */
      tools.forEach(function (tool, i) {
        $container.append(buildToolRow(tool, i + 1));
      });
    }

    /* Animate usage bars: start at 0%, then transition to actual width.
     * We use two requestAnimationFrame calls to guarantee the initial
     * 0% state is painted before we apply the target width. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.querySelectorAll('.usage-fill[data-target-width]').forEach(function (el) {
          el.style.setProperty('--fill-width', el.dataset.targetWidth);
        });
      });
    });
  }

  /**
   * buildToolRow — builds the jQuery element for a single tool row.
   *
   * @param {object} tool  — tool object from the API
   * @param {number} rank  — 1-based rank position
   * @returns {jQuery}
   */
  function buildToolRow(tool, rank) {
    var percent    = tool.usage_percent ? parseFloat(tool.usage_percent) : 0;
    var fillPct    = Math.min(100, Math.max(0, percent));
    var dir        = tool.trend_direction || 'stable';
    var trendHtml  = buildTrendBadge(dir);

    var $row = $(
      '<div class="tool-row" data-tool-slug="' + escapeHtml(tool.slug) + '">' +

        '<span class="tool-rank">#' + rank + '</span>' +

        '<div class="tool-info">' +
          '<div class="tool-row-header">' +
            '<span class="tool-row-name">' + escapeHtml(tool.name) + '</span>' +
            trendHtml +
          '</div>' +
          '<p class="tool-row-desc">' + escapeHtml(tool.description || '') + '</p>' +
          '<div class="usage-bar" ' +
               'role="progressbar" ' +
               'aria-valuenow="' + percent.toFixed(1) + '" ' +
               'aria-valuemin="0" aria-valuemax="100">' +
            /* data-target-width is read by the animation code in renderToolList */
            '<div class="usage-fill usage-fill--' + dir + '" ' +
                 'data-target-width="' + fillPct + '%" ' +
                 'style="--fill-width: 0%">' +
            '</div>' +
          '</div>' +
          /* Compare checkbox — only shown in premium tier */
          (USER_TIER === 'premium'
            ? '<div class="tool-compare-row">' +
                '<input type="checkbox" class="compare-check" ' +
                       'id="cmp-' + escapeHtml(tool.slug) + '" ' +
                       'data-tool-slug="' + escapeHtml(tool.slug) + '" ' +
                       'data-tool-name="' + escapeHtml(tool.name) + '">' +
                '<label class="compare-check-label" for="cmp-' + escapeHtml(tool.slug) + '">Select for comparison</label>' +
              '</div>'
            : '') +
        '</div>' +

        '<div class="tool-stat">' +
          '<div class="tool-stat-percent tool-percent--' + dir + '">' +
            percent.toFixed(1) + '%' +
          '</div>' +
          '<div class="tool-stat-label">usage ' + (tool.stat_year || currentYear) + '</div>' +
        '</div>' +

      '</div>'
    );

    /* Wire up compare checkboxes with jQuery change events */
    if (USER_TIER === 'premium') {
      $row.find('.compare-check').on('change', function () {
        handleCompareCheckChange($(this));
      });
    }

    return $row;
  }

  /** buildTrendBadge — returns the HTML string for a trend direction badge. */
  function buildTrendBadge(direction) {
    var map = {
      rising:  { icon: '↑', label: 'Rising',  cls: 'trend-badge--rising'  },
      stable:  { icon: '→', label: 'Stable',  cls: 'trend-badge--stable'  },
      falling: { icon: '↓', label: 'Falling', cls: 'trend-badge--falling' },
    };
    var t = map[direction] || map.stable;
    return '<span class="trend-badge ' + t.cls + '">' + t.icon + ' ' + t.label + '</span>';
  }

  /** buildToolSkeleton — returns HTML for the loading skeleton shown during fetch. */
  function buildToolSkeleton() {
    var html = '';
    for (var i = 0; i < 6; i++) {
      html +=
        '<div class="tool-row" style="pointer-events:none">' +
          '<div class="skeleton" style="width:28px;height:16px;border-radius:4px"></div>' +
          '<div class="tool-info">' +
            '<div class="skeleton skeleton--title" style="width:50%;height:14px;margin-bottom:8px"></div>' +
            '<div class="skeleton" style="width:90%;height:8px;border-radius:999px"></div>' +
          '</div>' +
          '<div class="skeleton" style="width:48px;height:24px;border-radius:4px"></div>' +
        '</div>';
    }
    return html;
  }

  /* ============================================================
     CHART
     ============================================================ */

  /**
   * renderChart — applies the premium gate then calls TBCharts.
   * The chart is always rendered (even in free tier) so the canvas
   * has real data; the CSS overlay just visually obscures it.
   */
  async function renderChart() {
    /* Remove any existing premium overlay before re-rendering */
    $('#chartWrapper .premium-overlay').remove();
    $('#chartWrapper').removeClass('premium-gate-wrapper');

    /* Render the chart with the current state */
    await TBCharts.renderUsageChart('usageChart', allTools, categorySlug, currentIndustry);

    /* Apply the premium gate overlay on top of the chart in free tier */
    if (USER_TIER === 'free') {
      $('#chartWrapper').addClass('premium-gate-wrapper');
      var $overlay = $(
        '<div class="premium-overlay">' +
          '<span class="premium-badge">🔒 Premium</span>' +
          '<p class="premium-overlay-title">Full historical chart</p>' +
          '<p class="premium-overlay-desc">See 5 years of usage trends across industries. Available in Premium.</p>' +
          '<button class="btn btn--primary btn--sm" id="chartPremiumCTA">Unlock Premium</button>' +
        '</div>'
      );
      $('#chartWrapper').append($overlay);

      $('#chartPremiumCTA').on('click', function () {
        alert('Payment integration coming soon! Set USER_TIER = \'premium\' in category.js to preview.');
      });
    }
  }

  /* ============================================================
     COMPARE MODAL
     ============================================================ */

  function wireCompareModal() {
    /* ---- Open the modal ---- */
    $('#compareOpenBtn').on('click', function () {
      if (USER_TIER === 'free') {
        showPremiumPrompt('Tool comparisons are a Premium feature.');
        return;
      }
      openModal();
    });

    /* ---- Close via × button ---- */
    $('#modalClose').on('click', closeModal);

    /* ---- Close via Cancel button ---- */
    $('#compareCancelBtn').on('click', closeModal);

    /* ---- Close when clicking outside the modal content ---- */
    $('#compareModal').on('click', function (e) {
      /* Only close if the click was directly on the backdrop, not the modal box */
      if ($(e.target).is('#compareModal')) {
        closeModal();
      }
    });

    /* ---- Close on Escape key ---- */
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && !$('#compareModal').attr('hidden')) {
        closeModal();
      }
    });

    /* ---- "Compare Selected" button ---- */
    $('#compareRunBtn').on('click', function () {
      if (selectedSlugs.length < 2) {
        alert('Please select at least 2 tools to compare.');
        return;
      }
      renderCompareResults();
    });
  }

  function openModal() {
    selectedSlugs = [];
    $('#compareResults').removeClass('is-visible').empty();
    $('#compareRunBtn').prop('disabled', true);
    $('#compareModal').removeAttr('hidden');
    /* Trap focus inside modal for accessibility */
    $('#modalClose').trigger('focus');
    /* Prevent body from scrolling behind the backdrop */
    $('body').css('overflow', 'hidden');
  }

  function closeModal() {
    $('#compareModal').attr('hidden', true);
    $('body').css('overflow', '');
  }

  /**
   * populateComparePicker — rebuilds the tool selection list inside the modal.
   * Called every time the tool list changes (industry or year filter change).
   */
  function populateComparePicker(tools) {
    var $picker = $('#compareToolPicker');
    $picker.empty();
    selectedSlugs = [];
    $('#compareRunBtn').prop('disabled', true);

    tools.forEach(function (tool) {
      var percent = tool.usage_percent ? parseFloat(tool.usage_percent).toFixed(1) + '%' : '—';

      var $item = $(
        '<div class="compare-picker-item" data-tool-slug="' + escapeHtml(tool.slug) + '">' +
          '<input type="checkbox" class="compare-picker-check" ' +
                 'id="pick-' + escapeHtml(tool.slug) + '" ' +
                 'value="' + escapeHtml(tool.slug) + '">' +
          '<label class="compare-picker-name" for="pick-' + escapeHtml(tool.slug) + '">' +
            escapeHtml(tool.name) +
          '</label>' +
          '<span class="compare-picker-stat">' + percent + '</span>' +
        '</div>'
      );

      /* jQuery click on the whole row toggles the checkbox */
      $item.on('click', function (e) {
        var $check = $item.find('.compare-picker-check');
        /* If the click was directly on the checkbox, let it toggle naturally */
        if (!$(e.target).is('.compare-picker-check')) {
          $check.prop('checked', !$check.prop('checked'));
        }
        handlePickerCheckChange($item, $check);
      });

      /* Also handle direct checkbox interaction */
      $item.find('.compare-picker-check').on('change', function () {
        handlePickerCheckChange($item, $(this));
      });

      $picker.append($item);
    });
  }

  /** handlePickerCheckChange — maintains selectedSlugs, enforces max-3 rule. */
  function handlePickerCheckChange($item, $check) {
    var slug    = $item.data('tool-slug');
    var checked = $check.prop('checked');

    if (checked) {
      if (selectedSlugs.length >= 3) {
        /* Prevent selecting a 4th tool */
        $check.prop('checked', false);
        alert('You can compare at most 3 tools at once.');
        return;
      }
      selectedSlugs.push(slug);
      $item.addClass('is-selected');
    } else {
      selectedSlugs = selectedSlugs.filter(function (s) { return s !== slug; });
      $item.removeClass('is-selected');
    }

    /* Disable unchosen items when 3 are already selected */
    $('#compareToolPicker .compare-picker-item').each(function () {
      var $i = $(this);
      var thisSlag = $i.data('tool-slug');
      var alreadyChosen = selectedSlugs.indexOf(thisSlag) !== -1;
      var disable = (selectedSlugs.length >= 3 && !alreadyChosen);
      $i.toggleClass('is-disabled', disable);
      $i.find('.compare-picker-check').prop('disabled', disable);
    });

    /* Enable the Compare button only when 2 or 3 tools are selected */
    $('#compareRunBtn').prop('disabled', selectedSlugs.length < 2);
  }

  /** handleCompareCheckChange — handler for the inline checkbox in tool rows (premium). */
  function handleCompareCheckChange($check) {
    var slug    = $check.data('tool-slug');
    var checked = $check.prop('checked');

    if (checked) {
      if (selectedSlugs.length >= 3) {
        $check.prop('checked', false);
        alert('You can compare at most 3 tools. Deselect one first.');
        return;
      }
      selectedSlugs.push(slug);
    } else {
      selectedSlugs = selectedSlugs.filter(function (s) { return s !== slug; });
    }
  }

  /**
   * renderCompareResults — builds a comparison table from the selected tools.
   * Uses data already in allTools (no extra API call).
   */
  function renderCompareResults() {
    /* Fetch full objects for each selected slug */
    var selectedTools = allTools.filter(function (t) {
      return selectedSlugs.indexOf(t.slug) !== -1;
    });

    if (selectedTools.length < 2) return;

    /* Build the comparison table HTML */
    var colHeaders = selectedTools.map(function (t) {
      return '<th class="compare-tool-header">' + escapeHtml(t.name) + '</th>';
    }).join('');

    /* Helper: render a cell value, fall back to "—" */
    function cell(val) {
      return '<td>' + (val !== null && val !== undefined ? val : '—') + '</td>';
    }

    var rows = [
      /* Row: usage percent */
      '<tr><td>Usage ' + (selectedTools[0].stat_year || currentYear) + '</td>' +
        selectedTools.map(function (t) {
          return cell(t.usage_percent ? parseFloat(t.usage_percent).toFixed(1) + '%' : null);
        }).join('') +
      '</tr>',

      /* Row: trend direction */
      '<tr><td>Trend</td>' +
        selectedTools.map(function (t) { return cell(buildTrendBadge(t.trend_direction)); }).join('') +
      '</tr>',

      /* Row: trend score */
      '<tr><td>Trend Score</td>' +
        selectedTools.map(function (t) {
          return cell(t.trend_score ? parseFloat(t.trend_score).toFixed(2) : null);
        }).join('') +
      '</tr>',

      /* Row: developer satisfaction */
      '<tr><td>Satisfaction</td>' +
        selectedTools.map(function (t) {
          return cell(t.satisfaction ? parseFloat(t.satisfaction).toFixed(1) + ' / 5' : null);
        }).join('') +
      '</tr>',

      /* Row: data source */
      '<tr><td>Source</td>' +
        selectedTools.map(function (t) { return cell(t.source || null); }).join('') +
      '</tr>',
    ].join('');

    var tableHtml =
      '<table class="compare-table">' +
        '<thead><tr><th>Metric</th>' + colHeaders + '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>';

    $('#compareResults').html(tableHtml).addClass('is-visible');

    /* Scroll the modal body to show the results */
    var $body = $('.modal-body');
    $body.animate({ scrollTop: $body[0].scrollHeight }, 300);
  }

  /* ============================================================
     UTILITY FUNCTIONS
     ============================================================ */

  /**
   * getUrlParam — reads a single named parameter from the current URL.
   *
   * @param {string} name — parameter name (e.g. 'slug')
   * @returns {string|null}
   */
  function getUrlParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * escapeHtml — prevent XSS when interpolating API data into HTML strings.
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

  /**
   * showPremiumPrompt — jQuery-animated inline notice that a feature requires Premium.
   * The message fades in below the filter bar and auto-dismisses after 3 seconds.
   *
   * @param {string} message
   */
  function showPremiumPrompt(message) {
    /* Reuse an existing prompt if present, otherwise create one */
    var $existing = $('#premiumPrompt');
    var $prompt   = $existing.length ? $existing : $('<div id="premiumPrompt">');

    $prompt
      .addClass('premium-prompt')
      .html('🔒 ' + message + ' <a href="#" id="premiumPromptDismiss">Dismiss</a>')
      .css({ display: 'none', opacity: 0 });

    if (!$existing.length) {
      $('.filters-bar .container').append($prompt);
    }

    /* jQuery fadeIn animation */
    $prompt.stop(true).fadeIn(200);

    /* Auto-dismiss after 3 seconds */
    var timer = setTimeout(function () {
      $prompt.fadeOut(300);
    }, 3000);

    /* Allow manual dismissal */
    $prompt.find('#premiumPromptDismiss').off('click').on('click', function (e) {
      e.preventDefault();
      clearTimeout(timer);
      $prompt.fadeOut(300);
    });
  }

  /** showPageError — replaces the main content area with an error message. */
  function showPageError(html) {
    $('main').html(
      '<div class="container" style="padding: 4rem 0;">' +
        '<div class="error-state">' +
          '<p class="error-message">' + html + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  /** showComingSoon — shown when a coming_soon category is accessed directly. */
  function showComingSoon(category) {
    $('#categoryName').text(category.name).removeClass('page-hero-title--loading');
    $('#categoryDescription').text('Data collection in progress.');
    $('#categoryBadge').html('<span class="badge badge--soon">Coming Soon</span>');

    $('#toolListContainer').html(
      '<div class="empty-state">' +
        '<p class="no-data">Data for this category hasn\'t been published yet. Check back soon!</p>' +
        '<a href="index.html" class="btn btn--ghost" style="margin-top:1rem">← Back to Dashboard</a>' +
      '</div>'
    );

    /* Hide the chart column entirely — no point showing a blank chart */
    $('.chart-column').hide();
  }

}(jQuery));
