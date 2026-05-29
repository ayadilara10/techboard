<?php
/**
 * tools/list.php — Tool Browser
 *
 * Displays all tools in a paginated, searchable table.
 * Handles inline deletion via POST (with CSRF protection).
 *
 * GET params:
 *   page   (int)    — current page number (default 1)
 *   search (string) — filter tools whose name or slug contains this string
 *
 * POST params (delete action):
 *   action       = 'delete'
 *   tool_id      — ID of the tool to soft-delete (sets is_active = 0)
 *   _csrf_token  — CSRF token
 *
 * We use a soft delete (is_active = 0) rather than a hard DELETE so that
 * historical usage_stats rows that reference the tool remain intact and
 * the referential integrity of the database is preserved.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/auth.php';

requireLogin();

const TOOLS_PER_PAGE = 20; // rows per page

$pageTitle  = 'Tools';
$activePage = 'tools';

/* ── Handle DELETE action ───────────────────────────────────────────────────
 * Process before any DB read so the page reflects the deletion.
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {

    if (!verifyCsrfToken($_POST['_csrf_token'] ?? '')) {
        setFlash('error', 'Invalid CSRF token. Action rejected.');
    } else {
        $toolId = (int)($_POST['tool_id'] ?? 0);

        if ($toolId > 0) {
            try {
                $db   = getDb();
                $stmt = $db->prepare(
                    'UPDATE tools SET is_active = 0 WHERE id = ? AND is_active = 1'
                );
                $stmt->execute([$toolId]);

                if ($stmt->rowCount() > 0) {
                    setFlash('success', 'Tool deactivated successfully. Usage statistics are preserved.');
                } else {
                    setFlash('warning', 'Tool not found or already deactivated.');
                }
            } catch (PDOException $e) {
                error_log('[tools/list.php delete] ' . $e->getMessage());
                setFlash('error', 'Database error while deleting tool.');
            }
        }
    }

    // PRG pattern: redirect after POST to avoid resubmission on browser refresh
    $qs = http_build_query([
        'page'   => $_POST['page']   ?? 1,
        'search' => $_POST['search'] ?? '',
    ]);
    header('Location: ' . ADMIN_BASE . 'tools/list.php?' . $qs);
    exit;
}

/* ── Query parameters ───────────────────────────────────────────────────────
 */
$page   = max(1, (int)($_GET['page']   ?? 1));
$search = trim($_GET['search'] ?? '');
$offset = ($page - 1) * TOOLS_PER_PAGE;

/* ── Fetch tools ─────────────────────────────────────────────────────────────
 */
$tools      = [];
$totalTools = 0;
$dbError    = null;
$categories = [];

try {
    $db = getDb();

    // Build WHERE clause — always filter by is_active; optionally filter by name/slug
    $where  = 't.is_active = 1';
    $params = [];

    if ($search !== '') {
        // LIKE with % wildcards; PDO parameterisation handles special characters safely
        $where   .= ' AND (t.name LIKE ? OR t.slug LIKE ?)';
        $pattern  = '%' . $search . '%';
        $params[] = $pattern;
        $params[] = $pattern;
    }

    // Total matching rows for pagination calculation
    $countStmt = $db->prepare(
        "SELECT COUNT(*) FROM tools t
         JOIN categories c ON c.id = t.category_id
         WHERE {$where}"
    );
    $countStmt->execute($params);
    $totalTools = (int)$countStmt->fetchColumn();

    // Fetch the requested page of tools with their category
    // Also join usage_stats for the latest global usage % (informational)
    $listStmt = $db->prepare(
        "SELECT
           t.id,
           t.slug,
           t.name,
           t.open_source,
           t.first_released,
           t.website_url,
           c.name AS category_name,
           c.slug AS category_slug,
           us.usage_percent,
           us.year AS stat_year
         FROM tools t
         JOIN categories c ON c.id = t.category_id
         LEFT JOIN usage_stats us
           ON  us.tool_id     = t.id
           AND us.industry_id IS NULL
           AND us.year = (
                 SELECT MAX(us2.year) FROM usage_stats us2
                 WHERE  us2.tool_id = t.id AND us2.industry_id IS NULL
               )
         WHERE {$where}
         ORDER BY c.sort_order ASC, t.name ASC
         LIMIT ? OFFSET ?"
    );
    $listStmt->execute([...$params, TOOLS_PER_PAGE, $offset]);
    $tools = $listStmt->fetchAll();

} catch (RuntimeException | PDOException $e) {
    $dbError = $e->getMessage();
}

