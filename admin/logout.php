<?php
/**
 * logout.php — Admin Session Termination
 *
 * Destroys the active session completely and redirects to the login page.
 *
 * This page accepts both GET and POST.  The navigation bar links to it via
 * GET for simplicity; a CSRF-protected POST would be slightly more secure
 * but is not required for this project's threat model (the admin panel is
 * not publicly accessible in production).
 *
 * Destruction steps (PHP session best practices):
 *   1. Clear all session variables.
 *   2. Destroy the server-side session data.
 *   3. Expire the session cookie in the browser.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';   // defines ADMIN_BASE
require_once __DIR__ . '/includes/auth.php'; // starts the session

// 1. Unset all session variables
$_SESSION = [];

// 2. If the session uses a cookie, delete it from the browser by setting
//    the expiry to a time in the past.
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,   // expire in the past → browser removes the cookie
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

// 3. Destroy the server-side session record
session_destroy();

// Redirect to login page — use an absolute path to avoid redirect loops
header('Location: ' . ADMIN_BASE . 'login.php');
exit;
