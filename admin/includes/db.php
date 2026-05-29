<?php
/**
 * includes/db.php — PDO MySQL Connection Factory
 *
 * Single source of truth for the database connection used by every admin
 * page.  All queries in the admin panel must go through the PDO instance
 * returned by getDb() and must use prepared statements.
 *
 * Environment variables (shared with the Node.js backend):
 *   DB_HOST     — MySQL hostname          (default: localhost)
 *   DB_PORT     — MySQL port              (default: 3306)
 *   DB_NAME     — database name           (default: techboard)
 *   DB_USER     — MySQL username
 *   DB_PASSWORD — MySQL password
 *
 * In Docker the variables are injected by docker-compose.yml.
 * For local development (php -S localhost:8080 from admin/) they are
 * loaded from the .env file at the project root by loadDotEnv() below.
 *
 * Course requirement: PDO must be used — not mysqli.
 */

declare(strict_types=1);

/* ── .env loader ────────────────────────────────────────────────────────────
 *
 * Reads NAME=VALUE lines from the project-root .env file and pushes them
 * into the process environment via putenv() / $_ENV.  Variables already
 * present in the environment (e.g. set by Docker) are never overwritten,
 * so Docker and local dev use the same code path.
 */
function loadDotEnv(): void
{
    // admin/ lives two levels below the project root (techboard/admin/includes → techboard/)
    $envFile = dirname(__FILE__, 3) . DIRECTORY_SEPARATOR . '.env';

    if (!is_readable($envFile)) {
        return; // Not found — rely on env vars being set by the OS / container
    }

    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $line = trim($line);

        // Skip blank lines and comments
        if ($line === '' || $line[0] === '#') {
            continue;
        }

        // Must contain an = sign
        if (strpos($line, '=') === false) {
            continue;
        }

        // Split on the first = so values that contain = are handled correctly
        [$name, $value] = explode('=', $line, 2);
        $name  = trim($name);
        $value = trim($value);

        // Strip surrounding single or double quotes from the value
        if (preg_match('/^(["\'])(.*)\1$/', $value, $m)) {
            $value = $m[2];
        }

        // Never overwrite an already-set environment variable
        if (getenv($name) === false) {
            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
        }
    }
}

loadDotEnv();

/* ── ADMIN_BASE constant ────────────────────────────────────────────────────
 *
 * The URL path prefix for all admin panel links, computed from the server's
 * document root vs. where admin/ lives on disk.
 *
 * Examples:
 *   Docker (admin/ is the document root)   → ADMIN_BASE = '/'
 *   XAMPP  (admin/ is at /techboard/admin) → ADMIN_BASE = '/techboard/admin/'
 *
 * All navigation hrefs are built as:  ADMIN_BASE . 'index.php' etc.
 */
(function () {
    $adminDir = dirname(__FILE__, 2);                      // .../admin
    $docRoot  = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');

    if ($docRoot !== '' && strpos($adminDir, $docRoot) === 0) {
        $relative = substr($adminDir, strlen($docRoot));
    } else {
        $relative = '';
    }

    define('ADMIN_BASE', rtrim($relative, '/') . '/');
})();

/* ── PDO factory ─────────────────────────────────────────────────────────────
 *
 * Returns a shared PDO instance.  PHP's static local variable ensures we
 * open exactly one connection per request, even if getDb() is called
 * multiple times across different require'd files.
 */
function getDb(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host     = getenv('DB_HOST')     ?: 'localhost';
    $port     = getenv('DB_PORT')     ?: '3306';
    $dbName   = getenv('DB_NAME')     ?: 'techboard';
    $user     = getenv('DB_USER')     ?: '';
    $password = getenv('DB_PASSWORD') ?: '';

    // DSN includes charset so MySQL always returns UTF-8 strings
    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $password, [
            // ERRMODE_EXCEPTION turns DB errors into catchable PDOExceptions
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            // FETCH_ASSOC returns rows as ['column' => 'value'] arrays
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Disable emulated prepares — real prepared statements prevent SQLi
            PDO::ATTR_EMULATE_PREPARES   => false,
            // Stringify fetches off: numeric columns come back as PHP numbers
            PDO::ATTR_STRINGIFY_FETCHES  => false,
        ]);
    } catch (PDOException $e) {
        // Log the real error server-side; never expose credentials in the UI
        error_log('[TechBoard Admin] DB connection failed: ' . $e->getMessage());
        // A RuntimeException here will be caught by the page's try/catch
        throw new RuntimeException(
            'Could not connect to the database. ' .
            'Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME are set correctly.'
        );
    }

    return $pdo;
}
