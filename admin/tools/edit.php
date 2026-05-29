<?php
/**
 * tools/edit.php — Edit Existing Tool
 *
 * Self-posting page (GET shows pre-populated form, POST validates and updates).
 *
 * GET params:
 *   id (int, required) — ID of the tool to edit
 *
 * POST params:
 *   Same fields as add.php, plus:
 *   tool_id      — echoed from the GET param to keep the target consistent
 *   _csrf_token  — CSRF token
 *
 * Differences from add.php:
 *   - The slug uniqueness check excludes the current tool's own slug so you
 *     can save without changing it.
 *   - A "Reactivate" checkbox is shown if the tool is currently deactivated.
 *   - On success, redirects back to the edit form (not the list) so the admin
 *     can see the saved values and make further edits if needed.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/includes/db.php';
require_once dirname(__DIR__) . '/includes/auth.php';

requireLogin();

$pageTitle  = 'Edit Tool';
$activePage = 'tools';

/* ── Load the tool to edit ───────────────────────────────────────────────────
 * Accept tool_id from GET (initial page load) or POST (form re-render on error).
 */
$toolId = (int)(
    $_SERVER['REQUEST_METHOD'] === 'POST'
        ? ($_POST['tool_id']  ?? 0)
        : ($_GET['id']        ?? 0)
);

if ($toolId <= 0) {
    setFlash('error', 'No tool ID provided.');
    header('Location: ' . ADMIN_BASE . 'tools/list.php');
    exit;
}

$tool       = null;
$categories = [];
$dbError    = null;

try {
    $db = getDb();

    // Fetch the tool — allow editing inactive tools (so you can reactivate them)
    $stmt = $db->prepare(
        'SELECT t.id, t.slug, t.name, t.description, t.website_url,
                t.open_source, t.first_released, t.is_active, t.category_id,
                c.name AS category_name
         FROM   tools t
         JOIN   categories c ON c.id = t.category_id
         WHERE  t.id = ?
         LIMIT  1'
    );
    $stmt->execute([$toolId]);
    $tool = $stmt->fetch();

    if (!$tool) {
        setFlash('error', "Tool #{$toolId} not found.");
        header('Location: ' . ADMIN_BASE . 'tools/list.php');
        exit;
    }

    // Fetch categories for the dropdown
    $categories = $db->query(
        'SELECT id, name FROM categories ORDER BY sort_order ASC, name ASC'
    )->fetchAll();

} catch (RuntimeException | PDOException $e) {
    $dbError = $e->getMessage();
}

