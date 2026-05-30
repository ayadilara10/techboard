/**
 * stack-builder.js — TechBoard Tech Stack Builder Logic
 *
 * Drives the three-step wizard on stack-builder.html:
 *   Step 1 — User selects an industry from available profiles
 *   Step 2 — User selects a product type within that industry
 *   Step 3 — Full recommended stack is fetched and displayed
 *
 * The "Export as XML" button generates a well-formed XML document
 * client-side from the fetched stack data and triggers a file download.
 *
 * Depends on jQuery (for DOM manipulation and AJAX via API.ajaxGet)
 * and api.js (for API.getStackRecommendation and API.ajaxGet).
 */

(function ($) {
  'use strict';

  /* ============================================================
     MODULE STATE
     All mutable state lives here so functions stay pure-ish.
     ============================================================ */

  /** @type {{ step: number, profiles: Array, selectedIndustry: Object|null, selectedType: Object|null, stack: Object|null }} */
  var state = {
    step:             1,
    profiles:         [],    /* API response: array of { industry_slug, industry_name, product_types[] } */
    selectedIndustry: null,  /* One element from profiles[] */
    selectedType:     null,  /* One element from selectedIndustry.product_types[] */
    stack:            null,  /* Full API response from /api/stack-builder */
  };

  /* ============================================================
     INDUSTRY ICONS
     Simple emoji mapping keyed by industry slug — no external assets needed.
     ============================================================ */
  var INDUSTRY_ICONS = {
    fintech:      '🏦',
    saas:         '☁️',
    ecommerce:    '🛍️',
    healthcare:   '🏥',
    media:        '🎬',
    education:    '🎓',
    government:   '🏛️',
    logistics:    '🚚',
    construction: '🏗️',
    finance:      '💰',
  };

  /* ============================================================
     INITIALISATION
     ============================================================ */

  /**
   * Entry point — called once the DOM is ready.
   * Loads the available stack profiles from the API, then renders Step 1.
   */
  $(document).ready(function () {
    /* Wire up navigation buttons that are always in the DOM */
    $('#backToStep1').on('click', function () { goToStep(1); });
    $('#backToStep2, #backToStep2b').on('click', function () { goToStep(2); });
    $('#startOverBtn').on('click',  function () { goToStep(1); });
    $('#exportXmlBtn').on('click',  exportStackXml);

    /* Fetch profiles; render Step 1 when ready */
    loadProfiles();
  });

  /* ============================================================
     DATA LOADING
     ============================================================ */

  /**
   * loadProfiles() — GET /api/stack-builder (list mode, no params).
   *
   * Populates state.profiles with the grouped industry → product_types
   * structure returned by the API, then renders the industry grid.
   */
  function loadProfiles() {
    /* Show skeleton loading cards while waiting */
    renderSkeletons('#industryGrid', 3);

    /* jQuery AJAX via API central client */
    API.ajaxGet('/api/stack-builder')
      .then(function (response) {
        state.profiles = response.data || [];

        if (state.profiles.length === 0) {
          /* No profiles in the database yet */
          showGridError('#industryGrid', 'No stack profiles available yet.');
          return;
        }

        renderIndustryStep();
      })
      .catch(function (err) {
        showGridError('#industryGrid', 'Could not load industries: ' + err.message);
      });
  }

  /**
   * loadStack() — GET /api/stack-builder?industry=…&type=…
   *
   * Fetches the full tool list for the selected industry + product type.
   * Shows the loading spinner on Step 3, then renders the result.
   */
  function loadStack() {
    /* Hide result/error; show loading */
    $('#stackResult').prop('hidden', true);
    $('#stackError').prop('hidden', true);
    $('#stackLoading').show();
    $('#step3BackRow').show();

    API.getStackRecommendation(
      state.selectedIndustry.industry_slug,
      state.selectedType.product_type
    )
      .then(function (stack) {
        state.stack = stack;
        renderStackResult();
      })
      .catch(function (err) {
        $('#stackLoading').hide();
        $('#stackErrorMessage').text(err.message || 'An unexpected error occurred.');
        $('#stackError').prop('hidden', false);
      });
  }

  /* ============================================================
     STEP 1 — INDUSTRY SELECTION
     ============================================================ */

  /**
   * renderIndustryStep() — Builds the industry selection grid.
   *
   * One selectable card per industry that has at least one published profile.
   * jQuery click handler on each card advances to Step 2.
   */
  function renderIndustryStep() {
    var $grid = $('#industryGrid').empty().removeAttr('aria-busy');

    /* Build one card per industry group */
    $.each(state.profiles, function (i, industryGroup) {
      var icon  = INDUSTRY_ICONS[industryGroup.industry_slug] || '🏢';
      var count = industryGroup.product_types.length;
      var label = count === 1 ? '1 profile available' : count + ' profiles available';

      /* Build the card element using jQuery DOM construction */
      var $card = $('<article>', {
        'class':       'builder-card',
        'role':        'listitem',
        'tabindex':    '0',
        'aria-label':  industryGroup.industry_name,
      });

      $card.append(
        $('<div>', { 'class': 'builder-card-icon', 'aria-hidden': 'true' }).text(icon),
        $('<h3',   { 'class': 'builder-card-name' }).text(industryGroup.industry_name),
        $('<p>',   { 'class': 'builder-card-meta' }).text(label)
      );

      /* Click — advance to Step 2 */
      $card.on('click', function () {
        state.selectedIndustry = industryGroup;
        renderProductTypeStep();
      });

      /* Keyboard — Space / Enter also select */
      $card.on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          $card.trigger('click');
        }
      });

      $grid.append($card);
    });
  }

  /* ============================================================
     STEP 2 — PRODUCT TYPE SELECTION
     ============================================================ */

  /**
   * renderProductTypeStep() — Builds the product type grid for the chosen industry.
   *
   * The breadcrumb is updated to show the selected industry name.
   * One card per product_type; clicking advances to Step 3 and fetches the stack.
   */
  function renderProductTypeStep() {
    /* Update breadcrumb */
    $('#crumbIndustryName').text(state.selectedIndustry.industry_name);

    var $grid = $('#productTypeGrid').empty();

    $.each(state.selectedIndustry.product_types, function (i, pt) {
      var $card = $('<article>', {
        'class':      'builder-card',
        'role':       'listitem',
        'tabindex':   '0',
        'aria-label': pt.product_type,
      });

      $card.append(
        $('<h3>', { 'class': 'builder-card-name' }).text(pt.product_type),
        $('<p>',  { 'class': 'builder-card-meta' }).text(pt.description || '')
      );

      $card.on('click', function () {
        state.selectedType = pt;
        goToStep(3);
        loadStack();
      });

      $card.on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          $card.trigger('click');
        }
      });

      $grid.append($card);
    });

    goToStep(2);
  }

  /* ============================================================
     STEP 3 — STACK RESULT
     ============================================================ */

  /**
   * renderStackResult() — Builds the full tool card grid from state.stack.
   *
   * Each tool gets a card showing: category label, tool name, description,
   * rationale (why it was chosen for this stack), and a link to the category page.
   */
  function renderStackResult() {
    /* Hide loading */
    $('#stackLoading').hide();
    $('#step3BackRow').hide();

    var stack = state.stack;

    /* Set breadcrumb and heading */
    $('#crumb2Industry').text(state.selectedIndustry.industry_name);
    $('#crumb2Type').text(state.selectedType.product_type);
    $('#stackTitle').text(stack.profile.product_type + ' Stack');
    $('#stackDescription').text(stack.profile.description || '');

    /* ---- "Why this stack?" explanation ---- */
    $('#stackWhyExplainer').remove();
    var industryName = state.selectedIndustry.industry_name;
    var productType  = state.selectedType.product_type;
    var rationaleList = stack.tools
      .filter(function (t) { return t.rationale; })
      .map(function (t)    { return t.category_name + ': ' + t.rationale; });

    var whyHtml =
      '<div id="stackWhyExplainer" class="stack-why-box">' +
        '<h3 class="stack-why-title">Why this stack?</h3>' +
        '<p class="stack-why-intro">This recommendation is optimised for ' +
          escapeHtml(productType) + ' in the ' + escapeHtml(industryName) +
          ' industry, based on real adoption data from 65,000+ developers.' +
          (stack.profile.description ? ' ' + escapeHtml(stack.profile.description) : '') +
        '</p>' +
      '</div>';

    $('#stackTitle').after(whyHtml);

    /* ---- Summary table (category | tool | rationale) ---- */
    $('#stackSummaryTable').remove();
    var tableRows = stack.tools.map(function (tool) {
      return '<tr>' +
        '<td class="stack-table-category">' + escapeHtml(tool.category_name) + '</td>' +
        '<td class="stack-table-tool"><strong>' + escapeHtml(tool.tool_name) + '</strong></td>' +
        '<td class="stack-table-rationale">' + escapeHtml(tool.rationale || '—') + '</td>' +
        '</tr>';
    }).join('');

    var tableHtml =
      '<div id="stackSummaryTable" class="stack-summary-table-wrap">' +
        '<table class="stack-summary-table">' +
          '<thead><tr>' +
            '<th>Category</th><th>Recommended Tool</th><th>Why</th>' +
          '</tr></thead>' +
          '<tbody>' + tableRows + '</tbody>' +
        '</table>' +
      '</div>';

    $('#stackWhyExplainer').after(tableHtml);

    /* Build tool cards */
    var $grid = $('#stackGrid').empty();

    $.each(stack.tools, function (i, tool) {
      var $card = buildToolCard(tool);
      $grid.append($card);
    });

    /* Reveal result section */
    $('#stackResult').prop('hidden', false);
  }

  /**
   * buildToolCard(tool) — Creates a jQuery element for one tool in the stack result.
   *
   * @param {object} tool — row from stack.tools[] with tool_name, category_name, rationale, etc.
   * @returns {jQuery} — the complete <article> element
   */
  function buildToolCard(tool) {
    var $card = $('<article>', {
      'class': 'stack-tool-card',
      'role':  'listitem',
    });

    /* Category label */
    $card.append(
      $('<p>', { 'class': 'stack-tool-card-category' }).text(tool.category_name)
    );

    /* Tool name */
    $card.append(
      $('<h3>', { 'class': 'stack-tool-card-name' }).text(tool.tool_name)
    );

    /* Tool description */
    if (tool.tool_description) {
      $card.append(
        $('<p>', { 'class': 'stack-tool-card-description' }).text(tool.tool_description)
      );
    }

    /* Rationale — why this tool was chosen for this stack */
    if (tool.rationale) {
      $card.append(
        $('<div>', { 'class': 'stack-tool-card-rationale' }).text(tool.rationale)
      );
    }

    /* Footer: open-source badge + link */
    var $footer = $('<div>', { 'class': 'stack-tool-card-footer' });

    /* Open-source vs proprietary badge */
    var badgeClass  = tool.open_source ? 'stack-tool-badge--open-source' : 'stack-tool-badge--proprietary';
    var badgeText   = tool.open_source ? 'Open Source' : 'Proprietary';
    $footer.append(
      $('<span>', { 'class': 'stack-tool-badge ' + badgeClass }).text(badgeText)
    );

    /* Link to category detail page */
    $footer.append(
      $('<a>', {
        'class':  'stack-tool-card-link',
        'href':   'category.html?slug=' + encodeURIComponent(tool.category_slug),
        'aria-label': 'View ' + tool.category_name + ' category',
      }).text('View category →')
    );

    $card.append($footer);
    return $card;
  }

  /* ============================================================
     XML EXPORT
     ============================================================ */

  /**
   * exportStackXml() — Generates a well-formed XML document from state.stack
   * and triggers a browser file download.
   *
   * The XML structure mirrors the /api/export/xml format for consistency,
   * scoped to only the tools in this stack recommendation.
   */
  function exportStackXml() {
    if (!state.stack) { return; }

    var stack = state.stack;

    /* Escape special XML characters in a string */
    function esc(str) {
      if (!str && str !== 0) { return ''; }
      return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&apos;');
    }

    /* Build tool nodes */
    var toolNodes = stack.tools.map(function (tool) {
      return [
        '    <tool>',
        '      <slug>'         + esc(tool.tool_slug)         + '</slug>',
        '      <name>'         + esc(tool.tool_name)         + '</name>',
        '      <category>'     + esc(tool.category_name)     + '</category>',
        '      <category_slug>'+ esc(tool.category_slug)     + '</category_slug>',
        '      <description>'  + esc(tool.tool_description)  + '</description>',
        '      <website>'      + esc(tool.website_url)       + '</website>',
        '      <open_source>'  + (tool.open_source ? 'true' : 'false') + '</open_source>',
        '      <rationale>'    + esc(tool.rationale)         + '</rationale>',
        '      <primary>'      + (tool.is_primary ? 'true' : 'false') + '</primary>',
        '    </tool>',
      ].join('\n');
    }).join('\n');

    /* Assemble the full document */
    var isoDate = new Date().toISOString();
    var xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!-- TechBoard Stack Recommendation Export — ' + isoDate + ' -->',
      '<stack_recommendation>',
      '  <generated_at>' + isoDate + '</generated_at>',
      '  <source>TechBoard Intelligence Platform</source>',
      '  <profile>',
      '    <industry_slug>' + esc(stack.profile.industry_slug) + '</industry_slug>',
      '    <industry_name>' + esc(stack.profile.industry_name) + '</industry_name>',
      '    <product_type>'  + esc(stack.profile.product_type)  + '</product_type>',
      '    <description>'   + esc(stack.profile.description)   + '</description>',
      '  </profile>',
      '  <tools count="' + stack.tools.length + '">',
      toolNodes,
      '  </tools>',
      '</stack_recommendation>',
    ].join('\n');

    /* Trigger download via a temporary <a> element */
    var filename = 'techboard-stack-'
      + esc(stack.profile.industry_slug).toLowerCase()
      + '-'
      + stack.profile.product_type.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      + '.xml';

    var blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var $a   = $('<a>', { href: url, download: filename }).appendTo('body');
    $a[0].click();
    $a.remove();

    /* Blob URL is no longer needed once the download starts */
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  /* ============================================================
     STEP NAVIGATION
     ============================================================ */

  /**
   * goToStep(n) — Shows the correct panel and updates the step indicator.
   *
   * @param {number} n — 1, 2, or 3
   */
  function goToStep(n) {
    state.step = n;

    /* Show the correct panel, hide the others */
    ['#panelStep1', '#panelStep2', '#panelStep3'].forEach(function (sel, i) {
      var isActive = (i + 1 === n);
      $(sel).toggleClass('is-active', isActive).prop('hidden', !isActive);
    });

    /* Update step indicator classes */
    [1, 2, 3].forEach(function (i) {
      var $item = $('#stepIndicator' + i);
      $item
        .toggleClass('is-active', i === n)
        .toggleClass('is-done',   i < n)
        .attr('aria-selected', i === n ? 'true' : 'false');
    });

    /* Scroll smoothly to the wizard top so the user sees the step change */
    $('html, body').animate(
      { scrollTop: $('.builder-wizard').offset().top - 80 },
      300
    );
  }

  /* ============================================================
     HELPER UTILITIES
     ============================================================ */

  /**
   * renderSkeletons($selector, count) — inserts placeholder skeleton cards.
   *
   * Gives users immediate visual feedback that content is loading,
   * matching the width of real cards.
   *
   * @param {string} selector — jQuery selector for the container
   * @param {number} count    — number of skeleton cards to render
   */
  function renderSkeletons(selector, count) {
    var $grid = $(selector).empty().attr('aria-busy', 'true');
    for (var i = 0; i < count; i++) {
      $grid.append(
        $('<article>', { 'class': 'builder-card skeleton-card', 'aria-hidden': 'true' }).append(
          $('<div>', { 'class': 'skeleton-line',  style: 'height:24px; width:60%; margin-bottom:8px' }),
          $('<div>', { 'class': 'skeleton-line',  style: 'height:14px; width:40%' })
        )
      );
    }
  }

  /**
   * showGridError(selector, message) — replaces the grid with an error message.
   *
   * @param {string} selector — jQuery selector for the grid container
   * @param {string} message  — human-readable error text
   */
  function showGridError(selector, message) {
    $(selector).empty().removeAttr('aria-busy').append(
      $('<div>', { 'class': 'builder-error' }).append(
        $('<h3>').text('Error'),
        $('<p>').text(message)
      )
    );
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

}(jQuery));
