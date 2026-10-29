<?php
// ============================================================
// Relief Centers Management
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Relief Centers Directory';
$pageSubtitle = 'Monitor Center Capacity, Shelter Occupancy, and Logistics Points';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

// Handle CRUD
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $name        = trim($_POST['center_name'] ?? '');
        $locationId  = (int)($_POST['location_id'] ?? 0);
        $type        = $_POST['center_type'] ?? 'Shelter';
        $capacity    = (int)($_POST['capacity'] ?? 0);
        $occupancy   = (int)($_POST['current_occupancy'] ?? 0);
        $contactPhone= trim($_POST['contact_number'] ?? '');
        $status      = $_POST['status'] ?? 'Active';

        if ($name && $locationId && $capacity > 0) {
            $stmt = $pdo->prepare("
                INSERT INTO relief_centers (location_id, center_name, center_type, capacity, current_occupancy, contact_number, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$locationId, $name, $type, $capacity, $occupancy, $contactPhone, $status]);
            setFlash('success', "Relief center '{$name}' created successfully.");
        } else {
            setFlash('error', 'Center name, location, and positive capacity are required.');
        }
        header('Location: relief_centers.php');
        exit;
    }

    if ($action === 'update') {
        $id          = (int)($_POST['center_id'] ?? 0);
        $name        = trim($_POST['center_name'] ?? '');
        $locationId  = (int)($_POST['location_id'] ?? 0);
        $type        = $_POST['center_type'] ?? 'Shelter';
        $capacity    = (int)($_POST['capacity'] ?? 0);
        $occupancy   = (int)($_POST['current_occupancy'] ?? 0);
        $contactPhone= trim($_POST['contact_number'] ?? '');
        $status      = $_POST['status'] ?? 'Active';

        if ($id && $name && $locationId) {
            $stmt = $pdo->prepare("
                UPDATE relief_centers 
                SET location_id = ?, center_name = ?, center_type = ?, capacity = ?, current_occupancy = ?, contact_number = ?, status = ?
                WHERE center_id = ?
            ");
            $stmt->execute([$locationId, $name, $type, $capacity, $occupancy, $contactPhone, $status, $id]);
            setFlash('success', "Relief center '{$name}' updated.");
        }
        header('Location: relief_centers.php');
        exit;
    }

    if ($action === 'delete') {
        requireRole(['Admin']);
        $id = (int)($_POST['center_id'] ?? 0);
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM relief_centers WHERE center_id = ?");
                $stmt->execute([$id]);
                setFlash('success', 'Relief center removed.');
            } catch (Exception $e) {
                setFlash('error', 'Cannot delete center: linked records exist.');
            }
        }
        header('Location: relief_centers.php');
        exit;
    }
}

$locations = $pdo->query("SELECT * FROM locations ORDER BY state, city ASC")->fetchAll();

$statusFilter = $_GET['status'] ?? '';
$sql = "
    SELECT rc.*, l.city, l.state, l.location_name
    FROM relief_centers rc
    JOIN locations l ON rc.location_id = l.location_id
    WHERE 1=1
