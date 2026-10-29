<?php
// ============================================================
// Affected People Management
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Affected Individuals Directory';
$pageSubtitle = 'Evacuation Tracking, Shelter Intake & Injury Status Registry';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

// Handle Form CRUD
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $disasterId  = (int)($_POST['disaster_id'] ?? 0);
        $locationId  = !empty($_POST['location_id']) ? (int)$_POST['location_id'] : null;
        $name        = trim($_POST['full_name'] ?? '');
        $age         = !empty($_POST['age']) ? (int)$_POST['age'] : null;
        $gender      = $_POST['gender'] ?? 'Other';
        $phone       = trim($_POST['phone'] ?? '');
        $familySize  = !empty($_POST['family_size']) ? (int)$_POST['family_size'] : 1;
        $injury      = $_POST['injury_status'] ?? 'None';
        $specialNeeds= trim($_POST['special_needs'] ?? '');

        if ($name && $disasterId) {
            $stmt = $pdo->prepare("
                INSERT INTO affected_people 
                (disaster_id, location_id, full_name, age, gender, phone, family_size, injury_status, special_needs)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$disasterId, $locationId, $name, $age, $gender, $phone, $familySize, $injury, $specialNeeds]);
            setFlash('success', "Record for '{$name}' registered.");
        } else {
            setFlash('error', 'Full name and linked disaster are required.');
        }
        header('Location: affected_people.php');
        exit;
    }

    if ($action === 'update') {
        $id          = (int)($_POST['person_id'] ?? 0);
        $disasterId  = (int)($_POST['disaster_id'] ?? 0);
        $locationId  = !empty($_POST['location_id']) ? (int)$_POST['location_id'] : null;
        $name        = trim($_POST['full_name'] ?? '');
        $age         = !empty($_POST['age']) ? (int)$_POST['age'] : null;
        $gender      = $_POST['gender'] ?? 'Other';
        $phone       = trim($_POST['phone'] ?? '');
        $familySize  = !empty($_POST['family_size']) ? (int)$_POST['family_size'] : 1;
        $injury      = $_POST['injury_status'] ?? 'None';
        $specialNeeds= trim($_POST['special_needs'] ?? '');

        if ($id && $name && $disasterId) {
            $stmt = $pdo->prepare("
                UPDATE affected_people 
                SET disaster_id = ?, location_id = ?, full_name = ?, age = ?, gender = ?, phone = ?, 
                    family_size = ?, injury_status = ?, special_needs = ?
                WHERE person_id = ?
            ");
            $stmt->execute([$disasterId, $locationId, $name, $age, $gender, $phone, $familySize, $injury, $specialNeeds, $id]);
            setFlash('success', "Record for '{$name}' updated.");
        }
        header('Location: affected_people.php');
        exit;
    }

    if ($action === 'delete') {
        requireRole(['Admin']);
        $id = (int)($_POST['person_id'] ?? 0);
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM affected_people WHERE person_id = ?");
                $stmt->execute([$id]);
                setFlash('success', 'Affected person record deleted.');
            } catch (Exception $e) {
                setFlash('error', 'Cannot delete: record has linked medical cases.');
            }
        }
        header('Location: affected_people.php');
        exit;
    }
}

// Fetch lists for selects
$disasters = $pdo->query("SELECT disaster_id, disaster_name FROM disasters ORDER BY disaster_name ASC")->fetchAll();
$locations = $pdo->query("SELECT location_id, city, state FROM locations ORDER BY city ASC")->fetchAll();

// Filters
$disasterFilter = $_GET['disaster_id'] ?? '';
$injuryFilter = $_GET['injury_status'] ?? '';

$sql = "
    SELECT ap.*, d.disaster_name, l.city, l.state
    FROM affected_people ap
    LEFT JOIN disasters d ON ap.disaster_id = d.disaster_id
    LEFT JOIN locations l ON ap.location_id = l.location_id
    WHERE 1=1
