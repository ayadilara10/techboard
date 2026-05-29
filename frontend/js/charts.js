/**
 * charts.js — TechBoard Chart.js Wrapper
 *
 * Exports a global `TBCharts` object with functions for rendering and
 * updating the usage-over-time line chart on the category detail page.
 *
 * Responsibilities:
 *   - Fetch per-tool usage history from GET /api/stats/usage
 *   - Map the data into Chart.js dataset format
 *   - Render a styled line chart that uses the TechBoard brand palette
 *   - Handle industry filter changes by destroying and re-rendering
 *   - Apply responsive sizing and theme-aware colors
 *
 * Dependencies (must be loaded before this file):
 *   - Chart.js 4.x  (CDN)
 *   - api.js        (API.getUsageHistory)
 *
 * Usage (called from category.js):
 *   await TBCharts.renderUsageChart('usageChart', topTools, 'frontend', null);
 *   TBCharts.destroyChart();  // before re-rendering on filter change
 */

var TBCharts = (function () {
  'use strict';

  /* ============================================================
     BRAND PALETTE
     These colors mirror the CSS custom properties in variables.css.
     Defined here as JS constants so Chart.js can use them — Chart.js
     does not read CSS variables directly.
     ============================================================ */
  var LINE_COLORS = [
    { border: '#2DD4D4', background: 'rgba(45,  212, 212, 0.07)' }, /* --accent-primary  (cyan)  */
    { border: '#C5A572', background: 'rgba(197, 165, 114, 0.07)' }, /* --accent-secondary (gold) */
    { border: '#4A6FA5', background: 'rgba(74,  111, 165, 0.07)' }, /* --color-steel             */
    { border: '#22c55e', background: 'rgba(34,  197,  94, 0.07)' }, /* --color-rising    (green) */
    { border: '#f59e0b', background: 'rgba(245, 158,  11, 0.07)' }, /* --color-stable    (amber) */
  ];

  /* Years present in the seed data — used as the X-axis labels */
  var CHART_YEARS = [2022, 2023, 2024];

  /* How many tools to display on the chart */
  var MAX_CHART_TOOLS = 5;

  /* Holds the active Chart.js instance so we can destroy it before re-rendering */
  var chartInstance = null;

  /* ============================================================
     PUBLIC API
     ============================================================ */

  /**
   * renderUsageChart(canvasId, tools, categorySlug, industry)
   *
   * Fetches usage history for the top MAX_CHART_TOOLS from `tools`,
   * then builds and renders a Chart.js line chart on the given canvas.
   *
   * @param {string}      canvasId      — id of the <canvas> element
   * @param {Array}       tools         — array of tool objects (from API.getTopTools)
   * @param {string}      categorySlug  — used only for context / logging
   * @param {string|null} industry      — current industry slug, or null for global
   * @returns {Promise<void>}
   */
  async function renderUsageChart(canvasId, tools, categorySlug, industry) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn('[TBCharts] Canvas element not found:', canvasId);
      return;
    }

    /* Always destroy the previous instance before drawing a new one.
     * Re-using a canvas without calling destroy() causes Chart.js to
     * complain about a canvas already in use. */
    destroyChart();

    /* Show a loading indicator while we fetch time-series data */
    showChartLoading(canvas);

    /* Take the top N tools from the list (already ranked by usage_percent) */
    var topTools = tools.slice(0, MAX_CHART_TOOLS);

    if (topTools.length === 0) {
      showChartEmpty(canvas, 'No tools available for this selection.');
      return;
    }

    try {
      /* Fetch usage history for all top tools in parallel.
       * Promise.allSettled ensures one failed request doesn't abort the chart. */
      var historyRequests = topTools.map(function (tool) {
        return API.getUsageHistory(tool.slug, CHART_YEARS, industry);
      });
      var historyResults = await Promise.allSettled(historyRequests);

      /* Build Chart.js datasets — one per tool */
      var datasets = [];
      topTools.forEach(function (tool, i) {
        var result = historyResults[i];
        if (result.status !== 'fulfilled') {
          console.warn('[TBCharts] Failed to load history for:', tool.slug);
          return;
        }

        var historyRows = result.value;  /* array of { year, usage_percent, ... } */
        var color       = LINE_COLORS[i % LINE_COLORS.length];

        /* Map each chart year to its usage_percent value.
         * If a year is missing from the data, use null — Chart.js will draw a gap. */
        var dataPoints = CHART_YEARS.map(function (year) {
          var row = historyRows.find(function (r) { return r.year === year; });
          return row ? parseFloat(row.usage_percent) : null;
        });

        datasets.push({
          label:                tool.name,
          data:                 dataPoints,
          borderColor:          color.border,
          backgroundColor:      color.background,
          pointBackgroundColor: color.border,
          pointBorderColor:     color.border,
          pointRadius:          5,
          pointHoverRadius:     7,
          borderWidth:          2.5,
          tension:              0.35,   /* slight curve; 0 = sharp corners, 1 = very smooth */
          fill:                 true,
          spanGaps:             true,   /* connect data points across null gaps */
        });
      });

      if (datasets.length === 0) {
        showChartEmpty(canvas, 'No historical data available.');
        return;
      }

      /* Remove the loading indicator before drawing */
      hideChartLoading(canvas);

      /* Detect current theme so we can colour the axes/grid correctly */
      var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      var gridColor    = isDark ? 'rgba(30, 58, 95, 0.7)'  : 'rgba(209, 217, 230, 0.7)';
      var tickColor    = isDark ? '#6B7FA3'                 : '#6B7FA3';
      var legendColor  = isDark ? '#D1D9E6'                 : '#0A1F33';
      var tooltipBg    = isDark ? '#12253A'                 : '#FFFFFF';
      var tooltipBorder= isDark ? '#1E3A5F'                 : '#D1D9E6';

      /* ---- Build the Chart.js configuration ---- */
      var config = {
        type: 'line',
        data: {
          /* X-axis labels — year strings */
          labels:   CHART_YEARS.map(String),
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,   /* height controlled by the container div */
          interaction: {
            /* Show tooltip for all datasets at the hovered X position */
            mode:       'index',
            intersect:  false,
          },
          plugins: {
            legend: {
              display:  true,
              position: 'bottom',
              labels: {
                color:       legendColor,
                font:        { size: 12, family: "'Inter', system-ui, sans-serif" },
                padding:     16,
                boxWidth:    12,
                boxHeight:   12,
                usePointStyle: true,
                pointStyle: 'circle',
              },
            },
            tooltip: {
              backgroundColor:  tooltipBg,
              borderColor:      tooltipBorder,
              borderWidth:      1,
              titleColor:       legendColor,
              bodyColor:        tickColor,
              padding:          12,
              cornerRadius:     8,
              titleFont:        { weight: '600', family: "'Inter', system-ui, sans-serif" },
              callbacks: {
                /* Append a % sign to each value in the tooltip */
                label: function (ctx) {
                  var val = ctx.parsed.y;
                  return val !== null
                    ? '  ' + ctx.dataset.label + ': ' + val.toFixed(1) + '%'
                    : '  ' + ctx.dataset.label + ': N/A';
                },
              },
            },
          },
          scales: {
            x: {
              grid:   { color: gridColor },
              ticks:  {
                color: tickColor,
                font:  { size: 12, family: "'JetBrains Mono', monospace" },
              },
              border: { color: gridColor },
            },
            y: {
              beginAtZero: false,
              grid:   { color: gridColor },
              ticks:  {
                color: tickColor,
                font:  { size: 12, family: "'JetBrains Mono', monospace" },
                /* Append % to every Y-axis tick label */
                callback: function (value) { return value + '%'; },
                maxTicksLimit: 8,
              },
              border: { color: gridColor },
            },
          },
          animation: {
            /* Animate lines drawing left-to-right on initial render */
            x:        { duration: 900, easing: 'easeOutQuart' },
            y:        { duration: 0   },
          },
        },
      };

      /* Render the chart on the canvas */
      chartInstance = new Chart(canvas, config);

      /* Build the external legend below the column header */
      buildLegend(datasets);

    } catch (err) {
      console.error('[TBCharts] Error rendering chart:', err.message);
      showChartEmpty(canvas, 'Failed to load chart data.');
    }
  }

  /**
   * destroyChart()
   * Destroys the active Chart.js instance and clears the legend.
   * Must be called before rendering a new chart on the same canvas.
   */
  function destroyChart() {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    /* Clear the external legend */
    var legend = document.getElementById('chartLegend');
    if (legend) legend.innerHTML = '';
  }

  /* ============================================================
     PRIVATE HELPERS
     ============================================================ */

  /**
   * showChartLoading — swaps canvas for a loading indicator div.
   * We hide the canvas and show a sibling loading element so Chart.js
   * doesn't try to draw on a zero-size canvas.
   */
  function showChartLoading(canvas) {
    canvas.style.display = 'none';
    var container = canvas.closest('.chart-canvas-container');
    if (!container) return;
    /* Insert a loading div if one doesn't exist yet */
    var existing = container.querySelector('.chart-loading');
    if (!existing) {
      var loader = document.createElement('div');
      loader.className = 'chart-loading';
      loader.innerHTML =
        '<div class="spinner"></div>' +
        '<span>Loading chart data…</span>';
      container.appendChild(loader);
    } else {
      existing.style.display = 'flex';
    }
  }

  /** hideChartLoading — removes loading div and shows the canvas again. */
  function hideChartLoading(canvas) {
    canvas.style.display = 'block';
    var container = canvas.closest('.chart-canvas-container');
    if (!container) return;
    var loader = container.querySelector('.chart-loading');
    if (loader) loader.style.display = 'none';
  }

  /** showChartEmpty — shows a "no data" message instead of the chart. */
  function showChartEmpty(canvas, message) {
    canvas.style.display = 'none';
    var container = canvas.closest('.chart-canvas-container');
    if (!container) return;
    var loader = container.querySelector('.chart-loading');
    if (loader) {
      loader.innerHTML = '<span>' + message + '</span>';
      loader.style.display = 'flex';
    }
  }

  /**
   * buildLegend — renders a colour-coded legend below the chart column header.
   * Chart.js's built-in legend is inside the chart canvas area; this renders
   * an HTML legend in the #chartLegend element for better visual positioning.
   */
  function buildLegend(datasets) {
    var legend = document.getElementById('chartLegend');
    if (!legend) return;

    legend.innerHTML = datasets.map(function (ds) {
      return (
        '<div class="chart-legend-item">' +
          '<span class="chart-legend-dot" style="background:' + ds.borderColor + '"></span>' +
          '<span>' + ds.label + '</span>' +
        '</div>'
      );
    }).join('');
  }

  /* ============================================================
     PUBLIC INTERFACE
     ============================================================ */
  return {
    renderUsageChart: renderUsageChart,
    destroyChart:     destroyChart,
    CHART_YEARS:      CHART_YEARS,    /* exposed so category.js can read available years */
  };

}());
