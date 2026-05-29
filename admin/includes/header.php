<?php
/**
 * includes/header.php — Admin Panel HTML Head + Navigation
 *
 * Included at the top of every admin page.  Outputs the complete HTML
 * <head> section, the top navigation bar, and any pending flash message.
 *
 * Variables the calling page should set BEFORE including this file:
 *   string $pageTitle  — displayed in <title> and the <h1> at the top of content
 *   string $activePage — nav item to highlight: 'dashboard'|'tools'|'import'
 *
 * This file also calls getFlash() and renders the flash alert so callers
 * don't need to do it themselves.
 *
 * CSS is embedded rather than linked to a separate file so the admin panel
 * works regardless of whether the Nginx / Node.js frontend server is running.
 * The color palette mirrors the TechBoard brand tokens defined in
 * frontend/css/variables.css.
 */

declare(strict_types=1);

// Default values if the calling page didn't set them
$pageTitle  = $pageTitle  ?? 'Admin';
$activePage = $activePage ?? '';

// Retrieve and clear any flash message from the session
$flash = getFlash();

// Retrieve the current admin name for the nav
$currentAdmin = getCurrentAdmin();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?> — TechBoard Admin</title>

  <!-- Google Fonts: Inter (UI) + JetBrains Mono (code/CSV previews) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <style>
    /* ============================================================
       RESET & BASE
       Brand tokens match frontend/css/variables.css (dark mode).
       ============================================================ */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      /* Brand palette */
      --navy:       #0A1F33;
      --navy-mid:   #0F2840;
      --card-bg:    #12253A;
      --surface:    #1B1B1D;
      --border:     #1E3A5F;
      --text:       #D1D9E6;
      --text-2:     #4A6FA5;
      --muted:      #6B7FA3;
      --cyan:       #2DD4D4;
      --cyan-dim:   rgba(45,212,212,0.12);
      --gold:       #C5A572;
      --green:      #22c55e;
      --green-dim:  rgba(34,197,94,0.15);
      --red:        #ef4444;
      --red-dim:    rgba(239,68,68,0.15);
      --amber:      #f59e0b;
      --amber-dim:  rgba(245,158,11,0.15);

      /* Sizing */
      --nav-h:      60px;
      --radius:     8px;
      --shadow:     0 2px 12px rgba(0,0,0,0.4);
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--navy);
      color: var(--text);
      min-height: 100vh;
      font-size: 15px;
      line-height: 1.5;
    }

    a { color: var(--cyan); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ============================================================
       NAVIGATION BAR
       ============================================================ */
    .nav {
      position: sticky;
      top: 0;
      z-index: 100;
      height: var(--nav-h);
      background: var(--navy-mid);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 28px;
      gap: 0;
    }

    .nav-brand {
      color: var(--cyan);
      font-weight: 700;
      font-size: 1rem;
      letter-spacing: -0.01em;
      margin-right: 32px;
      white-space: nowrap;
      text-decoration: none;
    }
    .nav-brand:hover { text-decoration: none; opacity: 0.85; }

    .nav-brand span {
      color: var(--muted);
      font-weight: 400;
      font-size: 0.8rem;
      margin-left: 6px;
    }

    .nav-links {
      display: flex;
      gap: 2px;
      flex: 1;
    }

    .nav-links a {
      color: var(--muted);
      text-decoration: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }
    .nav-links a:hover {
      color: var(--text);
      background: var(--cyan-dim);
      text-decoration: none;
    }
    .nav-links a.active {
      color: var(--cyan);
      background: var(--cyan-dim);
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--muted);
      font-size: 0.8rem;
    }
    .nav-user strong { color: var(--text-2); }

    /* ============================================================
       PAGE CONTENT WRAPPER
       ============================================================ */
    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 28px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      gap: 16px;
    }

    .page-title {
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--text);
    }

    /* ============================================================
       FLASH ALERTS
       ============================================================ */
    .alert {
      padding: 12px 18px;
      border-radius: var(--radius);
      margin-bottom: 24px;
      font-size: 0.875rem;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .alert-success { background: var(--green-dim);  border: 1px solid rgba(34,197,94,0.3);  color: var(--green);  }
    .alert-error   { background: var(--red-dim);    border: 1px solid rgba(239,68,68,0.3);  color: var(--red);    }
    .alert-warning { background: var(--amber-dim);  border: 1px solid rgba(245,158,11,0.3); color: var(--amber);  }
    .alert-info    { background: var(--cyan-dim);   border: 1px solid rgba(45,212,212,0.25);color: var(--cyan);   }

    /* ============================================================
       STAT CARDS (dashboard grid)
       ============================================================ */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px 20px;
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: var(--cyan);
      line-height: 1.1;
    }

    .stat-label {
      display: block;
      font-size: 0.78rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 6px;
    }

    /* ============================================================
       CARD (generic container)
       ============================================================ */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      margin-bottom: 24px;
    }

    .card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }

    /* ============================================================
       TABLES
       ============================================================ */
    .table-wrap {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      background: var(--navy-mid);
      color: var(--muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-weight: 600;
      padding: 11px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }

    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
      font-size: 0.875rem;
      vertical-align: middle;
    }

    .data-table tr:last-child td { border-bottom: none; }

    .data-table tbody tr:hover td {
      background: rgba(45,212,212,0.04);
    }

    .data-table .col-actions {
      text-align: right;
      white-space: nowrap;
    }

    /* ============================================================
       FORMS
       ============================================================ */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full { grid-column: 1 / -1; }

    .form-group label {
      font-size: 0.82rem;
      color: var(--muted);
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .form-group label .required {
      color: var(--red);
      margin-left: 2px;
    }

    input[type="text"],
    input[type="url"],
    input[type="number"],
    input[type="email"],
    input[type="password"],
    input[type="file"],
    select,
    textarea {
      background: var(--navy);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      padding: 10px 14px;
      font-size: 0.875rem;
      font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
      width: 100%;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--cyan);
      box-shadow: 0 0 0 3px rgba(45,212,212,0.1);
    }

    input[type="file"] { cursor: pointer; padding: 8px 10px; }

    textarea { resize: vertical; min-height: 90px; line-height: 1.5; }

    select option { background: var(--navy-mid); }

    .help-text {
      font-size: 0.78rem;
      color: var(--muted);
      margin-top: 2px;
    }

    .field-error {
      font-size: 0.78rem;
      color: var(--red);
      margin-top: 2px;
    }

    /* Checkbox row */
    .check-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;
    }
    .check-row input[type="checkbox"] {
      width: 18px;
      height: 18px;
      min-width: 18px;
      accent-color: var(--cyan);
      cursor: pointer;
    }
    .check-row label {
      font-size: 0.875rem;
      color: var(--text);
      cursor: pointer;
      margin: 0;
    }

    /* Form actions bar */
    .form-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }

    /* ============================================================
       BUTTONS
       ============================================================ */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 9px 20px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
      text-decoration: none;
      transition: background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s;
      white-space: nowrap;
      line-height: 1;
    }
    .btn:hover { text-decoration: none; }

    .btn-primary {
      background: var(--cyan);
      color: var(--navy);
      border-color: var(--cyan);
    }
    .btn-primary:hover { background: #26b5b5; border-color: #26b5b5; }

    .btn-secondary {
      background: transparent;
      color: var(--cyan);
      border-color: var(--border);
    }
    .btn-secondary:hover { border-color: var(--cyan); background: var(--cyan-dim); }

    .btn-danger {
      background: transparent;
      color: var(--red);
      border-color: rgba(239,68,68,0.4);
    }
    .btn-danger:hover { background: var(--red-dim); border-color: var(--red); }

    .btn-ghost {
      background: transparent;
      color: var(--muted);
      border-color: transparent;
    }
    .btn-ghost:hover { color: var(--text); background: var(--cyan-dim); }

    .btn-sm { padding: 5px 12px; font-size: 0.78rem; }

    /* ============================================================
       BADGES
       ============================================================ */
    .badge {
      display: inline-block;
      padding: 2px 9px;
      border-radius: 100px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .badge-live    { background: var(--green-dim); color: var(--green);  border: 1px solid rgba(34,197,94,0.25);  }
    .badge-soon    { background: rgba(107,127,163,0.15); color: var(--muted); border: 1px solid rgba(107,127,163,0.2); }
    .badge-yes     { background: var(--cyan-dim);  color: var(--cyan);   border: 1px solid rgba(45,212,212,0.2); }
    .badge-no      { background: rgba(107,127,163,0.1); color: var(--muted); }

    /* ============================================================
       SEARCH + TOOLBAR
       ============================================================ */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .toolbar input[type="search"],
    .toolbar input[type="text"] { flex: 1; max-width: 340px; }

    /* ============================================================
       PAGINATION
       ============================================================ */
    .pagination {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .pagination a,
    .pagination span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      height: 36px;
      padding: 0 10px;
      border-radius: 6px;
      font-size: 0.85rem;
      text-decoration: none;
    }
    .pagination a {
      color: var(--text-2);
      border: 1px solid var(--border);
    }
    .pagination a:hover { border-color: var(--cyan); color: var(--cyan); }
    .pagination .pg-current {
      background: var(--cyan);
      color: var(--navy);
      font-weight: 600;
    }
    .pagination .pg-dots { color: var(--muted); }
    .pg-info { color: var(--muted); font-size: 0.8rem; margin-left: auto; }

    /* ============================================================
       CSV / CODE PREVIEW
       ============================================================ */
    .code-block {
      background: var(--navy);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px 18px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.8rem;
      color: var(--muted);
      overflow-x: auto;
      white-space: pre;
      line-height: 1.7;
    }
    .code-block .hl { color: var(--cyan); } /* highlighted column */

    /* File drop zone */
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      padding: 40px 24px;
      text-align: center;
      color: var(--muted);
      transition: border-color 0.2s, color 0.2s;
      cursor: pointer;
    }
    .drop-zone:hover,
    .drop-zone.dragover { border-color: var(--cyan); color: var(--cyan); }
    .drop-zone p { font-size: 0.875rem; margin-top: 8px; }

    /* ============================================================
       LOGIN PAGE
       ============================================================ */
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .login-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 44px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: var(--shadow);
    }

    .login-logo {
      text-align: center;
      margin-bottom: 28px;
    }
    .login-logo strong {
      display: block;
      color: var(--cyan);
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .login-logo span {
      color: var(--muted);
      font-size: 0.82rem;
    }

    /* ============================================================
       IMPORT RESULT TABLE
       ============================================================ */
    .import-row-ok  td { color: var(--green); }
    .import-row-err td { color: var(--red); }
    .import-row-skip td { color: var(--muted); }

    /* ============================================================
       UTILITIES
       ============================================================ */
    .mt-2  { margin-top:  8px; }
    .mt-4  { margin-top: 16px; }
    .mt-6  { margin-top: 24px; }
    .mb-4  { margin-bottom: 16px; }
    .text-muted  { color: var(--muted); }
    .text-accent { color: var(--cyan);  }
    .text-danger { color: var(--red);   }
    .text-sm { font-size: 0.82rem; }
    .text-xs { font-size: 0.75rem; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; }

    /* ============================================================
       RESPONSIVE
       ============================================================ */
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .content { padding: 20px 16px; }
      .nav { padding: 0 16px; }
      .nav-brand span { display: none; }
      /* Hide less-critical table columns on small screens */
      .data-table .col-hide-sm { display: none; }
    }
  </style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════════
     TOP NAVIGATION BAR
     ═══════════════════════════════════════════════════════════════ -->
