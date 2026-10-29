<?php
// ============================================================
// Resource Requests Management
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Resource Requests & Requisitions';
$pageSubtitle = 'Process Demands, Prioritize Critical Supplies & Coordinate Logistics';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();
$user = currentUser();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $disasterId = (int)($_POST['disaster_id'] ?? 0);
        $resourceId = (int)($_POST['resource_id'] ?? 0);
        $locationId = !empty($_POST['location_id']) ? (int)$_POST['location_id'] : null;
        $qty        = (int)($_POST['quantity_requested'] ?? 0);
        $priority   = $_POST['priority'] ?? 'Medium';

        if ($disasterId && $resourceId && $qty > 0) {
            $stmt = $pdo->prepare("
                INSERT INTO resource_requests (disaster_id, requester_id, resource_id, location_id, quantity_requested, priority, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Pending')
            ");
            $stmt->execute([$disasterId, $user['user_id'], $resourceId, $locationId, $qty, $priority]);
            setFlash('success', 'Resource request submitted for approval.');
        } else {
            setFlash('error', 'Disaster, resource, and positive quantity are required.');
        }
        header('Location: resource_requests.php');
        exit;
    }

    if ($action === 'update_status') {
        requireRole(['Admin', 'Disaster Coordinator']);
        $reqId     = (int)($_POST['request_id'] ?? 0);
        $newStatus = $_POST['new_status'] ?? '';

        $validStatuses = ['Pending', 'Approved', 'Rejected', 'Processing', 'Delivered'];
        if ($reqId && in_array($newStatus, $validStatuses)) {
            $stmt = $pdo->prepare("UPDATE resource_requests SET status = ? WHERE request_id = ?");
            $stmt->execute([$newStatus, $reqId]);
            setFlash('success', "Request #REQ-{$reqId} status changed to '{$newStatus}'.");
        }
        header('Location: resource_requests.php');
        exit;
    }
}

$disasters = $pdo->query("SELECT disaster_id, disaster_name FROM disasters ORDER BY disaster_name ASC")->fetchAll();
$resources = $pdo->query("SELECT resource_id, resource_name, unit FROM resources ORDER BY resource_name ASC")->fetchAll();
$locations = $pdo->query("SELECT location_id, city, state FROM locations ORDER BY city ASC")->fetchAll();

$statusFilter = $_GET['status'] ?? '';
$priorityFilter = $_GET['priority'] ?? '';

$sql = "
    SELECT rr.*, d.disaster_name, r.resource_name, r.unit, u.full_name as requester_name, l.city, l.state
    FROM resource_requests rr
    JOIN disasters d ON rr.disaster_id = d.disaster_id
    JOIN resources r ON rr.resource_id = r.resource_id
    LEFT JOIN locations l ON rr.location_id = l.location_id
    LEFT JOIN users u ON rr.requester_id = u.user_id
    WHERE 1=1
