<?php
/**
 * import/process.php — CSV Parser and Database Importer
 *
 * Receives the CSV file uploaded by import/upload.php, parses it row-by-row,
 * inserts valid rows into usage_stats, and logs the import to data_import_log.
 *
 * This page only handles POST requests.  GET requests are redirected to upload.php.
 *
 * Processing steps:
 *   1. Verify CSRF token and that a valid file was uploaded.
 *   2. Detect the header row and map column names to positions (order-independent).
 *   3. Build a lookup map: tool_slug → tool_id (and industry_slug → industry_id).
 *   4. For each data row:
 *      a. Extract and validate required fields (tool_slug, year, usage_percent).
 *      b. Look up tool_id and industry_id (NULL for global rows).
 *      c. If skip_duplicates is on, check whether the row already exists.
 *      d. INSERT into usage_stats.
 *   5. Log the import to data_import_log.
 *   6. Display a summary table showing the result for every row.
 *
 * Error handling:
 *   - Rows with invalid data are skipped and counted separately.
 *   - A single bad row never aborts the entire import.
 *   - All DB operations are wrapped in a transaction so a mid-import failure
 *     can be rolled back cleanly.
 *   - The summary shows exactly which rows succeeded, were skipped, or failed.
 *
 * Security:
 *   - CSRF token verified before any file is read.
 *   - All DB values are parameterised (no string interpolation into SQL).
 *   - File is read from the PHP temp directory — never permanently stored.
 *   - htmlspecialchars() on every CSV value displayed in the results table.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/auth.php';

requireLogin();

// Redirect GET requests back to the upload form
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . ADMIN_BASE . 'import/upload.php');
    exit;
}

$pageTitle  = 'Import Results';
$activePage = 'import';

/* ── Validate CSRF and file upload ──────────────────────────────────────────
 */
$fatalError = null;

if (!verifyCsrfToken($_POST['_csrf_token'] ?? '')) {
    $fatalError = 'Invalid CSRF token. Please go back and try again.';
}

$sourceLabel   = trim($_POST['source_label']   ?? '');
$skipDuplicates = isset($_POST['skip_duplicates']);

if (!$fatalError && $sourceLabel === '') {
    $fatalError = 'Source label is required.';
}

$uploadedFile = $_FILES['csv_file'] ?? null;

if (!$fatalError) {
    if (!$uploadedFile || $uploadedFile['error'] !== UPLOAD_ERR_OK) {
        // Map PHP's upload error codes to human-readable messages
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds the server upload_max_filesize limit.',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds the form MAX_FILE_SIZE limit.',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded.',
            UPLOAD_ERR_NO_FILE    => 'No file was selected.',
            UPLOAD_ERR_NO_TMP_DIR => 'Server temporary directory is missing.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
            UPLOAD_ERR_EXTENSION  => 'A PHP extension blocked the upload.',
        ];
        $code       = $uploadedFile['error'] ?? UPLOAD_ERR_NO_FILE;
        $fatalError = $uploadErrors[$code] ?? "Upload error code {$code}.";
    }
}

// Verify the file has a .csv extension (MIME types are unreliable for CSV)
if (!$fatalError) {
    $ext = strtolower(pathinfo($uploadedFile['name'], PATHINFO_EXTENSION));
    if ($ext !== 'csv') {
        $fatalError = 'Only .csv files are accepted.';
    }
}

/* ── Show fatal error early, before we try to open the file ─────────────────
 */
if ($fatalError) {
    require_once dirname(__DIR__) . '/includes/header.php';
    echo '<div class="alert alert-error">' . htmlspecialchars($fatalError, ENT_QUOTES, 'UTF-8') . '</div>';
    echo '<a href="' . ADMIN_BASE . 'import/upload.php" class="btn btn-secondary">← Try Again</a>';
    require_once dirname(__DIR__) . '/includes/footer.php';
    exit;
}

/* ── Build slug → id lookup maps ────────────────────────────────────────────
 * Pre-load all tool slugs and industry slugs into arrays so we can do
 * O(1) lookups per row instead of one DB query per row.
 */
$toolMap     = [];   // slug → id
$industryMap = [];   // slug → id

