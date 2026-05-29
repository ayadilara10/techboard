<?php
/**
 * import/upload.php — CSV Upload Form
 *
 * Presents the file upload interface and documents the expected CSV format.
 * The form posts to process.php which does the actual parsing and DB insertion.
 *
 * Accepted CSV format (header row required):
 *
 *   tool_slug, industry_slug, year, usage_percent, satisfaction, sample_size, source
 *
 * Column descriptions:
 *   tool_slug     (required) — must match an existing tools.slug value
 *   industry_slug (optional) — must match an existing industries.slug; leave blank for global
 *   year          (required) — 4-digit year, e.g. 2024
 *   usage_percent (required) — decimal 0–100, e.g. 42.30
 *   satisfaction  (optional) — decimal satisfaction score, e.g. 4.2
 *   sample_size   (optional) — integer number of survey respondents
 *   source        (optional) — source label, e.g. "Stack Overflow Survey 2024"
 *
 * This page only presents the form.  All parsing and validation happens in
 * process.php to keep responsibilities separated.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/auth.php';

requireLogin();

$pageTitle  = 'Import CSV';
$activePage = 'import';

/* ── Load tool and industry lists for the format reference table ─────────────
 * Showing a sample of real slugs helps admins understand what values
 * the CSV is allowed to contain.
 */
$sampleTools      = [];
$sampleIndustries = [];

try {
    $db = getDb();

    $sampleTools = $db->query(
        'SELECT slug, name FROM tools WHERE is_active = 1 ORDER BY name ASC LIMIT 10'
    )->fetchAll();

    $sampleIndustries = $db->query(
        'SELECT slug, name FROM industries ORDER BY sort_order ASC'
    )->fetchAll();

} catch (RuntimeException | PDOException) {
    // Non-fatal — the form still works; the reference tables just won't appear
}

$csrfToken = generateCsrfToken();

require_once dirname(__DIR__) . '/includes/header.php';
?>

<!-- ── Page heading ─────────────────────────────────────────────────────── -->
<div class="page-header">
  <h1 class="page-title">Import CSV</h1>
  <a href="<?= ADMIN_BASE ?>index.php" class="btn btn-ghost btn-sm">← Dashboard</a>
</div>

<!-- ── Upload form ──────────────────────────────────────────────────────── -->
<div class="card">
  <div class="card-title">Upload a CSV File</div>

  <form method="POST"
        action="<?= ADMIN_BASE ?>import/process.php"
        enctype="multipart/form-data"
        novalidate
        id="uploadForm">

    <input type="hidden" name="_csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">

    <!-- Source label — stored in data_import_log for audit trail -->
    <div class="form-group mb-4" style="max-width:480px">
      <label for="source_label">Data Source Label <span class="required">*</span></label>
      <input
        type="text"
        id="source_label"
        name="source_label"
        placeholder='e.g. Stack Overflow Survey 2024'
        maxlength="150"
        required
      >
      <span class="help-text">
        Used as the default "source" value for rows that have an empty source column.
        Also logged in the import history.
      </span>
    </div>

    <!-- File drop zone -->
    <div class="drop-zone" id="dropZone" onclick="document.getElementById('csvFile').click()">
      <div style="font-size:2rem;margin-bottom:8px">📄</div>
      <strong style="color:var(--text)">Click to choose a CSV file</strong>
      <p>or drag and drop here</p>
      <p id="fileLabel" class="text-accent mt-2" style="display:none"></p>
    </div>

    <!-- Actual file input (hidden, triggered by the drop zone click) -->
    <input
      type="file"
      id="csvFile"
      name="csv_file"
      accept=".csv,text/csv"
      required
      style="display:none"
      onchange="handleFileSelect(this)"
    >

    <!-- Skip duplicates option -->
    <div class="check-row mt-4">
      <input type="checkbox" id="skip_duplicates" name="skip_duplicates" value="1" checked>
      <label for="skip_duplicates">
        Skip duplicate rows (same tool + industry + year already exists in the database)
      </label>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn btn-primary" id="submitBtn" disabled>
        ↑ Upload &amp; Import
      </button>
      <span class="text-muted text-sm">Maximum file size: <?= ini_get('upload_max_filesize') ?></span>
    </div>
  </form>
</div>

