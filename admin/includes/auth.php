<?php
/**
 * includes/auth.php — Session-based Authentication Helpers
 *
 * All authentication logic for the admin panel lives here.  Every protected
 * page starts with:
 *
 *   require_once __DIR__ . '/../includes/auth.php';
 *   requireLogin();
 *
 * Session is started (if not already running) when this file is included,
 * so pages never need to call session_start() themselves.
 *
 * Functions exported:
 *   requireLogin()         — redirect to login if not authenticated
 *   isLoggedIn()           — boolean check of session state
 *   getCurrentAdmin()      — return logged-in admin's data from session
 *   setFlash(type, text)   — store a one-time message in the session
 *   getFlash()             — read and clear the stored flash message
 *   generateCsrfToken()    — create (or reuse) a CSRF token for this session
 *   verifyCsrfToken(token) — validate a CSRF token from a submitted form
 */

declare(strict_types=1);

/* ── Session bootstrap ───────────────────────────────────────────────────────
 *
 * Configure session cookie security flags before starting the session.
 * These must be set before session_start() is called.
 *
 *   httponly — JS cannot read the session cookie (mitigates XSS)
 *   samesite — cookie is not sent with cross-site requests (mitigates CSRF)
 *   use_strict_mode — reject unknown session IDs (mitigates session fixation)
 */
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_strict_mode', '1');
    // 'Lax' lets cookies through on same-site top-level navigations
    session_set_cookie_params(['samesite' => 'Lax']);
    session_start();
}


/* ── Authentication guards ───────────────────────────────────────────────────
 */

/**
 * requireLogin() — redirect to login.php if the admin is not authenticated.
 *
 * Call this at the very top of every protected page (before any output).
 * Stores the requested URL in the session so login can redirect back after
 * successful authentication.
 */
function requireLogin(): void
{
    if (!isLoggedIn()) {
        // Remember where the user was trying to go
        $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'] ?? '';
        header('Location: ' . ADMIN_BASE . 'login.php');
        exit;
    }
}

/**
 * isLoggedIn() — return true if a valid admin session exists.
 *
 * We check that admin_id is set AND is a positive integer to guard against
 * someone manually setting $_SESSION['admin_id'] to null or false.
 */
function isLoggedIn(): bool
{
    return isset($_SESSION['admin_id']) && (int)$_SESSION['admin_id'] > 0;
}

/**
 * getCurrentAdmin() — return the logged-in admin's details from the session.
 *
 * @return array{id:int|null, email:string, name:string}
 */
function getCurrentAdmin(): array
{
    return [
        'id'    => isset($_SESSION['admin_id'])    ? (int)$_SESSION['admin_id'] : null,
        'email' => (string)($_SESSION['admin_email'] ?? ''),
        'name'  => (string)($_SESSION['admin_name']  ?? ''),
    ];
}


/* ── Flash messages ──────────────────────────────────────────────────────────
 *
 * A "flash" is a one-time message shown on the next page load (typically
 * after a redirect).  It is stored in $_SESSION and deleted on first read.
 *
 * Types: 'success' | 'error' | 'warning' | 'info'
 */

/**
 * setFlash(type, text) — store a flash message in the session.
 *
 * @param string $type  — 'success', 'error', 'warning', or 'info'
 * @param string $text  — the human-readable message
 */
function setFlash(string $type, string $text): void
{
    $_SESSION['flash'] = ['type' => $type, 'text' => $text];
}

/**
 * getFlash() — read and clear the flash message.
 *
 * Returns null if no flash is stored.
 *
 * @return array{type:string, text:string}|null
 */
function getFlash(): ?array
{
    if (!isset($_SESSION['flash'])) {
        return null;
    }
    $flash = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $flash;
}


/* ── CSRF protection ─────────────────────────────────────────────────────────
 *
 * Every state-changing form (POST) includes a hidden _csrf_token field.
 * The token is generated once per session and stored in $_SESSION.
 * On form submission, verifyCsrfToken() compares the submitted value to the
 * stored one using hash_equals() (constant-time comparison, prevents timing
 * attacks).
 *
 * Usage in a form:
 *   <input type="hidden" name="_csrf_token" value="<?= generateCsrfToken() ?>">
 *
 * Usage in the handler:
 *   if (!verifyCsrfToken($_POST['_csrf_token'] ?? '')) { die('Invalid token'); }
 */

/**
 * generateCsrfToken() — return the session's CSRF token, creating it if needed.
 *
 * @return string — 64-character hex token
 */
function generateCsrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        // random_bytes() uses the OS CSPRNG — safe for cryptographic tokens
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * verifyCsrfToken(submitted) — validate a CSRF token from $_POST.
 *
 * @param string $submitted — the value of $_POST['_csrf_token']
 * @return bool
 */
function verifyCsrfToken(string $submitted): bool
{
    $stored = $_SESSION['csrf_token'] ?? '';
    // hash_equals() prevents timing-based token guessing
    return $stored !== '' && hash_equals($stored, $submitted);
}
