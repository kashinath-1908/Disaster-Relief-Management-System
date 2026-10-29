<?php
// ============================================================
// Search & Rescue Operations Command
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Search & Rescue Operations';
$pageSubtitle = 'Tactical Mission Deployments, Evacuation Taskforces & Extrication Counters';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $name          = trim($_POST['operation_name'] ?? '');
        $disasterId    = (int)($_POST['disaster_id'] ?? 0);
        $locationId    = !empty($_POST['location_id']) ? (int)$_POST['location_id'] : null;
        $coordinatorId = !empty($_POST['coordinator_id']) ? (int)$_POST['coordinator_id'] : null;
        $rescued       = (int)($_POST['people_rescued'] ?? 0);
        $status        = $_POST['status'] ?? 'Active';
        $startTime     = !empty($_POST['start_time']) ? $_POST['start_time'] : date('Y-m-d H:i:s');
        $desc          = trim($_POST['description'] ?? '');

        if ($name && $disasterId) {
            $stmt = $pdo->prepare("
                INSERT INTO rescue_operations (disaster_id, location_id, operation_name, description, start_time, people_rescued, status, coordinator_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$disasterId, $locationId, $name, $desc, $startTime, $rescued, $status, $coordinatorId]);
            setFlash('success', "Rescue Mission '{$name}' successfully deployed.");
        } else {
            setFlash('error', 'Mission name and disaster are required.');
        }
        header('Location: rescue_operations.php');
        exit;
    }

    if ($action === 'update_progress') {
        $opId    = (int)($_POST['operation_id'] ?? 0);
        $rescued = (int)($_POST['people_rescued'] ?? 0);
        $status  = $_POST['status'] ?? 'Active';
        $endTime = ($status === 'Completed' || $status === 'Cancelled') ? date('Y-m-d H:i:s') : null;

        if ($opId) {
            $stmt = $pdo->prepare("
                UPDATE rescue_operations 
                SET people_rescued = ?, status = ?, end_time = COALESCE(?, end_time)
                WHERE operation_id = ?
            ");
            $stmt->execute([$rescued, $status, $endTime, $opId]);
            setFlash('success', "Operation progress updated.");
        }
        header('Location: rescue_operations.php');
        exit;
    }
}

// Stats
$totalRescued = (int)$pdo->query("SELECT COALESCE(SUM(people_rescued), 0) FROM rescue_operations")->fetchColumn();
$activeOps    = (int)$pdo->query("SELECT COUNT(*) FROM rescue_operations WHERE status = 'Active'")->fetchColumn();
$completedOps = (int)$pdo->query("SELECT COUNT(*) FROM rescue_operations WHERE status = 'Completed'")->fetchColumn();
$plannedOps   = (int)$pdo->query("SELECT COUNT(*) FROM rescue_operations WHERE status = 'Planned'")->fetchColumn();

// Dropdowns
$disasters = $pdo->query("SELECT disaster_id, disaster_name FROM disasters ORDER BY status = 'Active' DESC, disaster_name ASC")->fetchAll();
$locations = $pdo->query("SELECT location_id, location_name, city, state FROM locations ORDER BY city ASC")->fetchAll();
$coordinators = $pdo->query("SELECT u.user_id, u.full_name, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name IN ('Admin', 'Disaster Coordinator') ORDER BY u.full_name ASC")->fetchAll();

$statusFilter = $_GET['status'] ?? '';
$sql = "
    SELECT ro.*, d.disaster_name, l.location_name, l.city, l.state, u.full_name as coordinator_name
    FROM rescue_operations ro
    JOIN disasters d ON ro.disaster_id = d.disaster_id
    LEFT JOIN locations l ON ro.location_id = l.location_id
    LEFT JOIN users u ON ro.coordinator_id = u.user_id
    WHERE 1=1