";
$params = [];
if ($disasterFilter) {
    $sql .= " AND ap.disaster_id = ?";
    $params[] = $disasterFilter;
}
if ($injuryFilter) {
    $sql .= " AND ap.injury_status = ?";
    $params[] = $injuryFilter;
}
$sql .= " ORDER BY ap.person_id DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$people = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>Affected Individuals Registry (<?= count($people) ?>)</span>
        </h3>

        <form method="GET" action="affected_people.php" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <select name="disaster_id" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Disasters</option>
            <?php foreach ($disasters as $dis): ?>
              <option value="<?= $dis['disaster_id'] ?>" <?= $disasterFilter == $dis['disaster_id'] ? 'selected' : '' ?>><?= escape($dis['disaster_name']) ?></option>
            <?php endforeach; ?>
          </select>
          <select name="injury_status" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Injury Statuses</option>
            <option value="None" <?= $injuryFilter === 'None' ? 'selected' : '' ?>>None</option>
            <option value="Minor" <?= $injuryFilter === 'Minor' ? 'selected' : '' ?>>Minor</option>
            <option value="Moderate" <?= $injuryFilter === 'Moderate' ? 'selected' : '' ?>>Moderate</option>
            <option value="Severe" <?= $injuryFilter === 'Severe' ? 'selected' : '' ?>>Severe</option>
            <option value="Critical" <?= $injuryFilter === 'Critical' ? 'selected' : '' ?>>Critical</option>
          </select>
          <?php if ($disasterFilter || $injuryFilter): ?>
            <a href="affected_people.php" class="btn btn-sm btn-outline">Clear</a>
          <?php endif; ?>
        </form>
      </div>

      <div class="card-actions">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button type="button" class="btn btn-primary btn-sm" data-modal="modalAddPerson">
            + Register Affected Person
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Full Name & Demographics</th>
            <th>Disaster Linked</th>
            <th>Location</th>
            <th>Family Size</th>
            <th>Medical / Injury Status</th>
            <th>Contact Phone</th>
            <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
              <th style="text-align: right;">Actions</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($people)): ?>
            <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No affected individuals recorded matching criteria.</td></tr>
          <?php else: ?>
            <?php foreach ($people as $p): ?>
              <?php
                $injClass = 'badge-neutral';
                if ($p['injury_status'] === 'Critical' || $p['injury_status'] === 'Severe') $injClass = 'badge-critical';
                elseif ($p['injury_status'] === 'Moderate' || $p['injury_status'] === 'Minor') $injClass = 'badge-warning';
                elseif ($p['injury_status'] === 'None') $injClass = 'badge-success';
              ?>
              <tr>
                <td class="table-cell-bold">
                  <div><?= escape($p['full_name']) ?></div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">
                    <?= $p['age'] ? "{$p['age']} yrs" : 'Age N/A' ?> &bull; <?= escape($p['gender']) ?>
                    <?php if (!empty($p['special_needs'])): ?>
                      &bull; <span style="color: var(--warning-700);">⚠️ <?= escape($p['special_needs']) ?></span>
                    <?php endif; ?>
                  </div>
                </td>
                <td>
                  <span class="badge badge-neutral"><?= escape($p['disaster_name']) ?></span>
                </td>
                <td>
                  <?= escape($p['city'] ? "{$p['city']}, {$p['state']}" : 'Field Location') ?>
                </td>
                <td>
                  <strong><?= (int)$p['family_size'] ?></strong> members
                </td>
                <td>
                  <span class="badge <?= $injClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($p['injury_status']) ?>
                  </span>
                </td>
                <td><?= escape($p['phone'] ?: 'No Phone') ?></td>
                <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn btn-sm btn-outline" 
                            onclick='openEditPerson(<?= json_encode($p, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'>
                      Edit
                    </button>
                    <?php if (hasRole('Admin')): ?>
                      <form method="POST" action="affected_people.php" style="display: inline;" onsubmit="return confirmDelete('Delete record?');">
                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                        <input type="hidden" name="form_action" value="delete">
                        <input type="hidden" name="person_id" value="<?= $p['person_id'] ?>">
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

  <!-- ── MODAL: ADD PERSON ────────────────────────────────────── -->
  <div class="modal-overlay" id="modalAddPerson">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Register Affected Individual</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="affected_people.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create">

        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Full Legal Name</label>
              <input type="text" name="full_name" class="form-control" required placeholder="e.g. Sunita Devi">
            </div>
            <div class="form-group">
              <label class="form-label required">Linked Disaster Incident</label>
              <select name="disaster_id" class="form-select" required>
                <option value="">Select Disaster...</option>
                <?php foreach ($disasters as $dis): ?>
                  <option value="<?= $dis['disaster_id'] ?>"><?= escape($dis['disaster_name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Age</label>
              <input type="number" name="age" class="form-control" min="0" max="120" placeholder="e.g. 35">
            </div>
            <div class="form-group">
              <label class="form-label required">Gender</label>
              <select name="gender" class="form-select" required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" name="phone" class="form-control" placeholder="+91-9876543210">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Family Size</label>
              <input type="number" name="family_size" class="form-control" min="1" value="1">
            </div>
            <div class="form-group">
              <label class="form-label required">Injury / Medical Status</label>
              <select name="injury_status" class="form-select" required>
                <option value="None" selected>None (Unharmed)</option>
                <option value="Minor">Minor Injury</option>
                <option value="Moderate">Moderate Injury</option>
                <option value="Severe">Severe Injury</option>
                <option value="Critical">Critical (Immediate Care)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Location</label>
            <select name="location_id" class="form-select">
              <option value="">Select Location...</option>
              <?php foreach ($locations as $l): ?>
                <option value="<?= $l['location_id'] ?>"><?= escape($l['city']) ?> (<?= escape($l['state']) ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Special Needs & Vulnerabilities</label>
            <input type="text" name="special_needs" class="form-control" placeholder="e.g. Infant, Diabetic medication needed, Wheelchair access...">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Save Individual</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ── MODAL: EDIT PERSON ────────────────────────────────────── -->
  <div class="modal-overlay" id="modalEditPerson">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Edit Individual Details</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="affected_people.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="update">
        <input type="hidden" name="person_id" id="edit_person_id">

        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Full Legal Name</label>
              <input type="text" name="full_name" id="edit_full_name" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Disaster Incident</label>
              <select name="disaster_id" id="edit_disaster_id" class="form-select" required>
                <?php foreach ($disasters as $dis): ?>
                  <option value="<?= $dis['disaster_id'] ?>"><?= escape($dis['disaster_name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Age</label>
              <input type="number" name="age" id="edit_age" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label required">Gender</label>
              <select name="gender" id="edit_gender" class="form-select" required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="text" name="phone" id="edit_phone" class="form-control">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Family Size</label>
              <input type="number" name="family_size" id="edit_family_size" class="form-control" min="1">
            </div>
            <div class="form-group">
              <label class="form-label required">Injury Status</label>
              <select name="injury_status" id="edit_injury_status" class="form-select" required>
                <option value="None">None</option>
                <option value="Minor">Minor</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Location</label>
            <select name="location_id" id="edit_location_id" class="form-select">
              <option value="">Select Location...</option>
              <?php foreach ($locations as $l): ?>
                <option value="<?= $l['location_id'] ?>"><?= escape($l['city']) ?> (<?= escape($l['state']) ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Special Needs</label>
            <input type="text" name="special_needs" id="edit_special_needs" class="form-control">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Update Record</button>
        </div>
      </form>
    </div>
  </div>

<script>
function openEditPerson(data) {
  document.getElementById('edit_person_id').value = data.person_id;
  document.getElementById('edit_full_name').value = data.full_name;
  document.getElementById('edit_disaster_id').value = data.disaster_id;
  document.getElementById('edit_age').value = data.age || '';
  document.getElementById('edit_gender').value = data.gender;
  document.getElementById('edit_phone').value = data.phone || '';
  document.getElementById('edit_family_size').value = data.family_size || 1;
  document.getElementById('edit_injury_status').value = data.injury_status;
  document.getElementById('edit_location_id').value = data.location_id || '';
  document.getElementById('edit_special_needs').value = data.special_needs || '';
  openModal('modalEditPerson');
}

if (window.location.search.includes('action=new')) {
  openModal('modalAddPerson');
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
