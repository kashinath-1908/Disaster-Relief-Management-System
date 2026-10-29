<?php
// ============================================================
// Disaster Incident Management
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Disaster Incidents Management';
$pageSubtitle = 'Register, Monitor and Coordinate Disasters Across Regions';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();
$user = currentUser();

// Handle Form Submissions (Create / Update / Delete)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $name        = trim($_POST['disaster_name'] ?? '');
        $typeId      = (int)($_POST['disaster_type_id'] ?? 0);
        $locationId  = (int)($_POST['location_id'] ?? 0);
        $severity    = $_POST['severity'] ?? 'Medium';
        $status      = $_POST['status'] ?? 'Active';
        $startDate   = $_POST['start_date'] ?? date('Y-m-d');
        $endDate     = !empty($_POST['end_date']) ? $_POST['end_date'] : null;
        $description = trim($_POST['description'] ?? '');

        if ($name && $typeId) {
            $stmt = $pdo->prepare("
                INSERT INTO disasters (disaster_type_id, disaster_name, severity, status, start_date, end_date, description, reported_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$typeId, $name, $severity, $status, $startDate, $endDate, $description, $user['user_id']]);
            $newDisasterId = $pdo->lastInsertId();

            if ($locationId) {
                $aa = $pdo->prepare("INSERT INTO affected_areas (disaster_id, location_id, severity, estimated_population, damage_description) VALUES (?, ?, ?, ?, ?)");
                $aa->execute([$newDisasterId, $locationId, $severity, 1000, $description]);
            }

            setFlash('success', "Disaster incident '{$name}' registered successfully.");
        } else {
            setFlash('error', 'Please fill in required fields (Name and Type).');
        }
        header('Location: disasters.php');
        exit;
    }

    if ($action === 'update') {
        $id          = (int)($_POST['disaster_id'] ?? 0);
        $name        = trim($_POST['disaster_name'] ?? '');
        $typeId      = (int)($_POST['disaster_type_id'] ?? 0);
        $severity    = $_POST['severity'] ?? 'Medium';
        $status      = $_POST['status'] ?? 'Active';
        $startDate   = $_POST['start_date'] ?? date('Y-m-d');
        $endDate     = !empty($_POST['end_date']) ? $_POST['end_date'] : null;
        $description = trim($_POST['description'] ?? '');

        if ($id && $name && $typeId) {
            $stmt = $pdo->prepare("
                UPDATE disasters 
                SET disaster_type_id = ?, disaster_name = ?, severity = ?, status = ?, start_date = ?, end_date = ?, description = ?
                WHERE disaster_id = ?
            ");
            $stmt->execute([$typeId, $name, $severity, $status, $startDate, $endDate, $description, $id]);
            setFlash('success', "Disaster '{$name}' updated successfully.");
        }
        header('Location: disasters.php');
        exit;
    }

    if ($action === 'delete') {
        requireRole(['Admin']);
        $id = (int)($_POST['disaster_id'] ?? 0);
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM disasters WHERE disaster_id = ?");
                $stmt->execute([$id]);
                setFlash('success', 'Disaster incident deleted successfully.');
            } catch (Exception $e) {
                setFlash('error', 'Cannot delete disaster: linked records exist.');
            }
        }
        header('Location: disasters.php');
        exit;
    }
}

// Fetch Filter Options
$disasterTypes = $pdo->query("SELECT * FROM disaster_types ORDER BY type_name ASC")->fetchAll();
$locations = $pdo->query("SELECT * FROM locations ORDER BY state, city ASC")->fetchAll();

// Filter & Search
$statusFilter = $_GET['status'] ?? '';
$severityFilter = $_GET['severity'] ?? '';

$sql = "
    SELECT d.*, dt.type_name, u.full_name as reporter_name,
           (SELECT GROUP_CONCAT(DISTINCT CONCAT(l.city, ', ', l.state) SEPARATOR '; ') 
            FROM affected_areas aa 
            JOIN locations l ON aa.location_id = l.location_id 
            WHERE aa.disaster_id = d.disaster_id) as locations_list,
           (SELECT COUNT(*) FROM affected_people ap WHERE ap.disaster_id = d.disaster_id) as affected_count,
           (SELECT COUNT(*) FROM rescue_operations ro WHERE ro.disaster_id = d.disaster_id) as rescue_count
    FROM disasters d
    LEFT JOIN disaster_types dt ON d.disaster_type_id = dt.disaster_type_id
    LEFT JOIN users u ON d.reported_by = u.user_id
    WHERE 1=1
