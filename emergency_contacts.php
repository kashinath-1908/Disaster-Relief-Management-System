<?php
// ============================================================
// Emergency Helplines & Rapid Contact Directory
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Emergency Contacts & Helplines';
$pageSubtitle = '24/7 Tactical Quick-Dial Lines for Police, Fire, NDRF, Trauma & Disaster Control';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $locId        = !empty($_POST['location_id']) ? (int)$_POST['location_id'] : null;
        $svcType      = $_POST['service_type'] ?? 'Police';
        $svcName      = trim($_POST['service_name'] ?? '');
        $phone        = trim($_POST['contact_number'] ?? '');
        $address      = trim($_POST['address'] ?? '');
        $availability = $_POST['availability'] ?? '24/7';

        if ($svcName && $phone) {
            $stmt = $pdo->prepare("
                INSERT INTO emergency_contacts (location_id, service_name, service_type, contact_number, address, availability)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$locId, $svcName, $svcType, $phone, $address ?: null, $availability]);
            setFlash('success', "Emergency contact '{$svcName}' registered.");
        } else {
            setFlash('error', 'Service name and contact number are required.');
        }
        header('Location: emergency_contacts.php');
        exit;
    }

    if ($action === 'delete') {
        requireRole(['Admin']);
        $contactId = (int)($_POST['contact_id'] ?? 0);
        if ($contactId) {
            $pdo->prepare("DELETE FROM emergency_contacts WHERE contact_id = ?")->execute([$contactId]);
            setFlash('success', "Emergency contact deleted.");
        }
        header('Location: emergency_contacts.php');
        exit;
    }
}

$svcFilter = $_GET['service_type'] ?? '';
$locations = $pdo->query("SELECT location_id, location_name, city, state FROM locations ORDER BY city ASC")->fetchAll();

$sql = "
    SELECT ec.*, l.location_name, l.city, l.state
    FROM emergency_contacts ec
    LEFT JOIN locations l ON ec.location_id = l.location_id
    WHERE 1=1
