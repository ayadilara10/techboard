/**
 * config/constants.js — App-wide Constants
 *
 * Single source of truth for magic numbers and configuration values.
 * Change here once, applies everywhere.
 */

module.exports = {
  // Pagination — used by GET /api/tools
  DEFAULT_PAGE_LIMIT: 20,   // items per page when client doesn't specify
  MAX_PAGE_LIMIT:    100,   // hard ceiling to prevent giant queries

  // Stats — used by GET /api/stats/top
  DEFAULT_TOP_LIMIT:  5,    // tools returned by default
  MAX_TOP_LIMIT:     20,    // hard ceiling

  // JWT — used by auth middleware (Phase 9)
  JWT_EXPIRY: '24h',

  // The most recent year of survey data loaded in the seed
  LATEST_YEAR: 2024,

  // Reserved for future API versioning
  API_VERSION: 'v1',
};
