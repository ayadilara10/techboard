<?php
/**
 * includes/footer.php — Admin Panel HTML Footer
 *
 * Closes the <main> tag opened by header.php and outputs the page footer.
 * Included at the bottom of every admin page, just before </body></html>.
 *
 * Usage (at the end of every admin page):
 *   require_once __DIR__ . '/../includes/footer.php';
 *   // or, from admin root:
 *   require_once __DIR__ . '/includes/footer.php';
 */
declare(strict_types=1);
?>

</main><!-- end .content -->

<!-- ═══════════════════════════════════════════════════════════════
     SITE FOOTER
     ═══════════════════════════════════════════════════════════════ -->
<footer style="
  border-top: 1px solid #1E3A5F;
  padding: 16px 28px;
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #6B7FA3;
">
  <span>
    <strong style="color:#2DD4D4">TechBoard</strong> Admin Panel
    &nbsp;&middot;&nbsp;
    Tech Stack Intelligence Platform
  </span>
  <span>
    <?= htmlspecialchars(date('Y'), ENT_QUOTES, 'UTF-8') ?>
    &nbsp;&middot;&nbsp;
    PHP <?= htmlspecialchars(PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION, ENT_QUOTES, 'UTF-8') ?>
    &nbsp;&middot;&nbsp;
    <a href="<?= ADMIN_BASE ?>index.php" style="color:#4A6FA5">Dashboard</a>
  </span>
</footer>

</body>
</html>