";
$params = [];
if ($svcFilter) {
    $sql .= " AND ec.service_type = ?";
    $params[] = $svcFilter;
}
$sql .= " ORDER BY FIELD(ec.service_type, 'Disaster Management', 'Search & Rescue', 'Ambulance', 'Hospital', 'Police', 'Fire'), ec.service_name ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$contacts = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <!-- National Emergency Quick-Dial SOS Cards -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
    <div class="stat-card" style="border-left: 4px solid var(--emergency-600);">
      <div>
        <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--emergency-600); letter-spacing: 0.05em;">Unified Helpline</div>
        <div style="font-size: 1.85rem; font-weight: 800; color: var(--emergency-600);">
          <a href="tel:112" style="color: inherit; text-decoration: none;">112</a>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">National Emergency Response</div>
      </div>
    </div>

    <div class="stat-card" style="border-left: 4px solid var(--warning-600);">
      <div>
        <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--warning-600); letter-spacing: 0.05em;">NDRF / NDMA Control</div>
        <div style="font-size: 1.85rem; font-weight: 800; color: var(--warning-600);">
          <a href="tel:1078" style="color: inherit; text-decoration: none;">1078</a>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Disaster Management Desk</div>
      </div>
    </div>

    <div class="stat-card" style="border-left: 4px solid #2563eb;">
      <div>
        <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #2563eb; letter-spacing: 0.05em;">Police Control Room</div>
        <div style="font-size: 1.85rem; font-weight: 800; color: #2563eb;">
          <a href="tel:100" style="color: inherit; text-decoration: none;">100</a>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Law & Order Rapid Response</div>
      </div>
    </div>

    <div class="stat-card" style="border-left: 4px solid var(--success-600);">
      <div>
        <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--success-600); letter-spacing: 0.05em;">Medical Ambulance</div>
        <div style="font-size: 1.85rem; font-weight: 800; color: var(--success-600);">
          <a href="tel:108" style="color: inherit; text-decoration: none;">108</a>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Emergency Medical Care</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>Emergency Services Directory (<?= count($contacts) ?>)</span>
        </h3>

        <form method="GET" action="emergency_contacts.php" style="display: flex; gap: 0.5rem; align-items: center;">
          <select name="service_type" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Emergency Categories</option>
            <option value="Disaster Management" <?= $svcFilter === 'Disaster Management' ? 'selected' : '' ?>>Disaster Management</option>
            <option value="Search & Rescue" <?= $svcFilter === 'Search & Rescue' ? 'selected' : '' ?>>Search & Rescue</option>
            <option value="Ambulance" <?= $svcFilter === 'Ambulance' ? 'selected' : '' ?>>Ambulance</option>
            <option value="Hospital" <?= $svcFilter === 'Hospital' ? 'selected' : '' ?>>Hospital</option>
            <option value="Police" <?= $svcFilter === 'Police' ? 'selected' : '' ?>>Police</option>
            <option value="Fire" <?= $svcFilter === 'Fire' ? 'selected' : '' ?>>Fire & Rescue</option>
          </select>
          <?php if ($svcFilter): ?>
            <a href="emergency_contacts.php" class="btn btn-sm btn-outline">Clear</a>
          <?php endif; ?>
        </form>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="text" class="table-search" placeholder="Search agencies, numbers..." style="width: 200px;">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button class="btn btn-primary btn-sm" onclick="openModal('addContactModal')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Emergency Line</span>
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Service Agency</th>
            <th>Category</th>
            <th>Direct Emergency Hotline</th>
            <th>Operational Zone</th>
            <th>Availability</th>
            <th>Headquarters / Station</th>
            <?php if (hasRole(['Admin'])): ?><th>Action</th><?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($contacts)): ?>
            <tr>
              <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                No emergency contacts found for the selected category.
              </td>
            </tr>
          <?php else: ?>
            <?php foreach ($contacts as $c): 
              $badgeClass = 'badge-neutral';
              if ($c['service_type'] === 'Disaster Management' || $c['service_type'] === 'Search & Rescue') $badgeClass = 'badge-danger';
              elseif ($c['service_type'] === 'Ambulance' || $c['service_type'] === 'Hospital') $badgeClass = 'badge-success';
              elseif ($c['service_type'] === 'Police') $badgeClass = 'badge-info';
              elseif ($c['service_type'] === 'Fire') $badgeClass = 'badge-warning';
            ?>
              <tr>
                <td>
                  <div style="font-weight: 700; color: var(--navy-900); font-size: 0.95rem;"><?= htmlspecialchars($c['service_name']) ?></div>
                </td>
                <td>
                  <span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($c['service_type']) ?></span>
                </td>
                <td>
                  <a href="tel:<?= htmlspecialchars($c['contact_number']) ?>" style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 1.05rem; font-weight: 700; color: var(--emergency-600); text-decoration: none; padding: 0.2rem 0.5rem; background: rgba(239, 68, 68, 0.08); border-radius: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span><?= htmlspecialchars($c['contact_number']) ?></span>
                  </a>
                </td>
                <td>
                  <div><?= htmlspecialchars($c['location_name'] ?? 'Statewide') ?></div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($c['city'] ?? '') ?><?= !empty($c['state']) ? ', ' . htmlspecialchars($c['state']) : '' ?></div>
                </td>
                <td>
                  <span class="badge <?= $c['availability'] === '24/7' ? 'badge-success' : 'badge-neutral' ?>">
                    <?= htmlspecialchars($c['availability']) ?>
                  </span>
                </td>
                <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 200px;">
                  <?= htmlspecialchars($c['address'] ?? 'Official Emergency Dispatch Desk') ?>
                </td>
                <?php if (hasRole(['Admin'])): ?>
                  <td>
                    <form method="POST" action="emergency_contacts.php" onsubmit="return confirm('Delete this emergency contact?');" style="display: inline;">
                      <?= csrfField() ?>
                      <input type="hidden" name="form_action" value="delete">
                      <input type="hidden" name="contact_id" value="<?= $c['contact_id'] ?>">
                      <button type="submit" class="btn btn-sm btn-outline" style="color: var(--emergency-600); border-color: rgba(239, 68, 68, 0.3);">
                        Delete
                      </button>
                    </form>
                  </td>
                <?php endif; ?>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal: Add Emergency Contact -->
<div id="addContactModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Register Emergency Contact Hotline</h3>
      <button class="modal-close" onclick="closeModal('addContactModal')">&times;</button>
    </div>
    <form method="POST" action="emergency_contacts.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Agency / Service Name</label>
          <input type="text" name="service_name" class="form-input" required placeholder="e.g. NDRF 5th Battalion Pune, Metro Fire Command">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Emergency Category</label>
            <select name="service_type" class="form-select" required>
              <option value="Disaster Management">Disaster Management</option>
              <option value="Search & Rescue">Search & Rescue</option>
              <option value="Ambulance">Ambulance Services</option>
              <option value="Hospital">Hospital / Trauma</option>
              <option value="Police">Police</option>
              <option value="Fire">Fire & Rescue</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Primary Emergency Number</label>
            <input type="text" name="contact_number" class="form-input" required placeholder="e.g. +91 20 2550 1234 or 1078">
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Jurisdiction / Location</label>
            <select name="location_id" class="form-select">
              <option value="">-- All Zones / Statewide --</option>
              <?php foreach ($locations as $loc): ?>
                <option value="<?= $loc['location_id'] ?>"><?= htmlspecialchars($loc['location_name']) ?> (<?= $loc['city'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Availability</label>
            <select name="availability" class="form-select" required>
              <option value="24/7">24/7 Round the Clock</option>
              <option value="Business Hours">Business Hours (09:00 - 18:00)</option>
              <option value="On Call">On Call Emergency Duty</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Physical Address / Control Room</label>
          <textarea name="address" class="form-textarea" rows="2" placeholder="Street, Control Tower, Sector, Pincode..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addContactModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Emergency Contact</button>
      </div>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