<nav class="nav" role="navigation" aria-label="Admin navigation">

  <!-- Brand / logo -->
  <a href="<?= ADMIN_BASE ?>index.php" class="nav-brand">
    TechBoard <span>Admin Panel</span>
  </a>

  <!-- Navigation links — the calling page sets $activePage to highlight one -->
  <div class="nav-links">
    <a href="<?= ADMIN_BASE ?>index.php"
       class="<?= $activePage === 'dashboard' ? 'active' : '' ?>"
       aria-current="<?= $activePage === 'dashboard' ? 'page' : 'false' ?>">
      Dashboard
    </a>
    <a href="<?= ADMIN_BASE ?>tools/list.php"
       class="<?= $activePage === 'tools' ? 'active' : '' ?>"
       aria-current="<?= $activePage === 'tools' ? 'page' : 'false' ?>">
      Tools
    </a>
    <a href="<?= ADMIN_BASE ?>import/upload.php"
       class="<?= $activePage === 'import' ? 'active' : '' ?>"
       aria-current="<?= $activePage === 'import' ? 'page' : 'false' ?>">
      Import
    </a>
  </div>

  <!-- Logged-in user info + logout -->
  <div class="nav-user">
    <strong><?= htmlspecialchars($currentAdmin['name'] ?: $currentAdmin['email'], ENT_QUOTES, 'UTF-8') ?></strong>
    <a href="<?= ADMIN_BASE ?>logout.php" class="btn btn-ghost btn-sm" style="margin-left:4px">
      Logout
    </a>
  </div>

</nav>

<!-- ═══════════════════════════════════════════════════════════════
     FLASH MESSAGE
     Displayed once, then cleared from the session.
     ═══════════════════════════════════════════════════════════════ -->
<?php if ($flash): ?>
<div class="content" style="padding-bottom:0">
  <div class="alert alert-<?= htmlspecialchars($flash['type'], ENT_QUOTES, 'UTF-8') ?>" role="alert">
    <?= htmlspecialchars($flash['text'], ENT_QUOTES, 'UTF-8') ?>
  </div>
</div>
<?php endif; ?>

<!-- ═══════════════════════════════════════════════════════════════
     MAIN CONTENT (calling page continues here)
     ═══════════════════════════════════════════════════════════════ -->
<main class="content">
