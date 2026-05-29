<?php
/**
 * login.php — Admin Panel Login
 *
 * Self-posting page (GET shows form, POST processes it).
 *
 * Flow:
 *   1. If the admin is already logged in, redirect to the dashboard immediately.
 *   2. GET request → render the login form with an empty CSRF token.
 *   3. POST request:
 *      a. Verify CSRF token to prevent cross-site form submissions.
 *      b. Look up the admin_users row for the submitted email.
 *      c. Verify the submitted password against the stored bcrypt hash using
 *         password_verify() — safe against timing attacks.
 *      d. On success: regenerate the session ID (prevents session fixation),
 *         store admin data in the session, redirect to the dashboard.
 *      e. On failure: increment a lockout counter and show an error.
 *
 * Security notes:
 *   - The error message is intentionally vague ("Invalid credentials") so
 *     an attacker cannot distinguish between "email not found" and "wrong password".
 *   - password_verify() is constant-time for the comparison part.
 *   - session_regenerate_id(true) destroys the old session on login success.
 *   - A simple rate-limit (max 10 attempts per session) is implemented to
 *     slow brute-force attacks without requiring a Redis dependency.
 *
 * Default credentials (from seed_sample_data.sql):
 *   Email:    admin@techboard.dev
 *   Password: admin123
 */

declare(strict_types=1);

// db.php defines ADMIN_BASE and getDb(); auth.php starts the session
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';

// Already logged in → skip the form and go to the dashboard
if (isLoggedIn()) {
    header('Location: ' . ADMIN_BASE . 'index.php');
    exit;
}

/* ── Brute-force rate limit ─────────────────────────────────────────────────
 * Track failed attempts in the session.  After MAX_ATTEMPTS consecutive
 * failures we lock out further attempts for LOCKOUT_SECONDS seconds.
 */
const MAX_ATTEMPTS     = 10;
const LOCKOUT_SECONDS  = 300; // 5 minutes

$loginErrors = [];    // validation / auth errors rendered in the form
$lockoutMsg  = null;  // non-null when the account is temporarily locked

// Check if we're in a lockout window
if (isset($_SESSION['login_locked_until']) && time() < $_SESSION['login_locked_until']) {
    $remaining  = $_SESSION['login_locked_until'] - time();
    $lockoutMsg = "Too many failed attempts. Please wait {$remaining} seconds before trying again.";
}

