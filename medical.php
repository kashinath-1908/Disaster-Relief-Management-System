<?php
// ============================================================
// Medical Facilities & Patient Cases Registry
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Medical Facilities & Trauma Cases';
$pageSubtitle = 'Triage Capacity, Bed Availability, Field Hospitals & Patient Records';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create_facility') {
        $name       = trim($_POST['facility_name'] ?? '');
        $locId      = !empty($_POST['location_id']) ? (int)$_POST['location_id'] : null;
        $type       = $_POST['facility_type'] ?? 'Hospital';
        $availBeds  = (int)($_POST['available_beds'] ?? 0);
        $emerg      = !empty($_POST['emergency_available']) ? 1 : 0;
        $contact    = trim($_POST['contact_number'] ?? '');
        $status     = $_POST['status'] ?? 'Active';

        if ($name) {
            $stmt = $pdo->prepare("
                INSERT INTO medical_facilities (location_id, facility_name, facility_type, contact_number, available_beds, emergency_available, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$locId, $name, $type, $contact, $availBeds, $emerg, $status]);
            setFlash('success', "Medical facility '{$name}' registered.");
        } else {
            setFlash('error', 'Facility name is required.');
        }
        header('Location: medical.php');
        exit;
    }

    if ($action === 'create_case') {
        $personId    = !empty($_POST['person_id']) ? (int)$_POST['person_id'] : null;
        $facilityId  = !empty($_POST['facility_id']) ? (int)$_POST['facility_id'] : null;
        $disasterId  = !empty($_POST['disaster_id']) ? (int)$_POST['disaster_id'] : null;
        $caseType    = $_POST['case_type'] ?? 'Injury';
        $injuryDesc  = trim($_POST['injury_description'] ?? '');
        $treatment   = trim($_POST['treatment'] ?? '');
        $caseStatus  = $_POST['case_status'] ?? 'Admitted';
        $admission   = !empty($_POST['admission_date']) ? $_POST['admission_date'] : date('Y-m-d H:i:s');

        if ($caseType) {
            $stmt = $pdo->prepare("
                INSERT INTO medical_cases (person_id, facility_id, disaster_id, case_type, injury_description, treatment, case_status, admission_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$personId, $facilityId, $disasterId, $caseType, $injuryDesc, $treatment, $caseStatus, $admission]);

            // Deduct available bed if admitted and facility exists
            if ($facilityId && in_array($caseStatus, ['Admitted', 'Under Treatment', 'Critical'])) {
                $pdo->prepare("UPDATE medical_facilities SET available_beds = GREATEST(0, available_beds - 1) WHERE facility_id = ?")->execute([$facilityId]);
            }

            setFlash('success', 'Medical case registered successfully.');
        } else {
            setFlash('error', 'Case type is required.');
        }
        header('Location: medical.php');
        exit;
    }

    if ($action === 'update_case_status') {
        $caseId = (int)($_POST['case_id'] ?? 0);
        $newStatus = $_POST['case_status'] ?? 'Admitted';
        $facId = (int)($_POST['facility_id'] ?? 0);

        if ($caseId && in_array($newStatus, ['Admitted', 'Under Treatment', 'Discharged', 'Critical', 'Deceased'])) {
            $discharge = in_array($newStatus, ['Discharged', 'Deceased']) ? date('Y-m-d H:i:s') : null;
            $stmt = $pdo->prepare("UPDATE medical_cases SET case_status = ?, discharge_date = COALESCE(?, discharge_date) WHERE case_id = ?");
            $stmt->execute([$newStatus, $discharge, $caseId]);

            // If discharged, restore bed
            if (in_array($newStatus, ['Discharged', 'Deceased']) && $facId) {
                $pdo->prepare("UPDATE medical_facilities SET available_beds = available_beds + 1 WHERE facility_id = ?")->execute([$facId]);
            }
            setFlash('success', "Patient case status updated.");
        }
        header('Location: medical.php');
        exit;
    }
}

// Summary Metrics
$totalFacilities  = (int)$pdo->query("SELECT COUNT(*) FROM medical_facilities")->fetchColumn();
$totalBedsAvail   = (int)$pdo->query("SELECT COALESCE(SUM(available_beds), 0) FROM medical_facilities WHERE status = 'Active'")->fetchColumn();
$activeCasesCount = (int)$pdo->query("SELECT COUNT(*) FROM medical_cases WHERE case_status IN ('Admitted', 'Under Treatment', 'Critical')")->fetchColumn();
$criticalPatients = (int)$pdo->query("SELECT COUNT(*) FROM medical_cases WHERE case_status = 'Critical'")->fetchColumn();