<!-- ── CSV Format documentation ─────────────────────────────────────────── -->
<div class="card">
  <div class="card-title">Expected CSV Format</div>

  <p class="text-muted text-sm mb-4">
    The first row must be a header row with the exact column names shown below.
    Columns can be in any order as long as the header names match.
    Rows with fatal errors (missing required fields, unknown tool slug) are skipped
    and reported in the import summary.
  </p>

  <!-- Column reference table -->
  <div class="table-wrap mb-4">
    <table class="data-table">
      <thead>
        <tr>
          <th>Column</th>
          <th>Required</th>
          <th>Type</th>
          <th>Example</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono text-accent">tool_slug</td>
          <td><span class="badge badge-live">Yes</span></td>
          <td class="text-muted">string</td>
          <td class="mono">react</td>
          <td class="text-muted text-sm">Must match an existing tool slug (see table below)</td>
        </tr>
        <tr>
          <td class="mono text-accent">industry_slug</td>
          <td><span class="badge badge-no">No</span></td>
          <td class="text-muted">string</td>
          <td class="mono">fintech</td>
          <td class="text-muted text-sm">Leave blank for global (all-industry) stats</td>
        </tr>
        <tr>
          <td class="mono text-accent">year</td>
          <td><span class="badge badge-live">Yes</span></td>
          <td class="text-muted">integer</td>
          <td class="mono">2024</td>
          <td class="text-muted text-sm">4-digit year, 1950–<?= date('Y') ?></td>
        </tr>
        <tr>
          <td class="mono text-accent">usage_percent</td>
          <td><span class="badge badge-live">Yes</span></td>
          <td class="text-muted">decimal</td>
          <td class="mono">42.30</td>
          <td class="text-muted text-sm">0.00–100.00, two decimal places</td>
        </tr>
        <tr>
          <td class="mono text-accent">satisfaction</td>
          <td><span class="badge badge-no">No</span></td>
          <td class="text-muted">decimal</td>
          <td class="mono">4.2</td>
          <td class="text-muted text-sm">Developer satisfaction score (any scale)</td>
        </tr>
        <tr>
          <td class="mono text-accent">sample_size</td>
          <td><span class="badge badge-no">No</span></td>
          <td class="text-muted">integer</td>
          <td class="mono">65000</td>
          <td class="text-muted text-sm">Number of survey respondents</td>
        </tr>
        <tr>
          <td class="mono text-accent">source</td>
          <td><span class="badge badge-no">No</span></td>
          <td class="text-muted">string</td>
          <td class="mono">Stack Overflow Survey 2024</td>
          <td class="text-muted text-sm">Falls back to "Source Label" field above</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Example CSV content -->
  <p class="text-muted text-sm mb-4">Example CSV content:</p>
  <div class="code-block"
><span class="hl">tool_slug</span>,industry_slug,year,usage_percent,satisfaction,sample_size,source
react,,2024,42.30,4.5,65000,Stack Overflow Survey 2024
react,fintech,2024,38.10,4.2,8000,Stack Overflow Survey 2024
vue,,2024,18.70,4.3,65000,Stack Overflow Survey 2024
nextjs,saas,2024,55.20,4.6,14500,Stack Overflow Survey 2024
postgresql,,2024,49.00,4.7,65000,Stack Overflow Survey 2024</div>
</div>

<!-- ── Valid slugs reference ─────────────────────────────────────────────── -->
<?php if (!empty($sampleTools)): ?>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

  <div class="card">
    <div class="card-title">Tool Slugs (first 10)</div>
    <div class="table-wrap" style="border:none;border-radius:0">
      <table class="data-table">
        <thead><tr><th>Slug</th><th>Name</th></tr></thead>
        <tbody>
          <?php foreach ($sampleTools as $t): ?>
          <tr>
            <td class="mono text-accent"><?= htmlspecialchars($t['slug'], ENT_QUOTES, 'UTF-8') ?></td>
            <td class="text-muted"><?= htmlspecialchars($t['name'], ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <p class="text-muted text-xs mt-2">
      <a href="<?= ADMIN_BASE ?>tools/list.php">Browse all tool slugs →</a>
    </p>
  </div>

  <?php if (!empty($sampleIndustries)): ?>
  <div class="card">
    <div class="card-title">Industry Slugs</div>
    <div class="table-wrap" style="border:none;border-radius:0">
      <table class="data-table">
        <thead><tr><th>Slug</th><th>Name</th></tr></thead>
        <tbody>
          <?php foreach ($sampleIndustries as $ind): ?>
          <tr>
            <td class="mono text-accent"><?= htmlspecialchars($ind['slug'], ENT_QUOTES, 'UTF-8') ?></td>
            <td class="text-muted"><?= htmlspecialchars($ind['name'], ENT_QUOTES, 'UTF-8') ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <p class="text-muted text-xs mt-2">Leave industry_slug blank → global stats.</p>
  </div>
  <?php endif; ?>

</div><!-- end grid -->
<?php endif; ?>

<!-- ── JS for drag-drop and file selection ───────────────────────────────── -->
<script>
/**
 * handleFileSelect() — update the drop zone UI when a file is chosen.
 * Enables the submit button only when a file has been selected.
 *
 * @param {HTMLInputElement} input
 */
function handleFileSelect(input) {
  var label  = document.getElementById('fileLabel');
  var submit = document.getElementById('submitBtn');

  if (input.files && input.files[0]) {
    var file = input.files[0];
    label.textContent = '✓ ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
    label.style.display = 'block';
    submit.disabled = false;
  } else {
    label.style.display = 'none';
    submit.disabled = true;
  }
}

/* Drag-and-drop handling for the drop zone */
(function () {
  var zone = document.getElementById('dropZone');
  var input = document.getElementById('csvFile');

  zone.addEventListener('dragover', function (e) {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', function () {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', function (e) {
    e.preventDefault();
    zone.classList.remove('dragover');
    // Transfer the dropped file to the hidden input and trigger the handler
    if (e.dataTransfer.files.length > 0) {
      input.files = e.dataTransfer.files;
      handleFileSelect(input);
    }
  });
}());
</script>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