try {
    $db = getDb();

    // All active tools
    $rows = $db->query('SELECT id, slug FROM tools WHERE is_active = 1')->fetchAll();
    foreach ($rows as $r) {
        $toolMap[$r['slug']] = (int)$r['id'];
    }

    // All industries
    $rows = $db->query('SELECT id, slug FROM industries')->fetchAll();
    foreach ($rows as $r) {
        $industryMap[$r['slug']] = (int)$r['id'];
    }

} catch (RuntimeException | PDOException $e) {
    require_once dirname(__DIR__) . '/includes/header.php';
    echo '<div class="alert alert-error">Database error: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</div>';
    echo '<a href="' . ADMIN_BASE . 'import/upload.php" class="btn btn-secondary">← Try Again</a>';
    require_once dirname(__DIR__) . '/includes/footer.php';
    exit;
}

/* ── Parse the CSV file ─────────────────────────────────────────────────────
 *
 * We use fgetcsv() — the correct PHP function for CSV parsing — rather than
 * explode(',') because fgetcsv() handles quoted fields, embedded commas,
 * and multi-line values correctly.
 *
 * Required columns (order-independent via header mapping):
 *   tool_slug, year, usage_percent
 *
 * Optional columns:
 *   industry_slug, satisfaction, sample_size, source
 */

// Result tracking
$results      = [];   // one entry per data row: ['row', 'status', 'message']
$importedCount = 0;
$skippedCount  = 0;
$errorCount    = 0;

// Column index map built from the header row
$colMap = [];

// Required columns — import aborts if any are missing from the header
$requiredCols = ['tool_slug', 'year', 'usage_percent'];

$handle = fopen($uploadedFile['tmp_name'], 'r');

if ($handle === false) {
    require_once dirname(__DIR__) . '/includes/header.php';
    echo '<div class="alert alert-error">Could not open the uploaded file.</div>';
    echo '<a href="' . ADMIN_BASE . 'import/upload.php" class="btn btn-secondary">← Try Again</a>';
    require_once dirname(__DIR__) . '/includes/footer.php';
    exit;
}

// Handle UTF-8 BOM (added by Excel when saving as CSV)
$bom = fread($handle, 3);
if ($bom !== "\xEF\xBB\xBF") {
    // Not a BOM — seek back to the start
    rewind($handle);
}

// ---- Read and parse the header row ----
$headerRow = fgetcsv($handle);
if ($headerRow === false || $headerRow === null) {
    fclose($handle);
    require_once dirname(__DIR__) . '/includes/header.php';
    echo '<div class="alert alert-error">The file appears to be empty or could not be read.</div>';
    echo '<a href="' . ADMIN_BASE . 'import/upload.php" class="btn btn-secondary">← Try Again</a>';
    require_once dirname(__DIR__) . '/includes/footer.php';
    exit;
}

// Build column-name → index map (trim whitespace, lowercase)
foreach ($headerRow as $idx => $colName) {
    $colMap[trim(strtolower($colName))] = $idx;
}

// Verify all required columns are present
$missingCols = [];
foreach ($requiredCols as $col) {
    if (!array_key_exists($col, $colMap)) {
        $missingCols[] = $col;
    }
}

if (!empty($missingCols)) {
    fclose($handle);
    require_once dirname(__DIR__) . '/includes/header.php';
    echo '<div class="alert alert-error">Missing required columns in header: <span class="mono">'
        . htmlspecialchars(implode(', ', $missingCols), ENT_QUOTES, 'UTF-8')
        . '</span>. Please check the CSV format.</div>';
    echo '<a href="' . ADMIN_BASE . 'import/upload.php" class="btn btn-secondary">← Try Again</a>';
    require_once dirname(__DIR__) . '/includes/footer.php';
    exit;
}

/* ── Database transaction ────────────────────────────────────────────────────
 * Wrap all inserts in a transaction.  If anything goes wrong after the first
 * successful INSERT, rollback() puts the database back in the pre-import state.
 */