";
$params = [];
if ($statusFilter) {
    $sql .= " AND ro.status = ?";
    $params[] = $statusFilter;
}
$sql .= " ORDER BY FIELD(ro.status, 'Active', 'Planned', 'Completed', 'Cancelled'), ro.start_time DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$operations = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <!-- Summary KPI Cards -->
  <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Active Missions</span>
        <span class="stat-value" style="color: var(--emergency-600);"><?= $activeOps ?></span>
        <span class="stat-subtext">Teams in the field now</span>
      </div>
      <div class="stat-icon red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Lives Rescued</span>
        <span class="stat-value" style="color: var(--success-600);"><?= number_format($totalRescued) ?></span>
        <span class="stat-subtext">Safely evacuated & treated</span>
      </div>
      <div class="stat-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Planned Operations</span>
        <span class="stat-value"><?= $plannedOps ?></span>
        <span class="stat-subtext">Briefing & staging phase</span>
      </div>
      <div class="stat-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Completed Missions</span>
        <span class="stat-value"><?= $completedOps ?></span>
        <span class="stat-subtext">Successfully accomplished</span>
      </div>
      <div class="stat-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          <span>Deployment Roster (<?= count($operations) ?>)</span>
        </h3>

        <form method="GET" action="rescue_operations.php" style="display: flex; gap: 0.5rem; align-items: center;">
          <select name="status" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Mission Statuses</option>
            <option value="Active" <?= $statusFilter === 'Active' ? 'selected' : '' ?>>Active Missions</option>
            <option value="Planned" <?= $statusFilter === 'Planned' ? 'selected' : '' ?>>Planned Deployments</option>
            <option value="Completed" <?= $statusFilter === 'Completed' ? 'selected' : '' ?>>Completed</option>
            <option value="Cancelled" <?= $statusFilter === 'Cancelled' ? 'selected' : '' ?>>Cancelled</option>
          </select>
          <?php if ($statusFilter): ?>
            <a href="rescue_operations.php" class="btn btn-sm btn-outline">Clear</a>
          <?php endif; ?>
        </form>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="text" class="table-search" placeholder="Search mission, site, lead..." style="width: 220px;">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button class="btn btn-primary btn-sm" onclick="openModal('addRescueModal')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Deploy Rescue Team</span>
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Mission Name</th>
            <th>Disaster</th>
            <th>Operational Zone</th>
            <th>Mission Coordinator</th>
            <th>Start Time</th>
            <th>People Rescued</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($operations)): ?>
            <tr>
              <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                No search and rescue missions found.
              </td>
            </tr>
          <?php else: ?>
            <?php foreach ($operations as $op): 
              $badgeClass = 'badge-neutral';
              if ($op['status'] === 'Active') $badgeClass = 'badge-danger';
              elseif ($op['status'] === 'Completed') $badgeClass = 'badge-success';
              elseif ($op['status'] === 'Planned') $badgeClass = 'badge-info';
            ?>
              <tr>
                <td>
                  <div style="font-weight: 600; color: var(--navy-900);"><?= htmlspecialchars($op['operation_name']) ?></div>
                  <?php if (!empty($op['description'])): ?>
                    <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      <?= htmlspecialchars($op['description']) ?>
                    </div>
                  <?php endif; ?>
                </td>
                <td>
                  <span style="font-weight: 600; color: var(--navy-800);"><?= htmlspecialchars($op['disaster_name']) ?></span>
                </td>
                <td>
                  <div><?= htmlspecialchars($op['location_name'] ?? 'Zone Headquarters') ?></div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($op['city'] ?? '') ?>, <?= htmlspecialchars($op['state'] ?? '') ?></div>
                </td>
                <td>
                  <?= !empty($op['coordinator_name']) ? htmlspecialchars($op['coordinator_name']) : '<span style="color: var(--text-muted); font-style: italic;">Unassigned Lead</span>' ?>
                </td>
                <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">
                  <?= !empty($op['start_time']) ? date('M d, H:i', strtotime($op['start_time'])) : 'N/A' ?>
                </td>
                <td>
                  <span style="font-size: 1.1rem; font-weight: 700; color: var(--success-600);"><?= (int)$op['people_rescued'] ?></span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);"> souls</span>
                </td>
                <td>
                  <span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($op['status']) ?></span>
                </td>
                <td>
                  <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
                    <button class="btn btn-sm btn-outline" onclick='openUpdateModal(<?= json_encode($op) ?>)'>
                      Update
                    </button>
                  <?php else: ?>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">View Only</span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal: Deploy Rescue Team -->
<div id="addRescueModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Deploy Search & Rescue Team</h3>
      <button class="modal-close" onclick="closeModal('addRescueModal')">&times;</button>
    </div>
    <form method="POST" action="rescue_operations.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Operation / Mission Codename</label>
          <input type="text" name="operation_name" class="form-input" required placeholder="e.g. Operation Sagar Setu, Delta River Evac">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Disaster Incident</label>
            <select name="disaster_id" class="form-select" required>
              <option value="">-- Select Disaster --</option>
              <?php foreach ($disasters as $dis): ?>
                <option value="<?= $dis['disaster_id'] ?>"><?= htmlspecialchars($dis['disaster_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sector / Location</label>
            <select name="location_id" class="form-select">
              <option value="">-- Operational Sector --</option>
              <?php foreach ($locations as $loc): ?>
                <option value="<?= $loc['location_id'] ?>"><?= htmlspecialchars($loc['location_name']) ?> (<?= $loc['city'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Mission Coordinator</label>
            <select name="coordinator_id" class="form-select">
              <option value="">-- Select Coordinator --</option>
              <?php foreach ($coordinators as $coord): ?>
                <option value="<?= $coord['user_id'] ?>"><?= htmlspecialchars($coord['full_name']) ?> (<?= $coord['role_name'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Deployment Status</label>
            <select name="status" class="form-select" required>
              <option value="Active">Active (Deployed in Field)</option>
              <option value="Planned">Planned (Staging & Prep)</option>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Start Date & Time</label>
            <input type="datetime-local" name="start_time" class="form-input" value="<?= date('Y-m-d\TH:i') ?>">
          </div>
          <div class="form-group">
            <label class="form-label">Initial Rescued Count</label>
            <input type="number" name="people_rescued" class="form-input" value="0" min="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Mission Brief & Equipment Notes</label>
          <textarea name="description" class="form-textarea" rows="3" placeholder="Tactical objectives, boat deployments, helicopter aerial survey details..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addRescueModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Dispatch Mission</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal: Update Progress -->
<div id="updateProgressModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Update Mission Status</h3>
      <button class="modal-close" onclick="closeModal('updateProgressModal')">&times;</button>
    </div>
    <form method="POST" action="rescue_operations.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="update_progress">
      <input type="hidden" name="operation_id" id="modalOpId">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Mission</label>
          <input type="text" id="modalOpName" class="form-input" readonly style="background: var(--bg-hover);">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Total Extricated / Rescued</label>
            <input type="number" name="people_rescued" id="modalRescued" class="form-input" required min="0">
          </div>
          <div class="form-group">
            <label class="form-label required">Mission Status</label>
            <select name="status" id="modalStatus" class="form-select" required>
              <option value="Active">Active</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('updateProgressModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Mission Progress</button>
      </div>
    </form>
  </div>
</div>

<script>
function openUpdateModal(op) {
  document.getElementById('modalOpId').value = op.operation_id;
  document.getElementById('modalOpName').value = op.operation_name;
  document.getElementById('modalRescued').value = op.people_rescued || 0;
  document.getElementById('modalStatus').value = op.status;
  openModal('updateProgressModal');
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