/* ── POST handler ────────────────────────────────────────────────────────────
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $lockoutMsg === null) {

    // 1. CSRF check — reject immediately if token doesn't match
    if (!verifyCsrfToken($_POST['_csrf_token'] ?? '')) {
        $loginErrors[] = 'Invalid form token. Please refresh the page and try again.';

    } else {

        // 2. Sanitise inputs — trim whitespace, never trust raw POST values
        $email    = trim($_POST['email']    ?? '');
        $password = trim($_POST['password'] ?? '');

        if ($email === '') {
            $loginErrors[] = 'Email address is required.';
        }
        if ($password === '') {
            $loginErrors[] = 'Password is required.';
        }

        if (empty($loginErrors)) {
            try {
                $db = getDb();

                // 3. Fetch the admin row — one round-trip, no extra lookup needed
                $stmt = $db->prepare(
                    'SELECT id, email, name, password_hash
                     FROM   admin_users
                     WHERE  email = ?
                     LIMIT  1'
                );
                $stmt->execute([$email]);
                $admin = $stmt->fetch(); // returns array or false

                // 4. Verify password (constant-time bcrypt comparison)
                //    password_verify() works with PHP's $2y$ and Python's $2b$ hashes.
                if ($admin && password_verify($password, $admin['password_hash'])) {

                    // SUCCESS — regenerate session to prevent session fixation
                    session_regenerate_id(true);

                    // Store admin info in the new session
                    $_SESSION['admin_id']    = (int)$admin['id'];
                    $_SESSION['admin_email'] = $admin['email'];
                    $_SESSION['admin_name']  = $admin['name'];

                    // Reset failed attempt counter
                    unset($_SESSION['login_attempts'], $_SESSION['login_locked_until']);

                    // Redirect to dashboard (or wherever they were headed)
                    $redirect = $_SESSION['redirect_after_login'] ?? (ADMIN_BASE . 'index.php');
                    unset($_SESSION['redirect_after_login']);
                    header('Location: ' . $redirect);
                    exit;

                } else {
                    // FAILURE — vague error (don't confirm whether the email exists)
                    $loginErrors[] = 'Invalid email address or password.';

                    // Increment attempt counter
                    $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;

                    if ($_SESSION['login_attempts'] >= MAX_ATTEMPTS) {
                        $_SESSION['login_locked_until'] = time() + LOCKOUT_SECONDS;
                        $_SESSION['login_attempts']     = 0;
                        $lockoutMsg = 'Too many failed attempts. Try again in ' . LOCKOUT_SECONDS . ' seconds.';
                        $loginErrors = []; // Replace the vague error with lockout message
                    }
                }

            } catch (RuntimeException $e) {
                // DB not available — show a generic error, log the real one
                error_log('[login.php] ' . $e->getMessage());
                $loginErrors[] = 'A server error occurred. Please try again later.';
            }
        }
    }
}

// Generate (or reuse) a CSRF token for the form
$csrfToken = generateCsrfToken();

/* ── Render ─────────────────────────────────────────────────────────────────
 * The login page uses its own minimal layout (no nav, no header.php)
 * because the user is not yet authenticated.
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — TechBoard Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Minimal styles — only what the login page needs */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #0A1F33;
      color: #D1D9E6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #12253A;
      border: 1px solid #1E3A5F;
      border-radius: 12px;
      padding: 44px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 2px 32px rgba(0,0,0,0.4);
    }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo strong { display: block; color: #2DD4D4; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; }
    .logo span { color: #6B7FA3; font-size: 0.82rem; }
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; font-size: 0.82rem; color: #6B7FA3; font-weight: 500; margin-bottom: 6px; }
    input[type="email"], input[type="password"] {
      width: 100%; background: #0A1F33; border: 1px solid #1E3A5F; border-radius: 6px;
      color: #D1D9E6; padding: 11px 14px; font-size: 0.9rem; font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:focus { outline: none; border-color: #2DD4D4; box-shadow: 0 0 0 3px rgba(45,212,212,0.1); }
    .btn-submit {
      width: 100%; background: #2DD4D4; color: #0A1F33; border: none; border-radius: 6px;
      padding: 12px; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background 0.15s; margin-top: 8px;
    }
    .btn-submit:hover { background: #26b5b5; }
    .alert {
      padding: 11px 15px; border-radius: 6px; margin-bottom: 20px; font-size: 0.85rem;
      background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #ef4444;
    }
    .hint { text-align: center; color: #6B7FA3; font-size: 0.78rem; margin-top: 20px; }
    .hint a { color: #4A6FA5; }
  </style>
</head>
<body>

<div class="card">

  <!-- Brand -->
  <div class="logo">
    <strong>TechBoard</strong>
    <span>Admin Panel — Restricted Access</span>
  </div>

  <!-- Error / lockout message -->
  <?php if ($lockoutMsg): ?>
    <div class="alert"><?= htmlspecialchars($lockoutMsg, ENT_QUOTES, 'UTF-8') ?></div>
  <?php elseif (!empty($loginErrors)): ?>
    <div class="alert">
      <?php foreach ($loginErrors as $err): ?>
        <?= htmlspecialchars($err, ENT_QUOTES, 'UTF-8') ?><br>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <!-- Login form — posts to itself -->
  <form method="POST" action="" novalidate>
    <!-- CSRF hidden field — must be present and valid for POST to be processed -->
    <input type="hidden" name="_csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">

    <div class="form-group">
      <label for="email">Email Address</label>
      <input
        type="email"
        id="email"
        name="email"
        value="<?= htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
        placeholder="admin@techboard.dev"
        autocomplete="email"
        required
        <?= $lockoutMsg ? 'disabled' : '' ?>
      >
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        placeholder="••••••••"
        autocomplete="current-password"
        required
        <?= $lockoutMsg ? 'disabled' : '' ?>
      >
    </div>

    <button type="submit" class="btn-submit" <?= $lockoutMsg ? 'disabled' : '' ?>>
      Sign In →
    </button>
  </form>

  <p class="hint">
    <a href="<?= ADMIN_BASE ?>../">← Back to TechBoard</a>
  </p>

</div>

</body>
</html>
