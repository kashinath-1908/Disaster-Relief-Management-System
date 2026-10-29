<?php
// ============================================================
// Emergency Transportation & Transit Logistics
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Emergency Transport & Logistics Fleet';
$pageSubtitle = 'Fleet Readiness, Ambulances, Evacuation Convoys & Transit Missions';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create_vehicle') {
        $vNum    = trim($_POST['vehicle_number'] ?? '');
        $vType   = $_POST['vehicle_type'] ?? 'Truck';
        $cap     = !empty($_POST['capacity']) ? (int)$_POST['capacity'] : null;
        $driver  = trim($_POST['driver_name'] ?? '');
        $phone   = trim($_POST['driver_phone'] ?? '');
        $status  = $_POST['availability_status'] ?? 'Available';

        if ($vNum && $vType) {
            $stmt = $pdo->prepare("
                INSERT INTO transportation (vehicle_number, vehicle_type, capacity, driver_name, driver_phone, availability_status)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$vNum, $vType, $cap, $driver, $phone, $status]);
            setFlash('success', "Vehicle '{$vNum}' registered to emergency fleet.");
        } else {
            setFlash('error', 'Vehicle registration number and type are required.');
        }
        header('Location: transportation.php');
        exit;
    }

    if ($action === 'create_assignment') {
        $vehicleId   = (int)($_POST['vehicle_id'] ?? 0);
        $opId        = !empty($_POST['operation_id']) ? (int)$_POST['operation_id'] : null;
        $source      = trim($_POST['source_location'] ?? '');
        $destination = trim($_POST['destination_location'] ?? '');
        $departure   = !empty($_POST['departure_time']) ? $_POST['departure_time'] : date('Y-m-d H:i:s');
        $status      = $_POST['status'] ?? 'En Route';

        if ($vehicleId && $source && $destination) {
            $stmt = $pdo->prepare("
                INSERT INTO transport_assignments (vehicle_id, operation_id, source_location, destination_location, departure_time, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$vehicleId, $opId, $source, $destination, $departure, $status]);

            // Set vehicle availability status
            if ($status === 'En Route' || $status === 'Scheduled') {
                $pdo->prepare("UPDATE transportation SET availability_status = 'In Use' WHERE vehicle_id = ?")->execute([$vehicleId]);
            }
            setFlash('success', 'Transit assignment scheduled & dispatched.');
        } else {
            setFlash('error', 'Vehicle, source location, and destination are required.');
        }
        header('Location: transportation.php');
        exit;
    }

    if ($action === 'update_vehicle_status') {
        $vId = (int)($_POST['vehicle_id'] ?? 0);
        $vStatus = $_POST['availability_status'] ?? 'Available';
        if ($vId && in_array($vStatus, ['Available', 'In Use', 'Under Maintenance', 'Out of Service'])) {
            $stmt = $pdo->prepare("UPDATE transportation SET availability_status = ? WHERE vehicle_id = ?");
            $stmt->execute([$vStatus, $vId]);
            setFlash('success', "Vehicle #{$vId} status updated.");
        }
        header('Location: transportation.php');
        exit;
    }

    if ($action === 'update_assignment_status') {
        $aId = (int)($_POST['transport_assignment_id'] ?? 0);
        $aStatus = $_POST['status'] ?? 'Completed';
        $vId = (int)($_POST['vehicle_id'] ?? 0);

        if ($aId && in_array($aStatus, ['Scheduled', 'En Route', 'Arrived', 'Completed', 'Cancelled'])) {
            $arrival = in_array($aStatus, ['Arrived', 'Completed']) ? date('Y-m-d H:i:s') : null;
            $stmt = $pdo->prepare("UPDATE transport_assignments SET status = ?, arrival_time = COALESCE(?, arrival_time) WHERE transport_assignment_id = ?");
            $stmt->execute([$aStatus, $arrival, $aId]);

            if (in_array($aStatus, ['Completed', 'Cancelled']) && $vId) {
                $pdo->prepare("UPDATE transportation SET availability_status = 'Available' WHERE vehicle_id = ?")->execute([$vId]);
            }
            setFlash('success', "Transit assignment updated.");
        }
        header('Location: transportation.php');
        exit;
    }
}