try {
    $db->beginTransaction();

    // Prepare the INSERT statement once, execute it per valid row
    $insertStmt = $db->prepare(
        'INSERT INTO usage_stats
           (tool_id, industry_id, year, usage_percent, satisfaction, sample_size, source)
         VALUES
           (:tool_id, :industry_id, :year, :usage_percent, :satisfaction, :sample_size, :source)'
    );

    // Prepare a duplicate-check statement (used when skip_duplicates is on)
    $dupStmt = $db->prepare(
        'SELECT 1 FROM usage_stats
         WHERE tool_id     = :tool_id
           AND year        = :year
           AND (
               (:industry_id IS NULL AND industry_id IS NULL) OR
               industry_id = :industry_id2
           )
         LIMIT 1'
    );

    // ---- Process each data row ----
    $rowNumber = 1; // 1-based (header is row 0)

    while (($row = fgetcsv($handle)) !== false) {
        $rowNumber++;

        // Skip completely blank rows (common at the end of Excel exports)
        if (count(array_filter($row, fn($v) => trim($v) !== '')) === 0) {
            continue;
        }

        // Helper: safely read a column by name, returning '' if not present
        $col = function (string $name) use ($row, $colMap): string {
            $idx = $colMap[$name] ?? null;
            return $idx !== null && isset($row[$idx]) ? trim($row[$idx]) : '';
        };

        // ---- Extract fields ----
        $toolSlugRaw     = $col('tool_slug');
        $industrySlugRaw = $col('industry_slug');
        $yearRaw         = $col('year');
        $usagePctRaw     = $col('usage_percent');
        $satisfactionRaw = $col('satisfaction');
        $sampleSizeRaw   = $col('sample_size');
        $sourceRaw       = $col('source') ?: $sourceLabel;

        // ---- Validate required fields ----
        $rowErrors = [];

        if ($toolSlugRaw === '') {
            $rowErrors[] = 'tool_slug is required';
        } elseif (!isset($toolMap[$toolSlugRaw])) {
            $rowErrors[] = "tool_slug "{$toolSlugRaw}" not found in database";
        }

        $year = (int)$yearRaw;
        if ($yearRaw === '' || !ctype_digit(ltrim($yearRaw, '0')) && $year === 0) {
            $rowErrors[] = 'year is required';
        } elseif ($year < 1950 || $year > (int)date('Y')) {
            $rowErrors[] = "year {$year} is out of range (1950–" . date('Y') . ')';
        }

        if ($usagePctRaw === '') {
            $rowErrors[] = 'usage_percent is required';
        } else {
            $usagePct = (float)$usagePctRaw;
            if ($usagePct < 0 || $usagePct > 100) {
                $rowErrors[] = "usage_percent {$usagePct} is out of range (0–100)";
            }
        }

        // ---- Validate optional fields ----
        $industryId = null;
        if ($industrySlugRaw !== '') {
            if (!isset($industryMap[$industrySlugRaw])) {
                $rowErrors[] = "industry_slug "{$industrySlugRaw}" not found in database";
            } else {
                $industryId = $industryMap[$industrySlugRaw];
            }
        }

        // If this row has validation errors, record and skip
        if (!empty($rowErrors)) {
            $results[] = [
                'row'    => $rowNumber,
                'status' => 'error',
                'slug'   => $toolSlugRaw,
                'year'   => $yearRaw,
                'msg'    => implode('; ', $rowErrors),
            ];
            $errorCount++;
            continue;
        }

        // ---- Resolve IDs ----
        $toolId = $toolMap[$toolSlugRaw];

        // ---- Duplicate check ----
        if ($skipDuplicates) {
            $dupStmt->execute([
                ':tool_id'      => $toolId,
                ':year'         => $year,
                ':industry_id'  => $industryId,
                ':industry_id2' => $industryId,
            ]);
            if ($dupStmt->fetchColumn()) {
                $results[] = [
                    'row'    => $rowNumber,
                    'status' => 'skip',
                    'slug'   => $toolSlugRaw,
                    'year'   => $year,
                    'msg'    => 'Duplicate row — skipped',
                ];
                $skippedCount++;
                continue;
            }
        }

        // ---- Insert the row ----
        $insertStmt->execute([
            ':tool_id'      => $toolId,
            ':industry_id'  => $industryId,
            ':year'         => $year,
            ':usage_percent'=> $usagePct,
            ':satisfaction' => $satisfactionRaw !== '' ? (float)$satisfactionRaw : null,
            ':sample_size'  => $sampleSizeRaw  !== '' ? (int)$sampleSizeRaw    : null,
            ':source'       => $sourceRaw ?: null,
        ]);

        $results[] = [
            'row'    => $rowNumber,
            'status' => 'ok',
            'slug'   => $toolSlugRaw,
            'year'   => $year,
            'msg'    => 'Imported',
        ];
        $importedCount++;
    }

    fclose($handle);

    // ---- Log the import to data_import_log ----
    $currentAdmin = getCurrentAdmin();
    $logStmt = $db->prepare(
        'INSERT INTO data_import_log (filename, source, rows_imported, imported_by)
         VALUES (:filename, :source, :rows_imported, :imported_by)'
    );
    $logStmt->execute([
        ':filename'      => $uploadedFile['name'],
        ':source'        => $sourceLabel,
        ':rows_imported' => $importedCount,
        ':imported_by'   => $currentAdmin['id'],
    ]);

    $db->commit();

} catch (PDOException $e) {
    // If anything goes wrong, roll back the entire import
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    fclose($handle);
    error_log('[import/process.php] ' . $e->getMessage());

    require_once dirname(__DIR__) . '/includes/header.php';
    echo '<div class="alert alert-error">Database error during import: '
        . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8')
        . ' — all changes have been rolled back.</div>';
    echo '<a href="' . ADMIN_BASE . 'import/upload.php" class="btn btn-secondary">← Try Again</a>';
    require_once dirname(__DIR__) . '/includes/footer.php';
    exit;
}

