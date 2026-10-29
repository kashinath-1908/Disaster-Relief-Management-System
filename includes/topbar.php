<?php
// ============================================================
// Layout Topbar Component
// Disaster Relief & Resource Management System
// ============================================================
$pageSubtitle = $pageSubtitle ?? 'Emergency Relief Command & Logistics Platform';
$user = currentUser();

// Unread notification count
$topUnread = 0;
if ($user) {
    try {
        $stmt = getDB()->prepare("SELECT COUNT(*) FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0");
        $stmt->execute([$user['user_id']]);
        $topUnread = (int)$stmt->fetchColumn();
    } catch (Exception $e) {
        $topUnread = 0;
    }
}
?>
<header class="topbar">
  <div class="topbar-left">
    <button class="menu-toggle-btn" id="menuToggleBtn" aria-label="Toggle navigation">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div class="page-title-group">
      <h1><?= escape($pageTitle) ?></h1>
      <p><?= escape($pageSubtitle) ?></p>
    </div>
  </div>

  <div class="topbar-right">
    <div class="search-input-wrapper">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="tableQuickSearch" placeholder="Quick search records..." autocomplete="off">
    </div>

    <div class="topbar-actions">
      <a href="notifications.php" class="icon-btn" title="System Alerts">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <?php if ($topUnread > 0): ?>
          <span class="icon-badge"><?= $topUnread ?></span>
        <?php endif; ?>
      </a>

      <a href="emergency_contacts.php" class="btn btn-sm btn-emergency" title="Emergency Hotline Directory">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>Emergency Helplines</span>
      </a>

      <?php if ($user): ?>
      <a href="logout.php" class="btn btn-sm btn-outline" title="Sign out of system">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span>Logout</span>
      </a>
      <?php endif; ?>
    </div>
  </div>
</header>
<main class="content-body">
  <?php if ($msg = getFlash('success')): ?>
    <div class="alert alert-success">
      <span><?= escape($msg) ?></span>
      <button type="button" class="btn-icon-only" onclick="this.parentElement.remove()">✕</button>
    </div>
  <?php endif; ?>
  <?php if ($msg = getFlash('error')): ?>
    <div class="alert alert-error">
      <span><?= escape($msg) ?></span>
      <button type="button" class="btn-icon-only" onclick="this.parentElement.remove()">✕</button>
    </div>
  <?php endif; ?>
  <?php if ($msg = getFlash('info')): ?>
    <div class="alert alert-info">
      <span><?= escape($msg) ?></span>
      <button type="button" class="btn-icon-only" onclick="this.parentElement.remove()">✕</button>
    </div>
  <?php endif; ?>