// Dropdowns & Data
$locations = $pdo->query("SELECT location_id, location_name, city, state FROM locations ORDER BY city ASC")->fetchAll();
$disasters = $pdo->query("SELECT disaster_id, disaster_name FROM disasters ORDER BY status = 'Active' DESC, disaster_name ASC")->fetchAll();
$patients = $pdo->query("SELECT person_id, full_name, age, gender FROM affected_people ORDER BY full_name ASC LIMIT 100")->fetchAll();

$facilities = $pdo->query("
    SELECT mf.*, l.location_name, l.city, l.state,
           (SELECT COUNT(*) FROM medical_cases mc WHERE mc.facility_id = mf.facility_id AND mc.case_status IN ('Admitted', 'Under Treatment', 'Critical')) as active_admissions
    FROM medical_facilities mf
    LEFT JOIN locations l ON mf.location_id = l.location_id
    ORDER BY mf.facility_name ASC
")->fetchAll();

$cases = $pdo->query("
    SELECT mc.*, ap.full_name as patient_name, ap.age, ap.gender,
           mf.facility_name, d.disaster_name
    FROM medical_cases mc
    LEFT JOIN affected_people ap ON mc.person_id = ap.person_id
    LEFT JOIN medical_facilities mf ON mc.facility_id = mf.facility_id
    LEFT JOIN disasters d ON mc.disaster_id = d.disaster_id
    ORDER BY mc.admission_date DESC
")->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <!-- Summary KPI Cards -->
  <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Medical Facilities</span>
        <span class="stat-value"><?= $totalFacilities ?></span>
        <span class="stat-subtext">Hospitals & field units</span>
      </div>
      <div class="stat-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Available Triage Beds</span>
        <span class="stat-value" style="color: var(--success-600);"><?= number_format($totalBedsAvail) ?></span>
        <span class="stat-subtext">Ready for emergency admissions</span>
      </div>
      <div class="stat-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Active Inpatients</span>
        <span class="stat-value" style="color: var(--primary-600);"><?= $activeCasesCount ?></span>
        <span class="stat-subtext">Under active clinical care</span>
      </div>
      <div class="stat-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Critical Patients (ICU)</span>
        <span class="stat-value" style="color: var(--emergency-600);"><?= $criticalPatients ?></span>
        <span class="stat-subtext">High acuity trauma monitoring</span>
      </div>
      <div class="stat-icon red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
    </div>
  </div>

  <!-- SECTION 1: Medical Facilities -->
  <div class="card" style="margin-bottom: 2rem;">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <span>Hospital Network & Medical Units (<?= count($facilities) ?>)</span>
      </h3>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="text" class="table-search" placeholder="Search clinics, hospitals..." style="width: 200px;">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button class="btn btn-outline btn-sm" onclick="openModal('addFacilityModal')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Register Facility</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="openModal('addCaseModal')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Log Patient Case</span>
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Facility Name</th>
            <th>Classification</th>
            <th>Location</th>
            <th>Contact Phone</th>
            <th>Available Beds</th>
            <th>Emergency Unit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($facilities)): ?>
            <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No medical facilities registered.</td></tr>
          <?php else: ?>
            <?php foreach ($facilities as $f): 
              $fBadge = 'badge-neutral';
              if ($f['status'] === 'Active') $fBadge = 'badge-success';
              elseif ($f['status'] === 'Full') $fBadge = 'badge-warning';
              elseif ($f['status'] === 'Closed') $fBadge = 'badge-danger';
            ?>
              <tr>
                <td><strong><?= htmlspecialchars($f['facility_name']) ?></strong></td>
                <td><span class="badge badge-info"><?= htmlspecialchars($f['facility_type']) ?></span></td>
                <td>
                  <div><?= htmlspecialchars($f['location_name'] ?? 'Primary Health Post') ?></div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($f['city'] ?? '') ?>, <?= htmlspecialchars($f['state'] ?? '') ?></div>
                </td>
                <td>
                  <a href="tel:<?= htmlspecialchars($f['contact_number']) ?>" style="font-weight: 600; color: var(--primary-700);">
                    <?= htmlspecialchars($f['contact_number'] ?: 'N/A') ?>
                  </a>
                </td>
                <td>
                  <span style="font-size: 1.1rem; font-weight: 700; color: <?= $f['available_beds'] > 0 ? 'var(--success-600)' : 'var(--emergency-600)' ?>;">
                    <?= (int)$f['available_beds'] ?>
                  </span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);"> beds free (<?= (int)$f['active_admissions'] ?> in care)</span>
                </td>
                <td>
                  <?php if ($f['emergency_available']): ?>
                    <span class="badge badge-success">24/7 ER Ready</span>
                  <?php else: ?>
                    <span class="badge badge-neutral">Standard</span>
                  <?php endif; ?>
                </td>
                <td><span class="badge <?= $fBadge ?>"><?= htmlspecialchars($f['status']) ?></span></td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- SECTION 2: Medical Cases -->
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>
        <span>Medical Cases & Triage Patients (<?= count($cases) ?>)</span>
      </h3>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Patient Name</th>
            <th>Disaster</th>
            <th>Admitted Facility</th>
            <th>Type / Diagnosis</th>
            <th>Admission Date</th>
            <th>Status</th>
            <th>Update Status</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($cases)): ?>
            <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No medical cases recorded.</td></tr>
          <?php else: ?>
            <?php foreach ($cases as $c): 
              $cBadge = 'badge-neutral';
              if ($c['case_status'] === 'Critical') $cBadge = 'badge-danger';
              elseif ($c['case_status'] === 'Admitted' || $c['case_status'] === 'Under Treatment') $cBadge = 'badge-warning';
              elseif ($c['case_status'] === 'Discharged') $cBadge = 'badge-success';
              elseif ($c['case_status'] === 'Deceased') $cBadge = 'badge-neutral';
            ?>
              <tr>
                <td><strong>#MC-<?= str_pad($c['case_id'], 4, '0', STR_PAD_LEFT) ?></strong></td>
                <td>
                  <div style="font-weight: 600; color: var(--navy-900);"><?= htmlspecialchars($c['patient_name'] ?? 'Unidentified Patient') ?></div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($c['gender'] ?? '') ?> <?= $c['age'] ? '&bull; ' . $c['age'] . ' yrs' : '' ?></div>
                </td>
                <td><?= !empty($c['disaster_name']) ? htmlspecialchars($c['disaster_name']) : '<span style="color: var(--text-muted);">N/A</span>' ?></td>
                <td><?= !empty($c['facility_name']) ? htmlspecialchars($c['facility_name']) : '<span style="color: var(--text-muted);">Field Medical Post</span>' ?></td>
                <td>
                  <div style="font-weight: 600; color: var(--navy-800);"><?= htmlspecialchars($c['case_type']) ?></div>
                  <?php if (!empty($c['injury_description'])): ?>
                    <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      <?= htmlspecialchars($c['injury_description']) ?>
                    </div>
                  <?php endif; ?>
                </td>
                <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">
                  <?= !empty($c['admission_date']) ? date('M d, Y H:i', strtotime($c['admission_date'])) : 'N/A' ?>
                </td>
                <td><span class="badge <?= $cBadge ?>"><?= htmlspecialchars($c['case_status']) ?></span></td>
                <td>
                  <form method="POST" action="medical.php" style="display: inline-flex; gap: 0.25rem;">
                    <?= csrfField() ?>
                    <input type="hidden" name="form_action" value="update_case_status">
                    <input type="hidden" name="case_id" value="<?= $c['case_id'] ?>">
                    <input type="hidden" name="facility_id" value="<?= $c['facility_id'] ?>">
                    <select name="case_status" class="form-select" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; width: auto;" onchange="this.form.submit()">
                      <option value="Admitted" <?= $c['case_status'] === 'Admitted' ? 'selected' : '' ?>>Admitted</option>
                      <option value="Under Treatment" <?= $c['case_status'] === 'Under Treatment' ? 'selected' : '' ?>>Under Treatment</option>
                      <option value="Critical" <?= $c['case_status'] === 'Critical' ? 'selected' : '' ?>>Critical</option>
                      <option value="Discharged" <?= $c['case_status'] === 'Discharged' ? 'selected' : '' ?>>Discharged</option>
                      <option value="Deceased" <?= $c['case_status'] === 'Deceased' ? 'selected' : '' ?>>Deceased</option>
                    </select>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal: Register Facility -->
