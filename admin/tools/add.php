<?php
/**
 * tools/add.php — Add New Tool
 *
 * Self-posting page (GET shows blank form, POST validates and inserts).
 *
 * Fields:
 *   name          (required) — display name, e.g. "React"
 *   slug          (required) — URL-safe identifier, e.g. "react" — must be unique
 *   category_id   (required) — FK to categories table
 *   description   (optional) — short description of the tool
 *   website_url   (optional) — official website URL
 *   open_source   (optional) — checkbox, stored as TINYINT 1/0
 *   first_released(optional) — 4-digit year
 *
 * Validation rules (server-side — client-side validation is also present
 * via HTML5 required attributes and JS):
 *   - name:     non-empty, max 150 chars
 *   - slug:     non-empty, max 100 chars, lowercase alphanumeric + hyphens only, unique
 *   - category: must exist in categories table
 *   - website:  if provided, must be a valid URL
 *   - year:     if provided, must be 4 digits and between 1950 and current year
 *
 * On success: redirect to list.php with a success flash message.
 * On failure: re-render the form with field errors and the user's input preserved.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/auth.php';

requireLogin();

$pageTitle  = 'Add Tool';
$activePage = 'tools';

/* ── Fetch categories for the dropdown ─────────────────────────────────────
 */
$categories = [];
try {
    $categories = getDb()->query(
        'SELECT id, name FROM categories ORDER BY sort_order ASC, name ASC'
    )->fetchAll();
} catch (RuntimeException | PDOException $e) {
    $categories = [];
}

/* ── Form state ─────────────────────────────────────────────────────────────
 * $formData holds the user's input (preserved on validation failure).
 * $errors   holds field-level error messages, keyed by field name.
 */
$formData = [
    'name'           => '',
    'slug'           => '',
    'category_id'    => '',
    'description'    => '',
    'website_url'    => '',
    'open_source'    => 1,   // default to open source
    'first_released' => '',
];
$errors = [];