/* ── Render results ──────────────────────────────────────────────────────────
 */
require_once dirname(__DIR__) . '/includes/header.php';
?>

<!-- ── Page heading ─────────────────────────────────────────────────────── -->
<div class="page-header">
  <h1 class="page-title">Import Results</h1>
  <div style="display:flex;gap:10px">
    <a href="<?= ADMIN_BASE ?>import/upload.php" class="btn btn-secondary btn-sm">↑ Import Another</a>
    <a href="<?= ADMIN_BASE ?>index.php"         class="btn btn-ghost    btn-sm">← Dashboard</a>
  </div>
</div>

<!-- ── Summary cards ────────────────────────────────────────────────────── -->
<div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:24px">
  <div class="stat-card">
    <span class="stat-value" style="color:var(--green)"><?= number_format($importedCount) ?></span>
    <span class="stat-label">Rows Imported</span>
  </div>
  <div class="stat-card">
    <span class="stat-value" style="color:var(--muted)"><?= number_format($skippedCount) ?></span>
    <span class="stat-label">Skipped (Duplicates)</span>
  </div>
  <div class="stat-card">
    <span class="stat-value" style="color:var(--red)"><?= number_format($errorCount) ?></span>
    <span class="stat-label">Errors</span>
  </div>
</div>

<!-- ── Alert summary ────────────────────────────────────────────────────── -->
<?php if ($errorCount === 0 && $importedCount > 0): ?>
  <div class="alert alert-success">
    All <?= number_format($importedCount) ?> rows imported successfully from
    <strong><?= htmlspecialchars($uploadedFile['name'], ENT_QUOTES, 'UTF-8') ?></strong>.
  </div>
<?php elseif ($importedCount === 0 && $errorCount === 0 && $skippedCount > 0): ?>
  <div class="alert alert-warning">
    No new rows imported — <?= number_format($skippedCount) ?> duplicate(s) skipped.
  </div>
<?php elseif ($importedCount === 0): ?>
  <div class="alert alert-error">
    No rows were imported. <?= $errorCount ?> row(s) had errors. See details below.
  </div>
<?php else: ?>
  <div class="alert alert-warning">
    Import complete with warnings: <?= number_format($importedCount) ?> imported,
    <?= number_format($skippedCount) ?> skipped, <?= number_format($errorCount) ?> error(s).
  </div>
<?php endif; ?>

<!-- ── Row-by-row results table ─────────────────────────────────────────── -->
<?php if (!empty($results)): ?>
<div class="table-wrap">
  <table class="data-table">
    <thead>
      <tr>
        <th>Row #</th>
        <th>Tool Slug</th>
        <th>Year</th>
        <th>Status</th>
        <th>Message</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($results as $r):
        // Choose a row class based on import status
        $rowClass = match ($r['status']) {
            'ok'    => 'import-row-ok',
            'error' => 'import-row-err',
            'skip'  => 'import-row-skip',
            default => '',
        };
        $statusLabel = match ($r['status']) {
            'ok'    => '✓ Imported',
            'error' => '✗ Error',
            'skip'  => '— Skipped',
            default => $r['status'],
        };
      ?>
      <tr class="<?= $rowClass ?>">
        <td class="mono"><?= (int)$r['row'] ?></td>
        <td class="mono"><?= htmlspecialchars($r['slug'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars((string)$r['year'], ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= $statusLabel ?></td>
        <td class="text-muted text-sm"><?= htmlspecialchars($r['msg'], ENT_QUOTES, 'UTF-8') ?></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
<?php endif; ?>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
