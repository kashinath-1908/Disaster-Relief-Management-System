<?php
// ============================================================
// System Notifications & Alert Broadcasts
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Operational Alerts & Broadcasts';
$pageSubtitle = 'Real-time Emergency Feeds, Threat Warnings & Dispatch Notifications';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();
$user = currentUser();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $action = $_POST['form_action'] ?? '';

    if ($action === 'mark_read') {
        $notifId = (int)($_POST['notification_id'] ?? 0);
        if ($notifId) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ?");
            $stmt->execute([$notifId]);
            setFlash('success', 'Notification marked as read.');
        }
        header('Location: notifications.php');
        exit;
    }

    if ($action === 'mark_all_read') {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR user_id IS NULL");
        $stmt->execute([$user['user_id']]);
        setFlash('success', 'All notifications marked as read.');
        header('Location: notifications.php');
        exit;
    }

    if ($action === 'create_broadcast') {
        requireRole(['Admin']);
        $title   = trim($_POST['title'] ?? '');
        $message = trim($_POST['message'] ?? '');
        $type    = $_POST['type'] ?? 'Alert';

        if ($title && $message) {
            $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (NULL, ?, ?, ?, 0)");
            $stmt->execute([$title, $message, $type]);
            setFlash('success', 'Broadcast alert published to all personnel.');
        } else {
            setFlash('error', 'Title and message are required.');
        }
        header('Location: notifications.php');
        exit;
    }
}

$stmt = $pdo->prepare("
    SELECT * FROM notifications 
    WHERE user_id = ? OR user_id IS NULL 
    ORDER BY is_read ASC, created_at DESC
");
$stmt->execute([$user['user_id']]);
$notifications = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span>Notification Feed (<?= count($notifications) ?>)</span>
      </h3>

      <div class="card-actions">
        <form method="POST" action="notifications.php" style="display: inline;">
          <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
          <input type="hidden" name="form_action" value="mark_all_read">
          <button type="submit" class="btn btn-sm btn-outline">Mark All Read</button>
        </form>

        <?php if (hasRole('Admin')): ?>
          <button type="button" class="btn btn-emergency btn-sm" data-modal="modalBroadcast">
            + Publish Emergency Alert
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="card-body">
      <?php if (empty($notifications)): ?>
        <div style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No notifications in your queue.
        </div>
      <?php else: ?>
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <?php foreach ($notifications as $n): ?>
            <?php
              $borderCol = '#e2e8f0';
              $badgeClass = 'badge-neutral';
              if ($n['type'] === 'Critical') {
                  $borderCol = 'var(--emergency-600)';
                  $badgeClass = 'badge-critical';
              } elseif ($n['type'] === 'Warning') {
                  $borderCol = 'var(--warning-600)';
                  $badgeClass = 'badge-warning';
              } elseif ($n['type'] === 'Alert') {
                  $borderCol = '#2563eb';
                  $badgeClass = 'badge-info';
              } elseif ($n['type'] === 'Info') {
                  $borderCol = '#16a34a';
                  $badgeClass = 'badge-success';
              }
            ?>
            <div style="background: <?= $n['is_read'] ? '#ffffff' : 'var(--bg-surface-alt)' ?>; border: 1px solid var(--border-light); border-left: 4px solid <?= $borderCol ?>; border-radius: var(--radius-md); padding: 1.15rem 1.35rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                  <span class="badge <?= $badgeClass ?>"><?= escape($n['type']) ?></span>
                  <strong style="font-size: 0.95rem; color: var(--text-main);"><?= escape($n['title']) ?></strong>
                  <?php if (!$n['is_read']): ?>
                    <span style="width: 8px; height: 8px; border-radius: 999px; background: var(--emergency-600);" title="Unread"></span>
                  <?php endif; ?>
                </div>

                <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
                  <?= nl2br(escape($n['message'])) ?>
                </p>

                <div style="font-size: 0.72rem; color: var(--text-muted);">
                  📅 <?= formatDateTime($n['created_at']) ?>
                </div>
              </div>

              <?php if (!$n['is_read']): ?>
                <form method="POST" action="notifications.php">
                  <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                  <input type="hidden" name="form_action" value="mark_read">
                  <input type="hidden" name="notification_id" value="<?= $n['notification_id'] ?>">
                  <button type="submit" class="btn btn-sm btn-outline">Acknowledge</button>
                </form>
              <?php endif; ?>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>

  <!-- ── MODAL: BROADCAST ALERT ───────────────────────────────── -->
  <div class="modal-overlay" id="modalBroadcast">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Publish Emergency Broadcast</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="notifications.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create_broadcast">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Notification Severity Type</label>
            <select name="type" class="form-select" required>
              <option value="Critical">Critical (Immediate Danger)</option>
              <option value="Alert" selected>Tactical Alert</option>
              <option value="Warning">Advisory Warning</option>
              <option value="Info">General Briefing</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Broadcast Headline</label>
            <input type="text" name="title" class="form-control" required placeholder="e.g. Red Alert: Dam Overflow Warning Issued">
          </div>

          <div class="form-group">
            <label class="form-label required">Broadcast Message Text</label>
            <textarea name="message" class="form-control" required placeholder="Detailed message for all response units..." style="min-height: 100px;"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-emergency">Publish Broadcast</button>
        </div>
      </form>
    </div>
  </div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