// Summary Metrics
$totalVehicles = (int)$pdo->query("SELECT COUNT(*) FROM transportation")->fetchColumn();
$availableVehicles = (int)$pdo->query("SELECT COUNT(*) FROM transportation WHERE availability_status = 'Available'")->fetchColumn();
$inUseVehicles = (int)$pdo->query("SELECT COUNT(*) FROM transportation WHERE availability_status = 'In Use'")->fetchColumn();
$activeAssignments = (int)$pdo->query("SELECT COUNT(*) FROM transport_assignments WHERE status IN ('Scheduled', 'En Route')")->fetchColumn();

// Dropdowns & Queries
$vehicles = $pdo->query("SELECT * FROM transportation ORDER BY FIELD(availability_status, 'Available', 'In Use', 'Under Maintenance', 'Out of Service'), vehicle_type ASC")->fetchAll();
$operations = $pdo->query("SELECT operation_id, operation_name FROM rescue_operations ORDER BY operation_name ASC")->fetchAll();
$locations = $pdo->query("SELECT location_id, location_name, city FROM locations ORDER BY city ASC")->fetchAll();

$assignments = $pdo->query("
    SELECT ta.*, v.vehicle_number, v.vehicle_type, v.driver_name, v.driver_phone,
           ro.operation_name
    FROM transport_assignments ta
    JOIN transportation v ON ta.vehicle_id = v.vehicle_id
    LEFT JOIN rescue_operations ro ON ta.operation_id = ro.operation_id
    ORDER BY ta.transport_assignment_id DESC
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
        <span class="stat-title">Fleet Strength</span>
        <span class="stat-value"><?= $totalVehicles ?></span>
        <span class="stat-subtext">Registered transit assets</span>
      </div>
      <div class="stat-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Ready for Deployment</span>
        <span class="stat-value" style="color: var(--success-600);"><?= $availableVehicles ?></span>
        <span class="stat-subtext">Available standby units</span>
      </div>
      <div class="stat-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">In Field / Transit</span>
        <span class="stat-value" style="color: var(--emergency-600);"><?= $inUseVehicles ?></span>
        <span class="stat-subtext">Active logistical missions</span>
      </div>
      <div class="stat-icon red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">En Route Convoys</span>
        <span class="stat-value" style="color: var(--warning-600);"><?= $activeAssignments ?></span>
        <span class="stat-subtext">Active transit dispatches</span>
      </div>
      <div class="stat-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </div>
    </div>
  </div>

  <!-- SECTION 1: Fleet Inventory -->
  <div class="card" style="margin-bottom: 2rem;">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        <span>Emergency Fleet Inventory (<?= count($vehicles) ?>)</span>
      </h3>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="text" class="table-search" placeholder="Search plates, drivers..." style="width: 200px;">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button class="btn btn-outline btn-sm" onclick="openModal('addVehicleModal')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Register Vehicle</span>
          </button>
          <button class="btn btn-primary btn-sm" onclick="openModal('addAssignmentModal')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            <span>Dispatch Transit Mission</span>
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Vehicle No.</th>
            <th>Type</th>
            <th>Capacity</th>
            <th>Assigned Driver</th>
            <th>Phone</th>
            <th>Availability</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($vehicles)): ?>
            <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No vehicles registered.</td></tr>
          <?php else: ?>
            <?php foreach ($vehicles as $v): 
              $vBadge = 'badge-neutral';
              if ($v['availability_status'] === 'Available') $vBadge = 'badge-success';
              elseif ($v['availability_status'] === 'In Use') $vBadge = 'badge-danger';
              elseif ($v['availability_status'] === 'Under Maintenance') $vBadge = 'badge-warning';
            ?>
              <tr>
                <td><strong><?= htmlspecialchars($v['vehicle_number']) ?></strong></td>
                <td>
                  <span class="badge badge-info"><?= htmlspecialchars($v['vehicle_type']) ?></span>
                </td>
                <td>
                  <?= $v['capacity'] ? number_format($v['capacity']) . ' units / persons' : '<span style="color: var(--text-muted);">Standard</span>' ?>
                </td>
                <td><?= htmlspecialchars($v['driver_name'] ?? 'Unassigned Driver') ?></td>
                <td><?= htmlspecialchars($v['driver_phone'] ?? 'N/A') ?></td>
                <td><span class="badge <?= $vBadge ?>"><?= htmlspecialchars($v['availability_status']) ?></span></td>
                <td>
                  <form method="POST" action="transportation.php" style="display: inline-flex; gap: 0.25rem;">
                    <?= csrfField() ?>
                    <input type="hidden" name="form_action" value="update_vehicle_status">
                    <input type="hidden" name="vehicle_id" value="<?= $v['vehicle_id'] ?>">
                    <select name="availability_status" class="form-select" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; width: auto;" onchange="this.form.submit()">
                      <option value="Available" <?= $v['availability_status'] === 'Available' ? 'selected' : '' ?>>Available</option>
                      <option value="In Use" <?= $v['availability_status'] === 'In Use' ? 'selected' : '' ?>>In Use</option>
                      <option value="Under Maintenance" <?= $v['availability_status'] === 'Under Maintenance' ? 'selected' : '' ?>>Maintenance</option>
                      <option value="Out of Service" <?= $v['availability_status'] === 'Out of Service' ? 'selected' : '' ?>>Out of Service</option>
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

  <!-- SECTION 2: Active Transit Missions & Assignments -->
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        <span>Transit Assignments & Convoy Movements (<?= count($assignments) ?>)</span>
      </h3>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vehicle & Driver</th>
            <th>Mission / Operation</th>
            <th>Origin (Source)</th>
            <th>Destination</th>
            <th>Departure</th>
            <th>Transit Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($assignments)): ?>
            <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No transit assignments on record.</td></tr>
          <?php else: ?>
            <?php foreach ($assignments as $a): 
              $aBadge = 'badge-neutral';
              if ($a['status'] === 'En Route') $aBadge = 'badge-danger';
              elseif ($a['status'] === 'Arrived' || $a['status'] === 'Completed') $aBadge = 'badge-success';
              elseif ($a['status'] === 'Scheduled') $aBadge = 'badge-info';
            ?>
              <tr>
                <td><strong>#TR-<?= str_pad($a['transport_assignment_id'], 4, '0', STR_PAD_LEFT) ?></strong></td>
                <td>
                  <div style="font-weight: 600; color: var(--navy-900);"><?= htmlspecialchars($a['vehicle_number']) ?> (<?= $a['vehicle_type'] ?>)</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($a['driver_name'] ?? 'Driver N/A') ?> <?= !empty($a['driver_phone']) ? '• ' . htmlspecialchars($a['driver_phone']) : '' ?></div>
                </td>
                <td><?= !empty($a['operation_name']) ? htmlspecialchars($a['operation_name']) : '<span style="color: var(--text-muted);">General Logistics</span>' ?></td>
                <td><?= htmlspecialchars($a['source_location'] ?? 'Base Depot') ?></td>
                <td><strong><?= htmlspecialchars($a['destination_location'] ?? 'Target Zone') ?></strong></td>
                <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">
                  <?= !empty($a['departure_time']) ? date('M d, H:i', strtotime($a['departure_time'])) : 'Immediate' ?>
                </td>
                <td><span class="badge <?= $aBadge ?>"><?= htmlspecialchars($a['status']) ?></span></td>
                <td>
                  <form method="POST" action="transportation.php" style="display: inline-flex; gap: 0.25rem;">
                    <?= csrfField() ?>
                    <input type="hidden" name="form_action" value="update_assignment_status">
                    <input type="hidden" name="transport_assignment_id" value="<?= $a['transport_assignment_id'] ?>">
                    <input type="hidden" name="vehicle_id" value="<?= $a['vehicle_id'] ?>">
                    <select name="status" class="form-select" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; width: auto;" onchange="this.form.submit()">
                      <option value="Scheduled" <?= $a['status'] === 'Scheduled' ? 'selected' : '' ?>>Scheduled</option>
                      <option value="En Route" <?= $a['status'] === 'En Route' ? 'selected' : '' ?>>En Route</option>
                      <option value="Arrived" <?= $a['status'] === 'Arrived' ? 'selected' : '' ?>>Arrived</option>
                      <option value="Completed" <?= $a['status'] === 'Completed' ? 'selected' : '' ?>>Completed</option>
                      <option value="Cancelled" <?= $a['status'] === 'Cancelled' ? 'selected' : '' ?>>Cancelled</option>
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