";
$params = [];
if ($statusFilter) {
    $sql .= " AND rr.status = ?";
    $params[] = $statusFilter;
}
if ($priorityFilter) {
    $sql .= " AND rr.priority = ?";
    $params[] = $priorityFilter;
}
$sql .= " ORDER BY FIELD(rr.priority, 'Critical', 'High', 'Medium', 'Low'), rr.request_date DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$requests = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Resource Requisitions (<?= count($requests) ?>)</span>
        </h3>

        <form method="GET" action="resource_requests.php" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <select name="status" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Statuses</option>
            <option value="Pending" <?= $statusFilter === 'Pending' ? 'selected' : '' ?>>Pending</option>
            <option value="Approved" <?= $statusFilter === 'Approved' ? 'selected' : '' ?>>Approved</option>
            <option value="Processing" <?= $statusFilter === 'Processing' ? 'selected' : '' ?>>Processing</option>
            <option value="Delivered" <?= $statusFilter === 'Delivered' ? 'selected' : '' ?>>Delivered</option>
            <option value="Rejected" <?= $statusFilter === 'Rejected' ? 'selected' : '' ?>>Rejected</option>
          </select>

          <select name="priority" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Priorities</option>
            <option value="Critical" <?= $priorityFilter === 'Critical' ? 'selected' : '' ?>>Critical</option>
            <option value="High" <?= $priorityFilter === 'High' ? 'selected' : '' ?>>High</option>
            <option value="Medium" <?= $priorityFilter === 'Medium' ? 'selected' : '' ?>>Medium</option>
            <option value="Low" <?= $priorityFilter === 'Low' ? 'selected' : '' ?>>Low</option>
          </select>
          <?php if ($statusFilter || $priorityFilter): ?>
            <a href="resource_requests.php" class="btn btn-sm btn-outline">Clear</a>
          <?php endif; ?>
        </form>
      </div>

      <div class="card-actions">
        <button type="button" class="btn btn-primary btn-sm" data-modal="modalAddRequest">
          + Request Relief Aid
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Requisition</th>
            <th>Disaster Operation</th>
            <th>Resource Demanded</th>
            <th>Quantity</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Requested By</th>
            <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
              <th style="text-align: right;">Authorization</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($requests)): ?>
            <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No resource requests found.</td></tr>
          <?php else: ?>
            <?php foreach ($requests as $req): ?>
              <?php
                $priClass = 'badge-low';
                if ($req['priority'] === 'Critical') $priClass = 'badge-critical';
                elseif ($req['priority'] === 'High') $priClass = 'badge-high';
                elseif ($req['priority'] === 'Medium') $priClass = 'badge-medium';

                $stClass = 'badge-neutral';
                if ($req['status'] === 'Approved') $stClass = 'badge-info';
                elseif ($req['status'] === 'Processing') $stClass = 'badge-warning';
                elseif ($req['status'] === 'Delivered') $stClass = 'badge-success';
                elseif ($req['status'] === 'Rejected') $stClass = 'badge-danger';
                elseif ($req['status'] === 'Pending') $stClass = 'badge-high';
              ?>
              <tr>
                <td class="table-cell-bold">
                  #REQ-<?= $req['request_id'] ?>
                  <div style="font-size: 0.72rem; color: var(--text-muted);"><?= formatDate($req['request_date']) ?></div>
                </td>
                <td>
                  <div><strong><?= escape($req['disaster_name']) ?></strong></div>
                  <?php if ($req['city']): ?>
                    <div style="font-size: 0.72rem; color: var(--text-muted);"><?= escape($req['city']) ?>, <?= escape($req['state']) ?></div>
                  <?php endif; ?>
                </td>
                <td class="table-cell-bold"><?= escape($req['resource_name']) ?></td>
                <td>
                  <strong><?= number_format($req['quantity_requested']) ?></strong> <?= escape($req['unit']) ?>
                </td>
                <td>
                  <span class="badge <?= $priClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($req['priority']) ?>
                  </span>
                </td>
                <td>
                  <span class="badge <?= $stClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($req['status']) ?>
                  </span>
                </td>
                <td><?= escape($req['requester_name'] ?? 'Staff Member') ?></td>
                <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
                  <td style="text-align: right; white-space: nowrap;">
                    <?php if ($req['status'] === 'Pending'): ?>
                      <form method="POST" action="resource_requests.php" style="display: inline;">
                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                        <input type="hidden" name="form_action" value="update_status">
                        <input type="hidden" name="request_id" value="<?= $req['request_id'] ?>">
                        <button type="submit" name="new_status" value="Approved" class="btn btn-sm btn-success">Approve</button>
                        <button type="submit" name="new_status" value="Rejected" class="btn btn-sm btn-danger">Reject</button>
                      </form>
                    <?php elseif ($req['status'] === 'Approved'): ?>
                      <form method="POST" action="resource_requests.php" style="display: inline;">
                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                        <input type="hidden" name="form_action" value="update_status">
                        <input type="hidden" name="request_id" value="<?= $req['request_id'] ?>">
                        <button type="submit" name="new_status" value="Processing" class="btn btn-sm btn-primary">Process</button>
                      </form>
                    <?php elseif ($req['status'] === 'Processing'): ?>
                      <form method="POST" action="resource_requests.php" style="display: inline;">
                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                        <input type="hidden" name="form_action" value="update_status">
                        <input type="hidden" name="request_id" value="<?= $req['request_id'] ?>">
                        <button type="submit" name="new_status" value="Delivered" class="btn btn-sm btn-success">Delivered</button>
                      </form>
                    <?php else: ?>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">&mdash;</span>
                    <?php endif; ?>
                  </td>
                <?php endif; ?>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── MODAL: CREATE AID REQUEST ────────────────────────────── -->
  <div class="modal-overlay" id="modalAddRequest">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Submit Resource Requisition</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="resource_requests.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Associated Disaster</label>
            <select name="disaster_id" class="form-select" required>
              <option value="">Select Disaster Incident...</option>
              <?php foreach ($disasters as $dis): ?>
                <option value="<?= $dis['disaster_id'] ?>"><?= escape($dis['disaster_name']) ?></option>
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
              <label class="form-label">Destination Location Hub</label>
              <select name="location_id" class="form-select">
                <option value="">Select Location...</option>
                <?php foreach ($locations as $l): ?>
                  <option value="<?= $l['location_id'] ?>"><?= escape($l['city']) ?> (<?= escape($l['state']) ?>)</option>
                <?php endforeach; ?>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Quantity Demanded</label>
              <input type="number" name="quantity_requested" class="form-control" required min="1" placeholder="e.g. 200">
            </div>
            <div class="form-group">
              <label class="form-label required">Urgency / Priority</label>
              <select name="priority" class="form-select" required>
                <option value="Critical">Critical (Immediate Danger)</option>
                <option value="High" selected>High (Next 12 Hours)</option>
                <option value="Medium">Medium (Routine Replenishment)</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Submit Requisition</button>
        </div>
      </form>
    </div>
  </div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
