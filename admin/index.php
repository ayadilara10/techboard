<?php
/**
 * index.php — Admin Dashboard
 *
 * Shows a summary of the platform's current data state:
 *   - Four stat cards: total tools, live categories, industries, data points
 *   - A fifth card for total trend rows (shows Flask engine output)
 *   - A table of the most recent import log entries (last 10)
 *
 * All counts come from live DB queries so the dashboard always reflects the
 * current state of the data, not a cached snapshot.
 *
 * Access: requireLogin() redirects to login.php if the session is not active.
 */

declare(strict_types=1);

require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';

requireLogin();

/* ── Data queries ────────────────────────────────────────────────────────────
 * Run five COUNT queries in one pass using a UNION so we only need one
 * database round-trip for the stat cards.
 */
$pageTitle  = 'Dashboard';
$activePage = 'dashboard';

$stats      = [];
$importLog  = [];
$dbError    = null;

try {
    $db = getDb();

    // ---- Stat counts (individual queries for clarity) ----
    $counts = $db->query(
        "SELECT
           (SELECT COUNT(*) FROM tools       WHERE is_active = 1)              AS total_tools,
           (SELECT COUNT(*) FROM categories  WHERE data_status = 'live')       AS live_categories,
           (SELECT COUNT(*) FROM industries)                                   AS total_industries,
           (SELECT COUNT(*) FROM usage_stats)                                  AS total_data_points,
           (SELECT COUNT(*) FROM trends)                                       AS total_trends"
    )->fetch();

    $stats = $counts ?: [];

    // ---- Recent import log (last 10 rows, newest first) ----
    // LEFT JOIN admin_users so we still get rows even if imported_by is NULL
    $importLog = $db->query(
        "SELECT
           dil.id,
           dil.filename,
           dil.source,
           dil.rows_imported,
           dil.imported_at,
           au.name  AS admin_name,
           au.email AS admin_email
         FROM   data_import_log dil
         LEFT JOIN admin_users au ON au.id = dil.imported_by
         ORDER  BY dil.imported_at DESC
         LIMIT  10"
    )->fetchAll();

} catch (RuntimeException | PDOException $e) {
    $dbError = $e->getMessage();
}

require_once __DIR__ . '/includes/header.php';
?>

<!-- ── Page heading ─────────────────────────────────────────────────────── -->
<div class="page-header">
  <h1 class="page-title">Dashboard</h1>
  <div style="display:flex;gap:10px">
    <a href="<?= ADMIN_BASE ?>tools/add.php"    class="btn btn-secondary btn-sm">+ Add Tool</a>
    <a href="<?= ADMIN_BASE ?>import/upload.php" class="btn btn-primary   btn-sm">↑ Import CSV</a>
  </div>
</div>

<?php if ($dbError): ?>
  <div class="alert alert-error"><?= htmlspecialchars($dbError, ENT_QUOTES, 'UTF-8') ?></div>
<?php else: ?>

<!-- ── Stat cards ───────────────────────────────────────────────────────── -->
<div class="stat-grid">

  <div class="stat-card">
    <span class="stat-value"><?= number_format((int)($stats['total_tools']       ?? 0)) ?></span>
    <span class="stat-label">Active Tools</span>
  </div>

  <div class="stat-card">
    <span class="stat-value"><?= number_format((int)($stats['live_categories']   ?? 0)) ?></span>
    <span class="stat-label">Live Categories</span>
  </div>

  <div class="stat-card">
    <span class="stat-value"><?= number_format((int)($stats['total_industries']  ?? 0)) ?></span>
    <span class="stat-label">Industries</span>
  </div>

  <div class="stat-card">
    <span class="stat-value"><?= number_format((int)($stats['total_data_points'] ?? 0)) ?></span>
    <span class="stat-label">Data Points</span>
  </div>

  <div class="stat-card">
    <span class="stat-value"><?= number_format((int)($stats['total_trends']      ?? 0)) ?></span>
    <span class="stat-label">Trend Rows</span>
  </div>

</div>

<!-- ── Recent imports ───────────────────────────────────────────────────── -->
<div class="card">
  <div class="card-title">
    Recent Imports
    <a href="<?= ADMIN_BASE ?>import/upload.php" style="float:right;font-weight:400;font-size:0.82rem;color:#4A6FA5">
      Import new CSV →
    </a>
  </div>

  <?php if (empty($importLog)): ?>
    <p class="text-muted text-sm">
      No imports yet.
      <a href="<?= ADMIN_BASE ?>import/upload.php">Upload your first CSV</a> to populate usage statistics.
    </p>
  <?php else: ?>
  <div class="table-wrap" style="border:none;border-radius:0">
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Filename</th>
          <th>Source</th>
          <th class="col-hide-sm">Rows</th>
          <th class="col-hide-sm">Imported By</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($importLog as $row): ?>
        <tr>
          <td class="text-muted mono"><?= (int)$row['id'] ?></td>
          <td><?= htmlspecialchars($row['filename'] ?? '—', ENT_QUOTES, 'UTF-8') ?></td>
          <td class="text-muted"><?= htmlspecialchars($row['source'] ?? '—', ENT_QUOTES, 'UTF-8') ?></td>
          <td class="col-hide-sm">
            <span class="text-accent"><?= number_format((int)($row['rows_imported'] ?? 0)) ?></span>
          </td>
          <td class="col-hide-sm text-muted">
            <?= htmlspecialchars($row['admin_name'] ?: ($row['admin_email'] ?: '—'), ENT_QUOTES, 'UTF-8') ?>
          </td>
          <td class="text-muted text-sm">
            <?= htmlspecialchars(
              date('d M Y, H:i', strtotime($row['imported_at'])),
              ENT_QUOTES, 'UTF-8'
            ) ?>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>
</div>

<!-- ── Quick links ───────────────────────────────────────────────────────── -->
<div class="card">
  <div class="card-title">Quick Links</div>
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <a href="<?= ADMIN_BASE ?>tools/list.php"    class="btn btn-secondary">Browse Tools</a>
    <a href="<?= ADMIN_BASE ?>tools/add.php"     class="btn btn-secondary">Add Tool</a>
    <a href="<?= ADMIN_BASE ?>import/upload.php" class="btn btn-secondary">Import CSV</a>
    <a href="http://localhost:3000/api/stats/global" target="_blank" class="btn btn-ghost btn-sm" style="margin-left:auto">
      View API →
    </a>
  </div>
</div>

<?php endif; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
