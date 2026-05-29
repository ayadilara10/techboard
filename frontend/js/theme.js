/**
 * theme.js — Dark / Light Mode Toggle
 *
 * How it works:
 *   - The default theme is dark (set on <html data-theme="dark"> in the HTML).
 *   - On page load, this script reads localStorage for a saved preference and
 *     applies it immediately (before the browser paints) to avoid a flash.
 *   - Clicking the toggle button flips the theme and saves it to localStorage.
 *   - The toggle button's icon and aria-label update to reflect the current state.
 *
 * The actual visual changes are driven entirely by CSS — this script only
 * toggles the data-theme attribute on <html>.
 */

(function () {
  'use strict';

  /* ---- Constants ---- */
  const STORAGE_KEY = 'techboard-theme';
  const DARK  = 'dark';
  const LIGHT = 'light';

  /* ---- Read saved preference from localStorage ----
   * Wrapped in try/catch because localStorage can be blocked
   * by browser privacy settings or private browsing mode. */
  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  /* ---- Persist preference ---- */
  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* Silently fail if storage is unavailable */
    }
  }

  /* ---- Apply theme to <html> ---- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateToggleButton(theme);
  }

  /* ---- Update the toggle button icon and accessible label ---- */
  function updateToggleButton(theme) {
    var btn  = document.getElementById('themeToggle');
    var icon = document.getElementById('themeToggleIcon');
    if (!btn) return;

    if (theme === LIGHT) {
      /* Sun icon signals we're in light mode; clicking returns to dark */
      if (icon) icon.textContent = '☀';
      btn.setAttribute('aria-label', 'Switch to dark mode');
      btn.setAttribute('title', 'Switch to dark mode');
    } else {
      /* Moon icon signals dark mode; clicking switches to light */
      if (icon) icon.textContent = '☾';
      btn.setAttribute('aria-label', 'Switch to light mode');
      btn.setAttribute('title', 'Switch to light mode');
    }
  }

  /* ---- Toggle between dark and light ---- */
  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || DARK;
    var next    = current === DARK ? LIGHT : DARK;
    applyTheme(next);
    saveTheme(next);
  }

  /* ---- Initialise on page load ----
   * Apply saved theme immediately (synchronous) so there is no
   * white-flash when the page first renders in dark mode. */
  function init() {
    var saved = getSavedTheme();
    /* Honour the saved preference, falling back to dark */
    applyTheme(saved === LIGHT ? LIGHT : DARK);

    /* Wire up the toggle button once the DOM is ready */
    document.addEventListener('DOMContentLoaded', function () {
      var btn = document.getElementById('themeToggle');
      if (btn) {
        btn.addEventListener('click', toggleTheme);
      }
    });
  }

  init();

}());