";
$params = [];
if ($statusFilter) {
    $sql .= " AND rc.status = ?";
    $params[] = $statusFilter;
}
$sql .= " ORDER BY rc.status ASC, rc.center_name ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$centers = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Relief Centers & Shelters (<?= count($centers) ?>)</span>
        </h3>

        <form method="GET" action="relief_centers.php">
          <select name="status" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Statuses</option>
            <option value="Active" <?= $statusFilter === 'Active' ? 'selected' : '' ?>>Active</option>
            <option value="Full" <?= $statusFilter === 'Full' ? 'selected' : '' ?>>Full</option>
            <option value="Under Setup" <?= $statusFilter === 'Under Setup' ? 'selected' : '' ?>>Under Setup</option>
            <option value="Closed" <?= $statusFilter === 'Closed' ? 'selected' : '' ?>>Closed</option>
          </select>
        </form>
      </div>

      <div class="card-actions">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button type="button" class="btn btn-primary btn-sm" data-modal="modalAddCenter">
            + Register Relief Center
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Center Name</th>
            <th>Type</th>
            <th>Location</th>
            <th>Capacity & Occupancy</th>
            <th>Contact Phone</th>
            <th>Status</th>
            <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
              <th style="text-align: right;">Actions</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($centers)): ?>
            <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No relief centers found.</td></tr>
          <?php else: ?>
            <?php foreach ($centers as $c): ?>
              <?php
                $pct = $c['capacity'] > 0 ? round(($c['current_occupancy'] / $c['capacity']) * 100) : 0;
                $barColor = '#16a34a';
                if ($pct >= 90) $barColor = '#dc2626';
                elseif ($pct >= 75) $barColor = '#d97706';

                $stClass = 'badge-neutral';
                if ($c['status'] === 'Active') $stClass = 'badge-success';
                elseif ($c['status'] === 'Full') $stClass = 'badge-critical';
                elseif ($c['status'] === 'Under Setup') $stClass = 'badge-warning';
              ?>
              <tr>
                <td class="table-cell-bold">
                  <div style="font-size: 0.95rem;"><?= escape($c['center_name']) ?></div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">
                    ID: #RC-<?= $c['center_id'] ?>
                  </div>
                </td>
                <td>
                  <span class="badge badge-neutral"><?= escape($c['center_type']) ?></span>
                </td>
                <td>
                  <?= escape($c['city']) ?>, <?= escape($c['state']) ?>
                </td>
                <td style="min-width: 180px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 3px;">
                    <span><strong><?= $c['current_occupancy'] ?></strong> / <?= $c['capacity'] ?></span>
                    <span style="font-weight: 700; color: <?= $barColor ?>;"><?= $pct ?>%</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                    <div style="width: <?= min($pct, 100) ?>%; height: 100%; background: <?= $barColor ?>; border-radius: 999px;"></div>
                  </div>
                </td>
                <td>
                  <?= escape($c['contact_number'] ?: 'N/A') ?>
                </td>
                <td>
                  <span class="badge <?= $stClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($c['status']) ?>
                  </span>
                </td>
                <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn btn-sm btn-outline" 
                            onclick='openEditCenter(<?= json_encode($c, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'>
                      Edit
                    </button>
                    <?php if (hasRole('Admin')): ?>
                      <form method="POST" action="relief_centers.php" style="display: inline;" onsubmit="return confirmDelete('Delete this relief center?');">
                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                        <input type="hidden" name="form_action" value="delete">
                        <input type="hidden" name="center_id" value="<?= $c['center_id'] ?>">
                        <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                      </form>
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

  <!-- ── MODAL: ADD CENTER ────────────────────────────────────── -->
  <div class="modal-overlay" id="modalAddCenter">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Register Relief Center</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="relief_centers.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Relief Center Name</label>
            <input type="text" name="center_name" class="form-control" required placeholder="e.g. City Community Hall Shelter">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Jurisdiction Location</label>
              <select name="location_id" class="form-select" required>
                <option value="">Select Location...</option>
                <?php foreach ($locations as $l): ?>
                  <option value="<?= $l['location_id'] ?>"><?= escape($l['city']) ?> (<?= escape($l['state']) ?>)</option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Center Facility Type</label>
              <select name="center_type" class="form-select" required>
                <option value="Shelter" selected>Shelter</option>
                <option value="Food Distribution">Food Distribution</option>
                <option value="Medical">Medical Center</option>
                <option value="Multi-Purpose">Multi-Purpose Hub</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Max Capacity (Persons)</label>
              <input type="number" name="capacity" class="form-control" required min="1" value="200">
            </div>
            <div class="form-group">
              <label class="form-label required">Current Occupancy</label>
              <input type="number" name="current_occupancy" class="form-control" required min="0" value="0">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input type="text" name="contact_number" class="form-control" placeholder="+91-9876543210">
            </div>
            <div class="form-group">
              <label class="form-label required">Operational Status</label>
              <select name="status" class="form-select" required>
                <option value="Active" selected>Active</option>
                <option value="Full">Full</option>
                <option value="Under Setup">Under Setup</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Create Center</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ── MODAL: EDIT CENTER ────────────────────────────────────── -->
  <div class="modal-overlay" id="modalEditCenter">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Edit Relief Center Details</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="relief_centers.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="update">
        <input type="hidden" name="center_id" id="edit_center_id">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Relief Center Name</label>
            <input type="text" name="center_name" id="edit_center_name" class="form-control" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Jurisdiction Location</label>
              <select name="location_id" id="edit_location_id" class="form-select" required>
                <?php foreach ($locations as $l): ?>
                  <option value="<?= $l['location_id'] ?>"><?= escape($l['city']) ?> (<?= escape($l['state']) ?>)</option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Center Facility Type</label>
              <select name="center_type" id="edit_center_type" class="form-select" required>
                <option value="Shelter">Shelter</option>
                <option value="Food Distribution">Food Distribution</option>
                <option value="Medical">Medical Center</option>
                <option value="Multi-Purpose">Multi-Purpose Hub</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Max Capacity</label>
              <input type="number" name="capacity" id="edit_capacity" class="form-control" required min="1">
            </div>
            <div class="form-group">
              <label class="form-label required">Current Occupancy</label>
              <input type="number" name="current_occupancy" id="edit_occupancy" class="form-control" required min="0">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input type="text" name="contact_number" id="edit_contact_number" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label required">Operational Status</label>
              <select name="status" id="edit_status" class="form-select" required>
                <option value="Active">Active</option>
                <option value="Full">Full</option>
                <option value="Under Setup">Under Setup</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Update Center</button>
        </div>
      </form>
    </div>
  </div>

<script>
function openEditCenter(data) {
  document.getElementById('edit_center_id').value = data.center_id;
  document.getElementById('edit_center_name').value = data.center_name;
  document.getElementById('edit_location_id').value = data.location_id;
  document.getElementById('edit_center_type').value = data.center_type;
  document.getElementById('edit_capacity').value = data.capacity;
  document.getElementById('edit_occupancy').value = data.current_occupancy;
  document.getElementById('edit_contact_number').value = data.contact_number || '';
  document.getElementById('edit_status').value = data.status;
  openModal('modalEditCenter');
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