// Pagination metadata
$totalPages = $totalTools > 0 ? (int)ceil($totalTools / TOOLS_PER_PAGE) : 1;
$csrfToken  = generateCsrfToken();

require_once dirname(__DIR__) . '/includes/header.php';
?>

<!-- ── Page heading ─────────────────────────────────────────────────────── -->
<div class="page-header">
  <h1 class="page-title">
    Tools
    <?php if ($search !== ''): ?>
      <span class="text-muted" style="font-size:1rem;font-weight:400">
        — results for "<?= htmlspecialchars($search, ENT_QUOTES, 'UTF-8') ?>"
      </span>
    <?php endif; ?>
  </h1>
  <a href="<?= ADMIN_BASE ?>tools/add.php" class="btn btn-primary">+ Add Tool</a>
</div>

<?php if ($dbError): ?>
  <div class="alert alert-error"><?= htmlspecialchars($dbError, ENT_QUOTES, 'UTF-8') ?></div>
<?php else: ?>

<!-- ── Search bar ───────────────────────────────────────────────────────── -->
<form method="GET" action="" class="toolbar">
  <input
    type="search"
    name="search"
    value="<?= htmlspecialchars($search, ENT_QUOTES, 'UTF-8') ?>"
    placeholder="Search by name or slug…"
    autocomplete="off"
  >
  <button type="submit" class="btn btn-secondary">Search</button>
  <?php if ($search !== ''): ?>
    <a href="<?= ADMIN_BASE ?>tools/list.php" class="btn btn-ghost btn-sm">Clear ×</a>
  <?php endif; ?>
  <span class="pg-info">
    <?= number_format($totalTools) ?> tool<?= $totalTools !== 1 ? 's' : '' ?>
  </span>
</form>

<!-- ── Tool table ───────────────────────────────────────────────────────── -->
<?php if (empty($tools)): ?>
  <div class="card">
    <p class="text-muted text-sm">
      No tools found<?= $search !== '' ? ' for "' . htmlspecialchars($search, ENT_QUOTES, 'UTF-8') . '"' : '' ?>.
      <?php if ($search === ''): ?>
        <a href="<?= ADMIN_BASE ?>tools/add.php">Add the first tool</a>.
      <?php endif; ?>
    </p>
  </div>
<?php else: ?>