<div id="addFacilityModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Register Medical / Trauma Facility</h3>
      <button class="modal-close" onclick="closeModal('addFacilityModal')">&times;</button>
    </div>
    <form method="POST" action="medical.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create_facility">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Facility Official Name</label>
          <input type="text" name="facility_name" class="form-input" required placeholder="e.g. District Civil Hospital, Red Cross Trauma Tent">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Facility Classification</label>
            <select name="facility_type" class="form-select" required>
              <option value="Hospital">General Hospital</option>
              <option value="Trauma Center">Trauma Center (Emergency Level 1)</option>
              <option value="Field Medical Unit">Field Medical Unit / Camp</option>
              <option value="Clinic">Community Health Clinic</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sector / Location</label>
            <select name="location_id" class="form-select">
              <option value="">-- Select Location --</option>
              <?php foreach ($locations as $loc): ?>
                <option value="<?= $loc['location_id'] ?>"><?= htmlspecialchars($loc['location_name']) ?> (<?= $loc['city'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Available Beds</label>
            <input type="number" name="available_beds" class="form-input" required value="50" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Contact Telephone</label>
            <input type="text" name="contact_number" class="form-input" placeholder="+91 22 2876 5432">
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Operational Status</label>
            <select name="status" class="form-select" required>
              <option value="Active">Active</option>
              <option value="Full">Full (At Maximum Bed Capacity)</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1.8rem;">
            <input type="checkbox" name="emergency_available" id="emergAvail" value="1" checked style="width: 1.2rem; height: 1.2rem;">
            <label for="emergAvail" class="form-label" style="margin-bottom: 0; cursor: pointer;">Equipped for 24/7 Emergency Triage</label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addFacilityModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Facility</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal: Log Patient Case -->
<div id="addCaseModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Register Patient Medical Case</h3>
      <button class="modal-close" onclick="closeModal('addCaseModal')">&times;</button>
    </div>
    <form method="POST" action="medical.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create_case">
      <div class="modal-body">
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Affected Person / Patient</label>
            <select name="person_id" class="form-select">
              <option value="">-- Choose Registered Person (Optional) --</option>
              <?php foreach ($patients as $p): ?>
                <option value="<?= $p['person_id'] ?>"><?= htmlspecialchars($p['full_name']) ?> (<?= $p['gender'] ?>, <?= $p['age'] ?> yrs)</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Disaster Event</label>
            <select name="disaster_id" class="form-select">
              <option value="">-- Select Disaster --</option>
              <?php foreach ($disasters as $dis): ?>
                <option value="<?= $dis['disaster_id'] ?>"><?= htmlspecialchars($dis['disaster_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Admitted Facility</label>
            <select name="facility_id" class="form-select">
              <option value="">-- Select Facility --</option>
              <?php foreach ($facilities as $fac): ?>
                <option value="<?= $fac['facility_id'] ?>"><?= htmlspecialchars($fac['facility_name']) ?> (<?= $fac['available_beds'] ?> beds free)</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Case Classification</label>
            <select name="case_type" class="form-select" required>
              <option value="Injury">Physical Trauma / Injury</option>
              <option value="Illness">Infection / Acute Illness</option>
              <option value="Trauma">Psychological Trauma / Shock</option>
              <option value="Missing">Reported Missing / Injured</option>
              <option value="Deceased">Deceased</option>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Initial Patient Status</label>
            <select name="case_status" class="form-select" required>
              <option value="Admitted">Admitted</option>
              <option value="Under Treatment">Under Treatment</option>
              <option value="Critical">Critical (ICU Monitoring)</option>
              <option value="Discharged">Discharged (Treated & Released)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Admission Date & Time</label>
            <input type="datetime-local" name="admission_date" class="form-input" value="<?= date('Y-m-d\TH:i') ?>">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Injury / Symptoms Description</label>
          <textarea name="injury_description" class="form-textarea" rows="2" placeholder="e.g. Compound fracture right tibia, hypothermia, acute dehydration..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Treatment & Medical Directives</label>
          <textarea name="treatment" class="form-textarea" rows="2" placeholder="e.g. IV Saline 0.9%, tetanus toxoid, wound debridement..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addCaseModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Case</button>
      </div>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