";
$params = [];

if ($statusFilter) {
    $sql .= " AND d.status = ?";
    $params[] = $statusFilter;
}
if ($severityFilter) {
    $sql .= " AND d.severity = ?";
    $params[] = $severityFilter;
}
$sql .= " ORDER BY FIELD(d.severity, 'Critical', 'High', 'Medium', 'Low'), d.start_date DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$disasters = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Disaster Incident Directory (<?= count($disasters) ?>)</span>
        </h3>
        
        <!-- Filter Form -->
        <form method="GET" action="disasters.php" style="display: flex; gap: 0.5rem; align-items: center;">
          <select name="status" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Statuses</option>
            <option value="Active" <?= $statusFilter === 'Active' ? 'selected' : '' ?>>Active</option>
            <option value="Contained" <?= $statusFilter === 'Contained' ? 'selected' : '' ?>>Contained</option>
            <option value="Recovered" <?= $statusFilter === 'Recovered' ? 'selected' : '' ?>>Recovered</option>
            <option value="Archived" <?= $statusFilter === 'Archived' ? 'selected' : '' ?>>Archived</option>
          </select>
          <select name="severity" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Severities</option>
            <option value="Critical" <?= $severityFilter === 'Critical' ? 'selected' : '' ?>>Critical</option>
            <option value="High" <?= $severityFilter === 'High' ? 'selected' : '' ?>>High</option>
            <option value="Medium" <?= $severityFilter === 'Medium' ? 'selected' : '' ?>>Medium</option>
            <option value="Low" <?= $severityFilter === 'Low' ? 'selected' : '' ?>>Low</option>
          </select>
          <?php if ($statusFilter || $severityFilter): ?>
            <a href="disasters.php" class="btn btn-sm btn-outline">Clear</a>
          <?php endif; ?>
        </form>
      </div>

      <div class="card-actions">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button type="button" class="btn btn-emergency btn-sm" data-modal="modalAddDisaster">
            + Declare Disaster
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Disaster Name</th>
            <th>Type</th>
            <th>Affected Region</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Impact Metrics</th>
            <th>Declared Date</th>
            <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
              <th style="text-align: right;">Actions</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($disasters)): ?>
            <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No disaster records found matching criteria.</td></tr>
          <?php else: ?>
            <?php foreach ($disasters as $d): ?>
              <?php
                $sevClass = 'badge-low';
                if ($d['severity'] === 'Critical') $sevClass = 'badge-critical';
                elseif ($d['severity'] === 'High') $sevClass = 'badge-high';
                elseif ($d['severity'] === 'Medium') $sevClass = 'badge-medium';

                $statusClass = 'badge-neutral';
                if ($d['status'] === 'Active') $statusClass = 'badge-critical';
                elseif ($d['status'] === 'Contained') $statusClass = 'badge-warning';
                elseif ($d['status'] === 'Recovered') $statusClass = 'badge-success';
              ?>
              <tr>
                <td class="table-cell-bold">
                  <div style="font-size: 0.95rem;"><?= escape($d['disaster_name']) ?></div>
                  <?php if (!empty($d['description'])): ?>
                    <div style="font-size: 0.72rem; color: var(--text-muted); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      <?= escape($d['description']) ?>
                    </div>
                  <?php endif; ?>
                </td>
                <td>
                  <span class="badge badge-neutral"><?= escape($d['type_name']) ?></span>
                </td>
                <td><?= escape($d['locations_list'] ?: 'Region-wide') ?></td>
                <td>
                  <span class="badge <?= $sevClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($d['severity']) ?>
                  </span>
                </td>
                <td>
                  <span class="badge <?= $statusClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($d['status']) ?>
                  </span>
                </td>
                <td>
                  <span style="font-size: 0.78rem; color: var(--text-secondary);">
                    👥 <?= $d['affected_count'] ?> people &bull; 🚁 <?= $d['rescue_count'] ?> rescues
                  </span>
                </td>
                <td><?= formatDate($d['start_date']) ?></td>
                <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn btn-sm btn-outline" 
                            onclick='openEditDisaster(<?= json_encode($d, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'>
                      Edit
                    </button>
                    <?php if (hasRole('Admin')): ?>
                      <form method="POST" action="disasters.php" style="display: inline;" onsubmit="return confirmDelete('Delete disaster incident?');">
                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                        <input type="hidden" name="form_action" value="delete">
                        <input type="hidden" name="disaster_id" value="<?= $d['disaster_id'] ?>">
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

  <!-- ── MODAL: DECLARE NEW DISASTER ──────────────────────────── -->
  <div class="modal-overlay" id="modalAddDisaster">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Declare New Disaster Incident</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="disasters.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Disaster Incident Name</label>
            <input type="text" name="disaster_name" class="form-control" required placeholder="e.g. Cyclone Tej Relief">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Disaster Type</label>
              <select name="disaster_type_id" class="form-select" required>
                <option value="">Select Type...</option>
                <?php foreach ($disasterTypes as $dt): ?>
                  <option value="<?= $dt['disaster_type_id'] ?>"><?= escape($dt['type_name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Primary Operational Zone</label>
              <select name="location_id" class="form-select">
                <option value="">Select Location...</option>
                <?php foreach ($locations as $loc): ?>
                  <option value="<?= $loc['location_id'] ?>"><?= escape($loc['city']) ?> (<?= escape($loc['state']) ?>)</option>
                <?php endforeach; ?>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Severity Level</label>
              <select name="severity" class="form-select" required>
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Operational Status</label>
              <select name="status" class="form-select" required>
                <option value="Active" selected>Active</option>
                <option value="Contained">Contained</option>
                <option value="Recovered">Recovered</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Start Date</label>
              <input type="date" name="start_date" class="form-control" required value="<?= date('Y-m-d') ?>">
            </div>
            <div class="form-group">
              <label class="form-label">Anticipated / Actual End Date</label>
              <input type="date" name="end_date" class="form-control">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Incident Synopsis & Initial Assessment</label>
            <textarea name="description" class="form-control" placeholder="Provide situational overview, damage reports, and priorities..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-emergency">Register Disaster</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ── MODAL: EDIT DISASTER ──────────────────────────────────── -->
  <div class="modal-overlay" id="modalEditDisaster">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Edit Disaster Incident</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="disasters.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="update">
        <input type="hidden" name="disaster_id" id="edit_disaster_id">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Disaster Incident Name</label>
            <input type="text" name="disaster_name" id="edit_disaster_name" class="form-control" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Disaster Type</label>
              <select name="disaster_type_id" id="edit_disaster_type_id" class="form-select" required>
                <?php foreach ($disasterTypes as $dt): ?>
                  <option value="<?= $dt['disaster_type_id'] ?>"><?= escape($dt['type_name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Severity Level</label>
              <select name="severity" id="edit_severity" class="form-select" required>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Operational Status</label>
              <select name="status" id="edit_status" class="form-select" required>
                <option value="Active">Active</option>
                <option value="Contained">Contained</option>
                <option value="Recovered">Recovered</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Start Date</label>
              <input type="date" name="start_date" id="edit_start_date" class="form-control" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="date" name="end_date" id="edit_end_date" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Incident Synopsis & Initial Assessment</label>
            <textarea name="description" id="edit_description" class="form-control"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

<script>
function openEditDisaster(data) {
  document.getElementById('edit_disaster_id').value = data.disaster_id;
  document.getElementById('edit_disaster_name').value = data.disaster_name;
  document.getElementById('edit_disaster_type_id').value = data.disaster_type_id;
  document.getElementById('edit_severity').value = data.severity;
  document.getElementById('edit_status').value = data.status;
  document.getElementById('edit_start_date').value = data.start_date ? data.start_date.substring(0, 10) : '';
  document.getElementById('edit_end_date').value = data.end_date ? data.end_date.substring(0, 10) : '';
  document.getElementById('edit_description').value = data.description || '';
  openModal('modalEditDisaster');
}

if (window.location.search.includes('action=new')) {
  openModal('modalAddDisaster');
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