<div class="table-wrap">
  <table class="data-table">
    <thead>
      <tr>
        <th>Name</th>
        <th class="col-hide-sm">Slug</th>
        <th>Category</th>
        <th class="col-hide-sm">Usage</th>
        <th class="col-hide-sm">Open Source</th>
        <th class="col-hide-sm">Released</th>
        <th class="col-actions">Actions</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($tools as $tool): ?>
      <tr>
        <!-- Tool name + website link -->
        <td>
          <?php if ($tool['website_url']): ?>
            <a href="<?= htmlspecialchars($tool['website_url'], ENT_QUOTES, 'UTF-8') ?>"
               target="_blank" rel="noopener noreferrer" style="color:var(--text)">
              <?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?>
              <span class="text-muted" style="font-size:0.7rem">↗</span>
            </a>
          <?php else: ?>
            <?= htmlspecialchars($tool['name'], ENT_QUOTES, 'UTF-8') ?>
          <?php endif; ?>
        </td>

        <!-- Slug (monospace) -->
        <td class="col-hide-sm mono text-muted">
          <?= htmlspecialchars($tool['slug'], ENT_QUOTES, 'UTF-8') ?>
        </td>

        <!-- Category -->
        <td class="text-muted">
          <?= htmlspecialchars($tool['category_name'], ENT_QUOTES, 'UTF-8') ?>
        </td>

        <!-- Latest global usage % -->
        <td class="col-hide-sm">
          <?php if ($tool['usage_percent'] !== null): ?>
            <span class="text-accent"><?= number_format((float)$tool['usage_percent'], 1) ?>%</span>
            <span class="text-muted text-xs">(<?= (int)$tool['stat_year'] ?>)</span>
          <?php else: ?>
            <span class="text-muted">—</span>
          <?php endif; ?>
        </td>

        <!-- Open source badge -->
        <td class="col-hide-sm">
          <?php if ($tool['open_source']): ?>
            <span class="badge badge-yes">Yes</span>
          <?php else: ?>
            <span class="badge badge-no">No</span>
          <?php endif; ?>
        </td>

        <!-- First released year -->
        <td class="col-hide-sm text-muted">
          <?= $tool['first_released'] ? (int)$tool['first_released'] : '—' ?>
        </td>

        <!-- Actions: Edit + Delete (soft) -->
        <td class="col-actions">
          <a href="<?= ADMIN_BASE ?>tools/edit.php?id=<?= (int)$tool['id'] ?>"
             class="btn btn-ghost btn-sm">Edit</a>

          <!-- Delete form — POST only, with CSRF and JS confirmation -->
          <form method="POST" action="" style="display:inline"
                onsubmit="return confirm('Deactivate «<?= htmlspecialchars(addslashes($tool['name']), ENT_QUOTES, 'UTF-8') ?>»? Usage data is preserved.')">
            <input type="hidden" name="action"      value="delete">
            <input type="hidden" name="tool_id"     value="<?= (int)$tool['id'] ?>">
            <input type="hidden" name="page"        value="<?= $page ?>">
            <input type="hidden" name="search"      value="<?= htmlspecialchars($search, ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="_csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
            <button type="submit" class="btn btn-danger btn-sm">Deactivate</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<!-- ── Pagination ───────────────────────────────────────────────────────── -->
<?php if ($totalPages > 1): ?>
<nav class="pagination" aria-label="Tool list pages">
  <?php
  // Build the base query string (search term must persist across pages)
  $baseQs = $search !== '' ? '&search=' . urlencode($search) : '';

  // Previous page link
  if ($page > 1): ?>
    <a href="?page=<?= $page - 1 . $baseQs ?>" aria-label="Previous page">‹ Prev</a>
  <?php endif;

  // Page number links — show up to 7 pages with ellipsis for large sets
  $start = max(1, $page - 3);
  $end   = min($totalPages, $page + 3);

  if ($start > 1): ?>
    <a href="?page=1<?= $baseQs ?>">1</a>
    <?php if ($start > 2): ?><span class="pg-dots">…</span><?php endif;
  endif;

  for ($p = $start; $p <= $end; $p++): ?>
    <?php if ($p === $page): ?>
      <span class="pg-current"><?= $p ?></span>
    <?php else: ?>
      <a href="?page=<?= $p . $baseQs ?>"><?= $p ?></a>
    <?php endif;
  endfor;

  if ($end < $totalPages): ?>
    <?php if ($end < $totalPages - 1): ?><span class="pg-dots">…</span><?php endif; ?>
    <a href="?page=<?= $totalPages . $baseQs ?>"><?= $totalPages ?></a>
  <?php endif;

  // Next page link
  if ($page < $totalPages): ?>
    <a href="?page=<?= $page + 1 . $baseQs ?>" aria-label="Next page">Next ›</a>
  <?php endif; ?>

  <span class="pg-info">
    Page <?= $page ?> of <?= $totalPages ?>
    &middot; <?= number_format($totalTools) ?> tools
  </span>
</nav>
<?php endif; ?>

<?php endif; // empty tools check ?>
<?php endif; // dbError check ?>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