/* ── Form state ─────────────────────────────────────────────────────────────
 * On GET, pre-populate from the DB row.
 * On POST (validation error), keep the user's submitted values.
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $formData = [
        'name'           => trim($_POST['name']           ?? ''),
        'slug'           => trim(strtolower($_POST['slug'] ?? '')),
        'category_id'    => (int)($_POST['category_id']   ?? 0),
        'description'    => trim($_POST['description']    ?? ''),
        'website_url'    => trim($_POST['website_url']    ?? ''),
        'open_source'    => isset($_POST['open_source']) ? 1 : 0,
        'first_released' => trim($_POST['first_released'] ?? ''),
        'is_active'      => isset($_POST['is_active'])   ? 1 : 0,
    ];
} else {
    // Pre-populate from the DB row
    $formData = [
        'name'           => $tool['name']           ?? '',
        'slug'           => $tool['slug']           ?? '',
        'category_id'    => $tool['category_id']    ?? '',
        'description'    => $tool['description']    ?? '',
        'website_url'    => $tool['website_url']    ?? '',
        'open_source'    => (int)($tool['open_source']    ?? 1),
        'first_released' => $tool['first_released'] ?? '',
        'is_active'      => (int)($tool['is_active']      ?? 1),
    ];
}

$errors = [];

/* ── POST handler ────────────────────────────────────────────────────────────
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // CSRF check
    if (!verifyCsrfToken($_POST['_csrf_token'] ?? '')) {
        $errors['_general'] = 'Invalid form token. Please refresh and try again.';

    } elseif ($dbError) {
        $errors['_general'] = 'Database unavailable.';

    } else {

        // ---- Validate ----

        if ($formData['name'] === '') {
            $errors['name'] = 'Tool name is required.';
        } elseif (mb_strlen($formData['name']) > 150) {
            $errors['name'] = 'Tool name must be 150 characters or fewer.';
        }

        if ($formData['slug'] === '') {
            $errors['slug'] = 'Slug is required.';
        } elseif (!preg_match('/^[a-z0-9][a-z0-9\-]{0,98}[a-z0-9]$|^[a-z0-9]$/', $formData['slug'])) {
            $errors['slug'] = 'Slug must be lowercase letters, numbers, and hyphens only.';
        } else {
            // Uniqueness check — exclude the current tool so an unchanged slug passes
            try {
                $dup = $db->prepare(
                    'SELECT 1 FROM tools WHERE slug = ? AND id != ? LIMIT 1'
                );
                $dup->execute([$formData['slug'], $toolId]);
                if ($dup->fetchColumn()) {
                    $errors['slug'] = 'This slug is already taken by another tool.';
                }
            } catch (PDOException $e) {
                $errors['slug'] = 'Could not verify slug uniqueness.';
            }
        }

        if ($formData['category_id'] <= 0) {
            $errors['category_id'] = 'Please select a category.';
        } else {
            $validIds = array_map('intval', array_column($categories, 'id'));
            if (!in_array($formData['category_id'], $validIds, true)) {
                $errors['category_id'] = 'Invalid category.';
            }
        }

        if ($formData['website_url'] !== '') {
            if (!filter_var($formData['website_url'], FILTER_VALIDATE_URL)) {
                $errors['website_url'] = 'Must be a valid URL (include https://).';
            } elseif (mb_strlen($formData['website_url']) > 255) {
                $errors['website_url'] = 'URL must be 255 characters or fewer.';
            }
        }

        if ($formData['first_released'] !== '') {
            $yr = (int)$formData['first_released'];
            if ($yr < 1950 || $yr > (int)date('Y')) {
                $errors['first_released'] = 'Year must be between 1950 and ' . date('Y') . '.';
            } else {
                $formData['first_released'] = $yr;
            }
        }

        // ---- Save if valid ----
        if (empty($errors)) {
            try {
                $stmt = $db->prepare(
                    'UPDATE tools SET
                       category_id    = :category_id,
                       slug           = :slug,
                       name           = :name,
                       description    = :description,
                       website_url    = :website_url,
                       open_source    = :open_source,
                       first_released = :first_released,
                       is_active      = :is_active
                     WHERE id = :id'
                );
                $stmt->execute([
                    ':category_id'    => $formData['category_id'],
                    ':slug'           => $formData['slug'],
                    ':name'           => $formData['name'],
                    ':description'    => $formData['description'] ?: null,
                    ':website_url'    => $formData['website_url'] ?: null,
                    ':open_source'    => $formData['open_source'],
                    ':first_released' => $formData['first_released'] ?: null,
                    ':is_active'      => $formData['is_active'],
                    ':id'             => $toolId,
                ]);

                setFlash('success', ""{$formData['name']}" updated successfully.");
                header('Location: ' . ADMIN_BASE . 'tools/edit.php?id=' . $toolId);
                exit;

            } catch (PDOException $e) {
                error_log('[tools/edit.php] ' . $e->getMessage());
                $errors['_general'] = 'Database error while saving. Please try again.';
            }
        }
    }
}

$csrfToken = generateCsrfToken();

require_once dirname(__DIR__) . '/includes/header.php';
?>

<!-- ── Page heading ─────────────────────────────────────────────────────── -->
<div class="page-header">
  <h1 class="page-title">
    Edit Tool
    <span class="text-muted" style="font-size:1rem;font-weight:400">
      — <?= htmlspecialchars($tool['name'] ?? '', ENT_QUOTES, 'UTF-8') ?>
    </span>
  </h1>
  <a href="<?= ADMIN_BASE ?>tools/list.php" class="btn btn-ghost btn-sm">← Back to Tools</a>
</div>

<?php if ($dbError): ?>
  <div class="alert alert-error"><?= htmlspecialchars($dbError, ENT_QUOTES, 'UTF-8') ?></div>
<?php else: ?>

<!-- Inactive tool warning -->
<?php if (!$formData['is_active'] && $_SERVER['REQUEST_METHOD'] !== 'POST'): ?>
  <div class="alert alert-warning">
    This tool is currently <strong>deactivated</strong> and hidden from the public API.
    Check "Reactivate" at the bottom of the form to restore it.
  </div>
<?php endif; ?>

<?php if (isset($errors['_general'])): ?>
  <div class="alert alert-error"><?= htmlspecialchars($errors['_general'], ENT_QUOTES, 'UTF-8') ?></div>
<?php endif; ?>

<div class="card">
  <form method="POST" action="" novalidate>
    <input type="hidden" name="_csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
    <!-- Echo back the tool ID so POST can identify which row to update -->
    <input type="hidden" name="tool_id" value="<?= $toolId ?>">

    <div class="form-grid">

      <!-- ── Name ── -->
      <div class="form-group">
        <label for="name">Tool Name <span class="required">*</span></label>
        <input
          type="text" id="name" name="name"
          value="<?= htmlspecialchars($formData['name'], ENT_QUOTES, 'UTF-8') ?>"
          placeholder="e.g. React" maxlength="150" required
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
        <span class="help-text">Changing the slug will break any existing links to this tool.</span>
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
          value="<?= htmlspecialchars($formData['website_url'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
          placeholder="https://example.com" maxlength="255"
        >
        <?php if (isset($errors['website_url'])): ?>
          <span class="field-error"><?= htmlspecialchars($errors['website_url'], ENT_QUOTES, 'UTF-8') ?></span>
        <?php endif; ?>
      </div>

      <!-- ── Checkboxes ── -->
      <div class="form-group" style="justify-content:flex-end;gap:8px">
        <label style="visibility:hidden">Space</label>
        <div class="check-row">
          <input type="checkbox" id="open_source" name="open_source" value="1"
            <?= $formData['open_source'] ? 'checked' : '' ?>>
          <label for="open_source">Open Source</label>
        </div>
        <?php if (!($tool['is_active'] ?? 1)): ?>
        <div class="check-row">
          <input type="checkbox" id="is_active" name="is_active" value="1"
            <?= $formData['is_active'] ? 'checked' : '' ?>>
          <label for="is_active" style="color:var(--amber)">Reactivate this tool</label>
        </div>
        <?php else: ?>
          <!-- Always submit is_active=1 for currently-active tools -->
          <input type="hidden" name="is_active" value="1">
        <?php endif; ?>
      </div>

      <!-- ── Description ── -->
      <div class="form-group full">
        <label for="description">Description</label>
        <textarea id="description" name="description"><?= htmlspecialchars($formData['description'] ?? '', ENT_QUOTES, 'UTF-8') ?></textarea>
      </div>

    </div><!-- end form-grid -->

    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Save Changes</button>
      <a href="<?= ADMIN_BASE ?>tools/list.php" class="btn btn-ghost">Cancel</a>
      <!-- Metadata display -->
      <span class="text-muted text-sm" style="margin-left:auto">
        Tool ID: <span class="mono"><?= $toolId ?></span>
        &middot;
        Status: <?= $formData['is_active']
          ? '<span class="badge badge-live">Active</span>'
          : '<span class="badge badge-soon">Inactive</span>' ?>
      </span>
    </div>
  </form>
</div>

<?php endif; // dbError ?>

<?php require_once dirname(__DIR__) . '/includes/footer.php'; ?>