/* ── POST handler ────────────────────────────────────────────────────────────
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // CSRF protection
    if (!verifyCsrfToken($_POST['_csrf_token'] ?? '')) {
        $errors['_general'] = 'Invalid form token. Please refresh and try again.';
    } else {

        // ---- Collect and sanitise inputs ----
        $formData = [
            'name'           => trim($_POST['name']           ?? ''),
            'slug'           => trim(strtolower($_POST['slug'] ?? '')),
            'category_id'    => (int)($_POST['category_id']   ?? 0),
            'description'    => trim($_POST['description']    ?? ''),
            'website_url'    => trim($_POST['website_url']    ?? ''),
            'open_source'    => isset($_POST['open_source']) ? 1 : 0,
            'first_released' => trim($_POST['first_released'] ?? ''),
        ];

        // ---- Validate each field ----

        // Name: required, max 150 chars
        if ($formData['name'] === '') {
            $errors['name'] = 'Tool name is required.';
        } elseif (mb_strlen($formData['name']) > 150) {
            $errors['name'] = 'Tool name must be 150 characters or fewer.';
        }

        // Slug: required, format check, uniqueness check
        if ($formData['slug'] === '') {
            $errors['slug'] = 'Slug is required.';
        } elseif (!preg_match('/^[a-z0-9][a-z0-9\-]{0,98}[a-z0-9]$|^[a-z0-9]$/', $formData['slug'])) {
            $errors['slug'] = 'Slug must be lowercase letters, numbers, and hyphens only (e.g. "react", "next-js").';
        } elseif (mb_strlen($formData['slug']) > 100) {
            $errors['slug'] = 'Slug must be 100 characters or fewer.';
        } else {
            // Check uniqueness against all tools (including inactive ones)
            try {
                $dup = getDb()->prepare('SELECT 1 FROM tools WHERE slug = ? LIMIT 1');
                $dup->execute([$formData['slug']]);
                if ($dup->fetchColumn()) {
                    $errors['slug'] = 'This slug is already taken. Choose a different one.';
                }
            } catch (PDOException $e) {
                $errors['slug'] = 'Could not verify slug uniqueness.';
            }
        }

        // Category: must be a valid category ID
        if ($formData['category_id'] <= 0) {
            $errors['category_id'] = 'Please select a category.';
        } else {
            $validCatIds = array_column($categories, 'id');
            if (!in_array($formData['category_id'], array_map('intval', $validCatIds), true)) {
                $errors['category_id'] = 'Invalid category selected.';
            }
        }

        // Website URL: optional, but if provided must be a valid URL
        if ($formData['website_url'] !== '') {
            if (!filter_var($formData['website_url'], FILTER_VALIDATE_URL)) {
                $errors['website_url'] = 'Website must be a valid URL (include https://).';
            } elseif (mb_strlen($formData['website_url']) > 255) {
                $errors['website_url'] = 'URL must be 255 characters or fewer.';
            }
        }

        // First released year: optional, but if provided must be reasonable
        if ($formData['first_released'] !== '') {
            $yr = (int)$formData['first_released'];
            if ($yr < 1950 || $yr > (int)date('Y')) {
                $errors['first_released'] = 'Year must be between 1950 and ' . date('Y') . '.';
            } else {
                $formData['first_released'] = $yr; // normalise to int
            }
        }

        // ---- If no errors, insert the tool ----
        if (empty($errors)) {
            try {
                $db   = getDb();
                $stmt = $db->prepare(
                    'INSERT INTO tools
                       (category_id, slug, name, description, website_url, open_source, first_released)
                     VALUES
                       (:category_id, :slug, :name, :description, :website_url, :open_source, :first_released)'
                );
                $stmt->execute([
                    ':category_id'    => $formData['category_id'],
                    ':slug'           => $formData['slug'],
                    ':name'           => $formData['name'],
                    ':description'    => $formData['description'] ?: null,
                    ':website_url'    => $formData['website_url'] ?: null,
                    ':open_source'    => $formData['open_source'],
                    ':first_released' => $formData['first_released'] ?: null,
                ]);

                // PRG: set flash and redirect to the list so a browser refresh
                // doesn't re-submit the form
                setFlash('success', "Tool "{$formData['name']}" added successfully.");
                header('Location: ' . ADMIN_BASE . 'tools/list.php');
                exit;

            } catch (PDOException $e) {
                error_log('[tools/add.php] ' . $e->getMessage());
                $errors['_general'] = 'Database error while saving the tool. Please try again.';
            }
        }
    }
}

$csrfToken = generateCsrfToken();

require_once dirname(__DIR__) . '/includes/header.php';
?>

<!-- ── Page heading ─────────────────────────────────────────────────────── -->
<div class="page-header">
  <h1 class="page-title">Add New Tool</h1>
  <a href="<?= ADMIN_BASE ?>tools/list.php" class="btn btn-ghost btn-sm">← Back to Tools</a>
</div>

<?php if (isset($errors['_general'])): ?>
  <div class="alert alert-error"><?= htmlspecialchars($errors['_general'], ENT_QUOTES, 'UTF-8') ?></div>
<?php endif; ?>

<div class="card">
  <form method="POST" action="" novalidate>
    <!-- CSRF token -->
    <input type="hidden" name="_csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">

    <div class="form-grid">

      <!-- ── Name ── -->
      <div class="form-group">
        <label for="name">Tool Name <span class="required">*</span></label>
        <input
          type="text" id="name" name="name"
          value="<?= htmlspecialchars($formData['name'], ENT_QUOTES, 'UTF-8') ?>"
          placeholder="e.g. React" maxlength="150" required
          oninput="autoSlug(this.value)"
        >
        <?php if (isset($errors['name'])): ?>
          <span class="field-error"><?= htmlspecialchars($errors['name'], ENT_QUOTES, 'UTF-8') ?></span>
        <?php endif; ?>
      </div>

      <!-- ── Slug ── -->
      <div class="form-group">
        <label for="slug">Slug <span class="required">*</span></label>
        <input
          type="text" id="slug" name="slug"
          value="<?= htmlspecialchars($formData['slug'], ENT_QUOTES, 'UTF-8') ?>"
          placeholder="e.g. react" maxlength="100" required
          pattern="[a-z0-9][a-z0-9\-]*[a-z0-9]|[a-z0-9]"
        >
        <span class="help-text">Lowercase letters, numbers, and hyphens only. Auto-filled from name.</span>
        <?php if (isset($errors['slug'])): ?>
          <span class="field-error"><?= htmlspecialchars($errors['slug'], ENT_QUOTES, 'UTF-8') ?></span>
        <?php endif; ?>
      </div>

      <!-- ── Category ── -->
      <div class="form-group">
        <label for="category_id">Category <span class="required">*</span></label>
        <select id="category_id" name="category_id" required>
          <option value="">— Select category —</option>
          <?php foreach ($categories as $cat): ?>
            <option
              value="<?= (int)$cat['id'] ?>"
              <?= (int)$formData['category_id'] === (int)$cat['id'] ? 'selected' : '' ?>
            >
              <?= htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8') ?>
            </option>
          <?php endforeach; ?>
        </select>
        <?php if (isset($errors['category_id'])): ?>
          <span class="field-error"><?= htmlspecialchars($errors['category_id'], ENT_QUOTES, 'UTF-8') ?></span>
        <?php endif; ?>
      </div>

      <!-- ── First Released ── -->
      <div class="form-group">
        <label for="first_released">First Released (Year)</label>
        <input
          type="number" id="first_released" name="first_released"
          value="<?= htmlspecialchars((string)$formData['first_released'], ENT_QUOTES, 'UTF-8') ?>"
          placeholder="e.g. 2013" min="1950" max="<?= date('Y') ?>"
        >
        <?php if (isset($errors['first_released'])): ?>
          <span class="field-error"><?= htmlspecialchars($errors['first_released'], ENT_QUOTES, 'UTF-8') ?></span>
        <?php endif; ?>
      </div>

      <!-- ── Website URL ── -->
      <div class="form-group">
        <label for="website_url">Official Website</label>
        <input
          type="url" id="website_url" name="website_url"
          value="<?= htmlspecialchars($formData['website_url'], ENT_QUOTES, 'UTF-8') ?>"
          placeholder="https://example.com" maxlength="255"
        >
        <?php if (isset($errors['website_url'])): ?>
          <span class="field-error"><?= htmlspecialchars($errors['website_url'], ENT_QUOTES, 'UTF-8') ?></span>
        <?php endif; ?>
      </div>

      <!-- ── Open Source ── -->
      <div class="form-group" style="justify-content:flex-end">
        <label style="visibility:hidden">Space</label>
        <div class="check-row">
          <input
            type="checkbox" id="open_source" name="open_source" value="1"
            <?= $formData['open_source'] ? 'checked' : '' ?>
          >
          <label for="open_source">Open Source</label>
        </div>
      </div>

      <!-- ── Description ── -->
      <div class="form-group full">
        <label for="description">Description</label>
        <textarea id="description" name="description" placeholder="Short description of the tool…"><?= htmlspecialchars($formData['description'], ENT_QUOTES, 'UTF-8') ?></textarea>
      </div>

    </div><!-- end form-grid -->

    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Save Tool</button>
      <a href="<?= ADMIN_BASE ?>tools/list.php" class="btn btn-ghost">Cancel</a>
    </div>
  </form>
</div>

<!-- ── Slug auto-fill script ─────────────────────────────────────────────── -->
<script>
/**
 * autoSlug() — convert a tool name into a URL-safe slug.
 *
 * Only auto-fills while the slug field is empty (doesn't overwrite a
 * manually entered slug after the user has edited it).
 *
 * Transformation rules:
 *   1. Lowercase
 *   2. Replace spaces and underscores with hyphens
 *   3. Remove any character that is not a-z, 0-9, or a hyphen
 *   4. Collapse consecutive hyphens into one
 *   5. Trim leading/trailing hyphens
 *
 * @param {string} name — current value of the name input
 */
function autoSlug(name) {
  var slugInput = document.getElementById('slug');
  // Don't overwrite if the user has manually typed in the slug field
  if (slugInput.dataset.userEdited === 'true') return;

  var slug = name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')      // spaces and underscores → hyphens
    .replace(/[^a-z0-9\-]/g, '') // remove non-alphanumeric (except hyphens)
    .replace(/-{2,}/g, '-')      // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '');    // trim leading/trailing hyphens

  slugInput.value = slug;
}

// Mark the slug field as "user-edited" if they type in it directly
document.getElementById('slug').addEventListener('input', function () {
  this.dataset.userEdited = 'true';
});
</script>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