<!-- Modal: Register Vehicle -->
<div id="addVehicleModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Register Vehicle to Emergency Fleet</h3>
      <button class="modal-close" onclick="closeModal('addVehicleModal')">&times;</button>
    </div>
    <form method="POST" action="transportation.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create_vehicle">
      <div class="modal-body">
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Vehicle Number Plate</label>
            <input type="text" name="vehicle_number" class="form-input" required placeholder="e.g. MH-12-AB-9876">
          </div>
          <div class="form-group">
            <label class="form-label required">Vehicle Classification</label>
            <select name="vehicle_type" class="form-select" required>
              <option value="Truck">Heavy Supply Truck</option>
              <option value="Van">Cargo / Medical Van</option>
              <option value="Ambulance">Advanced Life Support Ambulance</option>
              <option value="Boat">Flood Rescue Boat</option>
              <option value="Helicopter">Air Evacuation Helicopter</option>
              <option value="Bus">Evacuation Passenger Bus</option>
              <option value="SUV">Quick Response 4x4 SUV</option>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Passenger / Cargo Capacity</label>
            <input type="number" name="capacity" class="form-input" placeholder="e.g. 20 (people or tons)">
          </div>
          <div class="form-group">
            <label class="form-label required">Availability Status</label>
            <select name="availability_status" class="form-select" required>
              <option value="Available">Available (Standby)</option>
              <option value="In Use">In Use (Deployed)</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Designated Driver Name</label>
            <input type="text" name="driver_name" class="form-input" placeholder="e.g. Rajesh Kumar">
          </div>
          <div class="form-group">
            <label class="form-label">Driver Contact Number</label>
            <input type="text" name="driver_phone" class="form-input" placeholder="+91 98765 12345">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addVehicleModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save to Fleet</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal: Dispatch Transit Mission -->
