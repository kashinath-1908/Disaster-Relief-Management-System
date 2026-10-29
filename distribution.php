<?php
// ============================================================
// Resource Distribution Tracking
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Resource Distribution Registry';
$pageSubtitle = 'Log Supplies Handed to Affected Citizens & Track Center Outflow';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();
$user = currentUser();

// Record distribution
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator', 'Volunteer']);

    $disasterId = (int)($_POST['disaster_id'] ?? 0);
    $centerId   = !empty($_POST['center_id']) ? (int)$_POST['center_id'] : null;
    $resourceId = (int)($_POST['resource_id'] ?? 0);
    $qty        = (int)($_POST['quantity_distributed'] ?? 0);
    $distDate   = $_POST['distribution_date'] ?? date('Y-m-d');

    if ($disasterId && $resourceId && $qty > 0) {
        $stmt = $pdo->prepare("
            INSERT INTO resource_distribution (resource_id, disaster_id, center_id, quantity_distributed, distribution_date, distributed_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$resourceId, $disasterId, $centerId, $qty, $distDate, $user['user_id']]);
        setFlash('success', "Distribution of {$qty} units successfully recorded.");
    } else {
        setFlash('error', 'Disaster, resource, and positive quantity are required.');
    }
    header('Location: distribution.php');
    exit;
}

$disasters = $pdo->query("SELECT disaster_id, disaster_name FROM disasters ORDER BY disaster_name ASC")->fetchAll();
$centers = $pdo->query("SELECT center_id, center_name FROM relief_centers ORDER BY center_name ASC")->fetchAll();
$resources = $pdo->query("SELECT resource_id, resource_name, unit FROM resources ORDER BY resource_name ASC")->fetchAll();

$sql = "
    SELECT rd.*, rc.center_name, d.disaster_name, r.resource_name, r.unit, u.full_name as distributor_name
    FROM resource_distribution rd
    JOIN disasters d ON rd.disaster_id = d.disaster_id
    JOIN resources r ON rd.resource_id = r.resource_id
    LEFT JOIN relief_centers rc ON rd.center_id = rc.center_id
    LEFT JOIN users u ON rd.distributed_by = u.user_id
    ORDER BY rd.distribution_date DESC, rd.distribution_id DESC
";
$distributions = $pdo->query($sql)->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
        <span>Resource Distribution Log (<?= count($distributions) ?> records)</span>
      </h3>

      <div class="card-actions">
        <button type="button" class="btn btn-primary btn-sm" data-modal="modalDistribute">
          + Record Aid Distribution
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Receipt #</th>
            <th>Disaster Incident</th>
            <th>Relief Center</th>
            <th>Supplies Handed Out</th>
            <th>Distributed Date</th>
            <th>Logged By Staff</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($distributions)): ?>
            <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No distribution receipts found.</td></tr>
          <?php else: ?>
            <?php foreach ($distributions as $d): ?>
              <tr>
                <td>#DST-<?= $d['distribution_id'] ?></td>
                <td class="table-cell-bold"><?= escape($d['disaster_name']) ?></td>
                <td><?= escape($d['center_name'] ?: 'Field Outpost') ?></td>
                <td>
                  <strong style="color: var(--primary-700); font-size: 0.95rem;">
                    <?= number_format($d['quantity_distributed']) ?> <?= escape($d['unit']) ?>
                  </strong>
                  <div style="font-size: 0.72rem; color: var(--text-muted);"><?= escape($d['resource_name']) ?></div>
                </td>
                <td><?= formatDate($d['distribution_date']) ?></td>
                <td><?= escape($d['distributor_name'] ?? 'Relief Staff') ?></td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── MODAL: RECORD DISTRIBUTION ───────────────────────────── -->
  <div class="modal-overlay" id="modalDistribute">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Record Aid Distribution</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="distribution.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Disaster Incident</label>
            <select name="disaster_id" class="form-select" required>
              <option value="">Select Disaster...</option>
              <?php foreach ($disasters as $dis): ?>
                <option value="<?= $dis['disaster_id'] ?>"><?= escape($dis['disaster_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Relief Center Hub (Optional)</label>
            <select name="center_id" class="form-select">
              <option value="">None / Field Delivery</option>
              <?php foreach ($centers as $c): ?>
                <option value="<?= $c['center_id'] ?>"><?= escape($c['center_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Relief Supply Item</label>
              <select name="resource_id" class="form-select" required>
                <option value="">Select Resource...</option>
                <?php foreach ($resources as $r): ?>
                  <option value="<?= $r['resource_id'] ?>"><?= escape($r['resource_name']) ?> (<?= escape($r['unit']) ?>)</option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Quantity Distributed</label>
              <input type="number" name="quantity_distributed" class="form-control" required min="1" placeholder="e.g. 100">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label required">Distribution Date</label>
            <input type="date" name="distribution_date" class="form-control" required value="<?= date('Y-m-d') ?>">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-success">Issue Supplies Record</button>
        </div>
      </form>
    </div>
  </div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
