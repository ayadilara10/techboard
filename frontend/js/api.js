/**
 * api.js — TechBoard Central API Client
 *
 * Single source of truth for every HTTP call made by the frontend.
 * Exports a global `API` object with named methods for each endpoint.
 *
 * Two request strategies are used (course requirement):
 *   - Native fetch()   — for GET /stats, /industries, /tools/:slug, /stats/usage
 *   - jQuery $.ajax()  — for GET /categories, /stats/top (demonstrates jQuery AJAX)
 *
 * All public methods return Promises, so callers can use async/await or .then()/.catch().
 *
 * Configuration:
 *   Set window.TECHBOARD_API_URL in a <script> block before this file loads.
 *   Default: 'http://localhost:3000' (local dev without Docker)
 *   For Docker / nginx proxy: set to '' (empty string → same-origin /api/...)
 */

/* The API client is wrapped in an IIFE that receives jQuery as '$'.
 * This avoids polluting the global scope and makes the jQuery dependency explicit.
 * jQuery must be loaded in the page BEFORE this script. */
var API = (function ($) {
  'use strict';

  /* ---- Base URL ----
   * Read from window config, fall back to localhost:3000 for local development.
   * In production (Docker + nginx), window.TECHBOARD_API_URL should be '' so
   * requests go to the same origin and nginx proxies /api/* to the Node backend. */
  var BASE_URL = (typeof window.TECHBOARD_API_URL !== 'undefined')
    ? window.TECHBOARD_API_URL
    : 'http://localhost:3000';

  /* ============================================================
     CORE REQUEST FUNCTIONS
     ============================================================ */

  /**
   * get() — native fetch wrapper.
   *
   * Builds a URL with query params, calls fetch(), checks for HTTP errors,
   * and returns the parsed JSON body.
   *
   * @param {string} path    — API path, e.g. '/api/stats/global'
   * @param {object} params  — key/value pairs appended as query string
   * @returns {Promise<any>} — resolves with parsed JSON
   * @throws  {Error}        — on non-2xx status or network failure
   */
  async function get(path, params) {
    /* Build the full URL, appending any params as a query string */
    var url = new URL(BASE_URL + path, window.location.href);

    if (params) {
      Object.keys(params).forEach(function (key) {
        /* Skip null / undefined values so callers don't need to guard them */
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.set(key, params[key]);
        }
      });
    }

    var response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    /* fetch() only rejects on network failure, not HTTP errors, so we
     * check response.ok and throw manually for 4xx/5xx responses. */
    if (!response.ok) {
      var errBody = {};
      try { errBody = await response.json(); } catch (e) { /* ignore parse error */ }
      throw new Error(errBody.error || ('HTTP ' + response.status + ' — ' + path));
    }

    return response.json();
  }

  /**
   * ajaxGet() — jQuery AJAX wrapper.
   *
   * Wraps $.ajax() in a Promise so it can be used with async/await.
   * jQuery's jqXHR is thenable, but wrapping it gives a proper Promise
   * with a consistent rejection interface.
   *
   * @param {string} path   — API path
   * @param {object} params — key/value pairs jQuery serialises to query string
   * @returns {Promise<any>}
   */
  function ajaxGet(path, params) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url:      BASE_URL + path,
        method:   'GET',
        data:     params || {},    /* jQuery serialises objects to ?key=val&key2=val2 */
        dataType: 'json',          /* parse response as JSON automatically */
        success: function (data) {
          resolve(data);
        },
        error: function (xhr, status, message) {
          /* Extract the API's own error message if available */
          var errMsg = (xhr.responseJSON && xhr.responseJSON.error)
            ? xhr.responseJSON.error
            : ('AJAX ' + status + ': ' + (message || path));
          reject(new Error(errMsg));
        },
      });
    });
  }

  /* ============================================================
     CATEGORY ENDPOINTS
     ============================================================ */

  /**
   * getCategories() — GET /api/categories
   * Returns all 15 categories sorted by sort_order.
   * Uses jQuery AJAX (demonstrates $.ajax for GET requests).
   */
  function getCategories() {
    return ajaxGet('/api/categories').then(function (res) { return res.data; });
  }

  /**
   * getCategory(slug) — GET /api/categories/:slug
   * Returns one category with all its tools and latest stats.
   * Uses jQuery AJAX.
   */
  function getCategory(slug) {
    return ajaxGet('/api/categories/' + encodeURIComponent(slug))
      .then(function (res) { return res.data; });
  }

  /* ============================================================
     TOOL ENDPOINTS
     ============================================================ */

  /**
   * getTools(page, limit, category) — GET /api/tools
   * Returns a paginated list of tools with pagination metadata.
   * Uses native fetch.
   */
  function getTools(page, limit, category) {
    return get('/api/tools', { page: page || 1, limit: limit || 20, category: category || null });
  }

  /**
   * getTool(slug) — GET /api/tools/:slug
   * Returns one tool with its full usage history and trend data.
   * Uses native fetch.
   */
  function getTool(slug) {
    return get('/api/tools/' + encodeURIComponent(slug))
      .then(function (res) { return res.data; });
  }

  /* ============================================================
     INDUSTRY ENDPOINTS
     ============================================================ */

  /**
   * getIndustries() — GET /api/industries
   * Returns all 10 industries.
   * Uses native fetch.
   */
  function getIndustries() {
    return get('/api/industries').then(function (res) { return res.data; });
  }

  /* ============================================================
     STATS ENDPOINTS
     ============================================================ */

  /**
   * getTopTools(category, industry, limit) — GET /api/stats/top
   * Returns the top N tools in a category by usage_percent.
   * Optionally filtered by industry slug.
   * Uses jQuery AJAX.
   *
   * @param {string}      category — category slug, e.g. 'frontend'
   * @param {string|null} industry — industry slug, e.g. 'fintech', or null for global
   * @param {number}      limit    — how many tools to return (default 5)
   */
  function getTopTools(category, industry, limit) {
    var params = { category: category, limit: limit || 5 };
    if (industry) params.industry = industry;
    return ajaxGet('/api/stats/top', params).then(function (res) { return res.data; });
  }

  /**
   * getGlobalStats() — GET /api/stats/global
   * Returns platform-wide summary counts for the hero ticker.
   * Uses native fetch.
   */
  function getGlobalStats() {
    return get('/api/stats/global').then(function (res) { return res.data; });
  }

  /**
   * getUsageHistory(toolSlug, years, industry) — GET /api/stats/usage
   * Returns year-by-year usage data for one tool (used for Chart.js).
   * Uses native fetch.
   *
   * @param {string}       toolSlug — tool slug, e.g. 'react'
   * @param {number[]|string|null} years — array or comma-string of years, or null for all
   * @param {string|null}  industry — industry slug, or null for global
   */
  function getUsageHistory(toolSlug, years, industry) {
    var params = { tool: toolSlug };
    if (years) {
      params.years = Array.isArray(years) ? years.join(',') : years;
    }
    if (industry) params.industry = industry;
    return get('/api/stats/usage', params).then(function (res) { return res.data; });
  }

  /**
   * getTrendingRising(limit) — GET /api/trends/rising
   * Top rising tools across all categories (wired up in Phase 6).
   * Returns null gracefully if the endpoint is not yet available.
   * Uses native fetch.
   */
  async function getTrendingRising(limit) {
    try {
      var res = await get('/api/trends/rising', { limit: limit || 5 });
      return res.data;
    } catch (e) {
      /* The Flask engine (Phase 6) must be running for this endpoint.
       * Until then, callers receive null and should fall back gracefully. */
      console.info('[API] getTrendingRising: endpoint not yet available (Phase 6)');
      return null;
    }
  }

  /**
   * compareTools(slugs, industry) — GET /api/compare
   * Side-by-side statistical comparison (Phase 4+).
   * Uses native fetch.
   */
  function compareTools(slugs, industry) {
    var params = { tools: slugs.join(',') };
    if (industry) params.industry = industry;
    return get('/api/compare', params).then(function (res) { return res.data; });
  }

  /* ============================================================
     STACK BUILDER ENDPOINT
     ============================================================ */

  /**
   * getStackRecommendation(industry, type) — GET /api/stack-builder
   * Returns a full tech stack recommendation for an industry + product type.
   * Uses jQuery AJAX.
   */
  function getStackRecommendation(industry, type) {
    return ajaxGet('/api/stack-builder', { industry: industry, type: type })
      .then(function (res) { return res.data; });
  }

  /* ============================================================
     LOADING STATE HELPERS
     Used by page controllers to manage loading UI on containers.
     ============================================================ */

  /**
   * showLoading($el) — adds 'is-loading' class to disable a container
   * @param {jQuery} $el — jQuery-wrapped element
   */
  function showLoading($el) {
    $el.addClass('is-loading').attr('aria-busy', 'true');
  }

  /**
   * hideLoading($el) — removes 'is-loading' class
   * @param {jQuery} $el — jQuery-wrapped element
   */
  function hideLoading($el) {
    $el.removeClass('is-loading').removeAttr('aria-busy');
  }

  /* ============================================================
     PUBLIC INTERFACE
     ============================================================ */
  return {
    /* Core (can be used directly for custom calls) */
    get:      get,
    ajaxGet:  ajaxGet,

    /* Categories */
    getCategories:         getCategories,
    getCategory:           getCategory,

    /* Tools */
    getTools:              getTools,
    getTool:               getTool,

    /* Industries */
    getIndustries:         getIndustries,

    /* Stats */
    getTopTools:           getTopTools,
    getGlobalStats:        getGlobalStats,
    getUsageHistory:       getUsageHistory,
    getTrendingRising:     getTrendingRising,
    compareTools:          compareTools,

    /* Stack Builder */
    getStackRecommendation: getStackRecommendation,

    /* UI helpers */
    showLoading:           showLoading,
    hideLoading:           hideLoading,
  };

}(jQuery));