<div id="addAssignmentModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Dispatch Transport Mission / Convoy</h3>
      <button class="modal-close" onclick="closeModal('addAssignmentModal')">&times;</button>
    </div>
    <form method="POST" action="transportation.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create_assignment">
      <div class="modal-body">
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Select Vehicle</label>
            <select name="vehicle_id" class="form-select" required>
              <option value="">-- Choose Fleet Vehicle --</option>
              <?php foreach ($vehicles as $v): ?>
                <option value="<?= $v['vehicle_id'] ?>">
                  <?= htmlspecialchars($v['vehicle_number']) ?> (<?= $v['vehicle_type'] ?> - <?= $v['availability_status'] ?>)
                </option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Related Mission (Optional)</label>
            <select name="operation_id" class="form-select">
              <option value="">-- General Convoy --</option>
              <?php foreach ($operations as $op): ?>
                <option value="<?= $op['operation_id'] ?>"><?= htmlspecialchars($op['operation_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Source (Starting Point)</label>
            <input type="text" name="source_location" class="form-input" required placeholder="e.g. Central Logistics Warehouse, Pune">
          </div>
          <div class="form-group">
            <label class="form-label required">Destination (Target Area)</label>
            <input type="text" name="destination_location" class="form-input" required placeholder="e.g. Coastal Relief Camp, Ratnagiri">
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Departure Time</label>
            <input type="datetime-local" name="departure_time" class="form-input" value="<?= date('Y-m-d\TH:i') ?>">
          </div>
          <div class="form-group">
            <label class="form-label required">Transit Status</label>
            <select name="status" class="form-select" required>
              <option value="En Route">En Route (Dispatched)</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addAssignmentModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Dispatch Mission</button>
      </div>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
